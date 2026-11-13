# 🔐 Pig City Account System

A unified authentication and cloud sync system for Pig City that works across web, desktop, and developer builds.

---

## Overview

### Problem Solved
Previously, your progress was trapped on each device:
- 🖥️ **Web version** saves in browser localStorage
- 💻 **Mac app** saves locally in Application Support
- 🔧 **Dev builds** save in separate localStorage
- ❌ **No sync between platforms**

### Solution
The Account System creates a **unified account** that:
- ✅ Syncs across all platforms automatically
- ✅ Keeps all saves in the cloud (Supabase)
- ✅ Works offline (syncs when back online)
- ✅ Allows switching between devices seamlessly
- ✅ Preserves version history of your saves

---

## Architecture

### Components

#### 1. **account-system.js** (Core)
The main authentication and sync engine:
- Email sign-in (via Supabase)
- Session management
- Cloud sync
- Local fallback (when offline)
- Cross-device game loading

#### 2. **account-ui.js** (UI Integration)
User-facing features:
- Sign-in dialog
- Account panel with stats
- Account button in header
- Save manager
- Sync status indicators

#### 3. **Supabase Backend** (Cloud)
Database tables:
- `players` - User accounts
- `player_games` - Saved games per player/platform
- `player_stats` - Achievements and statistics
- `game_save_history` - Version control for saves
- `player_devices` - Device tracking for cross-device sync
- `sync_logs` - Audit trail of all syncs

---

## How It Works

### Web Version (pigcity.github.io)

1. **Sign In**
   - Click "👤 Sign in" button in header
   - Enter your email
   - Receive sign-in link via email
   - Click link to authenticate

2. **Auto-Sync**
   - Game saves every 5 seconds (existing behavior)
   - Account system syncs to cloud every 30 seconds
   - Each sync updates: pig count, building count, coins, game state

3. **Load on Another Device**
   - Sign in on new device with same email
   - System detects cloud save
   - Prompts: "Load your town from [other-device]?"
   - Your progress is available immediately

### Mac Desktop App

1. **Local-First**
   - Saves locally as before (no network access due to sandbox)
   - When signed in, syncs when app requests network permission

2. **Cross-Platform Sync**
   - Desktop version can pull web version when online
   - Web version can pull desktop version when desktop uploaded

### Developer Builds

1. **Development Mode**
   - Works just like web version
   - Can use test account or local-only mode
   - Sync logs available in console

---

## Features

### Cross-Device Sync

#### Auto-Sync
- Every 30 seconds (when online)
- Syncs entire game state, pig data, buildings, progress
- Handles offline periods gracefully
- Resume exactly where you left off

#### Conflict Resolution
When the same account is logged in on multiple devices:
- **Last-write-wins** strategy
- Device that saved more recently takes precedence
- Both versions kept in history (you can restore old version)
- User is notified if conflict occurs

#### Manual Sync
- Force sync by clicking account button → "Sync now"
- Useful after intensive play sessions
- Shows status: "Syncing...", "Synced", or "Offline"

### Save Management

#### Multiple Saves
- Keep separate towns per account
- Each town is separate save file
- Can load any save to a specific platform
- Cloud stores all versions

#### Save History
- Every save is versioned
- Keep last 50 versions per game
- Restore old saves if you make a mistake
- See what changed in each version

### Statistics Tracking

The system automatically tracks:
- 🐹 Total pigs raised across all games
- 🏠 Total buildings built
- 🪙 Total coins earned
- ⏱️ Total play time
- 🏆 Achievements unlocked
- 💍 Marriages arranged
- 🌍 Islands created
- 📊 Highest population reached

Access stats by clicking account button → see your stats panel

### Device Management

#### Track Devices
- See all devices logged into your account
- Device names (Desktop, iPad, Chrome, etc.)
- Last login time for each device
- Sign out specific devices remotely

#### Security
- Session tokens stored securely
- No passwords stored (email-only authentication)
- Can revoke access to any device
- Login activity audit trail

---

## User Guide

### Setting Up Your Account

#### Step 1: Sign In
1. Click **"👤 Sign in"** button in the header
2. Enter your email address
3. Check your email for sign-in link
4. Click the link - you're signed in!

#### Step 2: First Sync
- Your current game is synced to the cloud immediately
- Shows "Saved to cloud" toast notification
- Syncs automatically every 30 seconds after that

#### Step 3: Play on Other Devices
1. Open Pig City on another device
2. Click "👤 Sign in" and use same email
3. Game detects your cloud save
4. Prompts: "Load your town from web? (50 pigs, 25 buildings)"
5. Click "Yes" to load - your progress appears!

### Managing Your Account

#### View Account Info
1. Click **"👤 [your-name]"** (header button)
2. See:
   - Your email
   - Current device
   - Last sync time
   - Current save stats (pigs, buildings, coins)

#### Sign Out
1. Click account button
2. Click "Sign out"
3. Game saves locally until you sign back in

#### Switch Saves
1. If you have multiple towns:
   - Click account button
   - See "Your Saves" section
   - Choose which one to load

### Troubleshooting

#### "Sign-in link didn't arrive"
- Check spam folder
- Make sure you entered email correctly
- Try signing in again (new link)

#### "I'm offline, will my progress be lost?"
- **No!** Game saves locally
- When you reconnect, it syncs automatically
- Shows "Offline" status in account button

#### "My progress isn't syncing"
- Check network connection
- Click account button → "Sync now"
- Check console (F12 → Console) for error messages
- Restart game if sync still doesn't work

#### "I have conflicting saves"
- System keeps newest version automatically
- Old version stays in history
- If you prefer the old one, contact support to restore

#### "I want to play different towns on different devices"
- You can! Keep them signed in separately
- Each device will sync its own town
- When you sign in with same account, choose which to load

---

## For Developers

### Setup Supabase

1. **Create Supabase Project**
   - Go to supabase.com
   - Create new project
   - Copy Project URL and Anon Key

2. **Run Database Migrations**
   - Open Supabase SQL editor
   - Copy contents of `supabase/migrations/20261105000000_account_system.sql`
   - Paste and run
   - Tables are created with RLS policies

3. **Configure Auth**
   - Supabase → Authentication → Providers
   - Enable "Email" provider
   - Copy redirect URL from AccountSystem.SUPABASE_URL
   - Set email templates (optional, use defaults)

4. **Update Configuration**
   - In `account-system.js`, line 15-16:
   ```javascript
   SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',
   SUPABASE_KEY: 'YOUR_ANON_KEY',
   ```

### Testing Locally

```bash
# Test account system without deploying
npm start  # Runs electron dev app

# Monitor sync in console
# Open Dev Tools: Cmd+Option+I
# Filter console for '[Account]' messages
```

### API Reference

#### AccountSystem.signIn(email)
Sign in with email address
```javascript
const result = await AccountSystem.signIn('user@example.com');
// Returns: { success: true, message: "Check your email..." }
```

#### AccountSystem.logout()
Sign out current user
```javascript
await AccountSystem.logout();
```

#### AccountSystem.syncProgress()
Manually sync game to cloud
```javascript
await AccountSystem.syncProgress();
// Updates cloud with current G (game state)
```

#### AccountSystem.loadProgress(platform)
Load save from specific platform
```javascript
const save = await AccountSystem.loadProgress('desktop');
// Returns: { state, pig_count, coin_total, ... }
```

#### AccountSystem.listSaves()
List all saves for current user
```javascript
const saves = await AccountSystem.listSaves();
// Returns: Array of save objects
```

#### AccountSystem.getStats()
Get player statistics
```javascript
const stats = await AccountSystem.getStats();
// Returns: { total_pigs_raised, total_buildings_built, achievements, ... }
```

#### AccountUI.loadFromPlatform(platform)
UI helper to load from specific platform
```javascript
await AccountUI.loadFromPlatform('desktop');
// Shows confirmation dialog and loads if confirmed
```

### Database Schema

Key tables:

**players**
```
id (UUID, from auth)
email (TEXT, unique)
settings (JSONB)
preferences (JSONB)
last_login (TIMESTAMP)
login_count (INT)
```

**player_games**
```
id (UUID)
player_id (UUID)
email (TEXT)
name (TEXT) - Town name
state (JSONB) - Full game state
platform (TEXT) - 'web', 'desktop', 'mobile'
pig_count (INT)
building_count (INT)
coin_total (BIGINT)
last_played (TIMESTAMP)
```

**player_stats**
```
player_id (UUID, unique)
total_pigs_raised (INT)
total_buildings_built (INT)
total_coins_earned (BIGINT)
achievements (JSONB) - Array of achievement IDs
marriages_arranged (INT)
islands_created (INT)
```

All tables have RLS policies that ensure users can only access their own data.

### Security Considerations

1. **Row-Level Security (RLS)**
   - Every user can only read/write their own data
   - Enforced at database level
   - No data leakage possible

2. **Authentication**
   - Email-only (magic links)
   - No password storage
   - Supabase handles secure tokens

3. **Data Encryption**
   - Game state stored as JSONB
   - No sensitive player info
   - Transmitted over HTTPS

4. **Rate Limiting**
   - Supabase includes rate limiting
   - Max 30 save attempts per minute
   - Prevents spam/abuse

### Monitoring & Debugging

#### Console Logs
All account system actions are logged:
```javascript
[Account] Restored user session: lexi@example.com
[Account] Progress synced to cloud
[Account] Online - syncing progress
[Account] Offline - saving locally
```

#### Sync Logs
View sync history in database:
```sql
SELECT * FROM sync_logs WHERE player_id = '{user_id}'
ORDER BY created_at DESC LIMIT 20;
```

#### Error Handling
All errors caught and reported:
```javascript
// Console shows: '[Account] Error message'
// User sees toast: 'Cloud save failed. Trying again soon.'
```

---

## Roadmap

### v1.0 (Current)
- ✅ Email authentication
- ✅ Auto-sync to cloud
- ✅ Cross-device loading
- ✅ Offline support
- ✅ Save history

### v1.1 (Next)
- [ ] Multiple save slots per account
- [ ] Game sharing (invite friends)
- [ ] Leaderboards
- [ ] Social features

### v1.2 (Future)
- [ ] GitHub account sign-in
- [ ] Two-factor authentication
- [ ] Account recovery
- [ ] Device management UI

---

## FAQ

**Q: Do I have to sign in?**  
A: No! Game works fine without an account. But you won't sync across devices.

**Q: Is my email stored?**  
A: Only in Supabase for authentication. No third-party tracking.

**Q: What if I forget my password?**  
A: There's no password! Just sign in with email again, you'll get a new link.

**Q: Can I share my town with friends?**  
A: Not yet, but it's coming in v1.1!

**Q: Does desktop app sync with web?**  
A: Only when app is online. Desktop saves locally, syncs when granted network access.

**Q: What happens if I'm on two devices at once?**  
A: Most recent save wins. Both versions kept in history.

**Q: Can I delete my account?**  
A: Contact support. We can delete all your data and save files.

---

## Support

Issues? Questions? Check:
1. [IMPLEMENTATION_STATUS.md](./IMPLEMENTATION_STATUS.md) - Technical details
2. GitHub Issues - Report bugs
3. Email support@pigcity.game

---

**Your Pig City progress is now safe and portable! 🐹☁️**
