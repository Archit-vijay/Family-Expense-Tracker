import pool from "../config/database.js";

export async function getCategories(familyId: number) {
  const result = await pool.query(
    `
      SELECT
        id,
        name,
        type,
        created_at
      FROM categories
      WHERE family_id = $1
      ORDER BY type ASC, name ASC;
    `,
    [familyId],
  );

  return result.rows;
}

export async function createCategory(
  familyId: number,
  name: string,
  type: "income" | "expense",
) {
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    throw new Error("Category name must be at least 2 characters long.");
  }

  if (type !== "income" && type !== "expense") {
    throw new Error("Category type must be either 'income' or 'expense'.");
  }

  const existing = await pool.query(
    "SELECT id FROM categories WHERE family_id = $1 AND LOWER(name) = LOWER($2) LIMIT 1",
    [familyId, trimmed],
  );

  if (existing.rows.length > 0) {
    throw new Error("A category with this name already exists in your family.");
  }

  const result = await pool.query(
    `
      INSERT INTO categories (family_id, name, type)
      VALUES ($1, $2, $3)
      RETURNING id, name, type, created_at;
    `,
    [familyId, trimmed, type],
  );

  return result.rows[0];
}

export async function deleteCategory(familyId: number, categoryId: number) {
  const check = await pool.query(
    "SELECT id, name FROM categories WHERE id = $1 AND family_id = $2 LIMIT 1",
    [categoryId, familyId],
  );

  if (check.rows.length === 0) {
    throw new Error("Category not found in your family.");
  }

  const txCheck = await pool.query(
    "SELECT id FROM transactions WHERE category_id = $1 AND is_deleted = FALSE LIMIT 1",
    [categoryId],
  );

  if (txCheck.rows.length > 0) {
    throw new Error(
      "Cannot delete this category because active transactions are assigned to it. Reassign or delete those transactions first.",
    );
  }

  const budgetCheck = await pool.query(
    "SELECT id FROM budgets WHERE category_id = $1 LIMIT 1",
    [categoryId],
  );

  if (budgetCheck.rows.length > 0) {
    throw new Error(
      "Cannot delete this category because monthly budgets are assigned to it. Remove those budget limits first.",
    );
  }

  await pool.query(
    "DELETE FROM categories WHERE id = $1 AND family_id = $2",
    [categoryId, familyId],
  );

  return { id: categoryId, name: check.rows[0].name };
}
