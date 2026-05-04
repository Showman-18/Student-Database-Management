const { app, BrowserWindow, dialog } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

const isDev = process.env.ELECTRON_DEV === 'true';
// PRODUCTION_PREVIEW is set when running "npm run desktop" locally —
// it makes the app behave exactly like the packaged version but still
// stores data in backend/data/ so you can inspect it easily.
const isProductionPreview = !isDev && !app.isPackaged;
const backendPort = process.env.PORT || '3000';
let mainWindow = null;

const waitForServer = (url, timeoutMs = 20000) =>
  new Promise((resolve, reject) => {
    const deadline = Date.now() + timeoutMs;

    const probe = () => {
      const request = http.get(url, (res) => {
        res.resume();
        resolve();
      });

      request.on('error', () => {
        if (Date.now() > deadline) {
          reject(new Error(`Timed out waiting for ${url}`));
          return;
        }
        setTimeout(probe, 350);
      });

      request.setTimeout(1500, () => {
        request.destroy();
      });
    };

    probe();
  });

// Set SQLITE_DB_PATH and SQLITE_BACKUP_DIR BEFORE requiring backend
// so db.js picks them up correctly on first load.
const setDataPaths = () => {
  let dataDir;

  if (app.isPackaged) {
    // Packaged .dmg / .exe — store data in OS user data folder
    // Mac:     ~/Library/Application Support/Student Management/
    // Windows: %APPDATA%\Student Management\
    dataDir = app.getPath('userData');
  } else {
    // "npm run desktop" local preview — store data in backend/data/
    // so it behaves like dev mode and is easy to inspect
    dataDir = path.join(__dirname, '..', 'backend', 'data');
  }

  fs.mkdirSync(dataDir, { recursive: true });

  process.env.SQLITE_DB_PATH =
    process.env.SQLITE_DB_PATH || path.join(dataDir, 'student_management.db');

  process.env.SQLITE_BACKUP_DIR =
    process.env.SQLITE_BACKUP_DIR || path.join(dataDir, 'backups');
};

const startBackend = () => {
  // CRITICAL: set paths before require so db.js reads correct values
  setDataPaths();
  try {
    require(path.join(__dirname, '..', 'backend', 'Index.js'));
  } catch (error) {
    dialog.showErrorBox('Backend Startup Failed', error.message);
    throw error;
  }
};

const ensureBackendRunning = async () => {
  const backendUrl = `http://localhost:${backendPort}/`;

  // If backend already running (dev:electron mode), reuse it
  try {
    await waitForServer(backendUrl, 1200);
    return;
  } catch {
    // not running yet — start it
  }

  startBackend();
  await waitForServer(backendUrl);
};

const createMainWindow = async () => {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1080,
    minHeight: 700,
    backgroundColor: '#f3f7f5',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
    show: false,
  });

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    dialog.showErrorBox(
      'Window Load Failed',
      `Could not load ${validatedURL}\n\nError ${errorCode}: ${errorDescription}`
    );
  });

  const backendUrl = `http://localhost:${backendPort}/`;
  await waitForServer(backendUrl);

  if (isDev) {
    await mainWindow.loadURL('http://localhost:5173');
    return;
  }

  const productionHtml = path.join(__dirname, '..', 'frontend', 'dist', 'index.html');
  if (!fs.existsSync(productionHtml)) {
    dialog.showErrorBox(
      'Frontend Build Missing',
      'Could not find frontend/dist/index.html. Run: npm run build:frontend'
    );
    app.quit();
    return;
  }

  await mainWindow.loadFile(productionHtml);
};

app.whenReady().then(async () => {
  try {
    await ensureBackendRunning();
    await createMainWindow();
  } catch (error) {
    dialog.showErrorBox('App Startup Failed', error.message);
    app.quit();
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
