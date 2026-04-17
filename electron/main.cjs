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

/**
 * Hidden 0×0 windows often print blank; Next/Turbopack needs time to paint.
 * @param {import('electron').BrowserWindow} win
 * @param {{ silent: boolean; deviceName?: string }} first
 */
function printBillWindow(win, first) {
  return new Promise((resolve) => {
    const opts = {
      silent: first.silent,
      printBackground: true,
      ...(first.deviceName ? { deviceName: first.deviceName } : {}),
    };
    win.webContents.print(opts, (success, failureReason) => {
      resolve({ ok: success, error: failureReason });
    });
  });
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
        error: `Print URL not allowed (use 127.0.0.1): ${urlString}`,
      };
    }
    const deviceNameRaw =
      typeof options?.deviceName === "string" ? options.deviceName.trim() : "";
    const deviceName = deviceNameRaw !== "" ? deviceNameRaw : undefined;

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
      await win.loadURL(urlString);
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

    await new Promise((r) => setTimeout(r, 1200));

    try {
      win.showInactive();
    } catch {
      try {
        win.show();
      } catch {
        // ignore
      }
    }
    await new Promise((r) => setTimeout(r, 150));

    let result = await printBillWindow(win, { silent: true, deviceName });
    if (!result.ok && deviceName) {
      await new Promise((r) => setTimeout(r, 200));
      result = await printBillWindow(win, {
        silent: true,
        deviceName: undefined,
      });
    }
    if (!result.ok) {
      await new Promise((r) => setTimeout(r, 200));
      result = await printBillWindow(win, { silent: false, deviceName });
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
  mainWindow.on("close", () => {
    killServerProcess();
  });
  mainWindow.loadURL(url);
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

async function start() {
  if (app.isPackaged) {
    app.setName("Restaurant Order");
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
  killServerProcess();
});
