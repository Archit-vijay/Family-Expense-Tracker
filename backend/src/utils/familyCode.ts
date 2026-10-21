import pool from "../config/database.js";

const CODE_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function generateFamilyCode(length = 6): string {
  let result = "";
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * CODE_CHARS.length);
    result += CODE_CHARS[randomIndex];
  }
  return result;
}

export async function generateUniqueFamilyCode(): Promise<string> {
  let code = "";
  let exists = true;
  let attempts = 0;

  while (exists && attempts < 10) {
    code = generateFamilyCode(6);
    const check = await pool.query(
      "SELECT id FROM families WHERE UPPER(code) = UPPER($1) LIMIT 1",
      [code]
    );
    if (check.rows.length === 0) {
      exists = false;
    }
    attempts++;
  }

  return code;
}
