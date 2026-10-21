import pool from "../config/database.js";
import { generateUniqueFamilyCode } from "../utils/familyCode.js";

const DEFAULT_EXPENSE_CATEGORIES = [
  "Food & Dining",
  "Housing & Rent",
  "Utilities & Bills",
  "Groceries",
  "Transportation",
  "Healthcare",
  "Shopping",
  "Entertainment",
];

const DEFAULT_INCOME_CATEGORIES = [
  "Salary",
  "Freelance",
  "Investments",
  "Other Income",
];

export async function getFamilyForUser(userId: number) {
  const result = await pool.query(
    `
      SELECT
        f.id AS family_id,
        f.name AS family_name,
        f.code AS family_code,
        fm.role
      FROM family_memberships fm
      INNER JOIN families f ON f.id = fm.family_id
      WHERE fm.user_id = $1
      LIMIT 1;
    `,
    [userId],
  );

  return result.rows[0] ?? null;
}

export async function createFamilyForUser(userId: number, familyName: string) {
  const existing = await getFamilyForUser(userId);
  if (existing) {
    throw new Error("You already belong to a family group.");
  }

  // Fetch user's name
  const userResult = await pool.query(
    "SELECT name FROM users WHERE id = $1 LIMIT 1",
    [userId]
  );
  const userName = userResult.rows[0]?.name || "Family Admin";

  const code = await generateUniqueFamilyCode();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Create family
    const familyRes = await client.query(
      `
        INSERT INTO families (name, code)
        VALUES ($1, $2)
        RETURNING id, name, code;
      `,
      [familyName.trim(), code]
    );
    const family = familyRes.rows[0];

    // 2. Add user to family_memberships as admin
    await client.query(
      `
        INSERT INTO family_memberships (user_id, family_id, role)
        VALUES ($1, $2, 'admin');
      `,
      [userId, family.id]
    );

    // 3. Create active family_members row linked to user
    await client.query(
      `
        INSERT INTO family_members (family_id, name, user_id, is_active)
        VALUES ($1, $2, $3, TRUE);
      `,
      [family.id, userName, userId]
    );

    // 4. Seed starter expense categories
    for (const catName of DEFAULT_EXPENSE_CATEGORIES) {
      await client.query(
        `
          INSERT INTO categories (family_id, name, type)
          VALUES ($1, $2, 'expense')
          ON CONFLICT DO NOTHING;
        `,
        [family.id, catName]
      );
    }

    // 5. Seed starter income categories
    for (const catName of DEFAULT_INCOME_CATEGORIES) {
      await client.query(
        `
          INSERT INTO categories (family_id, name, type)
          VALUES ($1, $2, 'income')
          ON CONFLICT DO NOTHING;
        `,
        [family.id, catName]
      );
    }

    await client.query("COMMIT");

    return {
      familyId: family.id,
      name: family.name,
      code: family.code,
      role: "admin",
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function joinFamilyByCode(userId: number, code: string) {
  const existing = await getFamilyForUser(userId);
  if (existing) {
    throw new Error("You already belong to a family group.");
  }

  const cleanCode = code.trim().toUpperCase();

  // Find family by code
  const familyRes = await pool.query(
    "SELECT id, name, code FROM families WHERE UPPER(code) = $1 LIMIT 1",
    [cleanCode]
  );

  const family = familyRes.rows[0];
  if (!family) {
    throw new Error("Invalid family code. Please verify the code and try again.");
  }

  // Fetch user's name
  const userResult = await pool.query(
    "SELECT name FROM users WHERE id = $1 LIMIT 1",
    [userId]
  );
  const userName = userResult.rows[0]?.name || "Family Member";

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // 1. Add user to family_memberships with role 'member'
    await client.query(
      `
        INSERT INTO family_memberships (user_id, family_id, role)
        VALUES ($1, $2, 'member');
      `,
      [userId, family.id]
    );

    // 2. Check if there's an unlinked active family_member with same name
    const memberCheck = await client.query(
      `
        SELECT id FROM family_members
        WHERE family_id = $1 AND user_id IS NULL AND is_active = TRUE AND LOWER(name) = LOWER($2)
        LIMIT 1;
      `,
      [family.id, userName]
    );

    if (memberCheck.rows.length > 0) {
      await client.query(
        `
          UPDATE family_members
          SET user_id = $1, updated_at = NOW()
          WHERE id = $2;
        `,
        [userId, memberCheck.rows[0].id]
      );
    } else {
      await client.query(
        `
          INSERT INTO family_members (family_id, name, user_id, is_active)
          VALUES ($1, $2, $3, TRUE);
        `,
        [family.id, userName, userId]
      );
    }

    await client.query("COMMIT");

    return {
      familyId: family.id,
      name: family.name,
      role: "member",
    };
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

export async function getFamilyCode(familyId: number) {
  const result = await pool.query(
    "SELECT code FROM families WHERE id = $1 LIMIT 1",
    [familyId]
  );
  return result.rows[0]?.code ?? null;
}

export async function regenerateFamilyCode(familyId: number) {
  const newCode = await generateUniqueFamilyCode();
  const result = await pool.query(
    `
      UPDATE families
      SET code = $1, updated_at = NOW()
      WHERE id = $2
      RETURNING code;
    `,
    [newCode, familyId]
  );
  return result.rows[0]?.code ?? null;
}
