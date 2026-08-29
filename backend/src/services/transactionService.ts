import pool from "../config/database.js";

export async function getTransactions() {
  const result = await pool.query(`
    SELECT
      t.id,
      t.title,
      t.amount,
      t.type,
      t.transaction_date::text AS transaction_date,
      c.name AS category,
      fm.name AS member_name
    FROM transactions t
    JOIN categories c
      ON t.category_id = c.id
    JOIN family_members fm
      ON t.member_id = fm.id
    ORDER BY t.transaction_date DESC, t.created_at DESC;
  `);

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