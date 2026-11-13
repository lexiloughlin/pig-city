# Incremental city loading

Home Town and Job City now index buildings in 8 × 8 tile spatial chunks. Each chunk carries projected bounds containing all its building artwork, including tall roofs. Rendering queries intersecting chunks and then retains the existing per-building visibility test and scene depth sort. The same candidates serve night lighting. Builder mode uses the full list so move previews remain available across chunk boundaries.

The index is transient. A changed building list, road revision, or save invalidates it. Placement, upgrades and movement already save; generating, clearing or moving districts also invalidates roads. Save schema and serialized building objects are unchanged. Weak maps release indexes and crowd clocks when their objects are discarded.

Nearby district crowds update every simulation tick, using a 240 projected-world-pixel margin around the camera. Distant districts and districts on other maps accumulate simulation time and update at approximately quarter-second intervals. Reactivation consumes the remaining accumulated time. This is a coarse crowd simulation, so customer timing and random crowd behavior can vary slightly from the old per-frame version. Resident needs, production, wages, traffic, metro, park simulation and interiors retain their existing update paths. Terrain remains the existing cached ground image; this increment does not stream terrain or evict saved city data.

## Validation (November 12, 2026)

- `node scripts/test-city-chunks.cjs`: game script parses; 200 viewport comparisons over 10,000 buildings match the original visibility rule, including tall buildings, negative coordinates and chunk boundaries. Checks add/move invalidation and accumulated distant time.
- `npx electron scripts/benchmark-city.cjs`: disposable profile with remote connections blocked; generates Job City, measures drawing and simulation at two zoom levels, checks street entry/camera/exit, builder drawing, home interiors, park and dashboard rendering, and save/reload counts and schema. Does not use the player's save or accounts.
- Before/after measurements in the same Electron runtime, generated Job City with 281 buildings, 100 warmed drawing calls and 300 simulation ticks per zoom: wide-view draw 1.105 → 1.111 ms, simulation 1.348 → 0.778 ms; close-view draw 0.402 → 0.336 ms, simulation 0.684 → 0.713 ms. These short runs include randomness and warm-up effects; they establish no major observed regression, not a guaranteed FPS gain. Large-city visibility correctness was checked separately from runtime performance.
- Expanded checks also caught and fixed a pre-existing stray `n` after the ride-bubble loop in `drawPark`, which raised a ReferenceError on every park draw.
- Save/reload preserved schema 4, 281 city buildings and 5 pigs in the generated test town. No game drawing errors were logged.
- Packaging follow-up: moved the six root-level add-on scripts into `assets/js/` and updated their HTML references. Both build configurations already bundle `assets/**/*`, and the Mac app serves that folder. `npm run audit:sandbox` now passes all 29 checks. A separate run through the actual `app://pig-city/` handler confirmed all six modules load without runtime errors using a disposable profile.

This is an initial bounded change. It does not establish complete regression coverage for every feature or benchmark a real large player save. Future work can profile aggregate citizen/production calculations and terrain memory independently.
