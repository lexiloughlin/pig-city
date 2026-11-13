# Archived account and tracking prototypes

These files are historical references, not the active database setup. Their earlier “complete” status descriptions referred to prototypes and example hooks. Do not follow their SQL/setup instructions for the new tracker.

The active implementation is documented in [Gameplay tracking](../GAMEPLAY_TRACKING.md). Runtime saves use `assets/cloud.js` and `towns`; telemetry uses `gameplay_events`. Old `player_games` and pig-tracking database tables remain in Supabase so no existing data is destroyed. Their JavaScript is no longer loaded by the game. Backup source files are retained under `backups/`.

No player save files, browser storage keys, database rows, or old migration files were removed by this cleanup.
