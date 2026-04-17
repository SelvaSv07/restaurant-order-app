import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "@/lib/db/schema";
import { resolveRestaurantDbPath } from "@/lib/db/resolve-db-path";

const dbPath = resolveRestaurantDbPath();

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite, { schema });
export type DbClient = typeof db;

/** Raw better-sqlite3 instance for bootstrap DDL when the file predates a migration. */
export const sqliteRaw = sqlite;

