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