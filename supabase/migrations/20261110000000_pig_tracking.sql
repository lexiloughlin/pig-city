-- Pig City Pig Tracking Database Schema
-- Tracks detailed information about each pig for analytics and mod support
-- Run this in Supabase SQL editor to set up pig tracking

-- Main pigs table - stores comprehensive pig data
CREATE TABLE IF NOT EXISTS pigs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES player_games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  
  -- Basic Information
  name TEXT NOT NULL,
  age_in_days INT DEFAULT 0,
  birth_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  skin TEXT,  -- Appearance/genetics
  
  -- Personality & Traits (stored as JSON from game)
  personality JSONB,  -- { trait_1, trait_2, trait_3, ... }
  favorite_snack TEXT,
  best_friend_id UUID,  -- Reference to another pig
  birthday INT DEFAULT 0,  -- Day of year
  
  -- Employment
  job TEXT,  -- null, 'cafe', 'salon', 'toy', 'masaki'
  workplace_id UUID,  -- Reference to building in game
  salary_per_shift INT DEFAULT 0,
  shifts_worked INT DEFAULT 0,
  current_shift_status TEXT DEFAULT 'idle',  -- idle, working, resting
  
  -- Statistics
  happiness_level INT DEFAULT 50,  -- 0-100
  happiness_history JSONB DEFAULT '[]',  -- Array of {timestamp, value}
  earnings_total BIGINT DEFAULT 0,
  earnings_today BIGINT DEFAULT 0,
  treats_received INT DEFAULT 0,
  
  -- Home & Living
  home_building_id UUID,  -- Which hutch they live in
  home_room_name TEXT,  -- Which room in the building
  
  -- Inventory & Furniture
  owned_furniture JSONB DEFAULT '[]',  -- Array of furniture IDs
  favorite_furniture TEXT,
  bedding_type TEXT,  -- decorative
  home_decor_items JSONB DEFAULT '[]',  -- Array of decor items
  
  -- Investments/Assets
  stocks_owned JSONB DEFAULT '{}',  -- { building_type: amount, ... }
  investment_total BIGINT DEFAULT 0,
  dividends_received BIGINT DEFAULT 0,
  
  -- Social & Relationships
  family_members JSONB DEFAULT '[]',  -- Array of pig IDs (parents, siblings)
  offspring JSONB DEFAULT '[]',  -- Array of pig IDs
  is_married BOOLEAN DEFAULT false,
  spouse_id UUID,
  marriage_date TIMESTAMP WITH TIME ZONE,
  
  -- Status
  health_status TEXT DEFAULT 'healthy',  -- healthy, sick, injured, recovering
  last_fed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_watered TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_petted TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Activity Tracking
  last_location TEXT,  -- where they were last seen
  location_history JSONB DEFAULT '[]',  -- Recent locations: [{time, location}, ...]
  activities JSONB DEFAULT '[]',  -- What they're doing
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(game_id, name)  -- Pig names are unique per game
);

-- Pig achievements & milestones
CREATE TABLE IF NOT EXISTS pig_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pig_id UUID NOT NULL REFERENCES pigs(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES player_games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  
  achievement_type TEXT NOT NULL,  -- 'promotion', 'birthday', 'marriage', 'milestone', 'award'
  title TEXT NOT NULL,
  description TEXT,
  reward_coins INT DEFAULT 0,
  achieved_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pig health log
CREATE TABLE IF NOT EXISTS pig_health_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pig_id UUID NOT NULL REFERENCES pigs(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES player_games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  
  health_status TEXT,
  condition TEXT,  -- sick, injured, tired, hungry, thirsty, happy, sad
  treatment_given TEXT,  -- food, medicine, rest, pet, treat
  treatment_effective BOOLEAN,
  notes TEXT,
  
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pig productivity log (for work tracking)
CREATE TABLE IF NOT EXISTS pig_work_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pig_id UUID NOT NULL REFERENCES pigs(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES player_games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  
  workplace_type TEXT NOT NULL,  -- cafe, salon, toy, masaki
  shift_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  shift_end TIMESTAMP WITH TIME ZONE,
  earnings INT DEFAULT 0,
  customers_served INT DEFAULT 0,
  efficiency_percent INT DEFAULT 100,
  shift_mood TEXT,  -- happy, neutral, tired, grumpy
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pig meal & care tracking
CREATE TABLE IF NOT EXISTS pig_care_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pig_id UUID NOT NULL REFERENCES pigs(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES player_games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  
  care_type TEXT NOT NULL,  -- 'fed', 'watered', 'petted', 'treat', 'groomed', 'played_with'
  food_type TEXT,  -- hay, grain, snack name, etc.
  location TEXT,
  pig_happiness_before INT,
  pig_happiness_after INT,
  
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pig genealogy (for breeding purposes)
CREATE TABLE IF NOT EXISTS pig_genealogy (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pig_id UUID NOT NULL REFERENCES pigs(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES player_games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  
  parent_1_id UUID REFERENCES pigs(id) ON DELETE SET NULL,
  parent_2_id UUID REFERENCES pigs(id) ON DELETE SET NULL,
  generation INT DEFAULT 1,
  breed_characteristics JSONB,  -- Inherited traits
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Pig-to-building relationships (for tracking where pigs work/live)
CREATE TABLE IF NOT EXISTS pig_building_relationships (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pig_id UUID NOT NULL REFERENCES pigs(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES player_games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  
  building_type TEXT NOT NULL,  -- hutch, cafe, salon, toy, masaki, etc
  building_game_id TEXT NOT NULL,  -- Game's internal building ID
  relationship_type TEXT NOT NULL,  -- 'home', 'workplace', 'visited'
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  
  UNIQUE(pig_id, building_game_id, relationship_type)
);

-- Pig statistics snapshots (for historical tracking)
CREATE TABLE IF NOT EXISTS pig_statistics_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pig_id UUID NOT NULL REFERENCES pigs(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES player_games(id) ON DELETE CASCADE,
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  
  -- Snapshot of key stats at a point in time
  happiness INT,
  earnings_total BIGINT,
  earnings_today BIGINT,
  treats_received INT,
  shifts_worked INT,
  age_in_days INT,
  health_status TEXT,
  
  snapshot_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE pigs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pig_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE pig_health_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pig_work_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pig_care_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE pig_genealogy ENABLE ROW LEVEL SECURITY;
ALTER TABLE pig_building_relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE pig_statistics_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for pigs table
CREATE POLICY "Users can view pigs in their games"
  ON pigs FOR SELECT
  USING (player_id = auth.uid());

CREATE POLICY "Users can insert pigs in their games"
  ON pigs FOR INSERT
  WITH CHECK (player_id = auth.uid());

CREATE POLICY "Users can update their pigs"
  ON pigs FOR UPDATE
  USING (player_id = auth.uid());

CREATE POLICY "Users can delete their pigs"
  ON pigs FOR DELETE
  USING (player_id = auth.uid());

-- RLS Policies for pig_achievements
CREATE POLICY "Users can view pig achievements"
  ON pig_achievements FOR SELECT
  USING (player_id = auth.uid());

CREATE POLICY "Users can insert pig achievements"
  ON pig_achievements FOR INSERT
  WITH CHECK (player_id = auth.uid());

-- RLS Policies for pig_health_log
CREATE POLICY "Users can view pig health logs"
  ON pig_health_log FOR SELECT
  USING (player_id = auth.uid());

CREATE POLICY "Users can insert pig health logs"
  ON pig_health_log FOR INSERT
  WITH CHECK (player_id = auth.uid());

-- RLS Policies for pig_work_log
CREATE POLICY "Users can view pig work logs"
  ON pig_work_log FOR SELECT
  USING (player_id = auth.uid());

CREATE POLICY "Users can insert pig work logs"
  ON pig_work_log FOR INSERT
  WITH CHECK (player_id = auth.uid());

-- RLS Policies for pig_care_log
CREATE POLICY "Users can view pig care logs"
  ON pig_care_log FOR SELECT
  USING (player_id = auth.uid());

CREATE POLICY "Users can insert pig care logs"
  ON pig_care_log FOR INSERT
  WITH CHECK (player_id = auth.uid());

-- RLS Policies for pig_genealogy
CREATE POLICY "Users can view pig genealogy"
  ON pig_genealogy FOR SELECT
  USING (player_id = auth.uid());

CREATE POLICY "Users can insert pig genealogy"
  ON pig_genealogy FOR INSERT
  WITH CHECK (player_id = auth.uid());

-- RLS Policies for pig_building_relationships
CREATE POLICY "Users can view pig building relationships"
  ON pig_building_relationships FOR SELECT
  USING (player_id = auth.uid());

CREATE POLICY "Users can insert pig building relationships"
  ON pig_building_relationships FOR INSERT
  WITH CHECK (player_id = auth.uid());

-- RLS Policies for pig_statistics_history
CREATE POLICY "Users can view pig statistics history"
  ON pig_statistics_history FOR SELECT
  USING (player_id = auth.uid());

CREATE POLICY "Users can insert pig statistics history"
  ON pig_statistics_history FOR INSERT
  WITH CHECK (player_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_pigs_game_id ON pigs(game_id);
CREATE INDEX idx_pigs_player_id ON pigs(player_id);
CREATE INDEX idx_pigs_name ON pigs(name);
CREATE INDEX idx_pigs_job ON pigs(job);
CREATE INDEX idx_pigs_health ON pigs(health_status);
CREATE INDEX idx_pig_achievements_pig_id ON pig_achievements(pig_id);
CREATE INDEX idx_pig_achievements_game_id ON pig_achievements(game_id);
CREATE INDEX idx_pig_achievements_type ON pig_achievements(achievement_type);
CREATE INDEX idx_pig_health_log_pig_id ON pig_health_log(pig_id);
CREATE INDEX idx_pig_health_log_status ON pig_health_log(health_status);
CREATE INDEX idx_pig_work_log_pig_id ON pig_work_log(pig_id);
CREATE INDEX idx_pig_work_log_shift_start ON pig_work_log(shift_start);
CREATE INDEX idx_pig_care_log_pig_id ON pig_care_log(pig_id);
CREATE INDEX idx_pig_care_log_type ON pig_care_log(care_type);
CREATE INDEX idx_pig_genealogy_pig_id ON pig_genealogy(pig_id);
CREATE INDEX idx_pig_genealogy_parent_1 ON pig_genealogy(parent_1_id);
CREATE INDEX idx_pig_genealogy_parent_2 ON pig_genealogy(parent_2_id);
CREATE INDEX idx_pig_building_relationships_pig_id ON pig_building_relationships(pig_id);
CREATE INDEX idx_pig_statistics_history_pig_id ON pig_statistics_history(pig_id);
CREATE INDEX idx_pig_statistics_history_snapshot ON pig_statistics_history(snapshot_date);

-- Create trigger to auto-update timestamp
CREATE TRIGGER update_pigs_updated_at BEFORE UPDATE ON pigs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add table documentation
COMMENT ON TABLE pigs IS 'Main pig data tracking table with comprehensive information about each pig';
COMMENT ON TABLE pig_achievements IS 'Track achievements, milestones, and awards earned by pigs';
COMMENT ON TABLE pig_health_log IS 'Health status history and care records';
COMMENT ON TABLE pig_work_log IS 'Work shifts and productivity tracking';
COMMENT ON TABLE pig_care_log IS 'Daily care activities (feeding, petting, treats)';
COMMENT ON TABLE pig_genealogy IS 'Family trees and breeding information';
COMMENT ON TABLE pig_building_relationships IS 'Track where pigs work, live, and visit';
COMMENT ON TABLE pig_statistics_history IS 'Historical snapshots of pig statistics for trends';

-- Views for common queries
CREATE OR REPLACE VIEW pig_summary AS
  SELECT 
    p.id,
    p.game_id,
    p.player_id,
    p.name,
    p.age_in_days,
    p.job,
    p.happiness_level,
    p.earnings_total,
    p.health_status,
    p.is_married,
    COUNT(DISTINCT pac.id) as care_count,
    COUNT(DISTINCT pwl.id) as shifts_worked_count,
    MAX(pac.recorded_at) as last_care_date,
    MAX(pwl.shift_end) as last_shift_end
  FROM pigs p
  LEFT JOIN pig_care_log pac ON p.id = pac.pig_id
  LEFT JOIN pig_work_log pwl ON p.id = pwl.pig_id
  GROUP BY p.id;

COMMENT ON VIEW pig_summary IS 'Quick summary view of all pigs with key stats and recent activity';
