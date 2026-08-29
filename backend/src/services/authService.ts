import bcrypt from "bcrypt";
import pool from "../config/database.js";

export async function findUserByEmail(email: string) {
  const result = await pool.query(
    `
      SELECT
        id,
        name,
        email,
        password_hash
      FROM users
      WHERE email = $1
      LIMIT 1;
    `,
    [email],
  );

  return result.rows[0] ?? null;
}

export async function createUser(
  name: string,
  email: string,
  password: string,
) {
  const passwordHash = await bcrypt.hash(password, 12);

  const result = await pool.query(
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
    [name, email, passwordHash],
  );

  return result.rows[0];
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
) {
  return bcrypt.compare(password, passwordHash);
}