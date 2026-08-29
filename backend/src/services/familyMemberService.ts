import pool from "../config/database.js";

export async function getFamilyMembers(familyId: number) {
  const result = await pool.query(
    `
      SELECT
        id,
        name,
        created_at
      FROM family_members
      WHERE family_id = $1
      AND is_active = TRUE
      ORDER BY name ASC;
    `,
    [familyId],
  );

  return result.rows;
}

export async function createFamilyMember(
  familyId: number,
  name: string,
) {
  const result = await pool.query(
    `
      INSERT INTO family_members (
        family_id,
        name
      )
      VALUES ($1, $2)
      RETURNING
        id,
        name,
        created_at;
    `,
    [familyId, name],
  );

  return result.rows[0];
}

export async function updateFamilyMember(
  familyId: number,
  memberId: number,
  name: string,
) {
  const result = await pool.query(
    `
      UPDATE family_members
      SET
        name = $1,
        updated_at = NOW()
      WHERE
        id = $2
        AND family_id = $3
        AND is_active = TRUE
      RETURNING
        id,
        name,
        created_at;
    `,
    [name, memberId, familyId],
  );

  return result.rows[0] ?? null;
}

export async function deactivateFamilyMember(
  familyId: number,
  memberId: number,
) {
  const result = await pool.query(
    `
      UPDATE family_members
      SET
        is_active = FALSE,
        updated_at = NOW()
      WHERE
        id = $1
        AND family_id = $2
        AND is_active = TRUE
      RETURNING
        id,
        name,
        created_at;
    `,
    [memberId, familyId],
  );

  return result.rows[0] ?? null;
}