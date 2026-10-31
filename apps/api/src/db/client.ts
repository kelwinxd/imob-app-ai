import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";
import { env } from "../env";
import * as schema from "./schema";

export const pool = new pg.Pool({ connectionString: env.DATABASE_URL, max: 10 });
export const db = drizzle(pool, { schema });
export type Db = typeof db;
export type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];

const MIGRATIONS_DIR = fileURLToPath(new URL("../../drizzle", import.meta.url));

export async function runMigrations() {
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
}
