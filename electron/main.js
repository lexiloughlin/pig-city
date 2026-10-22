// Pig City for macOS: Electron main process.
// Works the same in the local dev build and the Mac App Store (sandboxed) build:
//  - the game and its assets are bundled inside the app and served from app://pig-city/ (no network)
//  - the town is saved to a JSON file inside the app's own container (Application Support)
//  - exporting / importing a town uses the system save/open panels (user-selected file access)
//  - no auto-updater: the App Store version is updated through the App Store
'use strict';
const { app, BrowserWindow, Menu, dialog, ipcMain, net, protocol, session, shell } = require('electron');
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');

const SCHEME = 'app';
const HOST = 'pig-city';
const ORIGIN = `${SCHEME}://${HOST}`;
const ROOT = path.join(__dirname, '..'); // inside app.asar when packaged
const MAX_SAVE_BYTES = 50 * 1024 * 1024;
const MAX_IMPORT_BYTES = 20 * 1024 * 1024;
const IS_MAS = !!process.mas;

app.setName('Pig City');

protocol.registerSchemesAsPrivileged([
  { scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

// ---------- saves (inside the app container when sandboxed) ----------
const saveDir = () => path.join(app.getPath('userData'), 'Saves');
const savePath = () => path.join(saveDir(), 'town.json');
const backupPath = () => path.join(saveDir(), 'town.backup.json');
let lastBackup = 0;

function readSave() {
  for (const f of [savePath(), backupPath()]) {
    try {
      const txt = fs.readFileSync(f, 'utf8');
      JSON.parse(txt); // make sure it's whole before handing it to the game
      return txt;
    } catch (e) { /* missing or damaged: try the next one */ }
  }
  return null;
}

function writeSave(txt) {
  if (typeof txt !== 'string' || txt.length > MAX_SAVE_BYTES || txt[0] !== '{') return false;
  fs.mkdirSync(saveDir(), { recursive: true });
  const now = Date.now();
  // keep a backup copy, refreshed at most every 10 minutes
  if (now - lastBackup > 10 * 60 * 1000 && fs.existsSync(savePath())) {
    try { fs.copyFileSync(savePath(), backupPath()); lastBackup = now; } catch (e) { /* not fatal */ }
  }
  const tmp = savePath() + '.tmp';
  fs.writeFileSync(tmp, txt, 'utf8'); // write then rename, so a crash never leaves half a file
  fs.renameSync(tmp, savePath());
  return true;
}

// only our own page may talk to the main process
const fromGame = (e) => {
  const url = (e.senderFrame && e.senderFrame.url) || '';
  return url.startsWith(ORIGIN + '/');
};

ipcMain.on('save:load', (e) => { e.returnValue = fromGame(e) ? readSave() : null; });
ipcMain.on('save:write', (e, txt) => {
  if (!fromGame(e)) return;
  try { writeSave(txt); } catch (err) { console.error('save failed', err); }
});

ipcMain.handle('town:export', async (e, name, txt) => {
  if (!fromGame(e) || typeof txt !== 'string' || txt.length > MAX_SAVE_BYTES) return { ok: false, error: 'bad data' };
  const win = BrowserWindow.fromWebContents(e.sender);
  const safe = String(name || 'Pig City.pigcity').replace(/[\\/:*?"<>|]+/g, '').slice(0, 80) || 'Pig City.pigcity';
  const r = await dialog.showSaveDialog(win, {
    title: 'Export your town',
    defaultPath: safe.endsWith('.pigcity') ? safe : safe + '.pigcity',
    filters: [{ name: 'Pig City Town', extensions: ['pigcity'] }],
  });
  if (r.canceled || !r.filePath) return { ok: false };
  try { fs.writeFileSync(r.filePath, txt, 'utf8'); return { ok: true, name: path.basename(r.filePath) }; }
  catch (err) { return { ok: false, error: err.message }; }
});

ipcMain.handle('town:import', async (e) => {
  if (!fromGame(e)) return { error: 'not allowed' };
  const win = BrowserWindow.fromWebContents(e.sender);
  const r = await dialog.showOpenDialog(win, {
    title: 'Import a town',
    properties: ['openFile'],
    filters: [{ name: 'Pig City Town', extensions: ['pigcity', 'json'] }],
  });
  if (r.canceled || !r.filePaths.length) return {};
  try {
    const st = fs.statSync(r.filePaths[0]);
    if (st.size > MAX_IMPORT_BYTES) return { error: 'That file is too big to be a Pig City town.' };
    return { text: fs.readFileSync(r.filePaths[0], 'utf8') };
  } catch (err) { return { error: err.message }; }
});

// ---------- serving the bundled game ----------
const ALLOWED = /^(index\.html|assets\/[\w\-./]+)$/;
function serve(req) {
  const u = new URL(req.url);
  if (u.host !== HOST) return new Response('Not found', { status: 404 });
  let rel = decodeURIComponent(u.pathname).replace(/^\/+/, '') || 'index.html';
  rel = path.posix.normalize(rel);
  if (rel.startsWith('..') || !ALLOWED.test(rel)) return new Response('Not found', { status: 404 });
  const file = path.join(ROOT, ...rel.split('/'));
  if (!file.startsWith(ROOT + path.sep)) return new Response('Not found', { status: 404 });
  return net.fetch(pathToFileURL(file).toString());
}

// ---------- window ----------
let win = null;
let flushed = false;

function createWindow() {
  win = new BrowserWindow({
    width: 1440, height: 920, minWidth: 960, minHeight: 640,
    title: 'Pig City', backgroundColor: '#f7dfe2', show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: true,
      nodeIntegration: false,
      webSecurity: true,
      spellcheck: false,
      devTools: !app.isPackaged || process.env.PIGCITY_DEVTOOLS === '1',
    },
  });
  win.once('ready-to-show', () => win.show());
  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  win.webContents.on('will-navigate', (e, url) => { if (!url.startsWith(ORIGIN + '/')) e.preventDefault(); });
  // give the game a moment to save before the window goes away
  win.on('close', (e) => {
    if (flushed) return;
    e.preventDefault(); flushed = true;
    try { win.webContents.send('app:flush'); } catch (err) { /* window already gone */ }
    setTimeout(() => { if (win && !win.isDestroyed()) win.close(); }, 250);
  });
  win.on('closed', () => { win = null; });
  win.loadURL(`${ORIGIN}/index.html`);
}

function menu() {
  const send = (a) => () => { if (win) win.webContents.send('menu', a); };
  const template = [
    {
      label: 'Pig City',
      submenu: [
        { role: 'about' }, { type: 'separator' },
        { role: 'hide' }, { role: 'hideOthers' }, { role: 'unhide' }, { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'File',
      submenu: [
        { label: 'Export Town…', accelerator: 'CmdOrCtrl+E', click: send('export') },
        { label: 'Import Town…', accelerator: 'CmdOrCtrl+O', click: send('import') },
        { type: 'separator' },
        { role: 'close' },
      ],
    },
    { role: 'editMenu' },
    {
      label: 'View',
      submenu: [
        { label: 'Big Map', accelerator: 'CmdOrCtrl+Shift+M', click: send('bigmap') },
        { type: 'separator' },
        { role: 'togglefullscreen' },
        ...(app.isPackaged ? [] : [{ type: 'separator' }, { role: 'reload' }, { role: 'toggleDevTools' }]),
      ],
    },
    { role: 'windowMenu' },
    { role: 'help', submenu: [{ label: 'How to Play', click: send('help') }] },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

  app.whenReady().then(() => {
    // the game never needs the internet: refuse anything that isn't our own bundled files
    session.defaultSession.webRequest.onBeforeRequest({ urls: ['http://*/*', 'https://*/*', 'ws://*/*', 'wss://*/*'] }, (d, cb) => cb({ cancel: true }));
    session.defaultSession.setPermissionRequestHandler((wc, perm, cb) => cb(false));
    session.defaultSession.setPermissionCheckHandler(() => false);
    protocol.handle(SCHEME, serve);
    app.setAboutPanelOptions({
      applicationName: 'Pig City',
      applicationVersion: app.getVersion(),
      copyright: '© 2026 Lexi Loughlin',
      credits: 'A cozy guinea pig town builder.\nFonts: Chewy (Apache 2.0), Nunito (SIL OFL 1.1).',
    });
    menu();
    createWindow();
  });

  app.on('web-contents-created', (_e, wc) => {
    wc.on('will-attach-webview', (e) => e.preventDefault());
    wc.setWindowOpenHandler(({ url }) => {
      // there are no outside links in the game today; if one is added, open it in the browser
      if (/^https:\/\//.test(url) && !IS_MAS) shell.openExternal(url);
      return { action: 'deny' };
    });
  });

  // one-window game: closing the window quits, like most Mac games
  app.on('window-all-closed', () => app.quit());
}
