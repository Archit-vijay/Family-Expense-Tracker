import pool from "../config/database.js";

export async function getFamilyMembers(familyId: number) {
  const result = await pool.query(
    `
      SELECT
        fm.id,
        fm.name,
        fm.user_id,
        fm.created_at,
        fms.role
      FROM family_members fm
      LEFT JOIN family_memberships fms
        ON fms.user_id = fm.user_id
      AND fms.family_id = fm.family_id
      WHERE fm.family_id = $1
        AND fm.is_active = TRUE
      ORDER BY fm.created_at ASC;
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

export async function updateFamilyMemberRole(
  familyId: number,
  memberId: number,
  currentUserId: number,
  role: "admin" | "member" | "viewer",
) {
  const memberResult = await pool.query(
    `
      SELECT
        fm.id,
        fm.user_id,
        fms.role
      FROM family_members fm
      LEFT JOIN family_memberships fms
        ON fms.user_id = fm.user_id
       AND fms.family_id = fm.family_id
      WHERE fm.id = $1
        AND fm.family_id = $2
        AND fm.is_active = TRUE;
    `,
    [memberId, familyId],
  );

  if (memberResult.rows.length === 0) {
    throw new Error("Family member not found.");
  }

  const member = memberResult.rows[0];

  if (member.user_id === null) {
    throw new Error(
      "This family member does not have a connected account.",
    );
  }

  if (member.user_id === currentUserId) {
    throw new Error(
      "You cannot change your own role.",
    );
  }

  if (member.role === "admin") {
    throw new Error(
      "You cannot change the role of another admin.",
    );
  }

  const result = await pool.query(
    `
      UPDATE family_memberships
      SET role = $1
      WHERE user_id = $2
        AND family_id = $3
      RETURNING
        user_id,
        family_id,
        role;
    `,
    [role, member.user_id, familyId],
  );

  if (result.rows.length === 0) {
    throw new Error("Family membership not found.");
  }

  return result.rows[0];
}