# Sandbox compatibility audit

What Pig City uses, whether it works inside the Mac App Store sandbox, and what was changed.
Re-run any time with `npm run audit:sandbox` (28 automatic checks).

| Area | Before | Sandbox issue | Now |
|---|---|---|---|
| **Fonts** | Google Fonts (Chewy, Nunito) loaded from the internet | Would need the network entitlement; the app breaks offline | Bundled in `assets/fonts/` as woff2, with their licenses (Apache 2.0, SIL OFL 1.1) |
| **Other assets** | All art is drawn in code; sounds are synthesized with Web Audio | None | Unchanged. The only asset files are the fonts |
| **Network** | None besides fonts | — | Blocked three ways: the page's security policy (`connect-src 'none'`), main-process request blocking, and no network entitlement |
| **Saving** | `localStorage` | Works, since it lives in the app's container | Kept, plus a real save file at `<container>/Library/Application Support/Pig City/Saves/town.json`, with an atomic write and a backup copy. Saves on window close |
| **File export/import** | Didn't exist | Arbitrary file access isn't allowed | Uses the system save/open panels, the only way the sandbox grants file access, with the `files.user-selected.read-write` entitlement. Size limits and format checks included |
| **`prompt()` (4 uses)** | Naming pigs, neighborhoods, islands | Electron doesn't support `prompt()`, so renaming would have broken | In-game text box (`askText`) |
| **`confirm()` (3 uses)** | Start over, remove neighborhood, sink island | Works, but looks out of place | In-game confirm box (`askYes`) |
| **Dependencies** | — | Native modules or downloaded code could be rejected | **No runtime npm packages.** Only `electron` and `electron-builder` as pinned dev tools. No remote code, no `eval` |
| **Updates** | — | Self-updating apps are rejected on the App Store | No auto-updater, `publish: null` in both builds. Store updates come only from the App Store |
| **Windows and links** | — | — | New windows and navigation are refused. There are no outside links in the game |
| **Permissions** | — | — | Camera, mic, location and notification requests are all refused |
| **Electron internals** | — | Electron needs an app group, and its helpers must inherit the sandbox | `application-groups` = `<TEAMID>.com.lexiloughlin.pigcity`. Helpers use `entitlements.mas.inherit.plist`. Built against Electron's `mas` binaries |

Entitlements requested by the store app (and nothing else):

- `com.apple.security.app-sandbox`
- `com.apple.security.application-groups` → `<TEAMID>.com.lexiloughlin.pigcity`
- `com.apple.security.files.user-selected.read-write`
