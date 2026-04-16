/**
 * Deletes all bills (and bill lines via ON DELETE CASCADE).
 * Usage: DATABASE_URL=file:./data/app.db node scripts/clear-bills.mjs
 */
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const raw = process.env.DATABASE_URL ?? "file:data/app.db";
const dbPath = raw.replace(/^file:/, "");
const resolved = path.isAbsolute(dbPath) ? dbPath : path.join(root, dbPath);

const db = new Database(resolved);
db.pragma("foreign_keys = ON");

const countBefore = db.prepare("SELECT count(*) AS n FROM bills").get().n;
db.prepare("DELETE FROM bills").run();

console.log(`Cleared ${countBefore} bill(s) from ${resolved}`);
db.close();
