const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('uni', {
  openFile: () => ipcRenderer.invoke('dialog:open'),
  saveDialog: (payload) => ipcRenderer.invoke('dialog:save', payload),
  saveTo: (payload) => ipcRenderer.invoke('fs:save', payload),
});