/**
 * Deletes all bills (and bill lines via ON DELETE CASCADE).
 * Usage: DATABASE_URL=file:./data/app.db node scripts/clear-bills.mjs
 * Or: RESTAURANT_DB_PATH=C:\\path\\to\\app.db (matches Electron userData DB)
 */
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const fromElectron = process.env.RESTAURANT_DB_PATH?.trim();
const resolved = fromElectron
  ? path.resolve(fromElectron)
  : (() => {
      const raw = process.env.DATABASE_URL ?? "file:data/app.db";
      const dbPath = raw.replace(/^file:/, "");
      return path.isAbsolute(dbPath) ? dbPath : path.join(root, dbPath);
    })();

const db = new Database(resolved);
db.pragma("foreign_keys = ON");

const countBefore = db.prepare("SELECT count(*) AS n FROM bills").get().n;
db.prepare("DELETE FROM bills").run();

console.log(`Cleared ${countBefore} bill(s) from ${resolved}`);
db.close();
