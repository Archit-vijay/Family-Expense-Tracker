import bcrypt from "bcrypt";
import crypto from "crypto";
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
      WHERE LOWER(email) = LOWER($1)
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

export async function findOrCreateGoogleUser(
  email: string,
  name: string,
) {
  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return existingUser;
  }

  // Create user with a secure random password hash
  const randomPass = crypto.randomBytes(32).toString("hex");
  const passwordHash = await bcrypt.hash(randomPass, 12);

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
