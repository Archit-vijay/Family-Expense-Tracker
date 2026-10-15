import pool from "../config/database.js";

export interface PeriodRange {
  startDate: string;
  endDate: string;
  label: string;
}

export interface MetricComparison {
  current: number;
  previous: number;
  changeAmount: number;
  changePercentage: number;
  trend: "up" | "down" | "neutral";
}

export interface CategoryComparison {
  name: string;
  currentAmount: number;
  previousAmount: number;
  changeAmount: number;
  changePercentage: number;
  percentageOfTotal: number;
  isSpike: boolean;
}

export interface MemberComparison {
  name: string;
  currentAmount: number;
  previousAmount: number;
  changeAmount: number;
  changePercentage: number;
  percentageOfTotal: number;
}

export interface FinancialAnomaly {
  id: string;
  type: "outlier_transaction" | "velocity_spike" | "category_surge" | "new_category";
  severity: "high" | "medium" | "low";
  title: string;
  description: string;
  amount: number;
  category: string;
  date?: string;
  ratio?: number;
  explanation: string;
}

export interface DeterministicFinancialMetrics {
  period: {
    current: PeriodRange;
    previous: PeriodRange;
    selectedPeriod: string;
  };
  expenses: MetricComparison;
  income: MetricComparison;
  netSavings: MetricComparison;
  savingsRate: MetricComparison;
  categories: CategoryComparison[];
  topCategory: CategoryComparison | null;
  categorySpikes: CategoryComparison[];
  members: MemberComparison[];
  topSpender: MemberComparison | null;
  transactionStats: {
    totalCount: number;
    averageExpense: number;
    largestExpense: {
      title: string;
      amount: number;
      category: string;
      date: string;
    } | null;
  };
  anomalies: FinancialAnomaly[];
  hasEnoughData: boolean;
}

function getMonthName(monthIndex: number, year: number): string {
  const date = new Date(Date.UTC(year, monthIndex, 1));
  return date.toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

export function getComparativeDateRanges(period: string = "this-month"): {
  current: PeriodRange;
  previous: PeriodRange;
} {
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();

  let curStartYear = currentYear;
  let curStartMonth = currentMonth;
  let curEndYear = currentYear;
  let curEndMonth = currentMonth + 1;

  let prevStartYear = currentYear;
  let prevStartMonth = currentMonth - 1;
  let prevEndYear = currentYear;
  let prevEndMonth = currentMonth;

  let curLabel = "";
  let prevLabel = "";

  switch (period) {
    case "this-month":
      curLabel = getMonthName(currentMonth, currentYear);
      prevLabel = getMonthName(currentMonth - 1, currentYear);
      break;

    case "previous-month":
      curStartMonth = currentMonth - 1;
      curEndMonth = currentMonth;
      prevStartMonth = currentMonth - 2;
      prevEndMonth = currentMonth - 1;
      curLabel = getMonthName(currentMonth - 1, currentYear);
      prevLabel = getMonthName(currentMonth - 2, currentYear);
      break;

    case "last-3-months": {
      curStartMonth = currentMonth - 2;
      prevStartMonth = currentMonth - 5;
      prevEndMonth = currentMonth - 2;
      curLabel = "Last 3 Months";
      prevLabel = "Prior 3 Months";
      break;
    }

    default: {
      // Support YYYY-MM specific month format (e.g. "2026-08")
      const monthMatch = /^(\d{4})-(\d{2})$/.exec(period);
      if (monthMatch) {
        const y = parseInt(monthMatch[1], 10);
        const m = parseInt(monthMatch[2], 10) - 1; // 0-indexed
        curStartYear = y;
        curStartMonth = m;
        curEndYear = y;
        curEndMonth = m + 1;
        prevStartYear = y;
        prevStartMonth = m - 1;
        prevEndYear = y;
        prevEndMonth = m;
        curLabel = getMonthName(m, y);
        prevLabel = getMonthName(m - 1, y);
      } else {
        curLabel = getMonthName(currentMonth, currentYear);
        prevLabel = getMonthName(currentMonth - 1, currentYear);
      }
      break;
    }
  }

  const curStart = new Date(Date.UTC(curStartYear, curStartMonth, 1));
  const curEnd = new Date(Date.UTC(curEndYear, curEndMonth, 1));

  const prevStart = new Date(Date.UTC(prevStartYear, prevStartMonth, 1));
  const prevEnd = new Date(Date.UTC(prevEndYear, prevEndMonth, 1));

  return {
    current: {
      startDate: curStart.toISOString().slice(0, 10),
      endDate: curEnd.toISOString().slice(0, 10),
      label: curLabel,
    },
    previous: {
      startDate: prevStart.toISOString().slice(0, 10),
      endDate: prevEnd.toISOString().slice(0, 10),
      label: prevLabel,
    },
  };
}

function calculateMetricComparison(current: number, previous: number): MetricComparison {
  const changeAmount = current - previous;
  let changePercentage = 0;

  if (previous > 0) {
    changePercentage = Number((((current - previous) / previous) * 100).toFixed(1));
  } else if (current > 0) {
    changePercentage = 100;
  }

  let trend: "up" | "down" | "neutral" = "neutral";
  if (changeAmount > 0) {
    trend = "up";
  } else if (changeAmount < 0) {
    trend = "down";
  }

  return {
    current,
    previous,
    changeAmount,
    changePercentage,
    trend,
  };
}

export async function calculateDeterministicMetrics(
  familyId: number,
  period: string = "this-month",
): Promise<DeterministicFinancialMetrics> {
  const { current, previous } = getComparativeDateRanges(period);

  const [
    curSummaryRes,
    prevSummaryRes,
    curCategoryRes,
    prevCategoryRes,
    curMemberRes,
    prevMemberRes,
    txStatsRes,
    largestTxRes,
    curTransactionsRes,
    categoryBaselineRes,
  ] = await Promise.all([
    // 1. Current period income & expenses
    pool.query(
      `
        SELECT
          COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) AS income,
          COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS expenses
        FROM transactions
        WHERE family_id = $1
          AND is_deleted = FALSE
          AND transaction_date >= $2
          AND transaction_date < $3
      `,
      [familyId, current.startDate, current.endDate],
    ),

    // 2. Previous period income & expenses
    pool.query(
      `
        SELECT
          COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0) AS income,
          COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0) AS expenses
        FROM transactions
        WHERE family_id = $1
          AND is_deleted = FALSE
          AND transaction_date >= $2
          AND transaction_date < $3
      `,
      [familyId, previous.startDate, previous.endDate],
    ),

    // 3. Current period category breakdown
    pool.query(
      `
        SELECT
          c.name AS category,
          COALESCE(SUM(t.amount), 0) AS amount
        FROM transactions t
        JOIN categories c ON c.id = t.category_id
        WHERE t.family_id = $1
          AND t.is_deleted = FALSE
          AND t.type = 'expense'
          AND t.transaction_date >= $2
          AND t.transaction_date < $3
        GROUP BY c.name
        ORDER BY amount DESC
      `,
      [familyId, current.startDate, current.endDate],
    ),

    // 4. Previous period category breakdown
    pool.query(
      `
        SELECT
          c.name AS category,
          COALESCE(SUM(t.amount), 0) AS amount
        FROM transactions t
        JOIN categories c ON c.id = t.category_id
        WHERE t.family_id = $1
          AND t.is_deleted = FALSE
          AND t.type = 'expense'
          AND t.transaction_date >= $2
          AND t.transaction_date < $3
        GROUP BY c.name
        ORDER BY amount DESC
      `,
      [familyId, previous.startDate, previous.endDate],
    ),

    // 5. Current period member spending
    pool.query(
      `
        SELECT
          fm.name AS member_name,
          COALESCE(SUM(t.amount), 0) AS amount
        FROM transactions t
        JOIN family_members fm ON fm.id = t.member_id
        WHERE t.family_id = $1
          AND t.is_deleted = FALSE
          AND t.type = 'expense'
          AND t.transaction_date >= $2
          AND t.transaction_date < $3
        GROUP BY fm.name
        ORDER BY amount DESC
      `,
      [familyId, current.startDate, current.endDate],
    ),

    // 6. Previous period member spending
    pool.query(
      `
        SELECT
          fm.name AS member_name,
          COALESCE(SUM(t.amount), 0) AS amount
        FROM transactions t
        JOIN family_members fm ON fm.id = t.member_id
        WHERE t.family_id = $1
          AND t.is_deleted = FALSE
          AND t.type = 'expense'
          AND t.transaction_date >= $2
          AND t.transaction_date < $3
        GROUP BY fm.name
        ORDER BY amount DESC
      `,
      [familyId, previous.startDate, previous.endDate],
    ),

    // 7. Transaction count & avg expense in current period
    pool.query(
      `
        SELECT
          COUNT(*) AS count,
          COALESCE(AVG(amount) FILTER (WHERE type = 'expense'), 0) AS avg_expense
        FROM transactions
        WHERE family_id = $1
          AND is_deleted = FALSE
          AND transaction_date >= $2
          AND transaction_date < $3
      `,
      [familyId, current.startDate, current.endDate],
    ),

    // 8. Largest expense transaction in current period
    pool.query(
      `
        SELECT
          t.title,
          t.amount,
          c.name AS category,
          t.transaction_date::text AS date
        FROM transactions t
        JOIN categories c ON c.id = t.category_id
        WHERE t.family_id = $1
          AND t.is_deleted = FALSE
          AND t.type = 'expense'
          AND t.transaction_date >= $2
          AND t.transaction_date < $3
        ORDER BY t.amount DESC
        LIMIT 1
      `,
      [familyId, current.startDate, current.endDate],
    ),

    // 9. All current period expense transactions (for outlier & frequency anomaly detection)
    pool.query(
      `
        SELECT
          t.id,
          t.title,
          t.amount,
          c.id AS category_id,
          c.name AS category,
          fm.name AS member_name,
          t.transaction_date::text AS date
        FROM transactions t
        JOIN categories c ON c.id = t.category_id
        LEFT JOIN family_members fm ON fm.id = t.member_id
        WHERE t.family_id = $1
          AND t.is_deleted = FALSE
          AND t.type = 'expense'
          AND t.transaction_date >= $2
          AND t.transaction_date < $3
        ORDER BY t.transaction_date DESC, t.amount DESC
      `,
      [familyId, current.startDate, current.endDate],
    ),

    // 10. Category baseline (90 days prior to current period)
    pool.query(
      `
        SELECT
          c.id AS category_id,
          c.name AS category,
          COUNT(t.id) AS tx_count,
          COALESCE(AVG(t.amount), 0) AS avg_amount,
          COALESCE(STDDEV(t.amount), 0) AS std_amount
        FROM transactions t
        JOIN categories c ON c.id = t.category_id
        WHERE t.family_id = $1
          AND t.is_deleted = FALSE
          AND t.type = 'expense'
          AND t.transaction_date < $2
          AND t.transaction_date >= ($2::date - INTERVAL '90 days')
        GROUP BY c.id, c.name
      `,
      [familyId, current.startDate],
    ),
  ]);

  const curIncome = Number(curSummaryRes.rows[0]?.income || 0);
  const curExpenses = Number(curSummaryRes.rows[0]?.expenses || 0);
  const prevIncome = Number(prevSummaryRes.rows[0]?.income || 0);
  const prevExpenses = Number(prevSummaryRes.rows[0]?.expenses || 0);

  const curNetSavings = curIncome - curExpenses;
  const prevNetSavings = prevIncome - prevExpenses;

  const curSavingsRate = curIncome > 0 ? Number(((curNetSavings / curIncome) * 100).toFixed(1)) : 0;
  const prevSavingsRate = prevIncome > 0 ? Number(((prevNetSavings / prevIncome) * 100).toFixed(1)) : 0;

  const expensesComparison = calculateMetricComparison(curExpenses, prevExpenses);
  const incomeComparison = calculateMetricComparison(curIncome, prevIncome);
  const netSavingsComparison = calculateMetricComparison(curNetSavings, prevNetSavings);
  const savingsRateComparison = calculateMetricComparison(curSavingsRate, prevSavingsRate);

  // Map previous categories for quick delta lookup
  const prevCategoryMap = new Map<string, number>();
  for (const row of prevCategoryRes.rows) {
    prevCategoryMap.set(row.category, Number(row.amount));
  }

  const allCategoryNames = new Set<string>();
  for (const row of curCategoryRes.rows) allCategoryNames.add(row.category);
  for (const row of prevCategoryRes.rows) allCategoryNames.add(row.category);

  const curCategoryMap = new Map<string, number>();
  for (const row of curCategoryRes.rows) {
    curCategoryMap.set(row.category, Number(row.amount));
  }

  const categoryComparisons: CategoryComparison[] = [];
  for (const catName of allCategoryNames) {
    const curAmount = curCategoryMap.get(catName) || 0;
    const prevAmount = prevCategoryMap.get(catName) || 0;
    const changeAmount = curAmount - prevAmount;

    let changePercentage = 0;
    if (prevAmount > 0) {
      changePercentage = Number((((curAmount - prevAmount) / prevAmount) * 100).toFixed(1));
    } else if (curAmount > 0) {
      changePercentage = 100;
    }

    const percentageOfTotal =
      curExpenses > 0 ? Number(((curAmount / curExpenses) * 100).toFixed(1)) : 0;

    // A category spike is defined as >= 20% increase and >= ₹500 increase, OR a new category with >= ₹1,000 spend
    const isSpike =
      (prevAmount > 0 && changePercentage >= 20 && changeAmount >= 500) ||
      (prevAmount === 0 && curAmount >= 1000);

    if (curAmount > 0 || prevAmount > 0) {
      categoryComparisons.push({
        name: catName,
        currentAmount: curAmount,
        previousAmount: prevAmount,
        changeAmount,
        changePercentage,
        percentageOfTotal,
        isSpike,
      });
    }
  }

  // Sort categories by current amount descending
  categoryComparisons.sort((a, b) => b.currentAmount - a.currentAmount);

  const topCategory = categoryComparisons.length > 0 && categoryComparisons[0].currentAmount > 0
    ? categoryComparisons[0]
    : null;

  const categorySpikes = categoryComparisons.filter((c) => c.isSpike);

  // Members comparison
  const prevMemberMap = new Map<string, number>();
  for (const row of prevMemberRes.rows) {
    prevMemberMap.set(row.member_name, Number(row.amount));
  }

  const curMemberMap = new Map<string, number>();
  for (const row of curMemberRes.rows) {
    curMemberMap.set(row.member_name, Number(row.amount));
  }

  const allMemberNames = new Set<string>();
  for (const row of curMemberRes.rows) allMemberNames.add(row.member_name);
  for (const row of prevMemberRes.rows) allMemberNames.add(row.member_name);

  const memberComparisons: MemberComparison[] = [];
  for (const memName of allMemberNames) {
    const curAmount = curMemberMap.get(memName) || 0;
    const prevAmount = prevMemberMap.get(memName) || 0;
    const changeAmount = curAmount - prevAmount;

    let changePercentage = 0;
    if (prevAmount > 0) {
      changePercentage = Number((((curAmount - prevAmount) / prevAmount) * 100).toFixed(1));
    } else if (curAmount > 0) {
      changePercentage = 100;
    }

    const percentageOfTotal =
      curExpenses > 0 ? Number(((curAmount / curExpenses) * 100).toFixed(1)) : 0;

    if (curAmount > 0 || prevAmount > 0) {
      memberComparisons.push({
        name: memName,
        currentAmount: curAmount,
        previousAmount: prevAmount,
        changeAmount,
        changePercentage,
        percentageOfTotal,
      });
    }
  }

  memberComparisons.sort((a, b) => b.currentAmount - a.currentAmount);
  const topSpender = memberComparisons.length > 0 && memberComparisons[0].currentAmount > 0
    ? memberComparisons[0]
    : null;

  const totalCount = Number(txStatsRes.rows[0]?.count || 0);
  const averageExpense = Number(Number(txStatsRes.rows[0]?.avg_expense || 0).toFixed(2));

  let largestExpense = null;
  if (largestTxRes.rows.length > 0) {
    largestExpense = {
      title: largestTxRes.rows[0].title,
      amount: Number(largestTxRes.rows[0].amount),
      category: largestTxRes.rows[0].category,
      date: largestTxRes.rows[0].date,
    };
  }

  // --- Deterministic Anomaly Detection Engine ---
  const anomalies: FinancialAnomaly[] = [];

  // Map category baseline (from last 90 days prior to current period)
  const categoryBaselineMap = new Map<string, { count: number; avg: number; std: number }>();
  for (const row of categoryBaselineRes.rows) {
    categoryBaselineMap.set(row.category, {
      count: Number(row.tx_count),
      avg: Number(row.avg_amount),
      std: Number(row.std_amount),
    });
  }

  // 1. Transaction Outliers (High Variance single transactions)
  for (const row of curTransactionsRes.rows) {
    const txAmount = Number(row.amount);
    const txCat = row.category;
    const baseline = categoryBaselineMap.get(txCat);

    if (baseline && baseline.count >= 2 && baseline.avg > 0) {
      const ratio = Number((txAmount / baseline.avg).toFixed(1));
      if (txAmount >= 1000 && ratio >= 2.5) {
        anomalies.push({
          id: `outlier-${row.id}`,
          type: "outlier_transaction",
          severity: txAmount >= 10000 || ratio >= 3.5 ? "high" : "medium",
          title: `Unusual Expense in ${txCat}`,
          description: `₹${txAmount.toLocaleString("en-IN")} on '${row.title}' is ${ratio}x higher than your category average (₹${Math.round(baseline.avg).toLocaleString("en-IN")}).`,
          amount: txAmount,
          category: txCat,
          date: row.date,
          ratio,
          explanation: `This expense is significantly larger than typical spending in ${txCat}. Check whether this was a planned one-off purchase.`,
        });
      }
    } else if (averageExpense > 0) {
      const ratio = Number((txAmount / averageExpense).toFixed(1));
      if (txAmount >= 3000 && ratio >= 3.0) {
        anomalies.push({
          id: `outlier-${row.id}`,
          type: "outlier_transaction",
          severity: "high",
          title: `High-Value Expense in ${txCat}`,
          description: `₹${txAmount.toLocaleString("en-IN")} on '${row.title}' is ${ratio}x higher than your overall average expense (₹${Math.round(averageExpense).toLocaleString("en-IN")}).`,
          amount: txAmount,
          category: txCat,
          date: row.date,
          ratio,
          explanation: `A large transaction was recorded with limited category history. Verify details to ensure accurate family budgeting.`,
        });
      }
    }
  }

  // 2. Velocity Spikes (3+ transactions in same category on same date)
  const categoryDateCluster = new Map<string, { count: number; total: number; titles: string[] }>();
  for (const row of curTransactionsRes.rows) {
    const key = `${row.category}_${row.date}`;
    const txAmount = Number(row.amount);
    const existing = categoryDateCluster.get(key) || { count: 0, total: 0, titles: [] };
    existing.count += 1;
    existing.total += txAmount;
    if (existing.titles.length < 3) existing.titles.push(row.title);
    categoryDateCluster.set(key, existing);
  }

  for (const [key, cluster] of categoryDateCluster.entries()) {
    if (cluster.count >= 3 && cluster.total >= 1000) {
      const [category, date] = key.split("_");
      anomalies.push({
        id: `velocity-${key}`,
        type: "velocity_spike",
        severity: cluster.total >= 5000 || cluster.count >= 4 ? "high" : "medium",
        title: `Frequent Activity in ${category}`,
        description: `${cluster.count} transactions recorded in ${category} on ${date} totaling ₹${cluster.total.toLocaleString("en-IN")}.`,
        amount: cluster.total,
        category,
        date,
        ratio: cluster.count,
        explanation: `Multiple purchases occurred in ${category} within a single day. Review transactions to avoid unintended repeat or duplicate charges.`,
      });
    }
  }

  // 3. Category Surge (Category spend doubled and increased by >= ₹1,500)
  for (const cat of categoryComparisons) {
    if (
      cat.previousAmount > 0 &&
      cat.changePercentage >= 100 &&
      cat.changeAmount >= 1500
    ) {
      const alreadyHasOutlier = anomalies.some(
        (a) => a.type === "outlier_transaction" && a.category === cat.name
      );
      if (!alreadyHasOutlier) {
        anomalies.push({
          id: `surge-${cat.name}`,
          type: "category_surge",
          severity: cat.changeAmount >= 5000 ? "high" : "medium",
          title: `${cat.name} Spending Surge`,
          description: `Spending jumped by +${cat.changePercentage}% (+₹${cat.changeAmount.toLocaleString("en-IN")}) compared to ${previous.label}.`,
          amount: cat.currentAmount,
          category: cat.name,
          ratio: Number((cat.currentAmount / cat.previousAmount).toFixed(1)),
          explanation: `${cat.name} spending has more than doubled compared to last period. Keep an eye on ongoing commitments in this category.`,
        });
      }
    }
  }

  // 4. New Category (Major spend in previously inactive category)
  for (const cat of categoryComparisons) {
    if (cat.previousAmount === 0 && cat.currentAmount >= 2000) {
      const baseline = categoryBaselineMap.get(cat.name);
      if (!baseline || baseline.count === 0) {
        const alreadyHasOutlier = anomalies.some(
          (a) => a.category === cat.name
        );
        if (!alreadyHasOutlier) {
          anomalies.push({
            id: `new-${cat.name}`,
            type: "new_category",
            severity: "low",
            title: `New Expense Area: ${cat.name}`,
            description: `First recorded expenses in ${cat.name} totaling ₹${cat.currentAmount.toLocaleString("en-IN")}.`,
            amount: cat.currentAmount,
            category: cat.name,
            explanation: `A new spending category appeared this period. Consider establishing a reasonable monthly allocation for ${cat.name}.`,
          });
        }
      }
    }
  }

  // Sort anomalies: "high" severity first, then by amount descending, limit to top 4
  const severityScore = { high: 3, medium: 2, low: 1 };
  anomalies.sort((a, b) => {
    const diff = severityScore[b.severity] - severityScore[a.severity];
    if (diff !== 0) return diff;
    return (b.amount || 0) - (a.amount || 0);
  });

  const topAnomalies = anomalies.slice(0, 4);

  const hasEnoughData = curExpenses > 0 || curIncome > 0 || prevExpenses > 0;

  return {
    period: {
      current,
      previous,
      selectedPeriod: period,
    },
    expenses: expensesComparison,
    income: incomeComparison,
    netSavings: netSavingsComparison,
    savingsRate: savingsRateComparison,
    categories: categoryComparisons,
    topCategory,
    categorySpikes,
    members: memberComparisons,
    topSpender,
    transactionStats: {
      totalCount,
      averageExpense,
      largestExpense,
    },
    anomalies: topAnomalies,
    hasEnoughData,
  };
}
