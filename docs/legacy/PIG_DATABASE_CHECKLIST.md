# Pig Database Implementation Checklist

Use this checklist to implement the pig tracking database into your game.

## Phase 1: Database Setup ⚙️

- [ ] Open [Supabase Console](https://supabase.com/dashboard)
- [ ] Select your Pig City project
- [ ] Navigate to **SQL Editor**
- [ ] Click **New Query**
- [ ] Open file: `supabase/migrations/20261110000000_pig_tracking.sql`
- [ ] Copy entire file contents
- [ ] Paste into SQL editor
- [ ] Click **Run** (wait for completion)
- [ ] Check for success message (should show "8 tables created")
- [ ] Verify tables exist: SQL Editor → `pigs`, `pig_work_log`, etc.

**Troubleshooting:**
- [ ] If timeout: Try running in smaller chunks
- [ ] If "already exists": Safe - uses `IF NOT EXISTS`
- [ ] If auth error: Check you're logged into correct Supabase project

## Phase 2: Code Integration 🔧

### Add Script Tags
- [ ] Open `index.html`
- [ ] Find where you load supabase client (should have `supabase-2.118.0.js`)
- [ ] After that line, add:
  ```html
  <script src="pig-database.js"></script>
  <script src="pig-database-integration.js"></script>
  ```
- [ ] Save file

### Initialize Database
- [ ] Open `account-system.js` or `game-systems-integration.js`
- [ ] Find where Supabase auth is initialized
- [ ] Add this code after auth is ready:
  ```javascript
  if (window.pigDatabaseIntegration) {
    window.pigDatabaseIntegration.init(supabaseClient);
    console.log('✅ Pig Database initialized');
  }
  ```
- [ ] Save file

## Phase 3: Hook Game Events 🎮

### Create New Pig
- [ ] Find pig creation code in `index.html`
- [ ] After pig is created, add:
  ```javascript
  if (window.pigDatabaseIntegration) {
    await window.pigDatabaseIntegration.onPigCreated(
      pig,
      gameId,  // your game ID
      playerId // current player ID
    );
  }
  ```

### Work Shift Completion
- [ ] Find code that ends pig work shifts
- [ ] Add tracking:
  ```javascript
  await window.pigDatabaseIntegration.onShiftCompleted(
    pigId,
    'cafe',      // workplace type
    earnings,    // coins earned
    5,           // customers served
    gameId,
    playerId
  );
  ```

### Care Activities
- [ ] Find pig care code (feeding, petting, treats)
- [ ] Add:
  ```javascript
  await window.pigDatabaseIntegration.onCareActivity(
    pigId,
    'fed',                    // care type
    pigHappinessBefore,
    pigHappinessAfter,
    gameId,
    playerId
  );
  ```

### Game Save
- [ ] Find your save function
- [ ] Add sync before saving:
  ```javascript
  await window.pigDatabaseIntegration.syncGameStateWithDatabase(
    G,        // your game state object
    gameId,
    playerId
  );
  ```

### Daily Snapshots
- [ ] Find code that handles day change
- [ ] Add:
  ```javascript
  await window.pigDatabaseIntegration.createDailySnapshots(
    gameId,
    playerId,
    G.pigs  // array of pigs
  );
  ```

## Phase 4: Advanced Features 📈

### Marriages
- [ ] Find marriage system code
- [ ] Add:
  ```javascript
  await window.pigDatabaseIntegration.onMarriage(
    pigId1,
    pigId2,
    gameId,
    playerId
  );
  ```

### Offspring
- [ ] Find breeding/birth code
- [ ] Add:
  ```javascript
  await window.pigDatabaseIntegration.onOffspringBorn(
    parentId1,
    parentId2,
    babyId,
    gameId,
    playerId
  );
  ```

### Health Tracking
- [ ] Find pig health change code
- [ ] Add:
  ```javascript
  await window.pigDatabaseIntegration.onHealthChanged(
    pigId,
    'sick',      // health status
    'cold',      // condition
    'medicine',  // treatment given
    gameId,
    playerId
  );
  ```

### Job Assignment
- [ ] Find code that assigns jobs
- [ ] Add:
  ```javascript
  await window.pigDatabaseIntegration.onPigHired(
    pigId,
    buildingId,
    'cafe',  // building type
    gameId,
    playerId
  );
  ```

## Phase 5: Analytics Setup 📊

### Create Dashboard
- [ ] Create new function in your code:
  ```javascript
  async function showPigDashboard() {
    const summary = await window.pigDatabaseIntegration.getPigsSummary(gameId);
    const topEarners = await window.pigDatabaseIntegration.getTopPigEarners(gameId, 5);
    console.table(summary);
    console.table(topEarners);
  }
  ```
- [ ] Call this function where you want to display stats

### Leaderboards
- [ ] Create leaderboard function:
  ```javascript
  async function updateLeaderboard() {
    const topEarners = await window.pigDatabaseIntegration.getTopPigEarners(gameId, 10);
    // Display in UI
  }
  ```

### Workplace Analytics
- [ ] To see which workplace is best:
  ```javascript
  const cafeStats = await window.pigDatabaseIntegration.getWorkplacePerformance(gameId, 'cafe');
  console.log(`Café: ${cafeStats.totalPigs} pigs earning ${cafeStats.totalEarnings} 🪙`);
  ```

### Happiness Trends
- [ ] To plot pig happiness over time:
  ```javascript
  const trend = await window.pigDatabaseIntegration.getPigHappinessChart(pigId, 30);
  // Use with a charting library (Chart.js, etc.)
  ```

## Phase 6: Testing ✅

### Verify Database Works
- [ ] Open browser console
- [ ] Create a test pig:
  ```javascript
  await window.pigDatabaseIntegration.onPigCreated(
    { name: 'Test Pig', age: 0, skin: 'pink' },
    'test-game-id',
    'user-id'
  );
  ```
- [ ] Check Supabase console → `pigs` table → should see new row

### Test Work Logging
- [ ] Log a test shift:
  ```javascript
  await window.pigDatabaseIntegration.onShiftCompleted(
    'test-pig-id',
    'cafe',
    50,
    5,
    'test-game-id',
    'user-id'
  );
  ```
- [ ] Check `pig_work_log` table in Supabase

### Test Analytics
- [ ] Query pig summary:
  ```javascript
  const summary = await window.pigDatabaseIntegration.getPigsSummary('test-game-id');
  console.log(summary);
  ```
- [ ] Should return array of pigs with stats

### Test Export
- [ ] Export data:
  ```javascript
  const data = await window.pigDatabaseIntegration.exportGamePigData('test-game-id');
  console.log(JSON.stringify(data, null, 2));
  ```
- [ ] Should show complete pig data structure

## Phase 7: Production Deployment 🚀

- [ ] Test with real game saves (not test data)
- [ ] Verify all hooks fire correctly during gameplay
- [ ] Check Supabase database grows as players play
- [ ] Monitor for errors in browser console
- [ ] Test data export feature
- [ ] Verify RLS security policies work
- [ ] Create backup of Supabase database
- [ ] Document any customizations made
- [ ] Ready for launch! 🎉

## Common Issues & Solutions

### "pigDatabaseIntegration is undefined"
- [ ] Verify both JS files are loaded in HTML
- [ ] Check console for script load errors
- [ ] Verify script tags have correct paths

### "Cannot read property 'from' of undefined"
- [ ] Supabase client not initialized
- [ ] Call `init()` after auth is ready

### "Error: new row violates row level security policy"
- [ ] Player not authenticated
- [ ] `player_id` doesn't match `auth.uid()`
- [ ] Check Supabase RLS policies

### "Database tables don't exist"
- [ ] Migration didn't run successfully
- [ ] Check SQL editor for error messages
- [ ] Try running migration again

### "No data appearing in tables"
- [ ] Check browser console for errors
- [ ] Verify game IDs and player IDs are correct
- [ ] Confirm player is authenticated
- [ ] Check RLS policies allow your user

## Quick Reference

### Core Functions to Hook
```
onPigCreated(pig, gameId, playerId)
onShiftCompleted(pigId, type, earnings, customers, gameId, playerId)
onCareActivity(pigId, type, before, after, gameId, playerId)
onMarriage(pigId1, pigId2, gameId, playerId)
onOffspringBorn(parent1, parent2, baby, gameId, playerId)
onPigHired(pigId, buildingId, type, gameId, playerId)
onHealthChanged(pigId, status, condition, treatment, gameId, playerId)
```

### Analytics Functions to Query
```
getPigsSummary(gameId)
getTopPigEarners(gameId, limit)
getWorkplacePerformance(gameId, type)
getPigHappinessChart(pigId, days)
getPigEarningsChart(pigId, days)
```

### Sync Function
```
syncGameStateWithDatabase(G, gameId, playerId)
```

## Additional Resources

- 📖 **Full Setup Guide**: `PIG_DATABASE_SETUP.md`
- 🚀 **Quick Start**: `PIG_DATABASE_SETUP_QUICK.md`
- 📦 **Database Module**: `pig-database.js` (with JSDoc comments)
- 🔧 **Integration Examples**: `pig-database-integration.js` (with usage examples)
- 📊 **Schema**: `supabase/migrations/20261110000000_pig_tracking.sql` (with comments)

## Success Criteria ✨

You'll know it's working when:
- ✅ Migration runs without errors
- ✅ Tables appear in Supabase console
- ✅ Game pigs are created in database
- ✅ Work shifts are logged
- ✅ Care activities appear in logs
- ✅ Analytics queries return data
- ✅ Trends appear when querying history
- ✅ Export generates valid JSON
- ✅ No errors in browser console

## Need Help?

1. Check the comments in each file (comprehensive documentation)
2. Review `PIG_DATABASE_SETUP.md` for detailed explanations
3. Look at `pig-database-integration.js` for usage examples
4. Check Supabase console for data validation
5. Browser console for error messages

Happy tracking! 🐷📊
