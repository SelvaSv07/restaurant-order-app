const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const standalone = path.join(root, ".next", "standalone");
const publicDir = path.join(root, "public");
const staticDir = path.join(root, ".next", "static");
const drizzleDir = path.join(root, "drizzle");

if (!fs.existsSync(standalone)) {
  console.error("Missing .next/standalone — run `next build` first.");
  process.exit(1);
}

if (fs.existsSync(publicDir)) {
  fs.cpSync(publicDir, path.join(standalone, "public"), { recursive: true });
}

if (!fs.existsSync(staticDir)) {
  console.error("Missing .next/static — run `next build` first.");
  process.exit(1);
}

const standaloneNext = path.join(standalone, ".next");
fs.mkdirSync(standaloneNext, { recursive: true });
fs.cpSync(staticDir, path.join(standaloneNext, "static"), { recursive: true });

if (fs.existsSync(drizzleDir)) {
  fs.cpSync(drizzleDir, path.join(standalone, "drizzle"), { recursive: true });
}

console.log("Copied public, .next/static, and drizzle into .next/standalone");
