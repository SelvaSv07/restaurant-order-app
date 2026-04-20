const { app, BrowserWindow, Menu, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const { spawn, execSync } = require("child_process");
const http = require("http");
const net = require("net");

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
  process.exit(0);
}

/** @type {import('child_process').ChildProcess | null} */
let serverProcess = null;
/** @type {BrowserWindow | null} */
let mainWindow = null;

/** @type {ReturnType<typeof setInterval> | null} */
let cloudSyncIntervalId = null;

function getAppRoot() {
  if (app.isPackaged) {
    return path.join(process.resourcesPath, "..");
  }
  return path.join(__dirname, "..");
}

/** Pick a port that is free on 127.0.0.1 (OS assigns when 0). */
function getFreePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.listen(0, "127.0.0.1", () => {
      const addr = s.address();
      const port = typeof addr === "object" && addr ? addr.port : 0;
      s.close(() => resolve(port));
    });
    s.on("error", reject);
  });
}

/**
 * Prefer a stable port so the embedded Next URL stays the same between runs.
 * Falls back to a random free port if the default (or RESTAURANT_EMBEDDED_PORT) is taken.
 */
function isPortFree(port) {
  return new Promise((resolve) => {
    const s = net.createServer();
    s.once("error", () => resolve(false));
    s.listen(port, "127.0.0.1", () => {
      s.close(() => resolve(true));
    });
  });
}

async function getEmbeddedServerPort() {
  const fromEnv = process.env.RESTAURANT_EMBEDDED_PORT?.trim();
  if (fromEnv && /^\d+$/.test(fromEnv)) {
    const p = Number(fromEnv);
    if (p > 0 && p < 65536 && (await isPortFree(p))) return p;
  }
  const preferred = 45231;
  if (await isPortFree(preferred)) return preferred;
  return getFreePort();
}

function waitForServer(port, timeoutMs = 120_000) {
  const url = `http://127.0.0.1:${port}/`;
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const tryOnce = () => {
      http
        .get(url, (res) => {
          res.resume();
          resolve(undefined);
        })
        .on("error", () => {
          if (Date.now() - start > timeoutMs) {
            reject(
              new Error(
                `Server did not respond on port ${port} within ${timeoutMs}ms`,
              ),
            );
            return;
          }
          setTimeout(tryOnce, 300);
        });
    };
    tryOnce();
  });
}

function getNodeForPackaged() {
  const embedded =
    process.platform === "win32"
      ? path.join(process.resourcesPath, "node-runtime", "node.exe")
      : path.join(process.resourcesPath, "node-runtime", "bin", "node");
  if (fs.existsSync(embedded)) {
    return embedded;
  }
  return "node";
}

function spawnNextServer(appRoot, port, dbPath) {
  const env = {
    ...process.env,
    PORT: String(port),
    HOSTNAME: "127.0.0.1",
    RESTAURANT_DB_PATH: dbPath,
  };

  if (!app.isPackaged) {
    const nextCli = path.join(appRoot, "node_modules", "next", "dist", "bin", "next");
    if (!fs.existsSync(nextCli)) {
      throw new Error(`Next CLI not found at ${nextCli}`);
    }
    /** `start` = production. With `output: "standalone"`, `next start` is wrong — use `node server.js` in `.next/standalone`. */
    const useProdServer = process.env.RESTAURANT_NEXT_MODE === "start";
    if (useProdServer) {
      const standaloneDir = path.join(appRoot, ".next", "standalone");
      const serverJs = path.join(standaloneDir, "server.js");
      if (!fs.existsSync(serverJs)) {
        throw new Error(
          "Standalone server missing (.next/standalone/server.js). Run: npm run build",
        );
      }
      env.NODE_ENV = "production";
      env.HOSTNAME = "127.0.0.1";
      env.HOST = "127.0.0.1";
      return spawn("node", ["server.js"], {
        cwd: standaloneDir,
        env,
        stdio: "inherit",
        windowsHide: true,
      });
    }
    return spawn("node", [nextCli, "dev", "-H", "127.0.0.1", "-p", String(port)], {
      cwd: appRoot,
      env,
      stdio: "inherit",
      windowsHide: true,
    });
  }

  const standaloneDir = path.join(process.resourcesPath, "standalone");
  const serverJs = path.join(standaloneDir, "server.js");
  if (!fs.existsSync(serverJs)) {
    throw new Error(`Standalone server not found: ${serverJs}`);
  }

  const nodeBin = getNodeForPackaged();
  const logPath = path.join(path.dirname(dbPath), "next-server.log");
  let logFd;
  try {
    logFd = fs.openSync(logPath, "a");
  } catch {
    logFd = undefined;
  }
  const stdio = logFd !== undefined ? ["ignore", logFd, logFd] : "inherit";

  env.NODE_ENV = "production";

  return spawn(nodeBin, ["server.js"], {
    cwd: standaloneDir,
    env,
    stdio,
    windowsHide: true,
    detached: false,
  });
}

/** Fire-and-forget: Next returns 202 immediately; ingest runs in a background task after the response. */
function triggerCloudSync(port) {
  const url = `http://127.0.0.1:${port}/api/internal/cloud-sync`;
  http
    .get(url, (res) => {
      res.resume();
    })
    .on("error", () => {
      // ignore — sync errors are stored in cloud_sync_settings by the server
    });
}

function clearCloudSyncTimer() {
  if (cloudSyncIntervalId) {
    clearInterval(cloudSyncIntervalId);
    cloudSyncIntervalId = null;
  }
}

function killServerProcess() {
  if (!serverProcess) return;
  const pid = serverProcess.pid;
  if (process.platform === "win32") {
    try {
      execSync(`taskkill /PID ${pid} /T /F`, { stdio: "ignore", windowsHide: true });
    } catch {
      try {
        serverProcess.kill("SIGKILL");
      } catch {
        // ignore
      }
    }
  } else {
    try {
      serverProcess.kill("SIGTERM");
    } catch {
      // ignore
    }
    try {
      serverProcess.kill("SIGKILL");
    } catch {
      // ignore
    }
  }
  serverProcess = null;
}

function isAllowedPrintUrl(urlString) {
  try {
    const u = new URL(urlString);
    if (u.protocol !== "http:" && u.protocol !== "https:") return false;
    const h = u.hostname;
    if (h === "127.0.0.1" || h === "localhost" || h === "::1") return true;
    return false;
  } catch {
    return false;
  }
}

function printBillWindow(win, opts) {
  return new Promise((resolve) => {
    win.webContents.print(
      {
        silent: opts.silent,
        printBackground: true,
        ...(opts.deviceName ? { deviceName: opts.deviceName } : {}),
      },
      (success, failureReason) => {
        resolve({ ok: success, error: failureReason });
      },
    );
  });
}

function printBillWindowWithTimeout(win, opts, ms) {
  return Promise.race([
    printBillWindow(win, opts),
    new Promise((resolve) =>
      setTimeout(
        () => resolve({ ok: false, error: `Print timed out after ${Math.round(ms / 1000)}s` }),
        ms,
      ),
    ),
  ]);
}

const PRINT_SILENT_TIMEOUT_MS = 25_000;

/** Wait until receipt/KOT text is in the DOM (Turbopack can finish load early). */
async function waitForPrintBodyText(win) {
  const isDevServer = process.env.RESTAURANT_NEXT_MODE !== "start";
  const maxAttempts = isDevServer ? 28 : 14;
  const delayMs = 400;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const ok = await win.webContents.executeJavaScript(
        `(function(){
          var t = (document.body && document.body.innerText) ? document.body.innerText : '';
          return t.replace(/\\s+/g,' ').trim().length > 20;
        })()`,
        true,
      );
      if (ok) return;
    } catch {
      // ignore
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
}

/**
 * Match stored name from settings to Chromium's device name (same as Settings dropdown `p.name`).
 */
async function resolveDeviceName(deviceNameRaw) {
  const trimmed = typeof deviceNameRaw === "string" ? deviceNameRaw.trim() : "";
  if (trimmed === "") return undefined;
  if (!mainWindow) return trimmed;
  let list = [];
  try {
    list = await mainWindow.webContents.getPrintersAsync();
  } catch {
    return trimmed;
  }
  const exact = list.find((p) => p.name === trimmed);
  if (exact) return exact.name;
  const byDisplay = list.find((p) => p.displayName && p.displayName.trim() === trimmed);
  if (byDisplay) return byDisplay.name;
  return trimmed;
}

function registerPrintIpc() {
  ipcMain.handle("printers:list", async () => {
    if (!mainWindow) return [];
    try {
      return await mainWindow.webContents.getPrintersAsync();
    } catch {
      return [];
    }
  });

  ipcMain.handle("print:url", async (_event, urlString, options) => {
    if (!isAllowedPrintUrl(urlString)) {
      return {
        ok: false,
        error: `Print URL not allowed: ${urlString}`,
      };
    }

    let loadUrlString = urlString;
    try {
      const u = new URL(urlString);
      u.searchParams.set("silent", "1");
      loadUrlString = u.toString();
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }

    const deviceName = await resolveDeviceName(options?.deviceName);

    const session = mainWindow?.webContents.session;
    const win = new BrowserWindow({
      show: false,
      width: 900,
      height: 2000,
      backgroundColor: "#ffffff",
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: false,
        ...(session ? { session } : {}),
      },
    });

    const cleanup = () => {
      try {
        win.destroy();
      } catch {
        // ignore
      }
    };

    try {
      await win.loadURL(loadUrlString);
    } catch (e) {
      cleanup();
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }

    await new Promise((resolve) => {
      if (win.webContents.isLoading()) {
        win.webContents.once("did-finish-load", resolve);
      } else {
        resolve(undefined);
      }
    });

    try {
      await win.webContents.executeJavaScript(
        `new Promise((r) => {
          if (document.readyState === "complete") r();
          else window.addEventListener("load", () => r(), { once: true });
        })`,
      );
    } catch {
      // still try to print
    }

    // On Windows, offscreen/hidden windows are not composited by Chromium so
    // webContents.print produces blank output.  Keep the print window on-screen
    // (behind the main window) so it gets painted, then print silently.
    try {
      if (process.platform === "win32") {
        win.showInactive();
      } else {
        win.setBounds({ x: -2400, y: 0, width: 900, height: 2000 });
        win.showInactive();
      }
    } catch {
      try {
        win.showInactive();
      } catch {
        // ignore
      }
    }

    await waitForPrintBodyText(win);

    // Wait for Chromium to actually paint a frame before printing.
    try {
      await win.webContents.executeJavaScript(
        `new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))`,
      );
    } catch {
      // ignore
    }

    const isDevServer = process.env.RESTAURANT_NEXT_MODE !== "start";
    const settleMs = isDevServer ? 3200 : 1800;
    await new Promise((r) => setTimeout(r, settleMs));

    let result = await printBillWindowWithTimeout(
      win,
      { silent: true, deviceName },
      PRINT_SILENT_TIMEOUT_MS,
    );

    if (!result.ok && deviceName) {
      console.warn("[electron print:url] retry default printer:", result.error);
      await new Promise((r) => setTimeout(r, 300));
      result = await printBillWindowWithTimeout(
        win,
        { silent: true, deviceName: undefined },
        PRINT_SILENT_TIMEOUT_MS,
      );
    }

    if (!result.ok && process.env.RESTAURANT_PRINT_FALLBACK_DIALOG === "1") {
      console.warn("[electron print:url] silent failed, opening print dialog:", result.error);
      try {
        win.show();
        win.focus();
      } catch {
        // ignore
      }
      await new Promise((r) => setTimeout(r, 400));
      result = await printBillWindowWithTimeout(
        win,
        { silent: false, deviceName },
        180_000,
      );
    }

    if (!result.ok) {
      console.error("[electron print:url] failed:", loadUrlString, result.error);
    }

    cleanup();
    return result;
  });
}

function createWindow(url) {
  const preloadPath = path.join(__dirname, "preload.cjs");
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: fs.existsSync(preloadPath) ? preloadPath : undefined,
    },
  });

  /** Allow receipt/KOT print URLs to open in a normal window so Chromium's print dialog runs (webContents.print is unreliable on Windows). */
  mainWindow.webContents.setWindowOpenHandler((details) => {
    try {
      const u = new URL(details.url);
      const h = u.hostname;
      if (h !== "127.0.0.1" && h !== "localhost" && h !== "::1") {
        return { action: "deny" };
      }
      if (!u.pathname.includes("/print/")) {
        return { action: "deny" };
      }
      const session = mainWindow?.webContents.session;
      return {
        action: "allow",
        overrideBrowserWindowOptions: {
          width: 420,
          height: 760,
          autoHideMenuBar: true,
          backgroundColor: "#ffffff",
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            ...(session ? { session } : {}),
          },
        },
      };
    } catch {
      return { action: "deny" };
    }
  });

  // Do not kill the Next server here: hidden/child windows (e.g. print preview) may still
  // need localhost until they close. Cleanup runs in app "before-quit" / "window-all-closed".
  mainWindow.loadURL(url);
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function start() {
  if (app.isPackaged) {
    app.setName("Starkhub");
  }
  const appRoot = getAppRoot();
  const userDataDir = app.getPath("userData");
  const dbPath = path.join(userDataDir, "app.db");

  const port = await getEmbeddedServerPort();

  serverProcess = spawnNextServer(appRoot, port, dbPath);
  serverProcess.on("error", (err) => {
    console.error("Next server spawn error:", err);
  });

  try {
    await waitForServer(port);
  } catch (e) {
    killServerProcess();
    throw e;
  }

  cloudSyncIntervalId = setInterval(() => triggerCloudSync(port), 5 * 60 * 1000);
  setTimeout(() => triggerCloudSync(port), 15_000);

  const url = `http://127.0.0.1:${port}/`;
  createWindow(url);
}

app.on("second-instance", () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  registerPrintIpc();
  start().catch((err) => {
    console.error(err);
    app.quit();
  });
});

app.on("window-all-closed", () => {
  app.quit();
});

app.on("before-quit", () => {
  clearCloudSyncTimer();
  killServerProcess();
});
