const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { autoUpdater } = require('electron-updater');


// Config file to store the path of the database
const CONFIG_FILE = path.join(app.getPath('userData'), 'config.json');
const DEFAULT_DB_PATH = path.join(app.getPath('userData'), 'ina-ai-chart-db.json');

// Helper to get DB path
function getDbPath() {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const config = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
      if (config.dbPath && fs.existsSync(config.dbPath)) {
        return config.dbPath;
      }
    }
  } catch (e) {
    console.error('Error reading config:', e);
  }
  return DEFAULT_DB_PATH;
}

// Helper to save DB path
function saveDbPath(dbPath) {
  try {
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ dbPath }));
  } catch (e) {
    console.error('Error saving config:', e);
  }
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs')
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, 'public/icon.ico')
  });

  // Emit window-closing event before window closes (for logout)
  win.on('close', (event) => {
    win.webContents.send('window-closing');
  });

  // Load app
  const isDev = !app.isPackaged;
  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, 'dist/index.html'));
  }
}

app.whenReady().then(() => {
  // IPC Handlers for Database
  ipcMain.handle('db-read', async () => {
    const dbPath = getDbPath();
    try {
      if (fs.existsSync(dbPath)) {
        return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      }
    } catch (e) {
      console.error('Error reading DB:', e);
    }
    return null; // Return null to signal init needed
  });

  ipcMain.handle('db-write', async (event, data) => {
    const dbPath = getDbPath();
    try {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
      return true;
    } catch (e) {
      console.error('Error writing DB:', e);
      throw e;
    }
  });

  ipcMain.handle('db-get-path', () => getDbPath());

  ipcMain.handle('db-set-path', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'createDirectory'],
      filters: [{ name: 'JSON Database', extensions: ['json'] }],
      title: 'Pilih File Database (atau buat file kosong baru)'
    });

    if (!result.canceled && result.filePaths.length > 0) {
      const newPath = result.filePaths[0];
      saveDbPath(newPath);
      return newPath;
    }
    return null;
  });

  // --- Year-Based Database Handlers ---

  // Helper to get year file path
  function getYearDbPath(year) {
    return path.join(app.getPath('userData'), `ina-ai-chart-${year}.json`);
  }

  // Helper to get years config path
  function getYearsConfigPath() {
    return path.join(app.getPath('userData'), 'years-config.json');
  }

  // Get available years
  ipcMain.handle('db-get-years', async () => {
    try {
      const configPath = getYearsConfigPath();
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        return config.years || [];
      }
    } catch (e) {
      console.error('Error reading years config:', e);
    }
    // Default: current year
    return [new Date().getFullYear()];
  });

  // Save years config
  function saveYearsConfig(years) {
    try {
      const configPath = getYearsConfigPath();
      fs.writeFileSync(configPath, JSON.stringify({ years }, null, 2));
    } catch (e) {
      console.error('Error saving years config:', e);
    }
  }

  // Read year data
  ipcMain.handle('db-read-year', async (event, year) => {
    const yearPath = getYearDbPath(year);
    try {
      if (fs.existsSync(yearPath)) {
        return JSON.parse(fs.readFileSync(yearPath, 'utf8'));
      }
    } catch (e) {
      console.error('Error reading year DB:', e);
    }
    return null;
  });

  // Write year data
  ipcMain.handle('db-write-year', async (event, year, data) => {
    const yearPath = getYearDbPath(year);
    try {
      fs.writeFileSync(yearPath, JSON.stringify(data, null, 2));
      return true;
    } catch (e) {
      console.error('Error writing year DB:', e);
      throw e;
    }
  });

  // Add new year with imported data
  ipcMain.handle('db-add-year', async (event, year, data) => {
    try {
      // Save the year data
      const yearPath = getYearDbPath(year);
      fs.writeFileSync(yearPath, JSON.stringify(data, null, 2));

      // Update years config
      const configPath = getYearsConfigPath();
      let years = [new Date().getFullYear()];
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        years = config.years || years;
      }
      if (!years.includes(year)) {
        years.push(year);
        years.sort((a, b) => b - a); // Sort descending
      }
      saveYearsConfig(years);

      return years;
    } catch (e) {
      console.error('Error adding year:', e);
      throw e;
    }
  });

  // --- Access Database (.accdb) Handlers ---

  // Open file dialog to select .accdb file
  ipcMain.handle('accdb-select-file', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Access Database', extensions: ['accdb', 'mdb'] }],
      title: 'Select Access Database File'
    });

    if (!result.canceled && result.filePaths.length > 0) {
      return result.filePaths[0];
    }
    return null;
  });

  // Read Access database and return all tables
  ipcMain.handle('accdb-read-database', async (event, filePath) => {
    try {
      // Dynamic import for ESM module
      const { default: MDBReader } = await import('mdb-reader');
      const buffer = fs.readFileSync(filePath);
      const reader = new MDBReader(buffer);

      // Get ALL table names - no filtering
      const allTableNames = reader.getTableNames();

      const result = {
        filePath: filePath,
        fileName: path.basename(filePath),
        tables: {},
        allTableNames: allTableNames // Include raw list for debugging
      };

      allTableNames.forEach(tableName => {
        // Mark system tables but still include them
        const isSystemTable = tableName.startsWith('MSys') || tableName.startsWith('~') || tableName.startsWith('USys');

        try {
          const table = reader.getTable(tableName);
          const columns = table.getColumnNames();
          const data = table.getData();

          result.tables[tableName] = {
            columns: columns,
            rowCount: data.length,
            data: data,
            isSystem: isSystemTable
          };
        } catch (e) {
          result.tables[tableName] = { error: e.message, isSystem: isSystemTable };
        }
      });

      return result;
    } catch (error) {
      console.error('Error reading accdb:', error);
      throw error;
    }
  });

  // --- Document Checklist File Handlers ---

  // Get checklist files directory
  function getChecklistFilesDir(projectId) {
    const dir = path.join(app.getPath('userData'), 'checklist-files', projectId);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return dir;
  }

  // Browse and attach file to checklist item
  ipcMain.handle('checklist-attach-file', async (event, projectId, itemId) => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      title: 'Select Document to Attach'
    });

    if (result.canceled || result.filePaths.length === 0) {
      return null;
    }

    const sourcePath = result.filePaths[0];
    const fileName = path.basename(sourcePath);
    const destDir = getChecklistFilesDir(projectId);
    const uniqueName = `${itemId}_${Date.now()}_${fileName}`;
    const destPath = path.join(destDir, uniqueName);

    // Copy file to userData
    fs.copyFileSync(sourcePath, destPath);

    return {
      fileName: fileName,
      filePath: destPath,
      storedName: uniqueName
    };
  });

  // Open attached file
  ipcMain.handle('checklist-open-file', async (event, filePath) => {
    if (fs.existsSync(filePath)) {
      const { shell } = require('electron');
      shell.openPath(filePath);
      return true;
    }
    return false;
  });

  // Generate ZIP from all attached files
  ipcMain.handle('checklist-generate-zip', async (event, projectId, files, zipName) => {
    try {
      const archiver = require('archiver');

      // Get save location
      const result = await dialog.showSaveDialog({
        title: 'Save ZIP File',
        defaultPath: `${zipName || 'checklist-documents'}.zip`,
        filters: [{ name: 'ZIP Archive', extensions: ['zip'] }]
      });

      if (result.canceled || !result.filePath) {
        return null;
      }

      const output = fs.createWriteStream(result.filePath);
      const archive = archiver('zip', { zlib: { level: 9 } });

      return new Promise((resolve, reject) => {
        output.on('close', () => {
          resolve({ path: result.filePath, size: archive.pointer() });
        });

        archive.on('error', (err) => {
          reject(err);
        });

        archive.pipe(output);

        // Add files to archive
        files.forEach(file => {
          if (fs.existsSync(file.filePath)) {
            archive.file(file.filePath, { name: file.fileName });
          }
        });

        archive.finalize();
      });
    } catch (error) {
      console.error('Error generating ZIP:', error);
      throw error;
    }
  });

  createWindow();

  // Auto-updater configuration
  autoUpdater.autoDownload = true; // Auto-download updates
  autoUpdater.autoInstallOnAppQuit = true; // Auto-install when app quits

  // Don't check for updates in development
  const isDev = !app.isPackaged;
  if (!isDev) {
    // Check for updates on launch (after 3 seconds delay)
    setTimeout(() => {
      autoUpdater.checkForUpdates();
    }, 3000);
  }

  // Auto-updater events - send to renderer
  let mainWindow = BrowserWindow.getAllWindows()[0];

  autoUpdater.on('checking-for-update', () => {
    console.log('Checking for update...');
    if (mainWindow) {
      mainWindow.webContents.send('update-checking');
    }
  });

  autoUpdater.on('update-available', (info) => {
    console.log('Update available:', info);
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info);
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    console.log('Update not available:', info);
    if (mainWindow) {
      mainWindow.webContents.send('update-not-available');
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('Update error:', err);
    if (mainWindow) {
      mainWindow.webContents.send('update-error', err);
    }
  });

  autoUpdater.on('download-progress', (progressObj) => {
    console.log(`Download progress: ${progressObj.percent.toFixed(2)}%`);
    if (mainWindow) {
      mainWindow.webContents.send('update-download-progress', progressObj.percent);
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    console.log('Update downloaded:', info);
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info);
    }
  });

  // IPC handler for manual restart and install
  ipcMain.handle('restart-and-install', () => {
    autoUpdater.quitAndInstall(false, true);
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
