import pool from "../config/database.js";

export async function getFamilyForUser(userId: number) {
  const result = await pool.query(
    `
      SELECT
        fm.family_id,
        fm.role
      FROM family_memberships fm
      WHERE fm.user_id = $1
      LIMIT 1;
    `,
    [userId],
  );

  return result.rows[0] ?? null;
}