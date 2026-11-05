# 🎮 Pig City: Game Enhancement Roadmap

## Vision: Transform into a Living Game
Make Pig City feel like The Sims meets Tamagotchi—where pigs are characters with needs, relationships, and daily drama.

---

## Phase 1: Core Systems (Priority)

### 1. **Pig Needs System** 💔
Each pig has 4 core needs that decay:
- **Hunger** (0-100) - Feed pigs at home or restaurants
- **Energy** (0-100) - Pigs sleep at night, get tired from work
- **Happiness** (0-100) - Affected by room décor, socializing, love
- **Social** (0-100) - Time with friends, family, romantic partners

**Decay Rate:**
- Hunger: -2/hour
- Energy: -1/hour (unless sleeping or idle)
- Happiness: -1/hour (baseline)
- Social: -3/hour without interaction

**Benefits:**
- Unhappy pigs work slower
- Hungry pigs look for food
- Low energy = worse work performance
- Social needs drive relationship building

---

### 2. **Relationship System** 💕
Pigs can have:
- **Best Friends** - Spend time together, increase happiness
- **Romantic Partners** - Go on dates, can marry
- **Enemies** - Avoid each other, fight in public
- **Crushes** - Unilateral attraction, may lead to dates

**Mechanics:**
- Relationships decay over time without interaction
- Public dates/hangouts improve relationships
- Jealousy system: conflicts if pigs with same crush meet
- Marriage unlocks couple perks (shared home bonuses)
- Can break up with relationship loss and drama

**Visual Indicators:**
- Heart over heads when pigs interact romantically
- Conflict symbols when enemies meet
- Hangout notifications ("Toki and Mochi are at the Café!")

---

### 3. **Social Interactions & Drama** 🎭
Pigs autonomously interact:
- **Hangouts** - Groups meet at parks, cafés, job centers
- **Romantic Interactions** - Dates, proposals, breakups
- **Conflicts** - Arguments, petty drama, gossip
- **Celebrations** - Birthday parties, weddings (already exist, enhance them)

**Event Triggers:**
- Low social need → pig seeks friends
- Crush detected → pig tries to talk to crush
- Enemy nearby → pig avoids or argues
- Holiday/Birthday → party event fires

---

### 4. **Daily Challenges & Quests** 🎯
Give players short-term goals:

**Daily Challenges (reset each day):**
1. "Feed 5 pigs" → +25 coins
2. "Get a pig to max happiness" → +15 coins
3. "Play 2 mini-games" → +20 coins
4. "Earn 200 coins from businesses" → +30 coins

**Weekly Challenges:**
1. "Get 2 pigs to marry" → Unlock wedding arch
2. "Run all job city businesses" → +100 coins
3. "Decorate 3 rooms" → New furniture unlock

**Quest Board:**
- Build a "Town Hall" building with quest board
- Show active challenges with progress bars
- Reward progression and unlocks

---

### 5. **Achievement System & Unlocks** 🏆
Unlock buildings, furniture, and cosmetics:

**Achievements:**
- "Love is in the Air" - First marriage
- "Population Boom" - 50+ pigs in town
- "Decorator" - Place 100+ furniture items
- "Workaholic" - Earn 10,000 coins
- "Social Butterfly" - 5+ friendships
- "Romance Novel" - 3+ marriages

**Unlocks (tied to achievements):**
- New buildings (Wedding Chapel, Love Café)
- Furniture themes (Romance, Luxury, Rustic)
- Special events (Harvest Festival already exists, add more)

---

### 6. **Random Events & Drama** ⚡
Inject unpredictability:

**Positive:**
- Celebrity pig visits
- "Love at First Sight" - 2 random pigs fall in love
- "Tax Refund" - +50 coins
- "Golden Acorn" - Special item spawn
- Someone's birthday! (already tracked, enhance)

**Negative:**
- Love scandal (affair drama)
- Business slow day (-20% earnings)
- Pig gets sick (needs medicine/rest)
- Thief steals from stores
- Traffic jam on bridge

**Neutral:**
- New pig moves to town
- Pet adoption event
- Weather disasters (flood, tornado - already have weather, enhance)

**Frequency:** 1 random event per day

---

### 7. **Progression Tiers** 📈
Unlock content as you progress:

**Tier 1: Hamlet** (Starting)
- Small map, basic buildings
- Max 10 pigs
- 1 island

**Tier 2: Village** (50 pigs)
- Unlock second island
- New buildings (Theater, Restaurant)
- Mini-games available

**Tier 3: Town** (100 pigs)
- Unlock third island
- Job City available
- Stock market unlocked
- Advanced relationships (marriage/divorce)

**Tier 4: City** (200+ pigs)
- Unlock fourth island
- Special events unlock
- Business chains (multiple businesses that boost each other)

---

## Phase 2: Polish & Expansion

### 8. **More Mini-Games** 🎮
Tied to buildings:
- Veggie Garden - Click-and-grow farm sim
- Sushi Spot - Cooking game
- Spa - Relaxation mini-game
- Casino - Gambling game (already have stock market, enhance)

### 9. **Pet Care Interaction Layer** 🎪
Direct player-pig interaction:
- "Pet" button to make pigs happy (+5 happiness)
- "Feed" pig with specific snacks (their favorites matter)
- "Play" interactive game with pig
- "Talk" to pig (reveals personality/mood)
- Kiss/dance animations

### 10. **Life Events** 👶
Major milestones:
- Birth (aging system - pigs start babies)
- First job
- Promotion
- Marriage
- Retirement
- Death (natural, sad, generates memorial)

---

## Implementation Priority

**Week 1 (Core Gameplay):**
1. ✅ Pig Needs System (hunger/energy/happiness/social)
2. ✅ Relationship System (friendships, romance)
3. ✅ Social Interactions (hangouts, conflicts, drama)

**Week 2 (Goals & Engagement):**
4. ✅ Daily Challenges & Quest Board
5. ✅ Achievement System
6. ✅ Random Events

**Week 3 (Polish & Expansion):**
7. ✅ Progression Tiers
8. ✅ Pet Care Interactions
9. ✅ More Mini-Games

**Week 4+ (Content):**
10. Life events, cosmetics, seasonal content

---

## Technical Approach

### Data Structure Additions
```javascript
// Per pig
pig {
  id, name, traits, ...existing...
  
  // NEW: Needs
  needs: { hunger, energy, happiness, social }
  
  // NEW: Relationships
  relationships: {
    [pigId]: { type: 'friend'|'crush'|'partner'|'enemy', strength: 0-100 }
  }
  
  // NEW: Status
  currentActivity: 'idle' | 'working' | 'sleeping' | 'eating' | 'socializing'
  lastInteraction: timestamp
  
  // NEW: Life
  ageInDays, isDead
}

// Per town
town {
  ...existing...
  
  // NEW: Challenges
  dailyChallenges: [{ id, progress, target }]
  weeklyQuests: [{ id, progress }]
  completedAchievements: [achievementIds]
  
  // NEW: Events
  nextEventTime: timestamp
}
```

### UI Changes
- Add needs bar to pig info panel (4 small bars)
- Add relationship status to pig profile
- Add quest board panel (new building)
- Add achievement panel
- Toast notifications for events

---

## Success Metrics

Player will spend more time:
- ✅ Managing pig needs
- ✅ Watching social interactions
- ✅ Completing challenges
- ✅ Unlocking content
- ✅ Experiencing emergent drama

This transforms Pig City from a **builder game** into a **living game** where pigs feel like characters, not decorations.
