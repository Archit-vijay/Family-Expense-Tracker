import crypto from "node:crypto";
import bcrypt from "bcrypt";

import pool from "../config/database.js";

export async function createFamilyInvitation(
  familyId: number,
  familyMemberId: number,
  email: string,
) {
  const memberResult = await pool.query(
    `
      SELECT
        id,
        name,
        user_id
      FROM family_members
      WHERE
        id = $1
        AND family_id = $2
        AND is_active = TRUE
      LIMIT 1;
    `,
    [familyMemberId, familyId],
  );

  const member = memberResult.rows[0];

  if (!member) {
    throw new Error("Family member not found.");
  }

  if (member.user_id !== null) {
    throw new Error(
      "This family member already has an account.",
    );
  }

  const existingUserResult = await pool.query(
    `
      SELECT id
      FROM users
      WHERE LOWER(email) = LOWER($1)
      LIMIT 1;
    `,
    [email],
  );

  if (existingUserResult.rows.length > 0) {
    throw new Error(
      "An account already exists with this email.",
    );
  }

  await pool.query(
    `
      UPDATE family_invitations
      SET
        expires_at = NOW()
      WHERE
        family_member_id = $1
        AND family_id = $2
        AND accepted_at IS NULL
        AND expires_at > NOW();
    `,
    [familyMemberId, familyId],
  );

  const token = crypto.randomBytes(32).toString("hex");

  const expiresAt = new Date(
    Date.now() + 48 * 60 * 60 * 1000,
  );

  const result = await pool.query(
    `
      INSERT INTO family_invitations (
        family_id,
        family_member_id,
        email,
        token,
        expires_at
      )
      VALUES ($1, $2, $3, $4, $5)
      RETURNING
        id,
        family_id,
        family_member_id,
        email,
        token,
        expires_at,
        created_at;
    `,
    [
      familyId,
      familyMemberId,
      email,
      token,
      expiresAt,
    ],
  );

  return {
    ...result.rows[0],
    memberName: member.name,
  };
}

export async function getInvitationByToken(
  token: string,
) {
  const result = await pool.query(
    `
      SELECT
        fi.id,
        fi.family_id,
        fi.family_member_id,
        fi.email,
        fi.expires_at,
        fi.accepted_at,
        fm.name AS member_name
      FROM family_invitations fi
      INNER JOIN family_members fm
        ON fm.id = fi.family_member_id
      WHERE fi.token = $1
      LIMIT 1;
    `,
    [token],
  );

  return result.rows[0] ?? null;
}

export async function acceptFamilyInvitation(
  token: string,
  password: string,
) {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const invitationResult = await client.query(
      `
        SELECT
          fi.id,
          fi.family_id,
          fi.family_member_id,
          fi.email,
          fi.expires_at,
          fi.accepted_at,
          fm.name AS member_name,
          fm.user_id
        FROM family_invitations fi
        INNER JOIN family_members fm
          ON fm.id = fi.family_member_id
        WHERE fi.token = $1
        LIMIT 1
        FOR UPDATE;
      `,
      [token],
    );

    const invitation = invitationResult.rows[0];

    if (!invitation) {
      throw new Error("Invitation not found.");
    }

    if (invitation.accepted_at) {
      throw new Error(
        "This invitation has already been accepted.",
      );
    }

    if (
      new Date(invitation.expires_at).getTime() <=
      Date.now()
    ) {
      throw new Error("This invitation has expired.");
    }

    if (invitation.user_id !== null) {
      throw new Error(
        "This family member already has an account.",
      );
    }

    const existingUserResult = await client.query(
      `
        SELECT id
        FROM users
        WHERE LOWER(email) = LOWER($1)
        LIMIT 1;
      `,
      [invitation.email],
    );

    if (existingUserResult.rows.length > 0) {
      throw new Error(
        "An account already exists with this email.",
      );
    }

    const passwordHash = await bcrypt.hash(
      password,
      12,
    );

    const userResult = await client.query(
      `
        INSERT INTO users (
          name,
          email,
          password_hash
        )
        VALUES ($1, $2, $3)
        RETURNING
          id,
          name,
          email,
          created_at;
      `,
      [
        invitation.member_name,
        invitation.email,
        passwordHash,
      ],
    );

    const user = userResult.rows[0];

    await client.query(
      `
        UPDATE family_members
        SET
          user_id = $1,
          updated_at = NOW()
        WHERE
          id = $2
          AND family_id = $3
          AND is_active = TRUE;
      `,
      [
        user.id,
        invitation.family_member_id,
        invitation.family_id,
      ],
    );

    await client.query(
      `
        INSERT INTO family_memberships (
          user_id,
          family_id,
          role
        )
        VALUES ($1, $2, 'member');
      `,
      [
        user.id,
        invitation.family_id,
      ],
    );

    await client.query(
      `
        UPDATE family_invitations
        SET
          accepted_at = NOW()
        WHERE id = $1;
      `,
      [invitation.id],
    );

    await client.query("COMMIT");

    return {
      user,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}