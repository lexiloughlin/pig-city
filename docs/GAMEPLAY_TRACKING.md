# Gameplay database

The development game now records real gameplay without requiring an account or an internet connection. Sign in once through **Cloud save** to also sync the history to the existing Pig City Supabase project. Mac sign-in accepts the email code or the original sign-in link copied from the email; the browser uses its existing email-link flow. The same cloud session handles town saves and tracking.

## Where the data lives

- **Mac:** `Gameplay/gameplay.sqlite` under the app's own Application Support/user-data folder. The exact location depends on whether the development or installed app is running. The `events` table contains the full immutable JSON payload and indexed event fields. `gameplay_earnings` and `gameplay_pig_snapshots` are local SQL views.
- **Browser:** the `pigcity-gameplay` IndexedDB database. It retains records after closing the page. Clearing browser/site storage also removes local saves and unsynced tracking history; export before doing that.
- **Supabase:** `gameplay_towns` and `gameplay_events`. Reporting views are `gameplay_daily`, `gameplay_pig_snapshots`, and `gameplay_latest_pigs`. Existing `towns`, `town_versions`, `player_games`, and legacy pig tables are preserved. The three new timestamped migrations in `supabase/migrations/` have already been applied to the configured project. Earlier migration files are historical source; the older schema was originally installed manually, so do not blindly replay them over the live database.

**Export gameplay data** downloads the complete locally recorded history for the current town as JSON. It is separate from **Export town**, which exports the playable save. **Import gameplay data** merges a history file into its matching town, skipping existing event IDs. To transfer a save and its history to another device, import the town save first, then the gameplay history. The save retains the tracking IDs.

## What is recorded

- Registration of existing pigs and buildings, identified as existing rather than fabricated births/construction.
- Actual new pigs, births and parent IDs, pig departures, rename/job/home/health-status changes, building additions/removals/moves/upgrades.
- Petting, treats, automatic feeding/watering, sitter care and park snacks.
- Wage payments, including park wages and legitimate zero amounts, plus customer payments at shops.
- One first-observed snapshot per pig and town per game day, and a pig-state observation at each session start. A game day is 240 simulation seconds; pig `age_game_seconds` is explicitly not calendar days. Snapshot happiness comes from the game's `joy`, and numeric health is retained separately from the derived health-status label.

Wages are payment events at the game's existing pay intervals, not invented work-shift durations. Pig state and building changes are reconciled at saves (normally every five real seconds) and at births, hiring and day boundaries; they are not a per-frame movement trace. Daily snapshots are the first observation in that day, not end-of-day totals. Historical events from before this update cannot be reconstructed. No fabricated efficiency score or guessed lifetime earnings is stored.

## Offline operation and duplicate prevention

Gameplay actions get a random event ID once. A per-event local journal protects actions while their database write is pending; successful commits clear journal entries. The history itself stays in SQLite/IndexedDB after sync. Both databases and the server enforce unique IDs. If the server accepts a batch but its reply is lost, retrying the same batch does not create more rows. Locally synced flags change only after the full acknowledgment is received.

Daily snapshots and initial entity registrations have deterministic keys and are first-write-wins, including across devices. Importing the same history repeatedly is safe. Legacy cloud saves acquire deterministic entity identities when pulled, so two devices importing the same old cloud save agree on IDs. New pigs get fresh identities even if the game later reuses an old numeric pig number. Names are never identity keys.

A tracking town is bound to the first account that syncs it on a device. Another account cannot silently receive its backlog. The server also checks the expected account on every batch, covering account changes during an in-flight request. Row-level security applies to the event tables and reporting views; anonymous users cannot ingest or query records. Cloud sync handles up to 200 records per request and retries on later sync cycles. The current town's queue is synced; other towns' retained local histories can be accessed by loading their corresponding saves.

Replaying gameplay after restoring an older save produces new action IDs, because those are newly performed actions. Restoring does not delete the already recorded history. The daily snapshot for a previously recorded day is kept. Current pig observations are refreshed after loading/restoring. The reporting data is client-reported gameplay telemetry, not a cheat-proof accounting ledger.

If storage is full or unavailable, the game shows a tracking error instead of claiming the data was saved. Keep the app open and export the history. No finite local store can retain unlimited history; ordinary offline play uses the database rather than keeping a growing localStorage queue.

## Save preservation and cleanup

Tracking adds optional town/pig/building identities without changing existing gameplay IDs or the save schema. Before migrating an old save, the browser keeps `pigcity-before-tracking`; the Mac also keeps an exact `Saves/town.before-tracking.json` backup. The existing town save, normal backup, export/import and save-history functions continue to work.

The duplicate account implementation and example database integration were removed from the loaded page and archived with their old guides and source backups under `docs/legacy/`. No player storage keys, existing database rows, or historical migration files were deleted. The live legacy `pig_summary` view was changed to respect the caller's row-level security. Its underlying tables remain available for any future explicit migration.

## Query examples in Supabase

```sql
-- Actual care, birth and earnings events per game day.
select town_id, game_day, care_actions, births, wages, shop_revenue
from public.gameplay_daily
order by town_id, game_day;

-- Happiness and health over time; zero is preserved.
select town_id, pig_id, game_day,
       (state->>'happiness')::numeric as happiness,
       (state->>'health')::numeric as health
from public.gameplay_pig_snapshots
order by town_id, pig_id, game_day;

-- Most recently observed pig state, including whether it has departed.
select town_id, pig_id, active, state->>'name' as name,
       state->'job' as job, state->>'home' as home
from public.gameplay_latest_pigs;
```

Normal signed-in clients see only their own records. The Supabase SQL editor runs with administrative privileges, so include a player/town filter when analyzing a particular account there.

## Validation

- `npm run test:tracking`: real SQLite reopen/integrity, transaction rollback, duplicate retries, stable snapshots, zero values, account ownership, network allowlist, desktop link/code parsing and pig-need timing.
- `npm run test:tracking:browser`: actual IndexedDB, gameplay buttons, legacy cloud identity migration, offline persistence, crash-journal recovery, duplicate imports/snapshots and a simulated lost cloud acknowledgment/account switch.
- `npm run test:tracking:desktop`: real app protocol and preload bridge, a pre-update save fixture and exact migration backup, actual SQLite persistence, reload identities, integrity checks and a read-only HTTPS connection to Supabase.
- Live Supabase transactional tests cover ingestion, retries, stable snapshots, zero values, collision rollback, account isolation and anonymous denial. Test records are rolled back.
- Existing camera, builder, interior, park, save/reload and building-rendering checks continue to run. No real player save or login session is used in automated tests. The final sign-in step requires the player to use their own email.
