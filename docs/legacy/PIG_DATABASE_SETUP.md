# Pig City Database Setup & Integration Guide

## Overview

You now have a comprehensive pig tracking database built on Supabase (PostgreSQL) with support for:

- **Basic Pig Info**: Names, ages, appearances, personalities
- **Work Tracking**: Job assignments, shift history, earnings, efficiency
- **Care Logs**: Feeding, watering, petting, treats, health status
- **Social System**: Marriages, genealogy, family trees
- **Investments**: Stock ownership, dividend tracking
- **Analytics**: Earnings trends, happiness tracking, workplace stats
- **Mod Support**: Extensible architecture for custom features

## Files Created

1. **Migration File**: `supabase/migrations/20261110000000_pig_tracking.sql`
   - Database schema with 8 main tables
   - Row-level security policies
   - Performance indexes
   - Useful views and functions

2. **Helper Module**: `pig-database.js`
   - 30+ methods for all pig operations
   - Analytics functions
   - Export capabilities

## Setup Instructions

### Step 1: Apply the Database Migration

1. Go to [Supabase Console](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Click **New Query**
5. Copy the entire contents of `supabase/migrations/20261110000000_pig_tracking.sql`
6. Paste it into the editor
7. Click **Run**

The database tables will be created automatically with all security policies and indexes.

### Step 2: Import the Pig Database Module

In your game code (e.g., `account-system.js` or `game-systems-integration.js`):

```javascript
// Import the module
const pigDB = new PigDatabase(supabaseClient);

// Now you can use all the pig tracking functions
```

### Step 3: Hook Into Existing Game Events

Add these calls at appropriate points in your game:

```javascript
// When a pig is born/created
await pigDB.addPig(gameId, playerId, {
  name: G.pigs[i].name,
  age: G.pigs[i].age || 0,
  skin: G.pigs[i].skin,
  personality: G.pigs[i].personality || null,
  favoriteSnack: G.pigs[i].favoriteSnack || null
});

// When a pig works a shift
await pigDB.logWorkShift(gameId, playerId, pigId, {
  workplaceType: 'cafe',  // or 'salon', 'toy', 'masaki'
  earnings: 50,
  customersServed: 5,
  efficiency: 95,
  mood: 'happy'
});

// When you feed/pet/treat a pig
await pigDB.logCareActivity(gameId, playerId, pigId, {
  type: 'fed',  // or 'petted', 'treat', 'watered', etc.
  foodType: 'hay',
  happinessBefore: 45,
  happinessAfter: 60
});

// When a pig gets married
await pigDB.recordMarriage(gameId, playerId, pigId1, pigId2);

// When pigs have babies
await pigDB.addOffspring(gameId, playerId, pigId1, pigId2, offspringId);

// When pig invests in stocks/buildings
await pigDB.recordInvestment(gameId, playerId, pigId, {
  buildingType: 'cafe',
  amount: 100
});
```

## Database Tables Reference

### `pigs`
Main table storing comprehensive pig information.

**Key Fields**:
- `id`: UUID
- `game_id`: References which game/save
- `player_id`: References which player
- `name`, `age_in_days`, `birth_date`
- `personality`: JSON object
- `job`: Current job type or null
- `happiness_level`: 0-100
- `earnings_total`, `earnings_today`
- `health_status`: healthy, sick, injured, recovering
- `stocks_owned`: JSON object of investments
- `is_married`, `spouse_id`
- `owned_furniture`, `favorite_furniture`
- `created_at`, `updated_at`, `last_activity`

### `pig_work_log`
Tracks every work shift.

**Key Fields**:
- `pig_id`, `game_id`, `player_id`
- `workplace_type`: cafe, salon, toy, masaki
- `shift_start`, `shift_end`
- `earnings`: Coins earned
- `customers_served`
- `efficiency_percent`
- `shift_mood`

### `pig_care_log`
Tracks all care activities.

**Key Fields**:
- `care_type`: fed, watered, petted, treat, groomed, played_with
- `food_type`: What they ate
- `pig_happiness_before`, `pig_happiness_after`
- `recorded_at`

### `pig_achievements`
Tracks milestones and accomplishments.

**Key Fields**:
- `achievement_type`: promotion, birthday, marriage, milestone, award
- `title`, `description`
- `reward_coins`
- `achieved_at`

### `pig_health_log`
Detailed health history.

**Key Fields**:
- `health_status`, `condition`
- `treatment_given`, `treatment_effective`
- `notes`

### `pig_genealogy`
Family trees and breeding data.

**Key Fields**:
- `parent_1_id`, `parent_2_id`
- `generation`
- `breed_characteristics`: JSON

### `pig_building_relationships`
Where pigs live and work.

**Key Fields**:
- `building_game_id`: Game's internal building ID
- `relationship_type`: home, workplace, visited
- `start_date`, `end_date`

### `pig_statistics_history`
Historical snapshots for trend analysis.

**Key Fields**:
- All pig stats at a point in time
- `snapshot_date`

## Available Views

### `pig_summary`
Quick overview of all pigs with recent activity.

```javascript
// Query via Supabase
const { data } = await pigDB.client
  .from('pig_summary')
  .select('*')
  .eq('game_id', gameId);
```

## Example Usage Patterns

### Get Top Earners
```javascript
const topEarners = await pigDB.getTopEarners(gameId, 10);
```

### Analyze a Workplace
```javascript
const stats = await pigDB.getWorkplaceAnalytics(gameId, 'cafe');
// Returns: totalPigs, totalEarnings, avgHappiness, avgAge, topPerformers
```

### Track Pig Happiness Over Time
```javascript
const trend = await pigDB.getHappinessTrend(pigId, 30);  // Last 30 days
// Returns: array of {snapshot_date, happiness}
```

### Get Work Performance for a Pig
```javascript
const cafeStats = await pigDB.getPigWorkplaceStats(pigId, 'cafe');
// Returns: shifts, totalEarnings, totalCustomers, avgEfficiency, mostRecentShift
```

### Export All Pig Data
```javascript
const fullExport = await pigDB.exportPigData(gameId);
// Returns: Complete pig data, achievements, work history, care logs
// Great for analysis, backups, or mod development
```

### Create Daily Snapshot for Trend Analysis
```javascript
// Call once per day (e.g., when day changes in game)
for (const pig of pigs) {
  await pigDB.createStatisticsSnapshot(gameId, playerId, pig.id);
}
```

## Security Notes

All tables have Row Level Security (RLS) enabled:
- Players can only access their own data
- Read, insert, update, delete policies in place
- Authenticated via Supabase auth

## Performance Tips

1. **Indexes**: All common queries are indexed
2. **Batch Operations**: Use Promise.all() for multiple operations
3. **Pagination**: Use `.limit()` and `.offset()` for large result sets
4. **Snapshots**: Create stats snapshots once per game day, not per frame

## Extending the Database

To add custom tracking:

1. Add columns to the `pigs` table (e.g., `custom_trait`)
2. Create new tables linking to `pigs` (e.g., `pig_custom_events`)
3. Update `pig-database.js` with new methods
4. Use the migration file as a template

Example custom table:

```sql
CREATE TABLE pig_custom_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pig_id UUID NOT NULL REFERENCES pigs(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Troubleshooting

### Foreign Key Errors
Make sure `player_games` records exist before inserting pigs.

### RLS Permission Denied
Check that the player is authenticated and the `player_id` matches `auth.uid()`.

### Data Not Appearing
1. Verify the migration ran successfully
2. Check browser console for errors
3. Confirm `supabaseClient` is properly authenticated
4. Check RLS policies on the table

## Next Steps

1. ✅ Run the migration to create tables
2. ✅ Import `pig-database.js` into your code
3. ✅ Hook into game events to start tracking
4. ✅ Query the database for analytics
5. ✅ Build UI dashboards using the data
6. ✅ Export data for analysis or mods

## Questions?

Check the database schema comments:
```sql
-- In Supabase, hover over table/column names to see documentation
COMMENT ON TABLE pigs IS '...';
```

All methods have JSDoc comments in `pig-database.js` for reference.
