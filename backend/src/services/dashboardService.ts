import pool from "../config/database.js";

function getDateRange(period: string) {
  const now = new Date();

  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();

  let startYear = currentYear;
  let startMonth = currentMonth;

  let endYear = currentYear;
  let endMonth = currentMonth + 1;

  switch (period) {
    case "this-month":
      break;

    case "previous-month":
      startMonth = currentMonth - 1;
      endMonth = currentMonth;
      break;

    case "last-3-months":
      startMonth = currentMonth - 2;
      break;

    case "last-6-months":
      startMonth = currentMonth - 5;
      break;

    case "this-year":
      startMonth = 0;
      break;

    default:
      throw new Error("Invalid dashboard period.");
  }

  const startDate = new Date(
    Date.UTC(startYear, startMonth, 1),
  );

  const endDate = new Date(
    Date.UTC(endYear, endMonth, 1),
  );

  return {
    startDate: startDate.toISOString().slice(0, 10),
    endDate: endDate.toISOString().slice(0, 10),
  };
}

export async function getDashboardData(
  familyId: number,
  period: string,
) {
  const { startDate, endDate } = getDateRange(period);

  const values = [familyId, startDate, endDate];

  const [
    summaryResult,
    trendResult,
    categoryResult,
    recentResult,
    memberResult,
  ] = await Promise.all([
    pool.query(
      `
        SELECT
          COALESCE(
            SUM(amount) FILTER (WHERE type = 'income'),
            0
          ) AS income,

          COALESCE(
            SUM(amount) FILTER (WHERE type = 'expense'),
            0
          ) AS expenses

        FROM transactions

        WHERE family_id = $1
          AND is_deleted = FALSE
          AND transaction_date >= $2
          AND transaction_date < $3
      `,
      values,
    ),

    pool.query(
      `
        SELECT
          transaction_date::text AS date,

          COALESCE(
            SUM(amount) FILTER (WHERE type = 'income'),
            0
          ) AS income,

          COALESCE(
            SUM(amount) FILTER (WHERE type = 'expense'),
            0
          ) AS expenses

        FROM transactions

        WHERE family_id = $1
          AND is_deleted = FALSE
          AND transaction_date >= $2
          AND transaction_date < $3

        GROUP BY transaction_date

        ORDER BY transaction_date
      `,
      values,
    ),

    pool.query(
      `
        SELECT
          c.name AS category,
          SUM(t.amount) AS amount

        FROM transactions t

        JOIN categories c
          ON c.id = t.category_id

        WHERE t.family_id = $1
          AND t.is_deleted = FALSE
          AND t.type = 'expense'
          AND t.transaction_date >= $2
          AND t.transaction_date < $3

        GROUP BY c.id, c.name

        ORDER BY amount DESC, c.name

        LIMIT 6
      `,
      values,
    ),

    pool.query(
      `
        SELECT
          t.id,
          t.title,
          t.amount,
          t.type,
          t.transaction_date::text AS transaction_date,
          c.id AS category_id,
          c.name AS category,
          fm.id AS member_id,
          fm.name AS member_name

        FROM transactions t

        JOIN categories c
          ON c.id = t.category_id

        JOIN family_members fm
          ON fm.id = t.member_id

        WHERE t.family_id = $1
          AND t.is_deleted = FALSE
          AND t.transaction_date >= $2
          AND t.transaction_date < $3

        ORDER BY
          t.transaction_date DESC,
          t.created_at DESC

        LIMIT 5
      `,
      values,
    ),

    pool.query(
      `
        SELECT
          fm.name AS member,
          SUM(t.amount) AS amount

        FROM transactions t

        JOIN family_members fm
          ON fm.id = t.member_id

        WHERE t.family_id = $1
          AND t.is_deleted = FALSE
          AND t.type = 'expense'
          AND t.transaction_date >= $2
          AND t.transaction_date < $3

        GROUP BY fm.id, fm.name

        ORDER BY amount DESC, fm.name
      `,
      values,
    ),
  ]);

  const income = Number(
    summaryResult.rows[0].income,
  );

  const expenses = Number(
    summaryResult.rows[0].expenses,
  );

  const netSavings = income - expenses;

  const savingsRate =
    income > 0
      ? (netSavings / income) * 100
      : 0;

  return {
    period,

    summary: {
      income,
      expenses,
      netSavings,
      savingsRate,
    },

    trend: trendResult.rows.map((row) => ({
      ...row,
      income: Number(row.income),
      expenses: Number(row.expenses),
    })),

    categories: categoryResult.rows.map((row) => ({
      ...row,
      amount: Number(row.amount),
    })),

    recentTransactions:
      recentResult.rows.map((row) => ({
        ...row,
        amount: Number(row.amount),
      })),

    memberSpending: memberResult.rows.map(
      (row) => ({
        ...row,
        amount: Number(row.amount),
      }),
    ),
  };
}