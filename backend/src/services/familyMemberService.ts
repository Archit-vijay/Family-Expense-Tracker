import pool from "../config/database.js";

export async function getFamilyMembers(familyId: number) {
  const result = await pool.query(
    `
      SELECT
        id,
        name,
        user_id,
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
        user_id,
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
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const memberResult = await client.query(
      `
        SELECT
          id,
          name,
          user_id,
          created_at
        FROM family_members
        WHERE
          id = $1
          AND family_id = $2
          AND is_active = TRUE
        FOR UPDATE;
      `,
      [memberId, familyId],
    );

    const member = memberResult.rows[0];

    if (!member) {
      await client.query("ROLLBACK");
      return null;
    }

    // Remove the user's membership from this family.
    // The global users account is NOT deleted.
    if (member.user_id !== null) {
      await client.query(
        `
          DELETE FROM family_memberships
          WHERE
            user_id = $1
            AND family_id = $2;
        `,
        [member.user_id, familyId],
      );
    }

    // Keep the family_members row for transaction history,
    // but deactivate it and detach the global user account.
    const result = await client.query(
      `
        UPDATE family_members
        SET
          is_active = FALSE,
          user_id = NULL,
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

    await client.query("COMMIT");

    return result.rows[0] ?? null;
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}