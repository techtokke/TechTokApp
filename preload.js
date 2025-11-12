/*
  preload.js
  This script runs in a privileged environment before your web content (index.html)
  is loaded. It acts as a secure bridge, exposing only specific Node.js/Electron
  APIs to your renderer process via the `window.electronAPI` object.
*/

const { contextBridge, ipcRenderer } = require('electron');

// Expose a secure API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // --- Title Bar ---
  minimize: () => ipcRenderer.send('app:minimize'),
  maximize: () => ipcRenderer.send('app:maximize'),
  close: () => ipcRenderer.send('app:close'),

  // --- Theme ---
  getInitialTheme: () => ipcRenderer.invoke('dark-mode:get-initial'),
  onThemeUpdated: (callback) =>
    ipcRenderer.on('theme-updated', (_event, isDarkMode) =>
      callback(isDarkMode)
    ),

  // --- Auto Update ---
  onUpdateDownloaded: (callback) =>
    ipcRenderer.on('update-downloaded', () => callback()),
  restartApp: () => ipcRenderer.send('restart-app'),
});