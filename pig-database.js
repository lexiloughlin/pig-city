/**
 * Pig Database Module
 * Handles all pig data tracking and queries with Supabase
 * Supports analytics, mod development, and player insights
 */

class PigDatabase {
  constructor(supabaseClient) {
    this.client = supabaseClient;
  }

  // ==================== PIG LIFECYCLE ====================

  /**
   * Create a new pig record in the database
   */
  async addPig(gameId, playerId, pigData) {
    const { data, error } = await this.client
      .from('pigs')
      .insert([{
        game_id: gameId,
        player_id: playerId,
        name: pigData.name,
        age_in_days: pigData.age || 0,
        birth_date: new Date().toISOString(),
        skin: pigData.skin || null,
        personality: pigData.personality || null,
        favorite_snack: pigData.favoriteSnack || null,
        job: null,
        happiness_level: 50,
        health_status: 'healthy'
      }])
      .select();

    if (error) throw error;
    return data?.[0];
  }

  /**
   * Get all pigs in a game
   */
  async getPigsInGame(gameId) {
    const { data, error } = await this.client
      .from('pigs')
      .select('*')
      .eq('game_id', gameId)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  /**
   * Get a single pig by ID
   */
  async getPig(pigId) {
    const { data, error } = await this.client
      .from('pigs')
      .select('*')
      .eq('id', pigId)
      .single();

    if (error) throw error;
    return data;
  }

  /**
   * Update pig data (name, age, stats, etc.)
   */
  async updatePig(pigId, updates) {
    const { data, error } = await this.client
      .from('pigs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        last_activity: new Date().toISOString()
      })
      .eq('id', pigId)
      .select();

    if (error) throw error;
    return data?.[0];
  }

  // ==================== WORK & JOBS ====================

  /**
   * Log a pig work shift
   */
  async logWorkShift(gameId, playerId, pigId, shiftData) {
    const { data, error } = await this.client
      .from('pig_work_log')
      .insert([{
        game_id: gameId,
        player_id: playerId,
        pig_id: pigId,
        workplace_type: shiftData.workplaceType,
        shift_start: shiftData.shiftStart || new Date().toISOString(),
        shift_end: shiftData.shiftEnd,
        earnings: shiftData.earnings || 0,
        customers_served: shiftData.customersServed || 0,
        efficiency_percent: shiftData.efficiency || 100,
        shift_mood: shiftData.mood || 'neutral'
      }])
      .select();

    if (error) throw error;
    return data?.[0];
  }

  /**
   * Get work history for a pig
   */
  async getPigWorkHistory(pigId, limit = 20) {
    const { data, error } = await this.client
      .from('pig_work_log')
      .select('*')
      .eq('pig_id', pigId)
      .order('shift_start', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get pig stats for a specific workplace
   */
  async getPigWorkplaceStats(pigId, workplaceType) {
    const { data, error } = await this.client
      .from('pig_work_log')
      .select('*')
      .eq('pig_id', pigId)
      .eq('workplace_type', workplaceType);

    if (error) throw error;

    if (!data?.length) return null;

    const totalEarnings = data.reduce((sum, shift) => sum + (shift.earnings || 0), 0);
    const totalCustomers = data.reduce((sum, shift) => sum + (shift.customers_served || 0), 0);
    const avgEfficiency = data.reduce((sum, shift) => sum + (shift.efficiency_percent || 100), 0) / data.length;

    return {
      shifts: data.length,
      totalEarnings,
      totalCustomers,
      avgEfficiency: Math.round(avgEfficiency),
      mostRecentShift: data[0]
    };
  }

  // ==================== CARE & HEALTH ====================

  /**
   * Log a care activity (feeding, petting, treats)
   */
  async logCareActivity(gameId, playerId, pigId, careData) {
    const { data, error } = await this.client
      .from('pig_care_log')
      .insert([{
        game_id: gameId,
        player_id: playerId,
        pig_id: pigId,
        care_type: careData.type,  // 'fed', 'watered', 'petted', 'treat', etc.
        food_type: careData.foodType || null,
        location: careData.location || null,
        pig_happiness_before: careData.happinessBefore || 50,
        pig_happiness_after: careData.happinessAfter || 50,
        recorded_at: new Date().toISOString()
      }])
      .select();

    if (error) throw error;
    return data?.[0];
  }

  /**
   * Get care history for a pig
   */
  async getPigCareHistory(pigId, days = 7) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.client
      .from('pig_care_log')
      .select('*')
      .eq('pig_id', pigId)
      .gte('recorded_at', startDate.toISOString())
      .order('recorded_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Log health status
   */
  async logHealthStatus(gameId, playerId, pigId, healthData) {
    const { data, error } = await this.client
      .from('pig_health_log')
      .insert([{
        game_id: gameId,
        player_id: playerId,
        pig_id: pigId,
        health_status: healthData.status,
        condition: healthData.condition || null,
        treatment_given: healthData.treatment || null,
        treatment_effective: healthData.effective || null,
        notes: healthData.notes || null
      }])
      .select();

    if (error) throw error;
    return data?.[0];
  }

  /**
   * Get health history for a pig
   */
  async getPigHealthHistory(pigId, limit = 20) {
    const { data, error } = await this.client
      .from('pig_health_log')
      .select('*')
      .eq('pig_id', pigId)
      .order('recorded_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  // ==================== ACHIEVEMENTS ====================

  /**
   * Record a pig achievement
   */
  async addAchievement(gameId, playerId, pigId, achievementData) {
    const { data, error } = await this.client
      .from('pig_achievements')
      .insert([{
        game_id: gameId,
        player_id: playerId,
        pig_id: pigId,
        achievement_type: achievementData.type,  // 'promotion', 'birthday', 'marriage', etc.
        title: achievementData.title,
        description: achievementData.description || null,
        reward_coins: achievementData.rewardCoins || 0
      }])
      .select();

    if (error) throw error;
    return data?.[0];
  }

  /**
   * Get achievements for a pig
   */
  async getPigAchievements(pigId) {
    const { data, error } = await this.client
      .from('pig_achievements')
      .select('*')
      .eq('pig_id', pigId)
      .order('achieved_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // ==================== RELATIONSHIPS & SOCIAL ====================

  /**
   * Record a marriage between two pigs
   */
  async recordMarriage(gameId, playerId, pigId1, pigId2) {
    const now = new Date().toISOString();

    // Update both pigs
    await Promise.all([
      this.updatePig(pigId1, {
        is_married: true,
        spouse_id: pigId2,
        marriage_date: now
      }),
      this.updatePig(pigId2, {
        is_married: true,
        spouse_id: pigId1,
        marriage_date: now
      })
    ]);

    // Record achievement for both
    await Promise.all([
      this.addAchievement(gameId, playerId, pigId1, {
        type: 'marriage',
        title: 'Married!',
        description: 'Found their special someone'
      }),
      this.addAchievement(gameId, playerId, pigId2, {
        type: 'marriage',
        title: 'Married!',
        description: 'Found their special someone'
      })
    ]);
  }

  /**
   * Record an offspring
   */
  async addOffspring(gameId, playerId, parentId1, parentId2, offspringId) {
    const parent1 = await this.getPig(parentId1);
    const parent2 = await this.getPig(parentId2);
    const offspring = await this.getPig(offspringId);

    // Update genealogy
    await this.client
      .from('pig_genealogy')
      .insert([{
        game_id: gameId,
        player_id: playerId,
        pig_id: offspringId,
        parent_1_id: parentId1,
        parent_2_id: parentId2,
        generation: Math.max((parent1?.generation || 1), (parent2?.generation || 1)) + 1
      }])
      .select();

    // Update parents' offspring arrays
    const p1Offspring = parent1?.offspring || [];
    const p2Offspring = parent2?.offspring || [];
    if (!p1Offspring.includes(offspringId)) p1Offspring.push(offspringId);
    if (!p2Offspring.includes(offspringId)) p2Offspring.push(offspringId);

    await Promise.all([
      this.updatePig(parentId1, { offspring: p1Offspring }),
      this.updatePig(parentId2, { offspring: p2Offspring })
    ]);
  }

  // ==================== INVESTMENTS ====================

  /**
   * Record investment in buildings/stocks
   */
  async recordInvestment(gameId, playerId, pigId, investmentData) {
    const pig = await this.getPig(pigId);
    const stocks = pig?.stocks_owned || {};

    stocks[investmentData.buildingType] = (stocks[investmentData.buildingType] || 0) + investmentData.amount;

    await this.updatePig(pigId, {
      stocks_owned: stocks,
      investment_total: (pig?.investment_total || 0) + investmentData.amount
    });
  }

  /**
   * Record dividends received
   */
  async recordDividends(gameId, playerId, pigId, amount) {
    const pig = await this.getPig(pigId);

    await this.updatePig(pigId, {
      dividends_received: (pig?.dividends_received || 0) + amount,
      earnings_total: (pig?.earnings_total || 0) + amount
    });
  }

  // ==================== ANALYTICS ====================

  /**
   * Get summary stats for all pigs in a game
   */
  async getGamePigStats(gameId) {
    const { data, error } = await this.client
      .from('pig_summary')
      .select('*')
      .eq('game_id', gameId);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get pigs by job type
   */
  async getPigsByJob(gameId, jobType) {
    const { data, error } = await this.client
      .from('pigs')
      .select('*')
      .eq('game_id', gameId)
      .eq('job', jobType)
      .order('earnings_total', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get pigs by happiness level
   */
  async getPigsByHappiness(gameId, minHappiness) {
    const { data, error } = await this.client
      .from('pigs')
      .select('*')
      .eq('game_id', gameId)
      .gte('happiness_level', minHappiness)
      .order('happiness_level', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get top earners
   */
  async getTopEarners(gameId, limit = 10) {
    const { data, error } = await this.client
      .from('pigs')
      .select('*')
      .eq('game_id', gameId)
      .order('earnings_total', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }

  /**
   * Get statistics snapshot for trend analysis
   */
  async createStatisticsSnapshot(gameId, playerId, pigId) {
    const pig = await this.getPig(pigId);
    if (!pig) return null;

    const { data, error } = await this.client
      .from('pig_statistics_history')
      .insert([{
        game_id: gameId,
        player_id: playerId,
        pig_id: pigId,
        happiness: pig.happiness_level,
        earnings_total: pig.earnings_total,
        earnings_today: pig.earnings_today,
        treats_received: pig.treats_received,
        shifts_worked: pig.shifts_worked,
        age_in_days: pig.age_in_days,
        health_status: pig.health_status
      }])
      .select();

    if (error) throw error;
    return data?.[0];
  }

  /**
   * Get happiness trend over time
   */
  async getHappinessTrend(pigId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.client
      .from('pig_statistics_history')
      .select('snapshot_date, happiness')
      .eq('pig_id', pigId)
      .gte('snapshot_date', startDate.toISOString())
      .order('snapshot_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get earnings trend over time
   */
  async getEarningsTrend(pigId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await this.client
      .from('pig_statistics_history')
      .select('snapshot_date, earnings_total, earnings_today')
      .eq('pig_id', pigId)
      .gte('snapshot_date', startDate.toISOString())
      .order('snapshot_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  /**
   * Get workplace analytics
   */
  async getWorkplaceAnalytics(gameId, workplaceType) {
    const pigs = await this.getPigsByJob(gameId, workplaceType);
    
    const analytics = {
      totalPigs: pigs.length,
      totalEarnings: 0,
      avgHappiness: 0,
      avgAge: 0,
      topPerformers: []
    };

    for (const pig of pigs) {
      analytics.totalEarnings += pig.earnings_total || 0;
      analytics.avgHappiness += pig.happiness_level || 50;
      analytics.avgAge += pig.age_in_days || 0;
    }

    if (pigs.length > 0) {
      analytics.avgHappiness = Math.round(analytics.avgHappiness / pigs.length);
      analytics.avgAge = Math.round(analytics.avgAge / pigs.length);
      analytics.topPerformers = pigs.slice(0, 5);
    }

    return analytics;
  }

  // ==================== BUILDING RELATIONSHIPS ====================

  /**
   * Record pig living in a building
   */
  async setPigHome(gameId, playerId, pigId, buildingGameId, buildingType, roomName = null) {
    await this.client
      .from('pig_building_relationships')
      .delete()
      .eq('pig_id', pigId)
      .eq('relationship_type', 'home');

    const { data, error } = await this.client
      .from('pig_building_relationships')
      .insert([{
        game_id: gameId,
        player_id: playerId,
        pig_id: pigId,
        building_type: buildingType,
        building_game_id: buildingGameId,
        relationship_type: 'home'
      }])
      .select();

    if (error) throw error;

    // Update pig record
    await this.updatePig(pigId, {
      home_building_id: buildingGameId,
      home_room_name: roomName
    });

    return data?.[0];
  }

  /**
   * Record pig working at a building
   */
  async setPigWorkplace(gameId, playerId, pigId, buildingGameId, buildingType) {
    const { data, error } = await this.client
      .from('pig_building_relationships')
      .delete()
      .eq('pig_id', pigId)
      .eq('relationship_type', 'workplace')
      .select();

    const { data: newData, error: newError } = await this.client
      .from('pig_building_relationships')
      .insert([{
        game_id: gameId,
        player_id: playerId,
        pig_id: pigId,
        building_type: buildingType,
        building_game_id: buildingGameId,
        relationship_type: 'workplace'
      }])
      .select();

    if (newError) throw newError;

    // Update pig record
    await this.updatePig(pigId, {
      job: buildingType,
      workplace_id: buildingGameId
    });

    return newData?.[0];
  }

  // ==================== EXPORTS ====================

  /**
   * Export pig data to JSON for analysis
   */
  async exportPigData(gameId) {
    const pigs = await this.getPigsInGame(gameId);
    
    const exportData = {
      exportDate: new Date().toISOString(),
      gameId,
      totalPigs: pigs.length,
      pigs: []
    };

    for (const pig of pigs) {
      const achievements = await this.getPigAchievements(pig.id);
      const workHistory = await this.getPigWorkHistory(pig.id, 50);
      const careHistory = await this.getPigCareHistory(pig.id, 30);

      exportData.pigs.push({
        ...pig,
        achievements,
        workHistory,
        careHistory
      });
    }

    return exportData;
  }

  /**
   * Get pig database stats
   */
  async getDatabaseStats(playerId) {
    const { data: pigsData, error: pigsError } = await this.client
      .from('pigs')
      .select('count', { count: 'exact' })
      .eq('player_id', playerId);

    const { data: logsData, error: logsError } = await this.client
      .from('pig_work_log')
      .select('count', { count: 'exact' })
      .eq('player_id', playerId);

    return {
      totalPigs: pigsData?.count || 0,
      totalWorkLogs: logsData?.count || 0
    };
  }
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = PigDatabase;
}
