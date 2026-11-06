/**
 * Pig City: Game Systems Enhancement Module
 * 
 * Adds living game mechanics:
 * - Pig needs (hunger, energy, happiness, social)
 * - Relationships (friendships, romance, enemies)
 * - Social interactions & drama
 * - Daily challenges & quests
 * - Achievement system
 * - Random events
 * - Progression tiers
 */

const GameSystems = {
  // ============= PIG NEEDS SYSTEM =============
  
  initPigNeeds(pig) {
    if (!pig.needs) {
      pig.needs = {
        hunger: 70,      // 0-100, decays over time
        energy: 70,      // 0-100, low during work
        happiness: 70,   // 0-100, affected by many things
        social: 70       // 0-100, decays without friends
      };
    }
    if (!pig.lastNeedUpdate) pig.lastNeedUpdate = 0;
  },

  updatePigNeeds(pig, deltaSeconds) {
    this.initPigNeeds(pig);
    const dt = deltaSeconds / 3600; // Convert to hours
    
    // Base decay rates (per hour)
    const decay = {
      hunger: 2,
      energy: 1,
      happiness: 1,
      social: 3
    };

    // Apply decay
    for (const need in pig.needs) {
      pig.needs[need] = Math.max(0, pig.needs[need] - decay[need] * dt);
    }

    // Modifiers based on activity
    if (pig.food > 85) pig.needs.hunger = Math.min(100, pig.needs.hunger + 0.5);
    if (pig.water > 85) pig.needs.energy = Math.min(100, pig.needs.energy + 0.2);
    
    // Happiness boost from being in a nice room
    if (pig.room && pig.lastRoomTime > 0) {
      pig.needs.happiness = Math.min(100, pig.needs.happiness + 0.1);
    }
  },

  getNeedStatus(value) {
    if (value >= 80) return { emoji: '🟢', text: 'Great' };
    if (value >= 60) return { emoji: '🟡', text: 'Good' };
    if (value >= 40) return { emoji: '🟠', text: 'Low' };
    return { emoji: '🔴', text: 'Critical' };
  },

  // ============= RELATIONSHIP SYSTEM =============

  initPigRelationships(pig) {
    if (!pig.relationships) {
      pig.relationships = {}; // { pigId: { type: 'friend'|'crush'|'partner'|'enemy', strength: 0-100 } }
    }
    if (pig.friend && !pig.relationships[pig.friend]) {
      pig.relationships[pig.friend] = { type: 'friend', strength: 60 };
    }
  },

  setRelationship(pig1, pig2, type, strength = 50) {
    this.initPigRelationships(pig1);
    this.initPigRelationships(pig2);
    
    pig1.relationships[pig2.id] = { type, strength: Math.max(0, Math.min(100, strength)) };
    
    // Relationships are directional, but romance is mutual
    if (type === 'partner') {
      pig2.relationships[pig1.id] = { type: 'partner', strength };
    }
  },

  getRelationship(pig1Id, pig2Id, allPigs) {
    const pig1 = allPigs.find(p => p.id === pig1Id);
    if (!pig1 || !pig1.relationships) return null;
    return pig1.relationships[pig2Id] || null;
  },

  decayRelationships(pig, deltaSeconds) {
    this.initPigRelationships(pig);
    const dt = deltaSeconds / 3600; // hours
    
    for (const pigId in pig.relationships) {
      const rel = pig.relationships[pigId];
      // Relationships decay without interaction (except partner/spouse)
      if (rel.type !== 'partner') {
        rel.strength = Math.max(0, rel.strength - (2 * dt));
      }
      
      // Remove dead relationships
      if (rel.strength <= 0 && rel.type !== 'partner') {
        delete pig.relationships[pigId];
      }
    }
  },

  // ============= DAILY CHALLENGES SYSTEM =============

  initChallenges(town) {
    if (!town.challenges) {
      town.challenges = {
        daily: [],
        weekly: [],
        lastDailyReset: 0,
        lastWeeklyReset: 0
      };
    }
  },

  resetDailyChallenges(town) {
    const dailyChallenges = [
      { id: 'feed-5', title: 'Feed 5 pigs', target: 5, progress: 0, reward: 25 },
      { id: 'max-happiness', title: 'Get a pig to max happiness', target: 1, progress: 0, reward: 15 },
      { id: 'play-minigame', title: 'Play 2 mini-games', target: 2, progress: 0, reward: 20 },
      { id: 'earn-coins', title: 'Earn 200 coins from businesses', target: 200, progress: 0, reward: 30 }
    ];
    
    town.challenges.daily = dailyChallenges;
    town.challenges.lastDailyReset = Date.now();
  },

  progressChallenge(town, challengeId, amount = 1) {
    const challenge = town.challenges.daily.find(c => c.id === challengeId);
    if (challenge && challenge.progress < challenge.target) {
      challenge.progress += amount;
      if (challenge.progress >= challenge.target) {
        return challenge.reward; // Return reward when completed
      }
    }
    return 0;
  },

  // ============= ACHIEVEMENT SYSTEM =============

  ACHIEVEMENTS: {
    'love-birds': {
      name: 'Love is in the Air 💕',
      desc: 'Get your first marriage',
      progress: 'marriages',
      target: 1
    },
    'population-boom': {
      name: 'Population Boom 🌆',
      desc: 'Grow your town to 50 pigs',
      progress: 'pigCount',
      target: 50
    },
    'decorator': {
      name: 'Interior Designer 🛋️',
      desc: 'Place 100 furniture items',
      progress: 'furnitureCount',
      target: 100
    },
    'workaholic': {
      name: 'Workaholic 💰',
      desc: 'Earn 10,000 coins total',
      progress: 'totalCoinsEarned',
      target: 10000
    },
    'social-butterfly': {
      name: 'Social Butterfly 🦋',
      desc: 'Create 5 friendships',
      progress: 'friendshipCount',
      target: 5
    },
    'matchmaker': {
      name: 'Matchmaker 💒',
      desc: 'Get 3 pigs married',
      progress: 'marriages',
      target: 3
    },
    'builder': {
      name: 'Master Builder 🏗️',
      desc: 'Build 50 buildings',
      progress: 'buildingCount',
      target: 50
    }
  },

  initAchievements(town) {
    if (!town.achievements) {
      town.achievements = {
        unlocked: [],
        progress: {}
      };
    }
  },

  checkAchievements(town, pigs) {
    this.initAchievements(town);
    
    // Track progress metrics
    const metrics = {
      marriages: pigs.filter(p => p.married).length,
      pigCount: pigs.length,
      furnitureCount: town.furniture ? town.furniture.length : 0,
      totalCoinsEarned: town.totalCoinsEarned || 0,
      friendshipCount: pigs.reduce((sum, p) => sum + Object.keys(p.relationships || {}).length, 0) / 2,
      buildingCount: town.buildings.length
    };

    for (const [id, achievement] of Object.entries(this.ACHIEVEMENTS)) {
      if (town.achievements.unlocked.includes(id)) continue;
      
      const current = metrics[achievement.progress] || 0;
      if (current >= achievement.target) {
        town.achievements.unlocked.push(id);
        return { id, achievement, milestone: true };
      }
    }
    return null;
  },

  // ============= RANDOM EVENTS SYSTEM =============

  EVENTS: [
    {
      id: 'celebrity-visit',
      name: '⭐ Celebrity Pig Spotted!',
      desc: 'A famous pig is visiting your town!',
      effect: 'happiness',
      value: 20,
      weight: 1
    },
    {
      id: 'love-at-sight',
      name: '💕 Love at First Sight',
      desc: 'Two pigs fall in love!',
      effect: 'relationship',
      value: 1,
      weight: 2
    },
    {
      id: 'tax-refund',
      name: '💰 Tax Refund!',
      desc: 'You receive an unexpected tax refund',
      effect: 'coins',
      value: 50,
      weight: 1
    },
    {
      id: 'business-boom',
      name: '📈 Business Boom!',
      desc: 'All businesses are extra productive today',
      effect: 'businesses',
      value: 1.5, // multiplier
      weight: 2
    },
    {
      id: 'love-scandal',
      name: '😱 Love Scandal!',
      desc: 'Drama unfolds between two pigs',
      effect: 'conflict',
      value: -20,
      weight: 1
    },
    {
      id: 'business-slowdown',
      name: '📉 Slow Business Day',
      desc: 'Businesses are struggling today',
      effect: 'businessMalus',
      value: 0.7,
      weight: 1
    },
    {
      id: 'new-arrival',
      name: '🎉 New Pig Moves to Town!',
      desc: 'A new pig arrives and is excited to meet everyone',
      effect: 'newPig',
      value: 1,
      weight: 2
    }
  ],

  selectRandomEvent() {
    const weights = this.EVENTS.map(e => e.weight);
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < this.EVENTS.length; i++) {
      random -= weights[i];
      if (random <= 0) return this.EVENTS[i];
    }
    return this.EVENTS[0];
  },

  triggerRandomEvent(town, pigs, event) {
    if (!town.events) town.events = [];
    
    const eventLog = {
      id: event.id,
      name: event.name,
      time: Date.now(),
      processed: false
    };

    switch (event.effect) {
      case 'coins':
        town.coins = (town.coins || 0) + event.value;
        break;
      case 'happiness':
        const randomPig = pigs[Math.floor(Math.random() * pigs.length)];
        if (randomPig) randomPig.needs.happiness = Math.min(100, randomPig.needs.happiness + event.value);
        break;
      case 'relationship':
        if (pigs.length >= 2) {
          const pig1 = pigs[Math.floor(Math.random() * pigs.length)];
          let pig2 = pigs[Math.floor(Math.random() * pigs.length)];
          while (pig2.id === pig1.id && pigs.length > 1) {
            pig2 = pigs[Math.floor(Math.random() * pigs.length)];
          }
          this.setRelationship(pig1, pig2, 'crush', 50);
        }
        break;
    }

    town.events.push(eventLog);
    return eventLog;
  },

  // ============= PROGRESSION TIERS =============

  getTier(pigCount) {
    if (pigCount < 10) return { tier: 1, name: 'Hamlet', next: 10 };
    if (pigCount < 50) return { tier: 2, name: 'Village', next: 50 };
    if (pigCount < 100) return { tier: 3, name: 'Town', next: 100 };
    return { tier: 4, name: 'City', next: 200 };
  },

  checkTierUp(town, pigs) {
    const current = this.getTier(pigs.length);
    const prev = town.currentTier || { tier: 0 };
    
    if (current.tier > prev.tier) {
      town.currentTier = current;
      return { unlocked: true, tier: current };
    }
    
    return null;
  },

  // ============= SOCIAL INTERACTION SYSTEM =============

  initiateHangout(pig1, pig2, location = 'park') {
    if (!pig1.hangouts) pig1.hangouts = [];
    if (!pig2.hangouts) pig2.hangouts = [];
    
    const hangout = {
      pigs: [pig1.id, pig2.id],
      location,
      startTime: Date.now(),
      duration: 30 + Math.random() * 30 // 30-60 minutes
    };
    
    pig1.hangouts.push(hangout);
    pig2.hangouts.push(hangout);
    
    return hangout;
  },

  updateSocialInteractions(pig, pigs, deltaSeconds) {
    if (!pig.hangouts) pig.hangouts = [];
    
    // Update existing hangouts
    pig.hangouts = pig.hangouts.filter(h => {
      const elapsed = (Date.now() - h.startTime) / 60000; // minutes
      if (elapsed > h.duration) {
        // Hangout ended, boost relationship
        const otherPigId = h.pigs.find(id => id !== pig.id);
        if (pig.relationships && pig.relationships[otherPigId]) {
          pig.relationships[otherPigId].strength = Math.min(100, 
            pig.relationships[otherPigId].strength + 10);
        }
        return false;
      }
      return true;
    });

    // Maybe initiate new hangout if social need is low
    if (pig.needs.social < 30 && Math.random() < 0.01) {
      const friends = pigs.filter(p => 
        p.id !== pig.id && 
        pig.relationships && 
        pig.relationships[p.id] && 
        pig.relationships[p.id].type === 'friend'
      );
      
      if (friends.length > 0) {
        const friend = friends[Math.floor(Math.random() * friends.length)];
        this.initiateHangout(pig, friend);
      }
    }
  },

  // ============= MINI-GAME & CHALLENGE INTEGRATION =============

  recordMiniGamePlay(town, pigId, reward) {
    if (!town.minigameStats) town.minigameStats = [];
    
    town.minigameStats.push({
      pigId,
      reward,
      timestamp: Date.now()
    });
  },

  // ============= SAVE/LOAD HELPERS =============

  sanitizeForSave(town) {
    // Keep only essential data to avoid save bloat
    if (town.events && town.events.length > 100) {
      town.events = town.events.slice(-100);
    }
    return town;
  },

  validateLoadedData(town) {
    // Ensure all pigs have initialized systems
    if (town.pigs) {
      for (const pig of town.pigs) {
        this.initPigNeeds(pig);
        this.initPigRelationships(pig);
      }
    }
    this.initChallenges(town);
    this.initAchievements(town);
  }
};

// Export for use in main game loop
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GameSystems;
}
