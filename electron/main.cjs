const { app, BrowserWindow, Menu } = require("electron");
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

function createWindow(url) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
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

  const port = await getFreePort();

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
  start().catch((err) => {
    console.error(err);
    app.quit();
  });
});

app.on("window-all-closed", () => {
  killServerProcess();
  app.quit();
});

app.on("before-quit", () => {
  killServerProcess();
});

app.on("will-quit", () => {
  killServerProcess();
});
