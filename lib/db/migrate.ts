/**
 * Production migration runner.
 *
 * Applies all pending Drizzle migrations from the drizzle/ directory using
 * the checked-in SQL files.  This must be used in production instead of
 * `drizzle-kit push`, which synchronises schema directly without migration
 * tracking and is only safe for development / test databases.
 *
 * Usage:
 *   DATABASE_URL=... pnpm --filter @workspace/db run migrate
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import path from "path";
import { fileURLToPath } from "url";

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("ERROR: DATABASE_URL environment variable is required.");
  process.exit(1);
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const migrationsFolder = path.join(__dirname, "drizzle");

console.log(`Running migrations from: ${migrationsFolder}`);
console.log(`Connecting to database...`);

const pool = new Pool({ connectionString: DATABASE_URL });

try {
  const db = drizzle(pool);
  await migrate(db, { migrationsFolder });
  console.log("Migrations completed successfully.");
} catch (err) {
  console.error("Migration failed:", err);
  process.exit(1);
} finally {
  await pool.end();
}
