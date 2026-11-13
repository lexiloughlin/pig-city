/**
 * Pig Database Integration Example
 * Shows how to hook the pig tracking database into your game
 * 
 * Add these snippets to your game code (account-system.js, game-systems-integration.js, etc.)
 */

// ==================== INITIALIZATION ====================

// 1. Initialize the pig database when supabase client is ready
let pigDB = null;

function initPigDatabase(supabaseClient) {
  pigDB = new PigDatabase(supabaseClient);
  console.log('✅ Pig Database initialized');
}

// Call this after Supabase auth is ready
// Example: in your account system initialization
/*
if (typeof Supabase !== 'undefined') {
  const { createClient } = Supabase;
  const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  supabaseClient.auth.onAuthStateChange((event, session) => {
    if (session) {
      initPigDatabase(supabaseClient);
    }
  });
}
*/

// ==================== GAME STATE MONITORING ====================

/**
 * Called when a new pig is born/created
 * Hook this into your pig creation code
 */
async function onPigCreated(pigObj, gameId, playerId) {
  if (!pigDB) return;
  
  try {
    const newPigRecord = await pigDB.addPig(gameId, playerId, {
      name: pigObj.name,
      age: pigObj.age || 0,
      skin: pigObj.skin || null,
      personality: pigObj.personality || null,
      favoriteSnack: pigObj.favoriteSnack || null
    });
    
    console.log(`📝 Tracked new pig: ${pigObj.name}`, newPigRecord);
  } catch (error) {
    console.error('Failed to track pig creation:', error);
  }
}

/**
 * Called when a pig completes a work shift
 * Hook this into your job system when shifts end
 */
async function onShiftCompleted(pigId, workplaceType, earnings, customersServed, gameId, playerId) {
  if (!pigDB) return;
  
  try {
    await pigDB.logWorkShift(gameId, playerId, pigId, {
      workplaceType: workplaceType,  // 'cafe', 'salon', 'toy', 'masaki'
      shiftEnd: new Date().toISOString(),
      earnings: earnings,
      customersServed: customersServed,
      efficiency: Math.min(100, (customersServed / 5) * 100)  // Example calculation
    });
    
    console.log(`💼 Logged work shift for pig ${pigId}`);
  } catch (error) {
    console.error('Failed to log work shift:', error);
  }
}

/**
 * Called when player performs care activity on a pig
 * Hook this into interactions like feeding, petting, giving treats
 */
async function onCareActivity(pigId, careType, pigHappinessBefore, pigHappinessAfter, gameId, playerId) {
  if (!pigDB) return;
  
  try {
    const careMap = {
      'feed': 'fed',
      'water': 'watered',
      'pet': 'petted',
      'treat': 'treat',
      'groom': 'groomed',
      'play': 'played_with'
    };
    
    await pigDB.logCareActivity(gameId, playerId, pigId, {
      type: careMap[careType] || careType,
      happinessBefore: pigHappinessBefore,
      happinessAfter: pigHappinessAfter,
      location: 'home'  // Or wherever the pig is
    });
    
    console.log(`🐷 Logged care activity: ${careType}`);
  } catch (error) {
    console.error('Failed to log care activity:', error);
  }
}

/**
 * Called periodically (e.g., at game day change) to snapshot stats
 * Use for historical tracking and trend analysis
 */
async function createDailySnapshots(gameId, playerId, pigs) {
  if (!pigDB) return;
  
  try {
    const snapshots = await Promise.all(
      pigs.map(pig => pigDB.createStatisticsSnapshot(gameId, playerId, pig.id))
    );
    
    console.log(`📊 Created ${snapshots.length} daily statistics snapshots`);
  } catch (error) {
    console.error('Failed to create snapshots:', error);
  }
}

/**
 * Called when two pigs get married
 */
async function onMarriage(pigId1, pigId2, gameId, playerId) {
  if (!pigDB) return;
  
  try {
    await pigDB.recordMarriage(gameId, playerId, pigId1, pigId2);
    console.log(`💕 Recorded marriage between pigs ${pigId1} and ${pigId2}`);
  } catch (error) {
    console.error('Failed to record marriage:', error);
  }
}

/**
 * Called when pigs have offspring
 */
async function onOffspringBorn(parentId1, parentId2, offspringId, gameId, playerId) {
  if (!pigDB) return;
  
  try {
    await pigDB.addOffspring(gameId, playerId, parentId1, parentId2, offspringId);
    console.log(`👶 Recorded offspring ${offspringId} from parents ${parentId1} and ${parentId2}`);
  } catch (error) {
    console.error('Failed to record offspring:', error);
  }
}

/**
 * Called when a pig gets a job
 */
async function onPigHired(pigId, buildingId, buildingType, gameId, playerId) {
  if (!pigDB) return;
  
  try {
    await pigDB.setPigWorkplace(gameId, playerId, pigId, buildingId, buildingType);
    console.log(`💼 Assigned pig ${pigId} to work at ${buildingType}`);
  } catch (error) {
    console.error('Failed to set workplace:', error);
  }
}

/**
 * Called when pig health status changes
 */
async function onHealthChanged(pigId, status, condition, treatment, gameId, playerId) {
  if (!pigDB) return;
  
  try {
    await pigDB.logHealthStatus(gameId, playerId, pigId, {
      status: status,  // 'healthy', 'sick', 'injured', 'recovering'
      condition: condition,  // 'sick', 'injured', 'tired', 'hungry', etc.
      treatment: treatment,  // What was done
      effective: true  // Whether treatment worked
    });
    
    console.log(`🏥 Logged health change: ${condition}`);
  } catch (error) {
    console.error('Failed to log health status:', error);
  }
}

// ==================== ANALYTICS & DASHBOARDS ====================

/**
 * Get summary statistics for all pigs in current game
 * Use this for dashboard displays
 */
async function getPigsSummary(gameId) {
  if (!pigDB) return null;
  
  try {
    const stats = await pigDB.getGamePigStats(gameId);
    return stats;
  } catch (error) {
    console.error('Failed to get pigs summary:', error);
    return null;
  }
}

/**
 * Get the top earning pigs
 * Use for leaderboards or achievements
 */
async function getTopPigEarners(gameId, limit = 5) {
  if (!pigDB) return [];
  
  try {
    const topEarners = await pigDB.getTopEarners(gameId, limit);
    return topEarners;
  } catch (error) {
    console.error('Failed to get top earners:', error);
    return [];
  }
}

/**
 * Get workplace analytics
 * Useful for deciding where to hire more pigs
 */
async function getWorkplacePerformance(gameId, workplaceType) {
  if (!pigDB) return null;
  
  try {
    const analytics = await pigDB.getWorkplaceAnalytics(gameId, workplaceType);
    return analytics;
  } catch (error) {
    console.error('Failed to get workplace analytics:', error);
    return null;
  }
}

/**
 * Get happiness trend for a single pig
 * Use for line charts showing mood over time
 */
async function getPigHappinessChart(pigId, days = 30) {
  if (!pigDB) return [];
  
  try {
    const trend = await pigDB.getHappinessTrend(pigId, days);
    return trend;
  } catch (error) {
    console.error('Failed to get happiness trend:', error);
    return [];
  }
}

/**
 * Get earnings trend for a pig
 * Use for financial tracking charts
 */
async function getPigEarningsChart(pigId, days = 30) {
  if (!pigDB) return [];
  
  try {
    const trend = await pigDB.getEarningsTrend(pigId, days);
    return trend;
  } catch (error) {
    console.error('Failed to get earnings trend:', error);
    return [];
  }
}

// ==================== EXPORT & IMPORT ====================

/**
 * Export all pig data for backups or analysis
 * Great for: backups, mods, data analysis, sharing
 */
async function exportGamePigData(gameId) {
  if (!pigDB) return null;
  
  try {
    const fullExport = await pigDB.exportPigData(gameId);
    
    // Optionally save to file
    const json = JSON.stringify(fullExport, null, 2);
    console.log('📥 Pig data exported:', json);
    
    return fullExport;
  } catch (error) {
    console.error('Failed to export pig data:', error);
    return null;
  }
}

/**
 * Get database statistics
 * Useful for debugging or UI info
 */
async function getDatabaseStatus(playerId) {
  if (!pigDB) return null;
  
  try {
    const stats = await pigDB.getDatabaseStats(playerId);
    console.log(`📊 Database Stats: ${stats.totalPigs} pigs, ${stats.totalWorkLogs} work records`);
    return stats;
  } catch (error) {
    console.error('Failed to get database stats:', error);
    return null;
  }
}

// ==================== EXAMPLE: SYNC WITH GAME STATE ====================

/**
 * Sync current game state with database
 * Call this when saving game or periodically
 * 
 * This is a comprehensive sync that:
 * - Updates all pig records with current stats
 * - Logs recent work shifts
 * - Records care activities
 * - Creates statistics snapshots
 */
async function syncGameStateWithDatabase(G, gameId, playerId) {
  if (!pigDB) {
    console.warn('Pig database not initialized');
    return;
  }
  
  try {
    console.log('🔄 Syncing game state with pig database...');
    
    // Update each pig's current stats
    for (const pig of G.pigs || []) {
      await pigDB.updatePig(pig.id, {
        age_in_days: pig.age || 0,
        happiness_level: pig.happiness || 50,
        earnings_total: pig.earnings || 0,
        health_status: pig.health || 'healthy',
        last_activity: new Date().toISOString()
      });
    }
    
    // Create daily snapshot
    if (G.lastSnapshotDay !== G.dayNum) {
      await createDailySnapshots(gameId, playerId, G.pigs || []);
      G.lastSnapshotDay = G.dayNum;
    }
    
    console.log('✅ Sync complete');
  } catch (error) {
    console.error('Sync failed:', error);
  }
}

// ==================== USAGE IN YOUR CODE ====================

/*

// In your game initialization:
window.addEventListener('load', () => {
  // ... existing code ...
  
  // Initialize pig database when ready
  if (typeof PigDatabase !== 'undefined' && supabaseClient) {
    initPigDatabase(supabaseClient);
  }
});

// Hook into pig creation:
// Existing: function createPig(name, skin, etc) { ... }
// Add this:
async function createPig(name, skin, etc) {
  const pigObj = {
    name,
    skin,
    // ... other properties
  };
  
  // Call existing pig creation code
  // ...
  
  // Then track in database
  await onPigCreated(pigObj, gameId, playerId);
}

// Hook into save/autosave:
// Existing: function save() { ... }
// Add this:
async function save() {
  // ... existing save code ...
  
  // Sync with database
  await syncGameStateWithDatabase(G, gameId, playerId);
}

// Create dashboard that queries analytics:
async function buildDashboard() {
  const summary = await getPigsSummary(gameId);
  const topEarners = await getTopPigEarners(gameId, 5);
  
  // Display summary and leaderboard
  console.table(summary);
  console.table(topEarners);
}

*/

// ==================== SYNC EXISTING PIGS ====================

/**
 * Sync all existing pigs from game to database (one-time bulk import).
 * gameId must be the UUID of a player_games row and playerId the signed-in player's id:
 * the pigs table rejects anything else. allPigs is the game's G.pigs array.
 */
async function syncAllExistingPigs(gameId, playerId, allPigs) {
  if (!pigDB) { console.warn('Pig database not initialized: call pigDatabaseIntegration.init(supabaseClient) first'); return 0; }
  if (!gameId || !playerId || !allPigs || allPigs.length === 0) { console.warn('syncAllExistingPigs needs a game id, a player id and a list of pigs'); return 0; }

  console.log(`📊 Syncing ${allPigs.length} existing pigs to database...`);
  let synced = 0;
  for (const pig of allPigs) {
    try {
      await pigDB.addPig(gameId, playerId, {
        name: pig.name,
        age: Math.floor(pig.age || 0),
        skin: pig.skin == null ? null : (typeof pig.skin === 'string' ? pig.skin : JSON.stringify(pig.skin)),
        personality: pig.trait ? { trait: pig.trait } : null,
        favoriteSnack: pig.fav == null ? null : String(pig.fav)
      });
      synced++;
    } catch (err) {
      const msg = (err && err.message) || String(err);
      // a pig with this name is already in the table: skip it
      if (!/unique|duplicate/i.test(msg)) console.warn(`⚠️ Failed to sync pig ${pig.name}:`, msg);
    }
  }
  console.log(`✅ Synced ${synced} pigs to database!`);
  return synced;
}

// ==================== MAKE FUNCTIONS AVAILABLE GLOBALLY ====================

window.pigDatabaseIntegration = {
  init: initPigDatabase,
  onPigCreated,
  onShiftCompleted,
  onCareActivity,
  createDailySnapshots,
  onMarriage,
  onOffspringBorn,
  onPigHired,
  onHealthChanged,
  getPigsSummary,
  getTopPigEarners,
  getWorkplacePerformance,
  getPigHappinessChart,
  getPigEarningsChart,
  exportGamePigData,
  getDatabaseStatus,
  syncGameStateWithDatabase,
  syncAllExistingPigs
};

console.log('🎮 Pig Database Integration functions loaded');
