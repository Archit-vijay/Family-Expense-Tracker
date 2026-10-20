import pool from "../config/database.js";

export interface CategoryBaseline {
  categoryId: number;
  categoryName: string;
  categoryType: string;
  averageMonthlySpend: number;
  lastMonthSpend: number;
  recentMaxTransaction: number;
  activeMonthsCount: number;
  totalTransactionCount: number;
  currentBudget: number | null;
  recommendedAmount: number;
  reasoning: string;
}

export interface BudgetRecommendationBaselines {
  targetMonth: number;
  targetYear: number;
  categories: CategoryBaseline[];
  hasHistoricalData: boolean;
  totalHistoricalAverage: number;
}

/**
 * Calculates authoritative historical spending baselines for all expense categories
 * of a family over the past 3 to 6 months leading up to the target month.
 */
export async function calculateBudgetRecommendationBaselines(
  familyId: number,
  targetMonth: number,
  targetYear: number,
): Promise<BudgetRecommendationBaselines> {
  // Query expense categories for the family
  const categoriesRes = await pool.query(
    `
      SELECT id, name, type
      FROM categories
      WHERE family_id = $1 AND type = 'expense'
      ORDER BY name ASC;
    `,
    [familyId],
  );

  const categories = categoriesRes.rows;
  if (categories.length === 0) {
    return {
      targetMonth,
      targetYear,
      categories: [],
      hasHistoricalData: false,
      totalHistoricalAverage: 0,
    };
  }

  // 1. Query past 3-month spending per category before the target month
  const pastSpendingRes = await pool.query(
    `
      SELECT
        t.category_id,
        COALESCE(SUM(t.amount), 0)::float AS total_spent,
        COUNT(DISTINCT date_trunc('month', t.transaction_date))::int AS active_months_count,
        COUNT(t.id)::int AS transaction_count,
        COALESCE(MAX(t.amount), 0)::float AS max_single_transaction
      FROM transactions t
      WHERE t.family_id = $1
        AND t.type = 'expense'
        AND t.is_deleted = FALSE
        AND t.transaction_date >= (make_date($3, $2, 1) - interval '3 months')
        AND t.transaction_date < make_date($3, $2, 1)
      GROUP BY t.category_id;
    `,
    [familyId, targetMonth, targetYear],
  );

  const pastSpendingMap = new Map<number, {
    totalSpent: number;
    activeMonthsCount: number;
    transactionCount: number;
    maxSingleTransaction: number;
  }>();

  for (const row of pastSpendingRes.rows) {
    pastSpendingMap.set(row.category_id, {
      totalSpent: row.total_spent,
      activeMonthsCount: row.active_months_count,
      transactionCount: row.transaction_count,
      maxSingleTransaction: row.max_single_transaction,
    });
  }

  // 2. Query immediate previous month spend (targetMonth - 1)
  const prevMonthRes = await pool.query(
    `
      SELECT
        t.category_id,
        COALESCE(SUM(t.amount), 0)::float AS last_month_spent
      FROM transactions t
      WHERE t.family_id = $1
        AND t.type = 'expense'
        AND t.is_deleted = FALSE
        AND t.transaction_date >= (make_date($3, $2, 1) - interval '1 month')
        AND t.transaction_date < make_date($3, $2, 1)
      GROUP BY t.category_id;
    `,
    [familyId, targetMonth, targetYear],
  );

  const prevMonthMap = new Map<number, number>();
  for (const row of prevMonthRes.rows) {
    prevMonthMap.set(row.category_id, row.last_month_spent);
  }

  // 3. Query any existing budget for targetMonth and targetYear
  const existingBudgetsRes = await pool.query(
    `
      SELECT category_id, amount::float AS amount
      FROM budgets
      WHERE family_id = $1 AND month = $2 AND year = $3;
    `,
    [familyId, targetMonth, targetYear],
  );

  const existingBudgetsMap = new Map<number, number>();
  for (const row of existingBudgetsRes.rows) {
    existingBudgetsMap.set(row.category_id, row.amount);
  }

  // If past 3 months had 0 transactions overall, check all-time spending to give helpful guidance
  let allTimeMap = new Map<number, { total: number; months: number }>();
  if (pastSpendingRes.rows.length === 0) {
    const allTimeRes = await pool.query(
      `
        SELECT
          t.category_id,
          COALESCE(SUM(t.amount), 0)::float AS total_spent,
          GREATEST(COUNT(DISTINCT date_trunc('month', t.transaction_date)), 1)::int AS active_months_count
        FROM transactions t
        WHERE t.family_id = $1
          AND t.type = 'expense'
          AND t.is_deleted = FALSE
        GROUP BY t.category_id;
      `,
      [familyId],
    );
    for (const row of allTimeRes.rows) {
      allTimeMap.set(row.category_id, {
        total: row.total_spent,
        months: row.active_months_count,
      });
    }
  }

  let hasHistoricalData = false;
  let totalHistoricalAverage = 0;

  const baselines: CategoryBaseline[] = categories.map((cat) => {
    const past = pastSpendingMap.get(cat.id);
    const lastMonth = prevMonthMap.get(cat.id) ?? 0;
    const currentBudget = existingBudgetsMap.get(cat.id) ?? null;

    let averageMonthlySpend = 0;
    let transactionCount = 0;
    let activeMonthsCount = 0;
    let recentMaxTransaction = 0;

    if (past && past.totalSpent > 0) {
      hasHistoricalData = true;
      activeMonthsCount = Math.max(1, past.activeMonthsCount);
      averageMonthlySpend = Math.round(past.totalSpent / activeMonthsCount);
      transactionCount = past.transactionCount;
      recentMaxTransaction = past.maxSingleTransaction;
    } else if (allTimeMap.has(cat.id)) {
      const allTime = allTimeMap.get(cat.id)!;
      if (allTime.total > 0) {
        hasHistoricalData = true;
        averageMonthlySpend = Math.round(allTime.total / allTime.months);
      }
    }

    totalHistoricalAverage += averageMonthlySpend;

    // Deterministic recommendation heuristic:
    // Essentials (Groceries, Food, Utilities, Bills, Health) get ~10% buffer
    // Discretionary gets ~5% buffer or stable round-up to nearest ₹500
    const catLower = cat.name.toLowerCase();
    const isEssential =
      catLower.includes("food") ||
      catLower.includes("grocer") ||
      catLower.includes("bill") ||
      catLower.includes("util") ||
      catLower.includes("health") ||
      catLower.includes("educat");

    let recommendedAmount = 0;
    let reasoning = "";

    if (averageMonthlySpend > 0) {
      const multiplier = isEssential ? 1.1 : 1.05;
      const targetRaw = averageMonthlySpend * multiplier;
      // Round up to nearest ₹500
      recommendedAmount = Math.max(500, Math.ceil(targetRaw / 500) * 500);

      const bufferPercent = Math.round(((recommendedAmount - averageMonthlySpend) / averageMonthlySpend) * 100);
      reasoning = `Based on average monthly spending of ₹${averageMonthlySpend.toLocaleString("en-IN")}, a ₹${recommendedAmount.toLocaleString("en-IN")} target provides a comfortable ${bufferPercent}% safety buffer.`;
    } else {
      // Starter budget for inactive category
      recommendedAmount = isEssential ? 3000 : 2000;
      reasoning = `No recent transactions found in ${cat.name}. A starter target of ₹${recommendedAmount.toLocaleString("en-IN")} provides a reasonable baseline to begin tracking.`;
    }

    return {
      categoryId: cat.id,
      categoryName: cat.name,
      categoryType: cat.type,
      averageMonthlySpend,
      lastMonthSpend: lastMonth,
      recentMaxTransaction,
      activeMonthsCount,
      totalTransactionCount: transactionCount,
      currentBudget,
      recommendedAmount,
      reasoning,
    };
  });

  return {
    targetMonth,
    targetYear,
    categories: baselines,
    hasHistoricalData,
    totalHistoricalAverage,
  };
}
