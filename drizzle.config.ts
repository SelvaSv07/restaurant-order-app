import fs from "fs";
import path from "path";

import { defineConfig } from "drizzle-kit";

/** SQLite file URL only — ignore a global `DATABASE_URL` pointing at Postgres/other drivers. */
const rawUrl =
  process.env.SQLITE_DATABASE_URL?.trim() ||
  (process.env.DATABASE_URL?.trim().startsWith("file:")
    ? process.env.DATABASE_URL.trim()
    : undefined) ||
  "file:data/app.db";
if (rawUrl.startsWith("file:")) {
  const filePath = rawUrl.replace(/^file:/, "").trim();
  const resolvedPath = path.isAbsolute(filePath) ? filePath : path.join(process.cwd(), filePath);
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
}

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle",
  dialect: "sqlite",
  dbCredentials: {
    url: rawUrl,
  },
});

