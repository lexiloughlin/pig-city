-- Pig City Account System Database Schema
-- Run this in Supabase SQL editor to set up the account system

-- Player accounts table (extends Supabase auth)
CREATE TABLE IF NOT EXISTS players (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  settings JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{
    "notifications": true,
    "sound": true,
    "difficulty": "normal",
    "theme": "light"
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  login_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Player games/saves table
CREATE TABLE IF NOT EXISTS player_games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT DEFAULT 'My Town',
  description TEXT,
  state JSONB NOT NULL,  -- Complete game state
  platform TEXT NOT NULL DEFAULT 'web',  -- web, desktop, mobile, dev
  app_version TEXT DEFAULT '1.0.0',
  pig_count INT DEFAULT 0,
  building_count INT DEFAULT 0,
  coin_total BIGINT DEFAULT 0,
  play_time_minutes INT DEFAULT 0,
  game_progress_percent INT DEFAULT 0,
  achievements_unlocked INT DEFAULT 0,
  last_played TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, name)
);

-- Player statistics and achievements
CREATE TABLE IF NOT EXISTS player_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL UNIQUE REFERENCES players(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  total_games_created INT DEFAULT 0,
  total_games_deleted INT DEFAULT 0,
  total_pigs_raised INT DEFAULT 0,
  total_buildings_built INT DEFAULT 0,
  total_coins_earned BIGINT DEFAULT 0,
  total_minutes_played INT DEFAULT 0,
  games_exported INT DEFAULT 0,
  games_imported INT DEFAULT 0,
  achievements JSONB DEFAULT '[]',  -- Array of achieved IDs
  challenges_completed INT DEFAULT 0,
  marriages_arranged INT DEFAULT 0,
  islands_created INT DEFAULT 0,
  highest_population INT DEFAULT 0,
  favorite_building TEXT,
  favorite_pig TEXT,
  preferred_platform TEXT DEFAULT 'web',
  play_sessions INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Game save history (for version control)
CREATE TABLE IF NOT EXISTS game_save_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES player_games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL,
  version INT NOT NULL DEFAULT 1,
  state JSONB NOT NULL,
  change_summary TEXT,
  platform TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Device/session tracking (for cross-device sync)
CREATE TABLE IF NOT EXISTS player_devices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  device_name TEXT,
  device_type TEXT,  -- web, desktop, mobile
  os TEXT,  -- Windows, macOS, iOS, Android, Web
  browser TEXT,
  ip_address TEXT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(player_id, device_id)
);

-- Cross-device sync logs
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  device_id TEXT,
  game_id UUID,
  action TEXT,  -- 'push', 'pull', 'conflict', 'merge'
  source_device TEXT,
  target_device TEXT,
  status TEXT,  -- 'success', 'failed', 'conflict'
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Invite/sharing system
CREATE TABLE IF NOT EXISTS game_shares (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES player_games(id) ON DELETE CASCADE,
  owner_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  shared_with_email TEXT,
  share_type TEXT DEFAULT 'view',  -- view, edit, fork
  share_token TEXT UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_save_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for players table
CREATE POLICY "Users can view their own profile"
  ON players FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON players FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for player_games table
CREATE POLICY "Users can view their own games"
  ON player_games FOR SELECT
  USING (player_id = auth.uid());

CREATE POLICY "Users can insert their own games"
  ON player_games FOR INSERT
  WITH CHECK (player_id = auth.uid());

CREATE POLICY "Users can update their own games"
  ON player_games FOR UPDATE
  USING (player_id = auth.uid());

CREATE POLICY "Users can delete their own games"
  ON player_games FOR DELETE
  USING (player_id = auth.uid());

-- RLS Policies for player_stats table
CREATE POLICY "Users can view their own stats"
  ON player_stats FOR SELECT
  USING (player_id = auth.uid());

CREATE POLICY "Users can update their own stats"
  ON player_stats FOR UPDATE
  USING (player_id = auth.uid());

-- RLS Policies for sync_logs
CREATE POLICY "Users can view their own sync logs"
  ON sync_logs FOR SELECT
  USING (player_id = auth.uid());

CREATE POLICY "Users can insert their own sync logs"
  ON sync_logs FOR INSERT
  WITH CHECK (player_id = auth.uid());

-- RLS Policies for devices
CREATE POLICY "Users can view their own devices"
  ON player_devices FOR SELECT
  USING (player_id = auth.uid());

CREATE POLICY "Users can update their own devices"
  ON player_devices FOR UPDATE
  USING (player_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_player_games_player_id ON player_games(player_id);
CREATE INDEX idx_player_games_email ON player_games(email);
CREATE INDEX idx_player_games_last_played ON player_games(last_played DESC);
CREATE INDEX idx_player_stats_player_id ON player_stats(player_id);
CREATE INDEX idx_game_save_history_game_id ON game_save_history(game_id);
CREATE INDEX idx_sync_logs_player_id ON sync_logs(player_id);
CREATE INDEX idx_player_devices_player_id ON player_devices(player_id);
CREATE INDEX idx_game_shares_token ON game_shares(share_token);

-- Create functions for auto-update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers for auto-updated_at
CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_games_updated_at BEFORE UPDATE ON player_games
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_player_stats_updated_at BEFORE UPDATE ON player_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to auto-update login info
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE players SET last_login = NOW(), login_count = login_count + 1
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment documentation
COMMENT ON TABLE players IS 'Player account information, linked to Supabase auth';
COMMENT ON TABLE player_games IS 'Saved games per player, supports multiple platforms';
COMMENT ON TABLE player_stats IS 'Aggregated player statistics and achievements';
COMMENT ON TABLE game_save_history IS 'Version history for game saves';
COMMENT ON TABLE player_devices IS 'Devices used by player for cross-device sync';
COMMENT ON TABLE sync_logs IS 'Log of sync operations between devices';
