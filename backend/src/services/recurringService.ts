import pool from "../config/database.js";

export type RecurringFrequency = "daily" | "weekly" | "monthly" | "quarterly" | "yearly";
export type RecurringStatus = "active" | "paused" | "completed";
export type RecurringType = "income" | "expense";

export interface RecurringTransaction {
  id: number;
  family_id: number;
  member_id: number;
  category_id: number;
  created_by: number;
  title: string;
  amount: number;
  type: RecurringType;
  frequency: RecurringFrequency;
  start_date: string;
  end_date: string | null;
  next_due_date: string;
  last_processed_date: string | null;
  status: RecurringStatus;
  is_subscription: boolean;
  created_at: string;
  updated_at: string;
  category_name?: string;
  member_name?: string;
  creator_name?: string;
  days_until_due?: number;
}

export interface RecurringSummary {
  monthlyCommittedExpense: number;
  monthlyCommittedIncome: number;
  activeSubscriptionsCount: number;
  monthlySubscriptionCost: number;
  upcomingDueCount: number;
  totalActiveCount: number;
  nextUpcomingItem: {
    id: number;
    title: string;
    amount: number;
    nextDueDate: string;
    daysUntilDue: number;
    type: RecurringType;
  } | null;
}

export interface CreateRecurringInput {
  title: string;
  amount: number;
  type: RecurringType;
  frequency: RecurringFrequency;
  categoryId: number;
  memberId: number;
  startDate: string;
  endDate?: string | null;
  isSubscription?: boolean;
}

export interface UpdateRecurringInput {
  title?: string;
  amount?: number;
  type?: RecurringType;
  frequency?: RecurringFrequency;
  categoryId?: number;
  memberId?: number;
  startDate?: string;
  endDate?: string | null;
  nextDueDate?: string;
  status?: RecurringStatus;
  isSubscription?: boolean;
}

/**
 * Calculates the next occurrence date after a given date based on cadence
 */
export function calculateNextOccurrence(
  currentDateStr: string,
  frequency: RecurringFrequency,
): string {
  const d = new Date(currentDateStr);

  switch (frequency) {
    case "daily":
      d.setUTCDate(d.getUTCDate() + 1);
      break;
    case "weekly":
      d.setUTCDate(d.getUTCDate() + 7);
      break;
    case "monthly": {
      const origDay = d.getUTCDate();
      d.setUTCMonth(d.getUTCMonth() + 1);
      // Handle month rollover (e.g. Jan 31 -> Feb 28/29)
      if (d.getUTCDate() < origDay) {
        d.setUTCDate(0);
      }
      break;
    }
    case "quarterly": {
      const origDay = d.getUTCDate();
      d.setUTCMonth(d.getUTCMonth() + 3);
      if (d.getUTCDate() < origDay) {
        d.setUTCDate(0);
      }
      break;
    }
    case "yearly":
      d.setUTCFullYear(d.getUTCFullYear() + 1);
      break;
  }

  return d.toISOString().slice(0, 10);
}

/**
 * Converts any cadence amount into an equivalent monthly expense/income amount
 */
export function normalizeToMonthly(amount: number, frequency: RecurringFrequency): number {
  switch (frequency) {
    case "daily":
      return amount * 30.416;
    case "weekly":
      return (amount * 52) / 12;
    case "monthly":
      return amount;
    case "quarterly":
      return amount / 3;
    case "yearly":
      return amount / 12;
    default:
      return amount;
  }
}

/**
 * Computes initial next_due_date starting from startDate up to or beyond today
 */
export function computeInitialNextDue(startDateStr: string, frequency: RecurringFrequency): string {
  const todayStr = new Date().toISOString().slice(0, 10);
  if (startDateStr >= todayStr) {
    return startDateStr;
  }

  let curr = startDateStr;
  // Advance until curr >= todayStr to find the next active due date
  while (curr < todayStr) {
    curr = calculateNextOccurrence(curr, frequency);
  }
  return curr;
}

/**
 * Fetch all recurring transactions for a family with optional filters and overall summary
 */
export async function getRecurringTransactions(
  familyId: number,
  filters?: { status?: string; type?: string; isSubscription?: boolean },
): Promise<{ items: RecurringTransaction[]; summary: RecurringSummary }> {
  let query = `
    SELECT
      r.id,
      r.family_id,
      r.member_id,
      r.category_id,
      r.created_by,
      r.title,
      r.amount::numeric AS amount,
      r.type,
      r.frequency,
      TO_CHAR(r.start_date, 'YYYY-MM-DD') AS start_date,
      TO_CHAR(r.end_date, 'YYYY-MM-DD') AS end_date,
      TO_CHAR(r.next_due_date, 'YYYY-MM-DD') AS next_due_date,
      TO_CHAR(r.last_processed_date, 'YYYY-MM-DD') AS last_processed_date,
      r.status,
      r.is_subscription,
      r.created_at,
      r.updated_at,
      c.name AS category_name,
      fm.name AS member_name,
      u.name AS creator_name,
      (r.next_due_date - CURRENT_DATE)::integer AS days_until_due
    FROM recurring_transactions r
    JOIN categories c ON c.id = r.category_id
    JOIN family_members fm ON fm.id = r.member_id
    JOIN users u ON u.id = r.created_by
    WHERE r.family_id = $1
  `;

  const values: any[] = [familyId];
  let paramIdx = 2;

  if (filters?.status) {
    query += ` AND r.status = $${paramIdx++}`;
    values.push(filters.status);
  }

  if (filters?.type) {
    query += ` AND r.type = $${paramIdx++}`;
    values.push(filters.type);
  }

  if (filters?.isSubscription !== undefined) {
    query += ` AND r.is_subscription = $${paramIdx++}`;
    values.push(filters.isSubscription);
  }

  query += ` ORDER BY r.status ASC, r.next_due_date ASC, r.id ASC;`;

  const result = await pool.query(query, values);
  const items: RecurringTransaction[] = result.rows.map((row) => ({
    ...row,
    amount: Number(row.amount),
    days_until_due: Number(row.days_until_due),
  }));

  // Fetch full active list to calculate unbiased family summary
  const allActiveRes = await pool.query(
    `
      SELECT
        id,
        title,
        amount::numeric AS amount,
        type,
        frequency,
        is_subscription,
        TO_CHAR(next_due_date, 'YYYY-MM-DD') AS next_due_date,
        (next_due_date - CURRENT_DATE)::integer AS days_until_due
      FROM recurring_transactions
      WHERE family_id = $1
        AND status = 'active'
      ORDER BY next_due_date ASC;
    `,
    [familyId],
  );

  let monthlyCommittedExpense = 0;
  let monthlyCommittedIncome = 0;
  let activeSubscriptionsCount = 0;
  let monthlySubscriptionCost = 0;
  let upcomingDueCount = 0;
  let nextUpcomingItem: RecurringSummary["nextUpcomingItem"] = null;

  for (const r of allActiveRes.rows) {
    const amt = Number(r.amount);
    const monthlyAmt = normalizeToMonthly(amt, r.frequency as RecurringFrequency);
    const daysUntil = Number(r.days_until_due);

    if (r.type === "expense") {
      monthlyCommittedExpense += monthlyAmt;
      if (r.is_subscription) {
        activeSubscriptionsCount++;
        monthlySubscriptionCost += monthlyAmt;
      }
    } else if (r.type === "income") {
      monthlyCommittedIncome += monthlyAmt;
    }

    if (daysUntil <= 7) {
      upcomingDueCount++;
    }

    if (!nextUpcomingItem && daysUntil >= 0) {
      nextUpcomingItem = {
        id: r.id,
        title: r.title,
        amount: amt,
        nextDueDate: r.next_due_date,
        daysUntilDue: daysUntil,
        type: r.type as RecurringType,
      };
    }
  }

  return {
    items,
    summary: {
      monthlyCommittedExpense: Math.round(monthlyCommittedExpense),
      monthlyCommittedIncome: Math.round(monthlyCommittedIncome),
      activeSubscriptionsCount,
      monthlySubscriptionCost: Math.round(monthlySubscriptionCost),
      upcomingDueCount,
      totalActiveCount: allActiveRes.rows.length,
      nextUpcomingItem,
    },
  };
}

/**
 * Fetch a single recurring transaction by ID with joined category, member, and user names
 */
export async function getRecurringTransactionById(
  id: number,
  familyId: number,
): Promise<RecurringTransaction> {
  const result = await pool.query(
    `
      SELECT
        r.id,
        r.family_id,
        r.member_id,
        r.category_id,
        r.created_by,
        r.title,
        r.amount::numeric AS amount,
        r.type,
        r.frequency,
        TO_CHAR(r.start_date, 'YYYY-MM-DD') AS start_date,
        TO_CHAR(r.end_date, 'YYYY-MM-DD') AS end_date,
        TO_CHAR(r.next_due_date, 'YYYY-MM-DD') AS next_due_date,
        TO_CHAR(r.last_processed_date, 'YYYY-MM-DD') AS last_processed_date,
        r.status,
        r.is_subscription,
        r.created_at,
        r.updated_at,
        c.name AS category_name,
        fm.name AS member_name,
        u.name AS creator_name,
        (r.next_due_date - CURRENT_DATE)::integer AS days_until_due
      FROM recurring_transactions r
      JOIN categories c ON c.id = r.category_id
      JOIN family_members fm ON fm.id = r.member_id
      JOIN users u ON u.id = r.created_by
      WHERE r.family_id = $1 AND r.id = $2;
    `,
    [familyId, id],
  );

  if (result.rows.length === 0) {
    throw new Error("Recurring transaction not found.");
  }

  const row = result.rows[0];
  return {
    ...row,
    amount: Number(row.amount),
    days_until_due: Number(row.days_until_due),
  };
}

/**
 * Create a new recurring transaction schedule
 */
export async function createRecurringTransaction(
  familyId: number,
  userId: number,
  input: CreateRecurringInput,
): Promise<RecurringTransaction> {
  const {
    title,
    amount,
    type,
    frequency,
    categoryId,
    memberId,
    startDate,
    endDate,
    isSubscription,
  } = input;

  if (!title?.trim()) {
    throw new Error("Title is required.");
  }
  if (!amount || Number(amount) <= 0) {
    throw new Error("Amount must be a positive number.");
  }
  if (!["income", "expense"].includes(type)) {
    throw new Error("Invalid transaction type.");
  }
  if (!["daily", "weekly", "monthly", "quarterly", "yearly"].includes(frequency)) {
    throw new Error("Invalid frequency cadence.");
  }
  if (!startDate) {
    throw new Error("Start date is required.");
  }

  // Verify member belongs to family
  const memCheck = await pool.query(
    `SELECT id FROM family_members WHERE id = $1 AND family_id = $2 AND is_active = TRUE;`,
    [memberId, familyId],
  );
  if (memCheck.rows.length === 0) {
    throw new Error("Selected family member is invalid or not in your family.");
  }

  // Verify category belongs to family
  const catCheck = await pool.query(
    `SELECT id, type FROM categories WHERE id = $1 AND family_id = $2;`,
    [categoryId, familyId],
  );
  if (catCheck.rows.length === 0) {
    throw new Error("Selected category is invalid or not in your family.");
  }
  if (catCheck.rows[0].type !== type) {
    throw new Error(`Category type (${catCheck.rows[0].type}) must match transaction type (${type}).`);
  }

  const nextDueDate = computeInitialNextDue(startDate, frequency);

  const insertRes = await pool.query(
    `
      INSERT INTO recurring_transactions (
        family_id,
        member_id,
        category_id,
        created_by,
        title,
        amount,
        type,
        frequency,
        start_date,
        end_date,
        next_due_date,
        status,
        is_subscription
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 'active', $12)
      RETURNING *;
    `,
    [
      familyId,
      memberId,
      categoryId,
      userId,
      title.trim(),
      amount,
      type,
      frequency,
      startDate,
      endDate || null,
      nextDueDate,
      Boolean(isSubscription),
    ],
  );

  return getRecurringTransactionById(insertRes.rows[0].id, familyId);
}

/**
 * Update an existing recurring transaction
 */
export async function updateRecurringTransaction(
  id: number,
  familyId: number,
  input: UpdateRecurringInput,
): Promise<RecurringTransaction> {
  const existingRes = await pool.query(
    `SELECT * FROM recurring_transactions WHERE id = $1 AND family_id = $2;`,
    [id, familyId],
  );
  if (existingRes.rows.length === 0) {
    throw new Error("Recurring transaction not found.");
  }

  const current = existingRes.rows[0];

  const title = input.title !== undefined ? input.title.trim() : current.title;
  const amount = input.amount !== undefined ? Number(input.amount) : Number(current.amount);
  const type = input.type || current.type;
  const frequency = input.frequency || current.frequency;
  const categoryId = input.categoryId !== undefined ? input.categoryId : current.category_id;
  const memberId = input.memberId !== undefined ? input.memberId : current.member_id;
  const startDate = input.startDate || current.start_date;
  const endDate = input.endDate !== undefined ? input.endDate : current.end_date;
  const status = input.status || current.status;
  const isSubscription =
    input.isSubscription !== undefined ? Boolean(input.isSubscription) : current.is_subscription;

  let nextDueDate = input.nextDueDate || current.next_due_date;
  // If frequency or start date changed, recompute next due if requested
  if (input.frequency && input.frequency !== current.frequency) {
    nextDueDate = computeInitialNextDue(startDate, frequency);
  }

  const updateRes = await pool.query(
    `
      UPDATE recurring_transactions
      SET
        title = $1,
        amount = $2,
        type = $3,
        frequency = $4,
        category_id = $5,
        member_id = $6,
        start_date = $7,
        end_date = $8,
        next_due_date = $9,
        status = $10,
        is_subscription = $11,
        updated_at = NOW()
      WHERE id = $12 AND family_id = $13
      RETURNING *;
    `,
    [
      title,
      amount,
      type,
      frequency,
      categoryId,
      memberId,
      startDate,
      endDate,
      nextDueDate,
      status,
      isSubscription,
      id,
      familyId,
    ],
  );

  return getRecurringTransactionById(id, familyId);
}

/**
 * Delete a recurring schedule (preserves historical logged transactions)
 */
export async function deleteRecurringTransaction(id: number, familyId: number): Promise<void> {
  const check = await pool.query(
    `SELECT id FROM recurring_transactions WHERE id = $1 AND family_id = $2;`,
    [id, familyId],
  );
  if (check.rows.length === 0) {
    throw new Error("Recurring transaction not found.");
  }

  await pool.query(
    `DELETE FROM recurring_transactions WHERE id = $1 AND family_id = $2;`,
    [id, familyId],
  );
}

/**
 * Toggle pause or resume status
 */
export async function togglePauseRecurring(
  id: number,
  familyId: number,
  pause: boolean,
): Promise<RecurringTransaction> {
  const newStatus: RecurringStatus = pause ? "paused" : "active";
  const result = await pool.query(
    `
      UPDATE recurring_transactions
      SET status = $1, updated_at = NOW()
      WHERE id = $2 AND family_id = $3
      RETURNING *;
    `,
    [newStatus, id, familyId],
  );

  if (result.rows.length === 0) {
    throw new Error("Recurring transaction not found.");
  }

  return getRecurringTransactionById(id, familyId);
}

/**
 * Process all due recurring transactions for a family (or all families).
 * Automatically generates transactions and advances next_due_date.
 */
export async function processDueRecurringTransactions(
  familyId?: number,
): Promise<{ processedCount: number; createdTransactionIds: number[] }> {
  const client = await pool.connect();
  const createdTransactionIds: number[] = [];

  try {
    await client.query("BEGIN");

    let query = `
      SELECT
        r.*,
        TO_CHAR(r.next_due_date, 'YYYY-MM-DD') AS next_due_date_str,
        TO_CHAR(r.end_date, 'YYYY-MM-DD') AS end_date_str
      FROM recurring_transactions r
      WHERE r.status = 'active'
        AND r.next_due_date <= CURRENT_DATE
    `;

    const values: any[] = [];
    if (familyId) {
      query += ` AND r.family_id = $1`;
      values.push(familyId);
    }

    query += ` FOR UPDATE;`;

    const dueItems = await client.query(query, values);

    for (const item of dueItems.rows) {
      const dueDate = item.next_due_date_str;

      // Duplicate prevention: check if a transaction was already logged for this recurring rule on this date
      const dupCheck = await client.query(
        `
          SELECT id FROM transactions
          WHERE recurring_transaction_id = $1
            AND transaction_date = $2
            AND is_deleted = FALSE
          LIMIT 1;
        `,
        [item.id, dueDate],
      );

      if (dupCheck.rows.length === 0) {
        // Create the transaction record
        const txRes = await client.query(
          `
            INSERT INTO transactions (
              family_id,
              member_id,
              category_id,
              created_by,
              title,
              amount,
              type,
              transaction_date,
              recurring_transaction_id
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id;
          `,
          [
            item.family_id,
            item.member_id,
            item.category_id,
            item.created_by,
            item.title,
            item.amount,
            item.type,
            dueDate,
            item.id,
          ],
        );
        createdTransactionIds.push(txRes.rows[0].id);
      }

      // Calculate next due date
      const nextDate = calculateNextOccurrence(dueDate, item.frequency as RecurringFrequency);
      const isCompleted = item.end_date_str && nextDate > item.end_date_str;

      await client.query(
        `
          UPDATE recurring_transactions
          SET
            next_due_date = $1,
            last_processed_date = CURRENT_DATE,
            status = $2,
            updated_at = NOW()
          WHERE id = $3;
        `,
        [nextDate, isCompleted ? "completed" : "active", item.id],
      );
    }

    await client.query("COMMIT");
    return {
      processedCount: createdTransactionIds.length,
      createdTransactionIds,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * 1-Click "Record Now": creates a transaction immediately from an active recurring rule
 */
export async function recordSingleRecurringNow(
  id: number,
  familyId: number,
  userId: number,
): Promise<{ transactionId: number; nextDueDate: string }> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const itemRes = await client.query(
      `
        SELECT
          r.*,
          TO_CHAR(r.next_due_date, 'YYYY-MM-DD') AS next_due_date_str,
          TO_CHAR(r.end_date, 'YYYY-MM-DD') AS end_date_str
        FROM recurring_transactions r
        WHERE r.id = $1 AND r.family_id = $2
        FOR UPDATE;
      `,
      [id, familyId],
    );

    if (itemRes.rows.length === 0) {
      throw new Error("Recurring transaction not found.");
    }

    const item = itemRes.rows[0];
    const todayStr = new Date().toISOString().slice(0, 10);
    const txDate = item.next_due_date_str <= todayStr ? item.next_due_date_str : todayStr;

    // Insert transaction
    const txRes = await client.query(
      `
        INSERT INTO transactions (
          family_id,
          member_id,
          category_id,
          created_by,
          title,
          amount,
          type,
          transaction_date,
          recurring_transaction_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id;
      `,
      [
        item.family_id,
        item.member_id,
        item.category_id,
        userId,
        item.title,
        item.amount,
        item.type,
        txDate,
        item.id,
      ],
    );

    const transactionId = txRes.rows[0].id;

    // Advance next_due_date from the current next_due_date
    const nextDate = calculateNextOccurrence(
      item.next_due_date_str,
      item.frequency as RecurringFrequency,
    );
    const isCompleted = item.end_date_str && nextDate > item.end_date_str;

    await client.query(
      `
        UPDATE recurring_transactions
        SET
          next_due_date = $1,
          last_processed_date = CURRENT_DATE,
          status = $2,
          updated_at = NOW()
        WHERE id = $3;
      `,
      [nextDate, isCompleted ? "completed" : item.status, item.id],
    );

    await client.query("COMMIT");
    return {
      transactionId,
      nextDueDate: nextDate,
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Specialized retrieval for AI tools (returns upcoming bills within next N days)
 */
export async function getUpcomingBillsForAI(familyId: number, daysAhead = 30) {
  const result = await pool.query(
    `
      SELECT
        r.id,
        r.title,
        r.amount::numeric AS amount,
        r.type,
        r.frequency,
        r.is_subscription,
        TO_CHAR(r.next_due_date, 'YYYY-MM-DD') AS next_due_date,
        (r.next_due_date - CURRENT_DATE)::integer AS days_until_due,
        c.name AS category_name,
        fm.name AS member_name
      FROM recurring_transactions r
      JOIN categories c ON c.id = r.category_id
      JOIN family_members fm ON fm.id = r.member_id
      WHERE r.family_id = $1
        AND r.status = 'active'
        AND r.next_due_date <= (CURRENT_DATE + ($2 || ' days')::interval)
      ORDER BY r.next_due_date ASC;
    `,
    [familyId, daysAhead],
  );

  return result.rows.map((row) => ({
    id: row.id,
    title: row.title,
    amount: Number(row.amount),
    type: row.type,
    frequency: row.frequency,
    isSubscription: row.is_subscription,
    nextDueDate: row.next_due_date,
    daysUntilDue: Number(row.days_until_due),
    category: row.category_name,
    member: row.member_name,
  }));
}
