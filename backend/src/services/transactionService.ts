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