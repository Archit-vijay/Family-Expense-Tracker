import pool from "../config/database.js";
import { getBudgetsWithSpending, type BudgetWithSpending } from "./budgetService.js";

export type RiskLevel = "exceeded" | "high_risk" | "moderate_risk" | "on_track";

export interface CategoryRiskAnalysis {
  categoryId: number;
  categoryName: string;
  categoryType: string;
  budgetAmount: number;
  actualSpent: number;
  burnRatePerDay: number;
  projectedMonthEndSpend: number;
  projectedOverspend: number;
  projectedPercentage: number;
  expectedPaceSpend: number;
  paceRatio: number;
  remainingBuffer: number;
  daysRemaining: number;
  recommendedDailyCap: number;
  riskLevel: RiskLevel;
  largestTransaction?: {
    title: string;
    amount: number;
    date: string;
  };
  explanation?: string;
  actionableTip?: string;
}

export interface BudgetRiskReport {
  month: number;
  year: number;
  daysElapsed: number;
  daysRemaining: number;
  totalDaysInMonth: number;
  isCurrentMonth: boolean;
  totalBudgeted: number;
  totalSpent: number;
  totalProjectedSpend: number;
  totalProjectedOverspend: number;
  overallPacePercentage: number;
  overallRiskLevel: RiskLevel;
  criticalRisksCount: number;
  moderateRisksCount: number;
  onTrackCount: number;
  categories: CategoryRiskAnalysis[];
  hasBudgets: boolean;
}

/**
 * Calculates deterministic spending pace, burn rate, and projected month-end overspending
 * for a family's category budgets.
 */
export async function calculateBudgetRisks(
  familyId: number,
  month: number,
  year: number,
): Promise<BudgetRiskReport> {
  const budgetSummary = await getBudgetsWithSpending(familyId, month, year);

  const now = new Date();
  const currentMonthNum = now.getUTCMonth() + 1;
  const currentYearNum = now.getUTCFullYear();
  const isCurrentMonth = month === currentMonthNum && year === currentYearNum;

  // Number of days in the target month
  const totalDaysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();

  let daysElapsed = totalDaysInMonth;
  let daysRemaining = 0;

  if (isCurrentMonth) {
    daysElapsed = Math.max(1, Math.min(now.getUTCDate(), totalDaysInMonth));
    daysRemaining = Math.max(0, totalDaysInMonth - daysElapsed);
  } else if (year > currentYearNum || (year === currentYearNum && month > currentMonthNum)) {
    // Future month
    daysElapsed = 0;
    daysRemaining = totalDaysInMonth;
  }

  if (budgetSummary.budgets.length === 0) {
    return {
      month,
      year,
      daysElapsed,
      daysRemaining,
      totalDaysInMonth,
      isCurrentMonth,
      totalBudgeted: 0,
      totalSpent: budgetSummary.totalSpentBudgeted,
      totalProjectedSpend: 0,
      totalProjectedOverspend: 0,
      overallPacePercentage: 0,
      overallRiskLevel: "on_track",
      criticalRisksCount: 0,
      moderateRisksCount: 0,
      onTrackCount: 0,
      categories: [],
      hasBudgets: false,
    };
  }

  // Fetch largest transaction in this month for each category
  const largestTxnRes = await pool.query(
    `
      SELECT DISTINCT ON (t.category_id)
        t.category_id,
        t.title,
        t.amount::float AS amount,
        t.transaction_date::text AS date
      FROM transactions t
      WHERE t.family_id = $1
        AND t.type = 'expense'
        AND t.is_deleted = FALSE
        AND t.transaction_date >= make_date($3, $2, 1)
        AND t.transaction_date < (make_date($3, $2, 1) + interval '1 month')
      ORDER BY t.category_id, t.amount DESC, t.transaction_date DESC;
    `,
    [familyId, month, year],
  );

  const largestTxnMap = new Map<number, { title: string; amount: number; date: string }>();
  for (const row of largestTxnRes.rows) {
    largestTxnMap.set(row.category_id, {
      title: row.title,
      amount: row.amount,
      date: row.date,
    });
  }

  let totalProjectedSpend = 0;
  let criticalRisksCount = 0;
  let moderateRisksCount = 0;
  let onTrackCount = 0;

  const categories: CategoryRiskAnalysis[] = budgetSummary.budgets.map((b: BudgetWithSpending) => {
    const budgetAmount = b.amount;
    const actualSpent = b.actualSpent;
    const remainingBuffer = budgetAmount - actualSpent;

    let burnRatePerDay = 0;
    let projectedMonthEndSpend = actualSpent;
    let paceRatio = 1;
    let expectedPaceSpend = budgetAmount;

    if (daysElapsed > 0) {
      burnRatePerDay = Math.round((actualSpent / daysElapsed) * 10) / 10;
      projectedMonthEndSpend = Math.round(burnRatePerDay * totalDaysInMonth);
      expectedPaceSpend = Math.round(budgetAmount * (daysElapsed / totalDaysInMonth));
      paceRatio = expectedPaceSpend > 0 ? Math.round((actualSpent / expectedPaceSpend) * 10) / 10 : 1;
    }

    const projectedOverspend = Math.max(0, projectedMonthEndSpend - budgetAmount);
    const projectedPercentage =
      budgetAmount > 0 ? Math.round((projectedMonthEndSpend / budgetAmount) * 100) : 0;

    const recommendedDailyCap =
      daysRemaining > 0 && remainingBuffer > 0
        ? Math.round(remainingBuffer / daysRemaining)
        : 0;

    let riskLevel: RiskLevel = "on_track";
    if (actualSpent > budgetAmount) {
      riskLevel = "exceeded";
      criticalRisksCount++;
    } else if (daysElapsed >= 3 && projectedMonthEndSpend >= budgetAmount * 1.15) {
      riskLevel = "high_risk";
      criticalRisksCount++;
    } else if (daysElapsed >= 3 && projectedMonthEndSpend > budgetAmount) {
      riskLevel = "moderate_risk";
      moderateRisksCount++;
    } else {
      riskLevel = "on_track";
      onTrackCount++;
    }

    totalProjectedSpend += projectedMonthEndSpend;

    // Deterministic fallback explanation & tip
    let explanation = "";
    let actionableTip = "";

    if (riskLevel === "exceeded") {
      explanation = `Exceeded monthly target by ₹${Math.abs(remainingBuffer).toLocaleString("en-IN")}. Current spending is at ${b.percentage}%.`;
      actionableTip = "Halt non-urgent purchases in this category for the remainder of the month.";
    } else if (riskLevel === "high_risk") {
      explanation = `Spending pace is ${paceRatio}x higher than expected for day ${daysElapsed}. Projected to exceed budget by ₹${projectedOverspend.toLocaleString("en-IN")}.`;
      actionableTip = recommendedDailyCap > 0
        ? `Cap remaining spending to ₹${recommendedDailyCap.toLocaleString("en-IN")}/day over the next ${daysRemaining} days.`
        : "Pause discretionary spending in this area immediately.";
    } else if (riskLevel === "moderate_risk") {
      explanation = `Slightly ahead of target pace. Projected month-end spend is ₹${projectedMonthEndSpend.toLocaleString("en-IN")} (${projectedPercentage}% of limit).`;
      actionableTip = recommendedDailyCap > 0
        ? `Maintain a maximum of ₹${recommendedDailyCap.toLocaleString("en-IN")}/day for the remaining ${daysRemaining} days to stay under budget.`
        : "Monitor upcoming purchases closely.";
    } else {
      explanation = `Pacing comfortably within planned limits (${b.percentage}% used with ${daysRemaining} days remaining).`;
      actionableTip = "Keep up current spending habits.";
    }

    const largest = largestTxnMap.get(b.categoryId);

    return {
      categoryId: b.categoryId,
      categoryName: b.categoryName,
      categoryType: b.categoryType,
      budgetAmount,
      actualSpent,
      burnRatePerDay,
      projectedMonthEndSpend,
      projectedOverspend,
      projectedPercentage,
      expectedPaceSpend,
      paceRatio,
      remainingBuffer,
      daysRemaining,
      recommendedDailyCap,
      riskLevel,
      largestTransaction: largest,
      explanation,
      actionableTip,
    };
  });

  const totalBudgeted = budgetSummary.totalBudgeted;
  const totalSpent = budgetSummary.totalSpentBudgeted;
  const totalProjectedOverspend = Math.max(0, totalProjectedSpend - totalBudgeted);
  const overallPacePercentage =
    totalBudgeted > 0 ? Math.round((totalProjectedSpend / totalBudgeted) * 100) : 0;

  let overallRiskLevel: RiskLevel = "on_track";
  if (totalSpent > totalBudgeted) {
    overallRiskLevel = "exceeded";
  } else if (daysElapsed >= 3 && totalProjectedSpend >= totalBudgeted * 1.15) {
    overallRiskLevel = "high_risk";
  } else if (daysElapsed >= 3 && totalProjectedSpend > totalBudgeted) {
    overallRiskLevel = "moderate_risk";
  }

  // Sort categories by highest projected overspend, then risk level
  const riskOrder: Record<RiskLevel, number> = {
    exceeded: 0,
    high_risk: 1,
    moderate_risk: 2,
    on_track: 3,
  };

  categories.sort((a, b) => {
    if (riskOrder[a.riskLevel] !== riskOrder[b.riskLevel]) {
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    }
    return b.projectedOverspend - a.projectedOverspend;
  });

  return {
    month,
    year,
    daysElapsed,
    daysRemaining,
    totalDaysInMonth,
    isCurrentMonth,
    totalBudgeted,
    totalSpent,
    totalProjectedSpend,
    totalProjectedOverspend,
    overallPacePercentage,
    overallRiskLevel,
    criticalRisksCount,
    moderateRisksCount,
    onTrackCount,
    categories,
    hasBudgets: true,
  };
}
