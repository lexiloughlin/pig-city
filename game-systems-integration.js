/**
 * Pig City Game Systems Integration
 * 
 * This file contains integration code to hook GameSystems into the main game loop.
 * It should be included before the main game logic runs.
 */

// Initialize GameSystems in the game loop
const GameSystemsIntegration = {
  
  // Called on game load/new game
  initialize(town) {
    GameSystems.initChallenges(town);
    GameSystems.initAchievements(town);
    
    if (!town.nextEventTime) {
      town.nextEventTime = Date.now() + (3600 + Math.random() * 3600) * 1000; // 1-2 hours
    }

    for (const pig of town.pigs) {
      GameSystems.initPigNeeds(pig);
      GameSystems.initPigRelationships(pig);
    }

    // Reset challenges if new day
    if (!town.challenges.lastDailyReset) {
      GameSystems.resetDailyChallenges(town);
    } else {
      const lastReset = new Date(town.challenges.lastDailyReset);
      const today = new Date();
      if (lastReset.toDateString() !== today.toDateString()) {
        GameSystems.resetDailyChallenges(town);
      }
    }
  },

  // Called every tick from the main game loop
  update(town, pigs, deltaSeconds) {
    // Update pig needs
    for (const pig of pigs) {
      GameSystems.updatePigNeeds(pig, deltaSeconds);
      GameSystems.decayRelationships(pig, deltaSeconds);
      GameSystems.updateSocialInteractions(pig, pigs, deltaSeconds);
    }

    // Check for random events (approximately once per day)
    if (town.nextEventTime && Date.now() > town.nextEventTime) {
      const event = GameSystems.selectRandomEvent();
      const log = GameSystems.triggerRandomEvent(town, pigs, event);
      toast(`${event.name}: ${event.desc}`);
      town.nextEventTime = Date.now() + (3600 + Math.random() * 3600) * 1000;
    }

    // Check tier progression
    const tierUp = GameSystems.checkTierUp(town, pigs);
    if (tierUp) {
      toast(`🎉 You've unlocked ${tierUp.tier.name}!`);
    }

    // Check achievements
    const achievement = GameSystems.checkAchievements(town, pigs);
    if (achievement) {
      toast(`🏆 Achievement Unlocked: ${achievement.achievement.name}`);
    }
  },

  // UI Helper: Show pig needs in info panel
  formatNeedsUI(pig) {
    GameSystems.initPigNeeds(pig);
    const needs = [
      { emoji: '🍖', name: 'Hunger', val: pig.needs.hunger },
      { emoji: '⚡', name: 'Energy', val: pig.needs.energy },
      { emoji: '😊', name: 'Happiness', val: pig.needs.happiness },
      { emoji: '👥', name: 'Social', val: pig.needs.social }
    ];

    return needs.map(n => {
      const status = GameSystems.getNeedStatus(n.val);
      return `${n.emoji} ${status.emoji} ${Math.round(n.val)}%`;
    }).join('  |  ');
  },

  // UI Helper: Show relationships in info panel
  formatRelationshipsUI(pig, allPigs) {
    GameSystems.initPigRelationships(pig);
    const rels = [];

    for (const [pigId, rel] of Object.entries(pig.relationships || {})) {
      if (rel.strength <= 0) continue;
      
      const other = allPigs.find(p => p.id === parseInt(pigId));
      if (!other) continue;

      const icons = {
        friend: '👫',
        crush: '💕',
        partner: '💑',
        enemy: '⚔️'
      };

      const strength = GameSystems.getNeedStatus(rel.strength);
      rels.push(`${icons[rel.type]} ${other.name} (${strength.text})`);
    }

    return rels.length ? rels.join('\n') : 'No relationships yet';
  },

  // UI Helper: Format challenges for display
  formatChallengesUI(town) {
    GameSystems.initChallenges(town);
    const challenges = town.challenges.daily || [];

    return challenges.map(c => {
      const pct = Math.round((c.progress / c.target) * 100);
      return {
        id: c.id,
        title: c.title,
        progress: c.progress,
        target: c.target,
        reward: c.reward,
        completed: c.progress >= c.target,
        percent: pct
      };
    });
  },

  // UI Helper: Format achievements for display
  formatAchievementsUI(town) {
    GameSystems.initAchievements(town);
    const allAchievements = Object.entries(GameSystems.ACHIEVEMENTS).map(([id, ach]) => ({
      id,
      unlocked: town.achievements.unlocked.includes(id),
      ...ach
    }));

    return allAchievements;
  },

  // Progress a challenge and award coins if complete
  progressChallenge(town, challengeId) {
    const reward = GameSystems.progressChallenge(town, challengeId, 1);
    if (reward > 0) {
      town.coins = (town.coins || 0) + reward;
      return reward;
    }
    return 0;
  },

  // Record pig interaction (used by UI)
  recordInteraction(pig1, pig2, interactionType) {
    GameSystems.initPigRelationships(pig1);
    GameSystems.initPigRelationships(pig2);

    switch (interactionType) {
      case 'pet':
        pig1.needs.happiness = Math.min(100, pig1.needs.happiness + 15);
        break;
      case 'feed':
        pig1.needs.hunger = Math.min(100, pig1.needs.hunger + 20);
        break;
      case 'chat':
        pig1.needs.social = Math.min(100, pig1.needs.social + 10);
        if (pig2) {
          pig2.needs.social = Math.min(100, pig2.needs.social + 10);
          if (!pig1.relationships[pig2.id]) {
            pig1.relationships[pig2.id] = { type: 'friend', strength: 30 };
          } else {
            pig1.relationships[pig2.id].strength = Math.min(100, 
              pig1.relationships[pig2.id].strength + 5);
          }
        }
        break;
      case 'date':
        pig1.needs.happiness = Math.min(100, pig1.needs.happiness + 20);
        pig2.needs.happiness = Math.min(100, pig2.needs.happiness + 20);
        
        if (!pig1.relationships[pig2.id]) {
          pig1.relationships[pig2.id] = { type: 'crush', strength: 50 };
        } else {
          pig1.relationships[pig2.id].strength = Math.min(100,
            pig1.relationships[pig2.id].strength + 15);
          if (pig1.relationships[pig2.id].strength > 85) {
            pig1.relationships[pig2.id].type = 'partner';
            GameSystems.setRelationship(pig1, pig2, 'partner', 85);
          }
        }
        break;
    }
  }
};

// Hook into toast notifications for compatibility
if (typeof toast === 'undefined') {
  window.toast = (msg) => console.log(msg);
}
