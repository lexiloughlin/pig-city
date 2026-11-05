# 🚀 Account System Setup Guide

Quick start guide to enable the Account System in Pig City.

---

## Prerequisites

✅ Supabase account (already created at mrbmybiwxayhhneixdgc.supabase.co)  
✅ GitHub repository access  
✅ Pig City codebase updated with account system files

---

## Step 1: Set Up Database Tables

### Method A: Via Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to: https://app.supabase.com/projects
   - Select your Pig City project

2. **Open SQL Editor**
   - Click "SQL Editor" in left sidebar
   - Click "+ New Query"

3. **Copy Database Schema**
   - Open file: `supabase/migrations/20261105000000_account_system.sql`
   - Copy entire contents
   - Paste into Supabase SQL editor

4. **Run Query**
   - Click "Run" button (or Cmd+Enter)
   - Wait for all tables to be created
   - Check for green checkmarks (success)

5. **Verify Tables Created**
   - Click "Table Editor" in left sidebar
   - Should see these new tables:
     - `players`
     - `player_games`
     - `player_stats`
     - `game_save_history`
     - `player_devices`
     - `sync_logs`
     - `game_shares`

### Method B: Via Supabase CLI

```bash
# Navigate to project
cd "/Users/lexiloughlin/pig city/pig-city"

# Run migration
supabase db push
# (Requires supabase CLI installed)
```

---

## Step 2: Configure Authentication

### Email Authentication Setup

1. **Go to Authentication Settings**
   - Supabase Dashboard → Authentication
   - Click "Providers" in left sidebar
   - Find "Email" provider

2. **Enable Email**
   - Toggle on "Email Provider"
   - Leave default settings (they work fine)

3. **Configure Email Templates** (Optional)
   - Still in Email provider settings
   - Click "Email Templates"
   - Customize sign-in email if desired
   - Default templates are fine

4. **Set Redirect URL**
   - In Email provider settings, find "Redirect URL"
   - Add your URLs:
     - Web: `https://lexiloughlin.github.io/pig-city/`
     - Desktop app: `http://localhost:3000/` (for dev)
   - Save changes

---

## Step 3: Verify API Keys

### Get Project Credentials

1. **Go to Project Settings**
   - Supabase Dashboard → Settings
   - Click "API" in left sidebar

2. **Copy Keys** (They're already in code, but verify)
   - Find "Project URL" → Copy it
   - Find "Anon Key" (under "Public/Anon") → Copy it

3. **Update account-system.js (if different)**
   - Open `account-system.js`
   - Line ~15-16, update if needed:
   ```javascript
   SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',
   SUPABASE_KEY: 'YOUR_ANON_KEY',
   ```

4. **Verify in index.html**
   - CSP header already includes Supabase URL
   - Should have: `connect-src https://mrbmybiwxayhhneixdgc.supabase.co`

---

## Step 4: Test in Development

### Local Testing

1. **Start Dev Server**
   ```bash
   cd "/Users/lexiloughlin/pig city/pig-city"
   npm start  # or your dev command
   ```

2. **Test Sign-In Flow**
   - Open game in browser/app
   - Click "👤 Sign in" button
   - Enter your test email
   - Check email inbox for sign-in link
   - Click link
   - Should redirect and sign you in

3. **Verify Sync**
   - Open browser console (F12)
   - Look for "[Account]" log messages
   - Should show: "Progress synced to cloud"

4. **Check Database**
   - Supabase → Table Editor
   - Click `players` table
   - Should see your test user
   - Click `player_games` table
   - Should see your save file

### Troubleshooting Local Test

**Sign-in link not arriving:**
- Check spam folder
- Verify email address is correct
- Check Supabase email logs (Authentication → Logs)

**Sync not working:**
- Check browser console for errors
- Verify API keys are correct
- Check Supabase project is active

**Database tables not appearing:**
- Refresh page (F5)
- Check SQL execution for errors
- Verify RLS policies created

---

## Step 5: Deploy to Production

### Web Version (pigcity.github.io)

1. **Commit Changes**
   ```bash
   git add account-system.js account-ui.js ACCOUNT_SYSTEM_GUIDE.md
   git commit -m "Add account system for cloud sync"
   git push origin main
   ```

2. **GitHub Pages Deploy**
   - GitHub automatically deploys from main branch
   - Wait 2-3 minutes for build
   - Visit https://lexiloughlin.github.io/pig-city/

3. **Test Live**
   - Click "👤 Sign in"
   - Sign in with email
   - Play for a bit
   - Check Supabase tables - save should appear

### Mac App Version

1. **Build App with Account System**
   ```bash
   npm run dist:dev  # or your build command
   ```

2. **Test Desktop Sync**
   - Sign in on desktop app
   - Play and create progress
   - When online, should sync to cloud
   - Check Supabase for save marked as 'desktop'

3. **Test Cross-Device Load**
   - Sign in on web version
   - See prompt to load desktop save
   - Load it
   - Desktop progress now available on web

---

## Step 6: Enable Cloud Features

### Optional: Add Social Features

1. **Game Sharing**
   - Open `supabase/migrations/20261105000000_account_system.sql`
   - Already defined: `game_shares` table
   - Can enable share links (coming v1.1)

2. **Leaderboards**
   - Already tracking stats in `player_stats`
   - Can create public leaderboard view

3. **Achievements**
   - Already synced in game
   - Stored in `player_stats.achievements`

---

## Configuration Reference

### account-system.js

Key configuration options (top of file):

```javascript
// Supabase connection
SUPABASE_URL: 'https://mrbmybiwxayhhneixdgc.supabase.co',
SUPABASE_KEY: 'sb_publishable_ftYMUq_X7eiDnKXDb3ac6Q_uZ7Mgbi8',

// Sync interval (ms) - how often to upload to cloud
syncInterval: 30000,  // 30 seconds

// Auto-logout after inactivity (optional)
autoLogoutMinutes: 60,  // Coming in v1.1
```

### account-ui.js

Key UI configuration (top of file):

```javascript
// Button styling
accountBtn.style.fontSize = '15px';
accountBtn.style.padding = '5px 12px';

// These can be customized for your UI
```

---

## Verification Checklist

After setup, verify everything works:

- [ ] Database tables created in Supabase
- [ ] Email authentication enabled
- [ ] Sign-in email sends successfully
- [ ] Sign-in link redirects correctly
- [ ] Account button appears in game header
- [ ] Can sign in from web
- [ ] Can sign in from desktop app
- [ ] Game syncs to cloud every 30 seconds
- [ ] Cross-device load works
- [ ] Save history populated in database
- [ ] Player stats tracked in `player_stats` table
- [ ] Sync logs created when saving

---

## Monitoring in Production

### View Live Syncs

```sql
-- Supabase SQL Editor
SELECT * FROM sync_logs 
ORDER BY created_at DESC 
LIMIT 20;
```

### View Player Activity

```sql
SELECT player_id, email, last_login, login_count 
FROM players 
ORDER BY last_login DESC;
```

### Check Game Saves

```sql
SELECT email, platform, pig_count, last_played 
FROM player_games 
ORDER BY last_played DESC 
LIMIT 50;
```

### Monitor Errors

```sql
-- Games with sync failures
SELECT * FROM sync_logs 
WHERE status = 'failed' 
ORDER BY created_at DESC;
```

---

## Support & Troubleshooting

### Common Issues

**"Sign-in links not sending"**
- Check Supabase Email Logs (Authentication → Logs)
- Verify email provider configured
- Check spam filters

**"Sync not working"**
- Check network connection
- Verify RLS policies applied
- Check Supabase API status

**"Cross-device load shows no saves"**
- Verify both devices signed in with same email
- Check `player_games` table has entries for both platforms
- Try manual sync on source device first

**"Mac app can't sync"**
- Desktop app sandboxed, requires network permission
- Check System Preferences → Security & Privacy
- Restart app

### Debug Mode

Enable detailed logging:

```javascript
// In browser console, paste:
localStorage.setItem('pigcity-debug', 'true');
location.reload();

// Now all account actions log in console
```

### Getting Help

1. Check browser console for errors (F12)
2. Check Supabase logs for sync failures
3. Try force sync: click account button → Sync now
4. Export game as backup before major operations
5. Report issues with: email, error message, screenshot

---

## Next Steps

Once account system is running:

1. **Monitor** - Check sync logs regularly
2. **Test** - Have beta testers try cross-device sync
3. **Collect Feedback** - Get user feedback on UX
4. **Plan v1.1** - Multiple save slots, sharing, leaderboards
5. **Scale** - Monitor performance as user base grows

---

## Rollback Plan

If you need to disable the account system:

1. **Remove scripts from index.html:**
   ```html
   <!-- Delete these lines: -->
   <script src="account-system.js"></script>
   <script src="account-ui.js"></script>
   ```

2. **Game reverts to local save only**
   - All existing localStorage saves still work
   - Cloud saves can be re-enabled later
   - No data loss

3. **Keep database for later:**
   - Don't delete tables until sure
   - Keep all player data for future restoration

---

## Success! 🎉

Your Pig City account system is now active. Players can:

✅ Sign in with email  
✅ Auto-sync progress to cloud  
✅ Play on web and desktop  
✅ Load progress between devices  
✅ Keep save history  
✅ Track achievements  
✅ See stats  

**Happy syncing!** 🐹☁️
