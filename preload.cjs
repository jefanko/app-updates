// Electron Preload Script
// This script runs in an isolated context and exposes safe APIs to the renderer

const { contextBridge, ipcRenderer } = require('electron');

// Currently we don't need IPC communication since we'll use lowdb directly in the renderer
// But we can expose APIs here if needed in the future
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  versions: process.versions,
  // Database API
  db: {
    read: () => ipcRenderer.invoke('db-read'),
    write: (data) => ipcRenderer.invoke('db-write', data),
    setPath: () => ipcRenderer.invoke('db-set-path'),
    getPath: () => ipcRenderer.invoke('db-get-path'),
    // Year-based APIs
    getYears: () => ipcRenderer.invoke('db-get-years'),
    readYear: (year) => ipcRenderer.invoke('db-read-year', year),
    writeYear: (year, data) => ipcRenderer.invoke('db-write-year', year, data),
    addYear: (year, data) => ipcRenderer.invoke('db-add-year', year, data)
  },
  // Access Database API (.accdb)
  accdb: {
    selectFile: () => ipcRenderer.invoke('accdb-select-file'),
    readDatabase: (filePath) => ipcRenderer.invoke('accdb-read-database', filePath)
  },
  // Document Checklist API
  checklist: {
    attachFile: (projectId, itemId) => ipcRenderer.invoke('checklist-attach-file', projectId, itemId),
    openFile: (filePath) => ipcRenderer.invoke('checklist-open-file', filePath),
    generateZip: (projectId, files, zipName) => ipcRenderer.invoke('checklist-generate-zip', projectId, files, zipName)
  },
  // Update API
  updater: {
    onChecking: (callback) => ipcRenderer.on('update-checking', callback),
    onAvailable: (callback) => ipcRenderer.on('update-available', (event, info) => callback(info)),
    onNotAvailable: (callback) => ipcRenderer.on('update-not-available', callback),
    onError: (callback) => ipcRenderer.on('update-error', (event, err) => callback(err)),
    onDownloadProgress: (callback) => ipcRenderer.on('update-download-progress', (event, percent) => callback(percent)),
    onDownloaded: (callback) => ipcRenderer.on('update-downloaded', (event, info) => callback(info)),
    restartAndInstall: () => ipcRenderer.invoke('restart-and-install'),
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('update-checking');
      ipcRenderer.removeAllListeners('update-available');
      ipcRenderer.removeAllListeners('update-not-available');
      ipcRenderer.removeAllListeners('update-error');
      ipcRenderer.removeAllListeners('update-download-progress');
      ipcRenderer.removeAllListeners('update-downloaded');
    }
  },
  // Window events for logout on close
  onWindowClose: (callback) => {
    ipcRenderer.on('window-closing', callback);
  }
});
