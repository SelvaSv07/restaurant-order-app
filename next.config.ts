import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["better-sqlite3"],
  /** Dev SQLite must not be copied into `.next/standalone` (would look like “baked-in” data). */
  outputFileTracingExcludes: {
    "*": ["./data/app.db", "./data/app.db-wal", "./data/app.db-shm"],
  },
};

export default nextConfig;
