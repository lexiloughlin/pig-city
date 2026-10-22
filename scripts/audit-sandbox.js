#!/usr/bin/env node
// Checks that everything shipped in the app works inside the Mac App Store sandbox:
// bundled assets only, no network, no browser dialogs Electron lacks, no runtime npm packages,
// no auto-updater, and entitlements that ask only for what the game uses.
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const results = [];
const check = (ok, label, detail = '') => results.push({ ok: !!ok, label, detail });

const html = read('index.html');
const script = (html.match(/<script>([\s\S]*)<\/script>/) || [, ''])[1];
const noComments = html.replace(/<!--[\s\S]*?-->/g, '').replace(/<script>[\s\S]*?<\/script>/g, '').replace(/\/\*[\s\S]*?\*\//g, ''); // markup + CSS only

// 1. assets: everything the page loads must be inside the app
const remote = [...noComments.matchAll(/(?:src|href)\s*=\s*["'](https?:)?\/\/[^"']+["']|url\(\s*["']?(https?:)?\/\/[^)]+\)|@import\s+["']?https?:/gi)].map((m) => m[0]);
check(!remote.length, 'No remote scripts, styles, fonts or images', remote.join(', '));
const local = [...noComments.matchAll(/(?:src|href)\s*=\s*["']((?!https?:|data:|blob:|#|mailto:)[^"']+)["']|(?<![\w.])url\(\s*["']?((?!data:|blob:|https?:)[^)"']+)["']?\)/gi)].map((m) => m[1] || m[2]).filter(Boolean);
const missing = local.filter((p) => !fs.existsSync(path.join(ROOT, p.split(/[?#]/)[0])));
check(!missing.length, `All ${local.length} local asset references exist`, missing.join(', '));
check(local.every((p) => p.startsWith('assets/')), 'Local assets all live under assets/ (the only folder the app serves)', local.filter((p) => !p.startsWith('assets/')).join(', '));

// 2. no network use in the game
check(!/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|navigator\.sendBeacon/.test(script), 'Game code makes no network requests');
const csp = (html.match(/http-equiv="Content-Security-Policy"\s+content="([^"]+)"/) || [])[1] || '';
check(/connect-src 'none'/.test(csp) && /default-src 'self'/.test(csp), 'Content Security Policy blocks network access', csp);

// 3. browser features Electron doesn't provide / that behave badly in a packaged app
check(!/\bprompt\s*\(/.test(script), 'No window.prompt() (Electron does not support it)');
check(!/\balert\s*\(|\bconfirm\s*\(/.test(script), 'No alert()/confirm() (uses in-game dialogs instead)');
check(!/window\.open\s*\(/.test(script), 'No window.open()');
check(!/\beval\s*\(|new Function\s*\(/.test(script), 'No eval / new Function');

// 4. saving
check(/localStorage\.setItem\('pigcity-v1'/.test(script) && /desk\.writeSave/.test(script), 'Saves to localStorage and, in the app, to a file in the app container');
check(/desk\.exportTown/.test(script) && /desk\.importTown/.test(script), 'Export/import go through the system save/open panels in the app');

// 5. Electron side
const main = read('electron/main.js'), pre = read('electron/preload.js');
check(!/autoUpdater|electron-updater|update-electron-app/.test(main + pre), 'No auto-updater (App Store handles updates)');
check(/sandbox:\s*true/.test(main) && /contextIsolation:\s*true/.test(main) && /nodeIntegration:\s*false/.test(main), 'Renderer is sandboxed with context isolation');
check(/onBeforeRequest/.test(main) && /cancel:\s*true/.test(main), 'Main process refuses outgoing network requests');
check(/userData/.test(main) && !/homedir\(\)|\/Users\//.test(main), 'Save file lives in userData (inside the container when sandboxed)');

// 6. dependencies
const pkg = JSON.parse(read('package.json'));
check(!pkg.dependencies || !Object.keys(pkg.dependencies).length, 'No runtime npm dependencies are bundled', Object.keys(pkg.dependencies || {}).join(', '));
check(/^\d+\.\d+\.\d+$/.test((pkg.devDependencies || {}).electron || ''), 'Electron version is pinned', (pkg.devDependencies || {}).electron);

// 7. entitlements + configs
const ent = read('build/entitlements.mas.template.plist');
check(/com\.apple\.security\.app-sandbox<\/key>\s*<true\/>/.test(ent), 'App Sandbox entitlement present');
check(/com\.apple\.security\.application-groups/.test(ent), 'Application group entitlement present (Electron needs it)');
check(/files\.user-selected\.read-write/.test(ent), 'User-selected file access (export/import) present');
check(!/network\.client|network\.server|device\.|personal-information|files\.downloads|temporary-exception/.test(ent.replace(/<!--[\s\S]*?-->/g, '')), 'No extra entitlements (network, camera, mic, temporary exceptions)');
const inh = read('build/entitlements.mas.inherit.plist');
check(/app-sandbox/.test(inh) && /security\.inherit/.test(inh), 'Helper processes inherit the sandbox');
const masCfg = read('build/electron-builder.mas.template.yml'), devCfg = read('build/electron-builder.dev.yml');
check(/publish:\s*null/.test(masCfg) && /publish:\s*null/.test(devCfg), 'No publish/update feed configured in either build');
check(/ElectronTeamID/.test(masCfg) && /type:\s*distribution/.test(masCfg) && /provisioningProfile/.test(masCfg), 'MAS config has team ID, distribution type and provisioning profile');
check(/appId:\s*com\.lexiloughlin\.pigcity\.dev/.test(devCfg) && /appId:\s*com\.lexiloughlin\.pigcity\s*$/m.test(masCfg), 'Dev and store builds use different bundle ids');
for (const f of ['index.html', 'electron/main.js', 'electron/preload.js']) check(new RegExp(`- ${f.split('/')[0]}`).test(masCfg), `${f} is packaged`);

const bad = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? '✓' : '✗'} ${r.label}${!r.ok && r.detail ? `\n    ${r.detail}` : ''}`);
console.log(`\n${results.length - bad.length}/${results.length} sandbox checks passed.`);
process.exit(bad.length ? 1 : 0);
