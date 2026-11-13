# 🐷 Pig City Database Setup - Complete

Your comprehensive pig tracking database is now ready! Here's what was created:

## 📦 What You Got

### 1. **Database Migration** `supabase/migrations/20261110000000_pig_tracking.sql` (13 KB)
   - **8 Main Tables**:
     - `pigs` - Core pig data (name, age, job, happiness, earnings, etc.)
     - `pig_work_log` - Work shift tracking (earnings, customers, efficiency)
     - `pig_care_log` - Daily care activities (feeding, petting, treats)
     - `pig_health_log` - Health status and treatments
     - `pig_achievements` - Milestones and accomplishments
     - `pig_genealogy` - Family trees and breeding
     - `pig_building_relationships` - Where pigs live/work
     - `pig_statistics_history` - Historical snapshots for trends
   
   - **Security**: Row-level security (RLS) policies for data protection
   - **Performance**: Optimized indexes on all common queries
   - **Views**: `pig_summary` for quick overview queries

### 2. **Database Module** `pig-database.js` (16 KB)
   - **30+ Methods** for all pig operations:
     - Pig lifecycle (create, read, update)
     - Work tracking (log shifts, get stats)
     - Care logging (feeding, petting, health)
     - Social system (marriages, offspring, genealogy)
     - Analytics (earnings trends, happiness, top performers)
     - Data export for mods and analysis
   
   - **Easy to Use**: `await pigDB.addPig()`, `await pigDB.logWorkShift()`, etc.
   - **Error Handling**: All methods have try-catch ready
   - **Extensible**: Clean architecture for custom additions

### 3. **Integration Examples** `pig-database-integration.js` (11 KB)
   - **Ready-to-Use Hooks**: 
     - `onPigCreated()` - When pigs are born
     - `onShiftCompleted()` - After work
     - `onCareActivity()` - Feeding, petting, treats
     - `onMarriage()` - Love system
     - `onOffspringBorn()` - Breeding
     - `onHealthChanged()` - Health tracking
   
   - **Analytics Functions**:
     - `getPigsSummary()` - Dashboard data
     - `getTopPigEarners()` - Leaderboards
     - `getWorkplacePerformance()` - Where to hire
     - `getPigHappinessChart()` - Mood trends
     - `getPigEarningsChart()` - Financial history
   
   - **Copy-Paste Ready**: All functions have usage comments

### 4. **Setup Guide** `PIG_DATABASE_SETUP.md` (8 KB)
   - Step-by-step migration instructions
   - Complete table reference
   - Example usage patterns
   - Troubleshooting tips
   - Extension guide

## 🚀 Quick Start (5 minutes)

### Step 1: Apply Migration
```bash
# Go to Supabase Console → SQL Editor → New Query
# Paste entire contents of: supabase/migrations/20261110000000_pig_tracking.sql
# Click Run
```

### Step 2: Add to HTML
```html
<!-- In index.html, after supabase-js -->
<script src="pig-database.js"></script>
<script src="pig-database-integration.js"></script>
```

### Step 3: Initialize
```javascript
// In account-system.js or game-systems-integration.js
if (supabaseClient && typeof PigDatabase !== 'undefined') {
  window.pigDatabaseIntegration.init(supabaseClient);
}
```

### Step 4: Use It!
```javascript
// Track a pig shift
await window.pigDatabaseIntegration.onShiftCompleted(
  pigId, 'cafe', 50, 5, gameId, playerId
);

// Get top earners
const topEarners = await window.pigDatabaseIntegration.getTopPigEarners(gameId);
```

## 📊 Tracked Data

Your database now automatically tracks:

| Data Type | Tracking | Purpose |
|-----------|----------|---------|
| **Basic Info** | Name, age, birth date, skin, personality | Character management |
| **Work History** | Job, shifts, earnings, customers, efficiency | Career analytics |
| **Daily Care** | Feeding, watering, petting, treats | Care tracking |
| **Health** | Status, conditions, treatments | Health history |
| **Social** | Marriages, offspring, family trees | Relationships |
| **Investments** | Stocks, dividends, portfolio | Finance tracking |
| **Achievements** | Milestones, promotions, awards | Accomplishments |
| **Analytics** | Happiness trends, earnings trends, stats | Historical insights |

## 💡 Use Cases

### For Players
- **Dashboards**: See pig statistics and trends
- **Leaderboards**: Top earners and performers
- **Achievements**: Track milestones and awards
- **History**: See how pigs have grown over time

### For Mods/Plugins
- **Data Export**: Get all pig data as JSON
- **Analytics API**: Query trends and statistics
- **Custom Tracking**: Extend tables for custom features
- **Breeding Systems**: Access genealogy data

### For Future Development
- **AI Recommendations**: "Your cafe needs more workers"
- **Notifications**: "Pig is unhappy" alerts
- **Cloud Sync**: Save pig data across devices
- **Multiplayer**: Compare pig stats with friends

## 📁 Files Created

```
pig-city/
├── pig-database.js (16 KB)
│   └── Main module with 30+ methods
├── pig-database-integration.js (11 KB)
│   └── Hooks and example usage
├── PIG_DATABASE_SETUP.md (8 KB)
│   └── Complete setup guide
└── supabase/migrations/
    └── 20261110000000_pig_tracking.sql (13 KB)
        └── Database schema (8 tables, RLS, indexes)
```

## ✅ Next Steps

1. **Run Migration**: Apply SQL to Supabase
2. **Import Modules**: Add to HTML
3. **Initialize**: Call `init()` function
4. **Hook Events**: Use integration functions
5. **Monitor**: Watch analytics queries
6. **Extend**: Add custom tracking as needed

## 🔗 Integration Points

Hook these into your game code:

```javascript
// When pig is born
→ onPigCreated(pig, gameId, playerId)

// When shift ends
→ onShiftCompleted(pigId, type, earnings, customers, gameId, playerId)

// When pig is cared for
→ onCareActivity(pigId, type, before, after, gameId, playerId)

// When game saves
→ syncGameStateWithDatabase(G, gameId, playerId)

// Daily
→ createDailySnapshots(gameId, playerId, pigs)

// When pigs marry
→ onMarriage(pigId1, pigId2, gameId, playerId)

// When babies born
→ onOffspringBorn(parent1, parent2, baby, gameId, playerId)
```

## 🆘 Troubleshooting

**Migration won't run?**
- Ensure you're in correct Supabase project
- Check project is active (not paused)
- Try smaller queries if timeout occurs

**"Table already exists"?**
- Migration uses `IF NOT EXISTS` - safe to run again
- Or delete tables first if needed

**Data not saving?**
- Check authentication is working
- Verify `player_id` matches authenticated user
- Check RLS policies in Supabase console

**No data appearing?**
- Confirm player is authenticated
- Check player record exists in `players` table
- Verify `player_games` record exists
- Check browser console for errors

## 📚 Documentation

- **Setup**: See `PIG_DATABASE_SETUP.md`
- **Integration**: See `pig-database-integration.js` comments
- **Methods**: JSDoc comments in `pig-database.js`
- **Schema**: Comments in SQL migration file

## 🎉 You're All Set!

Your pig tracking database is ready for:
- ✅ Full game analytics
- ✅ Player dashboards
- ✅ Mod development
- ✅ Data analysis
- ✅ Future integrations

Happy tracking! 🐷📊

---

**Questions?** Check the comments in each file - they're comprehensive!
