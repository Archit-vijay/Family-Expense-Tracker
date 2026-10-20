import pool from "../config/database.js";

export interface BudgetWithSpending {
  id: number;
  familyId: number;
  categoryId: number;
  categoryName: string;
  categoryType: string;
  amount: number;
  month: number;
  year: number;
  actualSpent: number;
  remaining: number;
  percentage: number;
  status: "safe" | "warning" | "overbudget";
  createdAt: string;
  updatedAt: string;
}

export interface UnbudgetedCategorySpending {
  categoryId: number;
  categoryName: string;
  actualSpent: number;
  transactionCount: number;
}

export interface MonthlyBudgetSummary {
  month: number;
  year: number;
  totalBudgeted: number;
  totalSpentBudgeted: number;
  totalRemaining: number;
  totalUnbudgetedSpent: number;
  totalMonthlyExpenses: number;
  overallPercentage: number;
  overallStatus: "safe" | "warning" | "overbudget";
  overbudgetCount: number;
  warningCount: number;
  budgets: BudgetWithSpending[];
  unbudgeted: UnbudgetedCategorySpending[];
}

export interface CreateBudgetInput {
  familyId: number;
  categoryId: number;
  amount: number;
  month: number;
  year: number;
}

export interface UpdateBudgetInput {
  id: number;
  familyId: number;
  amount: number;
}

/**
 * Get budgets with authoritative actual spending for a family in a given month and year.
 */
export async function getBudgetsWithSpending(
  familyId: number,
  month: number,
  year: number,
): Promise<MonthlyBudgetSummary> {
  // 1. Query budgeted categories with their actual spending in this calendar month
  const budgetQuery = `
    SELECT
      b.id,
      b.family_id,
      b.category_id,
      c.name AS category_name,
      c.type AS category_type,
      b.amount::float AS amount,
      b.month,
      b.year,
      COALESCE(SUM(t.amount), 0)::float AS actual_spent,
      (b.amount - COALESCE(SUM(t.amount), 0))::float AS remaining,
      CASE
        WHEN b.amount > 0 THEN ROUND((COALESCE(SUM(t.amount), 0) / b.amount * 100)::numeric, 1)::float
        ELSE 0
      END AS percentage,
      CASE
        WHEN COALESCE(SUM(t.amount), 0) > b.amount THEN 'overbudget'
        WHEN COALESCE(SUM(t.amount), 0) >= (b.amount * 0.8) THEN 'warning'
        ELSE 'safe'
      END AS status,
      b.created_at,
      b.updated_at
    FROM budgets b
    JOIN categories c ON b.category_id = c.id
    LEFT JOIN transactions t ON (
      t.category_id = b.category_id
      AND t.family_id = b.family_id
      AND t.type = 'expense'
      AND t.is_deleted = FALSE
      AND t.transaction_date >= make_date(b.year, b.month, 1)
      AND t.transaction_date < (make_date(b.year, b.month, 1) + interval '1 month')
    )
    WHERE b.family_id = $1
      AND b.month = $2
      AND b.year = $3
    GROUP BY
      b.id,
      b.family_id,
      b.category_id,
      c.name,
      c.type,
      b.amount,
      b.month,
      b.year,
      b.created_at,
      b.updated_at
    ORDER BY
      percentage DESC,
      actual_spent DESC,
      c.name ASC;
  `;

  // 2. Query unbudgeted expense spending for categories that do not have a budget in this month
  const unbudgetedQuery = `
    SELECT
      c.id AS category_id,
      c.name AS category_name,
      COALESCE(SUM(t.amount), 0)::float AS actual_spent,
      COUNT(t.id)::int AS transaction_count
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.family_id = $1
      AND t.type = 'expense'
      AND t.is_deleted = FALSE
      AND t.transaction_date >= make_date($3, $2, 1)
      AND t.transaction_date < (make_date($3, $2, 1) + interval '1 month')
      AND t.category_id NOT IN (
        SELECT category_id
        FROM budgets
        WHERE family_id = $1 AND month = $2 AND year = $3
      )
    GROUP BY c.id, c.name
    ORDER BY actual_spent DESC;
  `;

  const [budgetRes, unbudgetedRes] = await Promise.all([
    pool.query(budgetQuery, [familyId, month, year]),
    pool.query(unbudgetedQuery, [familyId, month, year]),
  ]);

  const budgets: BudgetWithSpending[] = budgetRes.rows.map((r) => ({
    id: r.id,
    familyId: r.family_id,
    categoryId: r.category_id,
    categoryName: r.category_name,
    categoryType: r.category_type,
    amount: r.amount,
    month: r.month,
    year: r.year,
    actualSpent: r.actual_spent,
    remaining: r.remaining,
    percentage: r.percentage,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));

  const unbudgeted: UnbudgetedCategorySpending[] = unbudgetedRes.rows.map((r) => ({
    categoryId: r.category_id,
    categoryName: r.category_name,
    actualSpent: r.actual_spent,
    transactionCount: r.transaction_count,
  }));

  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpentBudgeted = budgets.reduce((sum, b) => sum + b.actualSpent, 0);
  const totalRemaining = totalBudgeted - totalSpentBudgeted;
  const totalUnbudgetedSpent = unbudgeted.reduce((sum, u) => sum + u.actualSpent, 0);
  const totalMonthlyExpenses = totalSpentBudgeted + totalUnbudgetedSpent;

  const overallPercentage =
    totalBudgeted > 0
      ? Math.round((totalSpentBudgeted / totalBudgeted) * 1000) / 10
      : 0;

  const overbudgetCount = budgets.filter((b) => b.status === "overbudget").length;
  const warningCount = budgets.filter((b) => b.status === "warning").length;

  let overallStatus: "safe" | "warning" | "overbudget" = "safe";
  if (totalSpentBudgeted > totalBudgeted && totalBudgeted > 0) {
    overallStatus = "overbudget";
  } else if (overallPercentage >= 80) {
    overallStatus = "warning";
  }

  return {
    month,
    year,
    totalBudgeted,
    totalSpentBudgeted,
    totalRemaining,
    totalUnbudgetedSpent,
    totalMonthlyExpenses,
    overallPercentage,
    overallStatus,
    overbudgetCount,
    warningCount,
    budgets,
    unbudgeted,
  };
}

/**
 * Create a new budget limit for an expense category in a given month.
 */
export async function createBudget(input: CreateBudgetInput) {
  const { familyId, categoryId, amount, month, year } = input;

  if (!amount || typeof amount !== "number" || amount <= 0) {
    throw new Error("Budget amount must be a positive number.");
  }

  if (!month || month < 1 || month > 12) {
    throw new Error("Month must be between 1 and 12.");
  }

  if (!year || year < 2000) {
    throw new Error("Year must be 2000 or later.");
  }

  // Verify category exists, belongs to this family, and is an expense category
  const categoryRes = await pool.query(
    `SELECT id, name, type FROM categories WHERE id = $1 AND family_id = $2`,
    [categoryId, familyId],
  );

  if (categoryRes.rows.length === 0) {
    throw new Error("Category not found or does not belong to your family.");
  }

  const category = categoryRes.rows[0];
  if (category.type !== "expense") {
    throw new Error("Budgets can only be created for expense categories.");
  }

  try {
    const insertRes = await pool.query(
      `
        INSERT INTO budgets (family_id, category_id, amount, month, year)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING
          id,
          family_id,
          category_id,
          amount::float,
          month,
          year,
          created_at,
          updated_at;
      `,
      [familyId, categoryId, amount, month, year],
    );

    return {
      ...insertRes.rows[0],
      category_name: category.name,
      category_type: category.type,
    };
  } catch (error: any) {
    if (error?.code === "23505") {
      throw new Error(
        `A budget for "${category.name}" already exists for ${month}/${year}.`,
      );
    }
    throw error;
  }
}

/**
 * Update an existing budget's target amount.
 */
export async function updateBudget(input: UpdateBudgetInput) {
  const { id, familyId, amount } = input;

  if (!amount || typeof amount !== "number" || amount <= 0) {
    throw new Error("Budget amount must be a positive number.");
  }

  const result = await pool.query(
    `
      UPDATE budgets
      SET amount = $1, updated_at = NOW()
      WHERE id = $2 AND family_id = $3
      RETURNING
        id,
        family_id,
        category_id,
        amount::float,
        month,
        year,
        created_at,
        updated_at;
    `,
    [amount, id, familyId],
  );

  if (result.rows.length === 0) {
    throw new Error("Budget not found or access denied.");
  }

  // Fetch category info
  const catRes = await pool.query(
    `SELECT name, type FROM categories WHERE id = $1`,
    [result.rows[0].category_id],
  );

  return {
    ...result.rows[0],
    category_name: catRes.rows[0]?.name ?? "Unknown",
    category_type: catRes.rows[0]?.type ?? "expense",
  };
}

/**
 * Delete a budget limit for a category in a given month.
 */
export async function deleteBudget(id: number, familyId: number) {
  const result = await pool.query(
    `
      DELETE FROM budgets
      WHERE id = $1 AND family_id = $2
      RETURNING id, category_id, month, year;
    `,
    [id, familyId],
  );

  if (result.rows.length === 0) {
    throw new Error("Budget not found or access denied.");
  }

  return result.rows[0];
}

/**
 * Copy all budgets from a source month into a target month.
 * Any categories already budgeted in the target month are preserved (ON CONFLICT DO NOTHING).
 */
export async function copyPreviousMonthBudgets(
  familyId: number,
  sourceMonth: number,
  sourceYear: number,
  targetMonth: number,
  targetYear: number,
) {
  if (sourceMonth === targetMonth && sourceYear === targetYear) {
    throw new Error("Source and target months cannot be the same.");
  }

  // Check if source month has any budgets
  const sourceCheck = await pool.query(
    `
      SELECT count(*)::int AS count
      FROM budgets
      WHERE family_id = $1 AND month = $2 AND year = $3
    `,
    [familyId, sourceMonth, sourceYear],
  );

  const availableCount = sourceCheck.rows[0]?.count ?? 0;
  if (availableCount === 0) {
    throw new Error(
      `No budgets were found in ${sourceMonth}/${sourceYear} to copy.`,
    );
  }

  const insertRes = await pool.query(
    `
      INSERT INTO budgets (family_id, category_id, amount, month, year)
      SELECT family_id, category_id, amount, $4, $5
      FROM budgets
      WHERE family_id = $1 AND month = $2 AND year = $3
      ON CONFLICT (family_id, category_id, month, year) DO NOTHING
      RETURNING id;
    `,
    [familyId, sourceMonth, sourceYear, targetMonth, targetYear],
  );

  const copiedCount = insertRes.rowCount ?? 0;

  return {
    copiedCount,
    totalAvailable: availableCount,
    skippedCount: availableCount - copiedCount,
  };
}
