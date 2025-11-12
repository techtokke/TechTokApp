const { app, BrowserWindow, ipcMain, nativeTheme, shell } = require('electron');
const path = require('path');
const { autoUpdater } = require('electron-updater');

autoUpdater.logger = require('electron-log');
autoUpdater.logger.transports.file.level = 'info';

let mainWindow;
let splashWindow;

function createSplashWindow() {
  splashWindow = new BrowserWindow({
    width: 400,
    height: 400,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    resizable: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  splashWindow.loadFile(path.join(__dirname, 'splash.html'));
  splashWindow.on('closed', () => (splashWindow = null));
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    frame: false,
    titleBarStyle: 'hidden',
    icon: path.join(__dirname, 'assets/logo.png'), // ✅ Use your logo for app icon
    backgroundColor: nativeTheme.shouldUseDarkColors ? '#0f172a' : '#f9fafb',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      spellcheck: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Show main window 5 seconds after splash
  mainWindow.once('ready-to-show', () => {
    setTimeout(() => {
      mainWindow.show();
      if (splashWindow) splashWindow.close();
      autoUpdater.checkForUpdatesAndNotify();
    }, 5000);
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
    app.quit();
  });
}

app.on('ready', () => {
  createSplashWindow();
  createMainWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});

ipcMain.on('app:minimize', () => mainWindow.minimize());
ipcMain.on('app:maximize', () =>
  mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize()
);
ipcMain.on('app:close', () => mainWindow.close());

ipcMain.handle('dark-mode:get-initial', () => nativeTheme.shouldUseDarkColors);
nativeTheme.on('updated', () => {
  if (mainWindow)
    mainWindow.webContents.send('theme-updated', nativeTheme.shouldUseDarkColors);
});

autoUpdater.on('update-downloaded', () => {
  if (mainWindow) mainWindow.webContents.send('update-downloaded');
});
ipcMain.on('restart-app', () => autoUpdater.quitAndInstall());
