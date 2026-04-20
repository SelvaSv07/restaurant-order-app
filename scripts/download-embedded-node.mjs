import {
  createWriteStream,
  existsSync,
  mkdirSync,
  rmSync,
  createReadStream,
  copyFileSync,
} from "fs";
import { execFileSync, execSync } from "child_process";
import { pipeline } from "stream/promises";
import path from "path";
import { fileURLToPath } from "url";
import { createHash } from "crypto";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "build", "node-runtime");
const zipPath = path.join(root, "build", "node-win-x64.zip");

/**
 * Pinned Node for the embedded `node.exe` (Windows packaged app).
 * Use this same version when running `npm run build` / `electron:dist` so native modules match.
 * See `engines.node` in package.json.
 */
const NODE_VERSION = "22.22.0";
const ZIP_URL = `https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-win-x64.zip`;
const SHASUMS_URL = `https://nodejs.org/dist/v${NODE_VERSION}/SHASUMS256.txt`;

if (process.platform !== "win32") {
  console.log("Skipping embedded Node download (automated only for Windows).");
  process.exit(0);
}

const nodeExe = path.join(outDir, "node.exe");

function embeddedMatchesBuild() {
  if (!existsSync(nodeExe)) return false;
  try {
    const v = execFileSync(nodeExe, ["-p", "process.version"], { encoding: "utf8" }).trim();
    if (v === `v${NODE_VERSION}`) {
      console.log("Embedded Node matches pinned version:", v);
      return true;
    }
    console.log("Embedded Node is", v, "but pinned is", `v${NODE_VERSION}`, "— replacing.");
  } catch {
    console.log("Could not read embedded Node version — replacing.");
  }
  try {
    rmSync(nodeExe, { force: true });
  } catch {
    // ignore
  }
  return false;
}

if (embeddedMatchesBuild()) {
  process.exit(0);
}

mkdirSync(path.dirname(outDir), { recursive: true });

async function download(url, dest) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `GET ${url} failed: ${res.status}. Install Node ${NODE_VERSION} (same as this shell) or adjust PATH.`,
    );
  }
  await pipeline(res.body, createWriteStream(dest));
}

function sha256File(file) {
  return new Promise((resolve, reject) => {
    const hash = createHash("sha256");
    createReadStream(file)
      .on("data", (c) => hash.update(c))
      .on("end", () => resolve(hash.digest("hex")))
      .on("error", reject);
  });
}

console.log("Downloading Node.js", NODE_VERSION, "win-x64 (pinned; run builds with Node", `v${NODE_VERSION}`, ")…");
await download(ZIP_URL, zipPath);

const shasumsRes = await fetch(SHASUMS_URL);
if (shasumsRes.ok) {
  const text = await shasumsRes.text();
  const line = text.split("\n").find((l) => l.includes("win-x64.zip"));
  const expected = line?.split(/\s+/)[0];
  if (expected) {
    const actual = await sha256File(zipPath);
    if (actual !== expected) {
      rmSync(zipPath, { force: true });
      throw new Error(`SHA256 mismatch for Node zip (expected ${expected}, got ${actual})`);
    }
  }
}

const extractDir = path.join(root, "build", "node-extract");
if (existsSync(extractDir)) {
  rmSync(extractDir, { recursive: true, force: true });
}
mkdirSync(extractDir, { recursive: true });

execSync(
  `powershell -NoProfile -Command "Expand-Archive -LiteralPath '${zipPath.replace(/'/g, "''")}' -DestinationPath '${extractDir.replace(/'/g, "''")}' -Force"`,
  { stdio: "inherit" },
);

const inner = path.join(extractDir, `node-v${NODE_VERSION}-win-x64`);
const srcExe = path.join(inner, "node.exe");
if (!existsSync(srcExe)) {
  throw new Error(`Expected ${srcExe} after extract`);
}

mkdirSync(outDir, { recursive: true });
copyFileSync(srcExe, nodeExe);

rmSync(extractDir, { recursive: true, force: true });
rmSync(zipPath, { force: true });

console.log("Wrote", nodeExe);
