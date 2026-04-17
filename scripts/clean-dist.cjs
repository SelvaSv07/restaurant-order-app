const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const dist = path.join(__dirname, "..", "dist");

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

function killDistLocksWindows() {
  if (process.platform !== "win32") return;
  const scriptPath = path.join(__dirname, "clean-dist-kill.ps1");
  const distFull = path.resolve(dist);
  try {
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${scriptPath}"`, {
      env: { ...process.env, CLEAN_TARGET_DIR: distFull },
      stdio: "inherit",
      windowsHide: true,
    });
  } catch {
    // ok if nothing to kill
  }
}

async function main() {
  killDistLocksWindows();
  await sleep(1000);

  if (!fs.existsSync(dist)) {
    return;
  }
  for (let attempt = 0; attempt < 10; attempt++) {
    try {
      fs.rmSync(dist, { recursive: true, force: true });
      console.log("Removed dist/");
      return;
    } catch (e) {
      const code = /** @type {NodeJS.ErrnoException} */ (e).code;
      if (attempt < 9 && (code === "EBUSY" || code === "EPERM")) {
        if (attempt === 2 || attempt === 5) {
          killDistLocksWindows();
          await sleep(1200);
        } else {
          await sleep(800);
        }
        continue;
      }
      console.error(
        "Could not remove dist/ (still in use). Close Restaurant Order, close Explorer windows on dist\\, then run: npm run clean:dist",
      );
      process.exit(1);
    }
  }
}

main();
