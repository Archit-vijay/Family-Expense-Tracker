import pool from "../config/database.js";

export async function getTransactions(familyId: number) {
  const result = await pool.query(
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
        ON t.category_id = c.id

      JOIN family_members fm
        ON t.member_id = fm.id

      WHERE
        t.family_id = $1
        AND t.is_deleted = FALSE

      ORDER BY
        t.transaction_date DESC,
        t.created_at DESC;
    `,
    [familyId],
  );

  return result.rows;
}

export interface CreateTransactionInput {
  familyId: number;
  memberId: number;
  categoryId: number;
  createdBy: number;
  title: string;
  amount: number;
  type: "income" | "expense";
  transactionDate: string;
}

export async function createTransaction(
  transaction: CreateTransactionInput,
) {
  const result = await pool.query(
    `
      INSERT INTO transactions (
        family_id,
        member_id,
        category_id,
        created_by,
        title,
        amount,
        type,
        transaction_date
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING
        id,
        title,
        amount,
        type,
        transaction_date;
    `,
    [
      transaction.familyId,
      transaction.memberId,
      transaction.categoryId,
      transaction.createdBy,
      transaction.title,
      transaction.amount,
      transaction.type,
      transaction.transactionDate,
    ],
  );

  return result.rows[0];
}

export interface UpdateTransactionInput {
  familyId: number;
  memberId: number;
  categoryId: number;
  title: string;
  amount: number;
  type: "income" | "expense";
  transactionDate: string;
}

export async function updateTransaction(
  transactionId: number,
  transaction: UpdateTransactionInput,
) {
  const result = await pool.query(
    `
      UPDATE transactions
      SET
        member_id = $1,
        category_id = $2,
        title = $3,
        amount = $4,
        type = $5,
        transaction_date = $6,
        updated_at = NOW()
      WHERE
        id = $7
        AND family_id = $8
        AND is_deleted = FALSE
      RETURNING
        id,
        title,
        amount,
        type,
        transaction_date::text AS transaction_date;
    `,
    [
      transaction.memberId,
      transaction.categoryId,
      transaction.title,
      transaction.amount,
      transaction.type,
      transaction.transactionDate,
      transactionId,
      transaction.familyId,
    ],
  );

  return result.rows[0] ?? null;
}

export async function deactivateTransaction(
  familyId: number,
  transactionId: number,
) {
  const result = await pool.query(
    `
      UPDATE transactions
      SET
        is_deleted = TRUE,
        updated_at = NOW()
      WHERE
        id = $1
        AND family_id = $2
        AND is_deleted = FALSE
      RETURNING
        id,
        title,
        amount,
        type,
        transaction_date::text AS transaction_date;
    `,
    [transactionId, familyId],
  );

  return result.rows[0] ?? null;
}

export async function deactivateTransactions(
  familyId: number,
  transactionIds: number[],
) {
  if (transactionIds.length === 0) {
    return [];
  }

  const result = await pool.query(
    `
      UPDATE transactions
      SET
        is_deleted = TRUE,
        updated_at = NOW()
      WHERE
        id = ANY($1::int[])
        AND family_id = $2
        AND is_deleted = FALSE
      RETURNING
        id,
        title,
        amount,
        type,
        transaction_date::text AS transaction_date;
    `,
    [transactionIds, familyId],
  );

  return result.rows;
}

export async function getSpendingByDateRange(
  familyId: number,
  startDate: string,
  endDate: string,
) {
  const result = await pool.query(
    `
      SELECT COALESCE(SUM(amount), 0) AS total_spending
      FROM transactions
      WHERE family_id = $1
        AND type = 'expense'
        AND is_deleted = FALSE
        AND transaction_date >= $2
        AND transaction_date < $3;
    `,
    [familyId, startDate, endDate],
  );

  const total = Number(result.rows[0].total_spending);
  return {
    startDate,
    endDate,
    totalSpending: total,
    formattedTotal: `₹${total.toLocaleString("en-IN")}`,
  };
}

export async function getCategorySpending(
  familyId: number,
  categoryName: string,
  startDate: string,
  endDate: string,
) {
  const result = await pool.query(
    `
      SELECT
        c.name AS category_name,
        COALESCE(SUM(t.amount), 0) AS total_spending
      FROM categories c
      LEFT JOIN transactions t
        ON t.category_id = c.id
        AND t.family_id = $1
        AND t.type = 'expense'
        AND t.is_deleted = FALSE
        AND t.transaction_date >= $3
        AND t.transaction_date < $4
      WHERE c.family_id = $1
        AND LOWER(c.name) = LOWER($2)
      GROUP BY c.id, c.name;
    `,
    [
      familyId,
      categoryName,
      startDate,
      endDate,
    ],
  );

  if (result.rows.length === 0) {
    return {
      category: categoryName,
      totalSpending: 0,
      categoryFound: false,
      startDate,
      endDate,
    };
  }

  return {
    category: result.rows[0].category_name,
    totalSpending: Number(
      result.rows[0].total_spending,
    ),
    categoryFound: true,
    startDate,
    endDate,
  };
}

export async function getFamilyTransactions(
  familyId: number,
  limit: number = 10,
  startDate?: string,
  endDate?: string,
) {
  const safeLimit = Math.min(
    Math.max(Math.floor(limit), 1),
    20,
  );

  const values: (number | string)[] = [familyId, safeLimit];
  let dateCondition = "";

  if (startDate !== undefined && endDate !== undefined) {
    values.push(startDate);
    values.push(endDate);
    dateCondition = `
      AND t.transaction_date >= $3
      AND t.transaction_date < $4
    `;
  }

  const result = await pool.query(
    `
      SELECT
        t.id,
        t.amount,
        t.type,
        t.title,
        t.transaction_date,
        c.name AS category,
        fm.name AS member_name
      FROM transactions t
      LEFT JOIN categories c
        ON c.id = t.category_id
      LEFT JOIN family_members fm
        ON fm.id = t.member_id
      WHERE
        t.family_id = $1
        AND t.is_deleted = FALSE
        ${dateCondition}
      ORDER BY
        t.transaction_date DESC,
        t.id DESC
      LIMIT $2;
    `,
    values,
  );

  return result.rows.map((transaction) => ({
    id: transaction.id,
    amount: Number(transaction.amount),
    type: transaction.type,
    title: transaction.title,
    transactionDate: transaction.transaction_date,
    category: transaction.category,
    memberName: transaction.member_name,
  }));
}

export async function getMemberSpending(
  familyId: number,
  memberName: string,
  period: "current_month" | "last_month" | "all",
) {
  let dateCondition = "";

  if (period === "current_month") {
    dateCondition = `
      AND t.transaction_date >= DATE_TRUNC(
        'month',
        CURRENT_DATE
      )
      AND t.transaction_date < DATE_TRUNC(
        'month',
        CURRENT_DATE + INTERVAL '1 month'
      )
    `;
  }

  if (period === "last_month") {
    dateCondition = `
      AND t.transaction_date >= DATE_TRUNC(
        'month',
        CURRENT_DATE - INTERVAL '1 month'
      )
      AND t.transaction_date < DATE_TRUNC(
        'month',
        CURRENT_DATE
      )
    `;
  }

  const result = await pool.query(
    `
      SELECT
        fm.name AS member_name,
        COALESCE(SUM(t.amount), 0) AS total_spending
      FROM transactions t
      JOIN family_members fm
        ON fm.id = t.member_id
      WHERE
        t.family_id = $1
        AND fm.family_id = $1
        AND fm.is_active = TRUE
        AND t.is_deleted = FALSE
        AND t.type = 'expense'
        AND LOWER(fm.name) = LOWER($2)
        ${dateCondition}
      GROUP BY fm.name;
    `,
    [familyId, memberName],
  );

  if (result.rows.length === 0) {
    return {
      memberName,
      totalSpending: 0,
      memberFound: false,
    };
  }

  return {
    memberName: result.rows[0].member_name,
    totalSpending: Number(
      result.rows[0].total_spending,
    ),
    memberFound: true,
  };
}

export async function getMemberSpendingByDateRange(
  familyId: number,
  memberName: string,
  startDate: string,
  endDate: string,
) {
  const result = await pool.query(
    `
      SELECT
        fm.name AS member_name,
        COALESCE(SUM(t.amount), 0) AS total_spending
      FROM family_members fm
      LEFT JOIN transactions t
        ON t.member_id = fm.id
        AND t.family_id = $1
        AND t.type = 'expense'
        AND t.is_deleted = FALSE
        AND t.transaction_date >= $3
        AND t.transaction_date < $4
      WHERE fm.family_id = $1
        AND fm.is_active = TRUE
        AND LOWER(fm.name) = LOWER($2)
      GROUP BY fm.id, fm.name;
    `,
    [
      familyId,
      memberName,
      startDate,
      endDate,
    ],
  );

  if (result.rows.length === 0) {
    return {
      memberName,
      totalSpending: 0,
      memberFound: false,
      startDate,
      endDate,
    };
  }

    return {
    memberName: result.rows[0].member_name,
    totalSpending: Number(
      result.rows[0].total_spending,
    ),
    memberFound: true,
    startDate,
    endDate,
  };
}

export async function getAllMembersSpendingByDateRange(
  familyId: number,
  startDate: string,
  endDate: string,
) {
  const result = await pool.query(
    `
      SELECT
        fm.name AS member_name,
        COALESCE(SUM(t.amount), 0) AS total_spending,
        COUNT(t.id) AS transaction_count
      FROM family_members fm
      LEFT JOIN transactions t
        ON t.member_id = fm.id
        AND t.family_id = $1
        AND t.type = 'expense'
        AND t.is_deleted = FALSE
        AND t.transaction_date >= $2
        AND t.transaction_date < $3
      WHERE fm.family_id = $1
        AND fm.is_active = TRUE
      GROUP BY fm.id, fm.name
      ORDER BY total_spending DESC;
    `,
    [familyId, startDate, endDate],
  );

  const members = result.rows.map((row) => ({
    memberName: row.member_name,
    totalSpending: Number(row.total_spending),
    transactionCount: Number(row.transaction_count),
  }));

  const totalSpending = members.reduce(
    (sum, m) => sum + m.totalSpending,
    0,
  );

  const breakdown = members
    .map((m) => `${m.memberName}: ₹${m.totalSpending.toLocaleString("en-IN")}`)
    .join(", ");

  return {
    startDate,
    endDate,
    totalFamilySpending: totalSpending,
    breakdown,
    members,
  };
}

export async function getIncomeByDateRange(
  familyId: number,
  startDate: string,
  endDate: string,
) {
  const result = await pool.query(
    `
      SELECT COALESCE(SUM(amount), 0) AS total_income
      FROM transactions
      WHERE family_id = $1
        AND type = 'income'
        AND is_deleted = FALSE
        AND transaction_date >= $2
        AND transaction_date < $3;
    `,
    [familyId, startDate, endDate],
  );

  const total = Number(result.rows[0].total_income);
  return {
    startDate,
    endDate,
    totalIncome: total,
    formattedTotal: `₹${total.toLocaleString("en-IN")}`,
  };
}

export async function getAllMembersIncomeByDateRange(
  familyId: number,
  startDate: string,
  endDate: string,
) {
  const result = await pool.query(
    `
      SELECT
        fm.name AS member_name,
        COALESCE(SUM(t.amount), 0) AS total_income,
        COUNT(t.id) AS transaction_count
      FROM family_members fm
      LEFT JOIN transactions t
        ON t.member_id = fm.id
        AND t.family_id = $1
        AND t.type = 'income'
        AND t.is_deleted = FALSE
        AND t.transaction_date >= $2
        AND t.transaction_date < $3
      WHERE fm.family_id = $1
        AND fm.is_active = TRUE
      GROUP BY fm.id, fm.name
      ORDER BY total_income DESC;
    `,
    [familyId, startDate, endDate],
  );

  const members = result.rows.map((row) => ({
    memberName: row.member_name,
    totalIncome: Number(row.total_income),
    transactionCount: Number(row.transaction_count),
  }));

  const totalIncome = members.reduce(
    (sum, m) => sum + m.totalIncome,
    0,
  );

  const breakdown = members
    .map((m) => `${m.memberName}: ₹${m.totalIncome.toLocaleString("en-IN")}`)
    .join(", ");

  return {
    startDate,
    endDate,
    totalFamilyIncome: totalIncome,
    breakdown,
    members,
  };
}

export async function getIncomeSummary(
  familyId: number,
  period: "current_month" | "last_month" | "all",
) {
  let dateCondition = "";

  if (period === "current_month") {
    dateCondition = `
      AND transaction_date >= DATE_TRUNC(
        'month',
        CURRENT_DATE
      )
      AND transaction_date < DATE_TRUNC(
        'month',
        CURRENT_DATE + INTERVAL '1 month'
      )
    `;
  }

  if (period === "last_month") {
    dateCondition = `
      AND transaction_date >= DATE_TRUNC(
        'month',
        CURRENT_DATE - INTERVAL '1 month'
      )
      AND transaction_date < DATE_TRUNC(
        'month',
        CURRENT_DATE
      )
    `;
  }

  const result = await pool.query(
    `
      SELECT
        COALESCE(SUM(amount), 0) AS total_income
      FROM transactions
      WHERE
        family_id = $1
        AND type = 'income'
        AND is_deleted = FALSE
        ${dateCondition};
    `,
    [familyId],
  );

  const total = Number(result.rows[0].total_income);
  return {
    period,
    totalIncome: total,
    formattedTotal: `₹${total.toLocaleString("en-IN")}`,
  };
}

export async function getSpendingTrends(
  familyId: number,
  months: number,
) {
  const safeMonths = Math.min(
    Math.max(Math.floor(months), 1),
    12,
  );

  const result = await pool.query(
    `
      SELECT
        TO_CHAR(
          DATE_TRUNC('month', t.transaction_date),
          'YYYY-MM'
        ) AS month,
        COALESCE(SUM(t.amount), 0) AS total_spending
      FROM transactions t
      WHERE
        t.family_id = $1
        AND t.type = 'expense'
        AND t.is_deleted = FALSE
        AND t.transaction_date >= DATE_TRUNC(
          'month',
          CURRENT_DATE - (($2 - 1) * INTERVAL '1 month')
        )
        AND t.transaction_date < DATE_TRUNC(
          'month',
          CURRENT_DATE + INTERVAL '1 month'
        )
      GROUP BY
        DATE_TRUNC('month', t.transaction_date)
      ORDER BY
        DATE_TRUNC('month', t.transaction_date) ASC;
    `,
    [familyId, safeMonths],
  );

  return result.rows.map((row) => ({
    month: row.month,
    totalSpending: Number(
      row.total_spending,
    ),
  }));
}

export async function getMemberIncomeByDateRange(
  familyId: number,
  memberName: string,
  startDate: string,
  endDate: string,
) {
  const result = await pool.query(
    `
      SELECT
        fm.name AS member_name,
        COALESCE(SUM(t.amount), 0) AS total_income
      FROM family_members fm
      LEFT JOIN transactions t
        ON t.member_id = fm.id
        AND t.family_id = $1
        AND t.type = 'income'
        AND t.is_deleted = FALSE
        AND t.transaction_date >= $3
        AND t.transaction_date < $4
      WHERE fm.family_id = $1
        AND fm.is_active = TRUE
        AND LOWER(fm.name) = LOWER($2)
      GROUP BY fm.id, fm.name;
    `,
    [
      familyId,
      memberName,
      startDate,
      endDate,
    ],
  );

  if (result.rows.length === 0) {
    return {
      memberName,
      totalIncome: 0,
      memberFound: false,
      startDate,
      endDate,
    };
  }

  return {
    memberName: result.rows[0].member_name,
    totalIncome: Number(
      result.rows[0].total_income,
    ),
    memberFound: true,
    startDate,
    endDate,
  };
}