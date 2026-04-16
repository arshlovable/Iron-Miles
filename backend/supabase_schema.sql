-- ============================================================
-- Iron Miles v1 — Minimum Viable Schema
-- Run this in Supabase Dashboard → SQL Editor → New Query
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  auth_user_id UUID UNIQUE,
  full_name TEXT,
  primary_goal TEXT,
  experience_level TEXT,
  truck_type TEXT,
  available_equipment JSONB DEFAULT '[]'::jsonb,
  pain_areas JSONB DEFAULT '[]'::jsonb,
  lifetime_iron_miles INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. EXERCISES (master library)
CREATE TABLE IF NOT EXISTS exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  equipment_type TEXT NOT NULL DEFAULT 'bodyweight',
  workout_style TEXT,
  sets_default INTEGER,
  reps_default TEXT,
  instruction_text TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. GENERATED WORKOUTS
CREATE TABLE IF NOT EXISTS generated_workouts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  target_area TEXT NOT NULL,
  equipment_selected JSONB DEFAULT '[]'::jsonb,
  duration_minutes INTEGER NOT NULL,
  workout_style TEXT,
  iron_miles_reward INTEGER DEFAULT 0,
  status TEXT DEFAULT 'ready',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. GENERATED WORKOUT EXERCISES (join table)
CREATE TABLE IF NOT EXISTS generated_workout_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  generated_workout_id UUID NOT NULL REFERENCES generated_workouts(id) ON DELETE CASCADE,
  exercise_id UUID NOT NULL REFERENCES exercises(id) ON DELETE CASCADE,
  exercise_order INTEGER NOT NULL,
  sets_assigned INTEGER,
  reps_assigned TEXT,
  instruction_override TEXT
);

-- 5. WORKOUT SESSIONS (execution tracking)
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  generated_workout_id UUID REFERENCES generated_workouts(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'started',
  iron_miles_earned INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. IRON MILES LOG (transaction history)
CREATE TABLE IF NOT EXISTS iron_miles_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  source_type TEXT NOT NULL,
  source_id UUID,
  miles_amount INTEGER NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_exercises_category ON exercises(category);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment ON exercises(equipment_type);
CREATE INDEX IF NOT EXISTS idx_generated_workouts_user ON generated_workouts(user_id);
CREATE INDEX IF NOT EXISTS idx_generated_workouts_status ON generated_workouts(status);
CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout ON generated_workout_exercises(generated_workout_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_user ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_status ON workout_sessions(status);
CREATE INDEX IF NOT EXISTS idx_iron_miles_log_user ON iron_miles_log(user_id);
CREATE INDEX IF NOT EXISTS idx_iron_miles_log_source ON iron_miles_log(source_type);

-- Helper function to auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
