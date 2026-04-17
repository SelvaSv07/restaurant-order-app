import { existsSync } from "fs";
import path from "path";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { db } from "@/lib/db";
import { resolveRestaurantDbPath } from "@/lib/db/resolve-db-path";

const migrationsFolder = path.join(process.cwd(), "drizzle");
if (existsSync(migrationsFolder)) {
  migrate(db, { migrationsFolder });
}

console.info("[restaurant-order-app] SQLite file:", resolveRestaurantDbPath());
