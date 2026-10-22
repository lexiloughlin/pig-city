// Runs in the sandboxed page before the game. Exposes a tiny, safe API as window.pigDesktop.
'use strict';
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('pigDesktop', {
  isApp: true,
  // the saved town as text (or null); synchronous so the game can start with it
  loadSave: () => ipcRenderer.sendSync('save:load'),
  writeSave: (text) => ipcRenderer.send('save:write', String(text)),
  exportTown: (name, text) => ipcRenderer.invoke('town:export', String(name), String(text)),
  importTown: () => ipcRenderer.invoke('town:import'),
  onMenu: (cb) => ipcRenderer.on('menu', (_e, action) => cb(String(action))),
  onFlush: (cb) => ipcRenderer.on('app:flush', () => cb()),
});
