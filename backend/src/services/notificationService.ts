import pool from "../config/database.js";
import { getBudgetsWithSpending } from "./budgetService.js";
import { getRecurringTransactions } from "./recurringService.js";

export type NotificationType =
  | "budget_warning"
  | "budget_exceeded"
  | "bill_due_soon"
  | "bill_overdue"
  | "anomaly"
  | "system";

export type NotificationSeverity = "info" | "warning" | "critical";

export interface NotificationItem {
  id: number;
  family_id: number;
  user_id: number | null;
  type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  message: string;
  link: string | null;
  metadata: Record<string, any> | null;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
}

export interface CreateNotificationInput {
  familyId: number;
  userId?: number | null;
  type: NotificationType;
  severity?: NotificationSeverity;
  title: string;
  message: string;
  link?: string | null;
  metadata?: Record<string, any> | null;
}

/**
 * Creates a notification record
 */
export async function createNotification(
  input: CreateNotificationInput,
): Promise<NotificationItem> {
  const {
    familyId,
    userId = null,
    type,
    severity = "info",
    title,
    message,
    link = null,
    metadata = null,
  } = input;

  const result = await pool.query(
    `
    INSERT INTO notifications (
      family_id, user_id, type, severity, title, message, link, metadata
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING
      id,
      family_id,
      user_id,
      type,
      severity,
      title,
      message,
      link,
      metadata,
      is_read,
      read_at,
      created_at
    `,
    [familyId, userId, type, severity, title, message, link, metadata ? JSON.stringify(metadata) : null],
  );

  return result.rows[0];
}

/**
 * Automatically evaluates budgets and recurring commitments to generate notifications.
 * Deduplicates against existing notifications for the same entity and cycle.
 */
export async function syncFinancialAlerts(familyId: number): Promise<void> {
  const now = new Date();
  const currentMonth = now.getUTCMonth() + 1;
  const currentYear = now.getUTCFullYear();

  // 1. Budget Alerts
  try {
    const budgetSummary = await getBudgetsWithSpending(familyId, currentMonth, currentYear);

    for (const budget of budgetSummary.budgets) {
      if (budget.status === "overbudget") {
        // Check if budget_exceeded notification already exists for this budget and month
        const existing = await pool.query(
          `
          SELECT id FROM notifications
          WHERE family_id = $1
            AND type = 'budget_exceeded'
            AND (metadata->>'budgetId')::int = $2
            AND (metadata->>'month')::int = $3
            AND (metadata->>'year')::int = $4
          LIMIT 1
          `,
          [familyId, budget.id, currentMonth, currentYear],
        );

        if (existing.rowCount === 0) {
          // Mark older budget_warning for this budget as read so it doesn't clutter
          await pool.query(
            `
            UPDATE notifications
            SET is_read = TRUE, read_at = NOW()
            WHERE family_id = $1
              AND type = 'budget_warning'
              AND (metadata->>'budgetId')::int = $2
              AND (metadata->>'month')::int = $3
              AND (metadata->>'year')::int = $4
              AND is_read = FALSE
            `,
            [familyId, budget.id, currentMonth, currentYear],
          );

          await createNotification({
            familyId,
            type: "budget_exceeded",
            severity: "critical",
            title: `Budget Exceeded: ${budget.categoryName}`,
            message: `Spending on ${budget.categoryName} has reached ₹${Math.round(budget.actualSpent).toLocaleString("en-IN")}, exceeding your ₹${Math.round(budget.amount).toLocaleString("en-IN")} budget (${budget.percentage}%).`,
            link: "/budgets",
            metadata: {
              budgetId: budget.id,
              categoryId: budget.categoryId,
              categoryName: budget.categoryName,
              month: currentMonth,
              year: currentYear,
              actualSpent: budget.actualSpent,
              budgetAmount: budget.amount,
            },
          });
        }
      } else if (budget.status === "warning") {
        // Check if either warning or exceeded alert already exists
        const existing = await pool.query(
          `
          SELECT id FROM notifications
          WHERE family_id = $1
            AND type IN ('budget_warning', 'budget_exceeded')
            AND (metadata->>'budgetId')::int = $2
            AND (metadata->>'month')::int = $3
            AND (metadata->>'year')::int = $4
          LIMIT 1
          `,
          [familyId, budget.id, currentMonth, currentYear],
        );

        if (existing.rowCount === 0) {
          await createNotification({
            familyId,
            type: "budget_warning",
            severity: "warning",
            title: `Budget Alert: ${budget.categoryName}`,
            message: `You have used ${budget.percentage}% of your ₹${Math.round(budget.amount).toLocaleString("en-IN")} ${budget.categoryName} budget (₹${Math.round(budget.remaining).toLocaleString("en-IN")} remaining).`,
            link: "/budgets",
            metadata: {
              budgetId: budget.id,
              categoryId: budget.categoryId,
              categoryName: budget.categoryName,
              month: currentMonth,
              year: currentYear,
              actualSpent: budget.actualSpent,
              budgetAmount: budget.amount,
            },
          });
        }
      }
    }
  } catch (err) {
    console.error("Error evaluating budget alerts in syncFinancialAlerts:", err);
  }

  // 2. Recurring Commitment & Bill Alerts
  try {
    const { items: recurringItems } = await getRecurringTransactions(familyId, {
      status: "active",
    });

    for (const item of recurringItems) {
      if (item.type !== "expense") continue; // Focus alert notifications on expenses/bills

      if (item.days_until_due !== undefined && item.days_until_due < 0) {
        // Bill is overdue
        const existing = await pool.query(
          `
          SELECT id FROM notifications
          WHERE family_id = $1
            AND type = 'bill_overdue'
            AND (metadata->>'recurringId')::int = $2
            AND metadata->>'dueDate' = $3
          LIMIT 1
          `,
          [familyId, item.id, item.next_due_date],
        );

        if (existing.rowCount === 0) {
          // Mark earlier bill_due_soon alert as read
          await pool.query(
            `
            UPDATE notifications
            SET is_read = TRUE, read_at = NOW()
            WHERE family_id = $1
              AND type = 'bill_due_soon'
              AND (metadata->>'recurringId')::int = $2
              AND metadata->>'dueDate' = $3
              AND is_read = FALSE
            `,
            [familyId, item.id, item.next_due_date],
          );

          const daysOverdue = Math.abs(item.days_until_due);
          await createNotification({
            familyId,
            type: "bill_overdue",
            severity: "critical",
            title: `Overdue Bill: ${item.title}`,
            message: `${item.title} of ₹${Math.round(Number(item.amount)).toLocaleString("en-IN")} was due on ${item.next_due_date} (${daysOverdue} ${daysOverdue === 1 ? "day" : "days"} ago).`,
            link: "/recurring",
            metadata: {
              recurringId: item.id,
              dueDate: item.next_due_date,
              amount: item.amount,
              daysOverdue,
            },
          });
        }
      } else if (item.days_until_due !== undefined && item.days_until_due >= 0 && item.days_until_due <= 3) {
        // Bill is due soon (today or within next 3 days)
        const existing = await pool.query(
          `
          SELECT id FROM notifications
          WHERE family_id = $1
            AND type IN ('bill_due_soon', 'bill_overdue')
            AND (metadata->>'recurringId')::int = $2
            AND metadata->>'dueDate' = $3
          LIMIT 1
          `,
          [familyId, item.id, item.next_due_date],
        );

        if (existing.rowCount === 0) {
          const dueText =
            item.days_until_due === 0
              ? "is due today!"
              : `is due in ${item.days_until_due} ${item.days_until_due === 1 ? "day" : "days"} (${item.next_due_date}).`;

          await createNotification({
            familyId,
            type: "bill_due_soon",
            severity: "warning",
            title: `Bill Due Soon: ${item.title}`,
            message: `${item.title} of ₹${Math.round(Number(item.amount)).toLocaleString("en-IN")} ${dueText}`,
            link: "/recurring",
            metadata: {
              recurringId: item.id,
              dueDate: item.next_due_date,
              amount: item.amount,
              daysUntilDue: item.days_until_due,
            },
          });
        }
      }
    }
  } catch (err) {
    console.error("Error evaluating recurring alerts in syncFinancialAlerts:", err);
  }
}

/**
 * Retrieves notifications for a family with filtering and unread count
 */
export async function getNotifications(
  familyId: number,
  options: {
    limit?: number;
    offset?: number;
    type?: string;
    unreadOnly?: boolean;
  } = {},
): Promise<{ notifications: NotificationItem[]; unreadCount: number }> {
  const { limit = 50, offset = 0, type, unreadOnly = false } = options;

  let query = `
    SELECT
      id,
      family_id,
      user_id,
      type,
      severity,
      title,
      message,
      link,
      metadata,
      is_read,
      read_at,
      created_at
    FROM notifications
    WHERE family_id = $1
  `;

  const values: any[] = [familyId];
  let paramIdx = 2;

  if (unreadOnly) {
    query += ` AND is_read = FALSE`;
  }

  if (type && type !== "all") {
    if (type === "budget") {
      query += ` AND type IN ('budget_warning', 'budget_exceeded')`;
    } else if (type === "bill") {
      query += ` AND type IN ('bill_due_soon', 'bill_overdue')`;
    } else {
      query += ` AND type = $${paramIdx++}`;
      values.push(type);
    }
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`;
  values.push(limit, offset);

  const [listResult, countResult] = await Promise.all([
    pool.query(query, values),
    pool.query(
      `
      SELECT COUNT(*)::int AS unread_count
      FROM notifications
      WHERE family_id = $1 AND is_read = FALSE
      `,
      [familyId],
    ),
  ]);

  return {
    notifications: listResult.rows,
    unreadCount: countResult.rows[0]?.unread_count || 0,
  };
}

/**
 * Mark a single notification as read
 */
export async function markNotificationAsRead(
  familyId: number,
  notificationId: number,
): Promise<NotificationItem | null> {
  const result = await pool.query(
    `
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE id = $1 AND family_id = $2
    RETURNING
      id,
      family_id,
      user_id,
      type,
      severity,
      title,
      message,
      link,
      metadata,
      is_read,
      read_at,
      created_at
    `,
    [notificationId, familyId],
  );

  return result.rows[0] || null;
}

/**
 * Mark all notifications for a family as read
 */
export async function markAllNotificationsAsRead(familyId: number): Promise<number> {
  const result = await pool.query(
    `
    UPDATE notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE family_id = $1 AND is_read = FALSE
    `,
    [familyId],
  );

  return result.rowCount ?? 0;
}

/**
 * Delete a single notification
 */
export async function deleteNotification(
  familyId: number,
  notificationId: number,
): Promise<boolean> {
  const result = await pool.query(
    `
    DELETE FROM notifications
    WHERE id = $1 AND family_id = $2
    `,
    [notificationId, familyId],
  );

  return (result.rowCount ?? 0) > 0;
}

/**
 * Clear all notifications for a family (or only read notifications if specified)
 */
export async function clearAllNotifications(
  familyId: number,
  onlyRead: boolean = false,
): Promise<number> {
  let query = `DELETE FROM notifications WHERE family_id = $1`;
  if (onlyRead) {
    query += ` AND is_read = TRUE`;
  }

  const result = await pool.query(query, [familyId]);
  return result.rowCount ?? 0;
}
