#!/usr/bin/env node
// After `npm run dist:mas` (on a Mac): inspects the built app and installer package without uploading anything.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
if (process.platform !== 'darwin') { console.error('verify-mas only runs on macOS.'); process.exit(1); }
const ROOT = path.join(__dirname, '..');
const run = (cmd, a) => { try { return execFileSync(cmd, a, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); } catch (e) { return (e.stdout || '') + (e.stderr || ''); } };
const find = (dir, re, depth = 3) => { if (!fs.existsSync(dir) || depth < 0) return []; return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => { const p = path.join(dir, d.name); return re.test(d.name) ? [p] : d.isDirectory() && !d.name.endsWith('.app') ? find(p, re, depth - 1) : []; }); };
const out = path.join(ROOT, 'dist', 'mas');
const apps = find(out, /\.app$/), pkgs = find(out, /\.pkg$/);
if (!apps.length) { console.error('No .app found in dist/mas. Run npm run dist:mas first.'); process.exit(1); }
let ok = true; const say = (good, msg) => { console.log(`${good ? '✓' : '✗'} ${msg}`); if (!good) ok = false; };
for (const app of apps) {
  console.log(`\n${path.relative(ROOT, app)}`);
  const ent = run('codesign', ['-d', '--entitlements', '-', '--xml', app]);
  say(/com\.apple\.security\.app-sandbox/.test(ent), 'app is sandboxed');
  say(/application-groups/.test(ent), 'application group entitlement is signed in');
  say(!/network\.client/.test(ent), 'no network entitlement');
  const sig = run('codesign', ['-dvv', app]);
  say(/Authority=(Apple Distribution|3rd Party Mac Developer Application)/.test(sig), 'signed with a distribution certificate');
  say(fs.existsSync(path.join(app, 'Contents', 'embedded.provisionprofile')), 'provisioning profile is embedded');
  const plist = run('plutil', ['-p', path.join(app, 'Contents', 'Info.plist')]);
  say(/ElectronTeamID/.test(plist) && !/TEAMID0000/.test(plist), 'Info.plist has your ElectronTeamID');
  say(/"CFBundleIdentifier" => "com\.lexiloughlin\.pigcity"/.test(plist), 'bundle id is com.lexiloughlin.pigcity');
  const check = run('codesign', ['--verify', '--deep', '--strict', '--verbose=2', app]);
  say(/valid on disk/.test(check) && !/invalid|not signed/i.test(check), 'code signature verifies');
}
for (const pkg of pkgs) {
  console.log(`\n${path.relative(ROOT, pkg)}`);
  const s = run('pkgutil', ['--check-signature', pkg]);
  say(/(3rd Party Mac Developer Installer|Mac Installer Distribution)/.test(s), 'installer package is signed with the installer certificate');
}
console.log(ok ? '\nLooks ready to hand to Transporter (not uploaded).' : '\nFix the ✗ items before uploading.');
process.exit(ok ? 0 : 1);
