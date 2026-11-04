# 🌾 Hay Harvest Mini-Game Feature

## Overview
A new mini-game has been added to Pig City that allows players to earn bonus coins by playing an interactive hay-catching game.

## Features

### Building: Hay Mill 🏭
- **Cost:** 85 🪙
- **Category:** Business building
- **Description:** "Play the Hay Harvest game to earn bonus 🪙. Once per day!"
- **Location:** Build it in your town like any other business building

### Gameplay
When you click the Hay Mill building and select "Play Game":

1. **Game Duration:** 30 seconds
2. **Objective:** Click on falling hay as it falls from the top
3. **Scoring:** Each piece of hay collected = 1 point
4. **Max Hay:** 15 pieces fall during the game
5. **Reward:** Up to 50 🪙 based on how much hay you collect
   - 1/15 hay = ~3 🪙
   - 5/15 hay = ~16 🪙
   - 15/15 hay (perfect!) = 50 🪙

### Game Rules
- **Once Per Day:** You can only play once every 24 hours
- **Real-Time Challenge:** The game progresses in real-time with a countdown timer
- **Visual Feedback:** 
  - Score counter shows collected hay
  - Reward preview shows potential coins
  - Success message when game ends

### Implementation Details

**Files Modified:**
- `index.html` - Added Hay Mill building, mini-game styles, modal, and game logic

**Key Code Sections:**

1. **Building Definition (line 531)**
   ```javascript
   haymill: { name: 'Hay Mill', ic: '🌾', cat: 'biz', cost: 85, desc: 'Play the Hay Harvest game to earn bonus 🪙. Once per day!' }
   ```

2. **Game Logic (lines 1166-1300)**
   - `startHayHarvest()` - Initiates the game and validates daily cooldown
   - `updateHayGame()` - Updates hay physics and scores
   - `renderHayGame()` - Draws the game canvas
   - `collectHay()` - Handles player clicks
   - `endHayHarvest()` - Completes the game and awards coins

3. **UI Integration (line 1384)**
   - Building panel shows "Play Game" button when Hay Mill is selected
   - Mini-game modal overlay (lines 4872-4884)
   - Responsive design with stats display

### Game Mechanics

**Hay Physics:**
- Hay starts at the top of the screen
- Falls with random vertical velocity (60-100 pixels/second)
- Drifts horizontally with random velocity
- Disappears if it reaches the bottom without being collected

**Scoring:**
- Maximum 15 hay items per game
- Each collected item = 1 point
- Reward calculation: `score * (50 / 15)`
- Rewards are instant and automatically saved

**Cooldown System:**
- `minigameLastPlay` tracks the last time played
- 24-hour cooldown enforced between games
- Cool message if played too recently: "You already played today! Come back tomorrow."

## How to Play

1. Build a **Hay Mill** for 85 🪙 in your town
2. Click on the Hay Mill building to select it
3. A panel appears showing building details
4. Click the "▶ Play Game" button
5. The Hay Harvest mini-game modal opens
6. Click "Start Game" to begin
7. Click on falling hay items to collect them
8. When time runs out, your reward is calculated and awarded
9. Come back tomorrow to play again!

## Future Enhancements

Potential additions:
- Difficulty levels (easy/normal/hard)
- Leaderboard tracking high scores per town
- Power-ups (slow time, double points)
- Different hay types with varying point values
- Mini-games for other buildings (Veggie Market, Sushi Spot, etc.)
- Achievements/badges for consistent play

## Testing Notes

- Game initializes on app load via `initMiniGame()`
- Canvas dimensions: 450x240 pixels
- 60 FPS game loop (16ms updates)
- Sounds: Uses existing `sfx('coin')` and `sfx('goal')` effects
- Saves game progress and rewards to town file
