import "dotenv/config";

import fs from "node:fs/promises";
import path from "node:path";

import pool from "../config/database.js";

async function migrate() {
  const client = await pool.connect();

  try {
    console.log("Starting database migrations...");

    // Create migration tracking table
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename VARCHAR(255) NOT NULL UNIQUE,
        executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    const migrationsDirectory = path.resolve(
      process.cwd(),
      "migrations",
    );

    const files = await fs.readdir(migrationsDirectory);

    const migrationFiles = files
      .filter((file) => file.endsWith(".sql"))
      .sort();

    for (const file of migrationFiles) {
      const result = await client.query(
        "SELECT id FROM schema_migrations WHERE filename = $1",
        [file],
      );

      if (result.rows.length > 0) {
        console.log(`Skipping ${file}`);
        continue;
      }

      console.log(`Running ${file}`);

      const sql = await fs.readFile(
        path.join(migrationsDirectory, file),
        "utf-8",
      );

      try {
        await client.query("BEGIN");

        await client.query(sql);

        await client.query(
          `INSERT INTO schema_migrations (filename)
           VALUES ($1)`,
          [file],
        );

        await client.query("COMMIT");

        console.log(`Completed ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");

        console.error(`Failed ${file}`);
        throw error;
      }
    }

    console.log("Database migrations completed!");
  } catch (error) {
    console.error("Migration error:", error);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();