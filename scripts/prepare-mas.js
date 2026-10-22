#!/usr/bin/env node
// Prepares the Mac App Store build: fills in your Apple Team ID, writes the entitlements and the
// electron-builder config into build/generated/, and checks your provisioning profile + certificates.
// Nothing is uploaded or submitted.
//
//   APPLE_TEAM_ID=ABCDE12345 node scripts/prepare-mas.js          (App Store release, needs build/embedded.provisionprofile)
//   APPLE_TEAM_ID=ABCDE12345 node scripts/prepare-mas.js --dev    (sandboxed test build, needs build/dev.provisionprofile)
//   node scripts/prepare-mas.js --generate-only                     (just write the files, skip the Apple checks)
// You can also put { "teamId": "ABCDE12345" } in build/mas.local.json (git-ignored) instead of the env var.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const B = (...p) => path.join(ROOT, 'build', ...p);
const args = new Set(process.argv.slice(2));
const DEV = args.has('--dev');
const GEN_ONLY = args.has('--generate-only');
const BUNDLE_ID = 'com.lexiloughlin.pigcity';

const problems = [];
const warn = [];

let teamId = process.env.APPLE_TEAM_ID;
if (!teamId && fs.existsSync(B('mas.local.json'))) {
  try { teamId = JSON.parse(fs.readFileSync(B('mas.local.json'), 'utf8')).teamId; } catch (e) { problems.push('build/mas.local.json is not valid JSON'); }
}
if (!teamId && GEN_ONLY) teamId = 'TEAMID0000';
if (!teamId) problems.push('No Apple Team ID. Set APPLE_TEAM_ID=XXXXXXXXXX or create build/mas.local.json with {"teamId":"XXXXXXXXXX"} (find it at developer.apple.com > Account > Membership details).');
else if (!/^[A-Z0-9]{10}$/.test(teamId)) problems.push(`"${teamId}" doesn't look like a Team ID (10 capital letters/numbers).`);

// --- provisioning profile ---
function readProfile(file) {
  const raw = fs.readFileSync(file, 'latin1');
  const a = raw.indexOf('<?xml'), z = raw.indexOf('</plist>');
  if (a < 0 || z < 0) return null;
  const xml = raw.slice(a, z + 8);
  const str = (key) => { const m = xml.match(new RegExp(`<key>${key}</key>\\s*<string>([^<]*)</string>`)); return m && m[1]; };
  const arr = (key) => { const m = xml.match(new RegExp(`<key>${key}</key>\\s*<array>([\\s\\S]*?)</array>`)); return m ? [...m[1].matchAll(/<string>([^<]*)<\/string>/g)].map((x) => x[1]) : []; };
  const date = (key) => { const m = xml.match(new RegExp(`<key>${key}</key>\\s*<date>([^<]*)</date>`)); return m && new Date(m[1]); };
  return {
    name: str('Name'), team: arr('TeamIdentifier')[0], appId: str('application-identifier') || str('com.apple.application-identifier'),
    expires: date('ExpirationDate'), devices: arr('ProvisionedDevices'), platforms: arr('Platform'),
  };
}
const profileFile = B(DEV ? 'dev.provisionprofile' : 'embedded.provisionprofile');
if (!GEN_ONLY) {
  if (!fs.existsSync(profileFile)) {
    problems.push(`Missing ${path.relative(ROOT, profileFile)}. Download the ${DEV ? 'macOS App Development' : 'Mac App Store'} provisioning profile for ${BUNDLE_ID} from developer.apple.com and save it there.`);
  } else {
    const p = readProfile(profileFile);
    if (!p) problems.push(`${path.relative(ROOT, profileFile)} doesn't look like a provisioning profile.`);
    else {
      if (teamId && p.team !== teamId) problems.push(`Profile "${p.name}" belongs to team ${p.team}, not ${teamId}.`);
      if (p.appId && p.appId !== `${teamId}.${BUNDLE_ID}`) problems.push(`Profile "${p.name}" is for ${p.appId}, expected ${teamId}.${BUNDLE_ID}.`);
      if (p.expires && p.expires < new Date()) problems.push(`Profile "${p.name}" expired on ${p.expires.toDateString()}.`);
      if (p.platforms.length && !p.platforms.includes('OSX')) problems.push(`Profile "${p.name}" is not a macOS profile (${p.platforms.join(', ')}).`);
      if (DEV && !p.devices.length) warn.push('The development profile lists no Macs. Register this Mac under Devices, then regenerate the profile.');
      if (!DEV && p.devices.length) problems.push(`Profile "${p.name}" lists test devices, so it's a development profile. The App Store build needs a "Mac App Store" distribution profile.`);
    }
  }
  // --- certificates (only checkable on a Mac) ---
  if (process.platform === 'darwin') {
    let ids = '';
    try { ids = execFileSync('security', ['find-identity', '-v'], { encoding: 'utf8' }); } catch (e) { /* ignore */ }
    const has = (re) => re.test(ids);
    if (DEV) {
      if (!has(/Apple Development:|Mac Developer:/)) problems.push('No "Apple Development" certificate in your keychain (Xcode > Settings > Accounts > Manage Certificates > +).');
    } else {
      if (!has(/Apple Distribution:|3rd Party Mac Developer Application:/)) problems.push('No "Apple Distribution" certificate in your keychain.');
      if (!has(/3rd Party Mac Developer Installer:|Mac Installer Distribution:/)) problems.push('No "Mac Installer Distribution" certificate in your keychain (needed to sign the .pkg).');
    }
  } else {
    warn.push('Not on a Mac, so certificates were not checked (Mac App Store builds must be made on macOS).');
  }
}

// --- write generated files ---
const gen = B('generated');
fs.mkdirSync(gen, { recursive: true });
const tid = teamId || 'TEAMID0000';
fs.writeFileSync(path.join(gen, 'entitlements.mas.plist'), fs.readFileSync(B('entitlements.mas.template.plist'), 'utf8').replace(/__TEAM_ID__/g, tid));
fs.writeFileSync(path.join(gen, 'electron-builder.mas.yml'),
  '# GENERATED by scripts/prepare-mas.js. Edit build/electron-builder.mas.template.yml instead.\n' +
  fs.readFileSync(B('electron-builder.mas.template.yml'), 'utf8').replace(/__TEAM_ID__/g, tid).replace(/__OUTPUT__/g, DEV ? 'dist/mas-dev' : 'dist/mas'));

for (const w of warn) console.log('⚠️  ' + w);
if (problems.length) {
  console.error('\nMac App Store build is not ready yet:\n' + problems.map((p) => '  ✗ ' + p).join('\n') + '\n\nSee docs/MAC_APP_STORE.md for the steps.');
  process.exit(1);
}
console.log(`✓ Wrote build/generated/ for ${DEV ? 'a sandboxed development (mas-dev)' : 'an App Store (mas)'} build, team ${tid}.`);
