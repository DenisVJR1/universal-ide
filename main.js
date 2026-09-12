const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const fs = require('fs');
const path = require('path');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 720,
    minHeight: 480,
    backgroundColor: '#1e1e1e',
    title: 'Universal IDE',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  win.webContents.on('will-navigate', (e) => e.preventDefault()); // тримаємо IDE всередині
}

ipcMain.handle('dialog:open', async () => {
  const r = await dialog.showOpenDialog({ properties: ['openFile'] });
  if (r.canceled || !r.filePaths[0]) return null;
  const p = r.filePaths[0];
  try {
    if (fs.statSync(p).isDirectory()) return null;
    return { path: p, content: fs.readFileSync(p, 'utf8') };
  } catch (e) {
    return { path: p, content: null, error: String(e.message || e) };
  }
});

ipcMain.handle('dialog:save', async (_e, { content, defaultPath }) => {
  const r = await dialog.showSaveDialog({ defaultPath: defaultPath || 'untitled.txt' });
  if (r.canceled || !r.filePath) return null;
  fs.writeFileSync(r.filePath, content, 'utf8');
  return r.filePath;
});

ipcMain.handle('fs:save', (_e, { path: p, content }) => {
  fs.writeFileSync(p, content, 'utf8');
  return p;
});

app.whenReady().then(() => {
  createWindow();
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});