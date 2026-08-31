-- Add preferred_workout_time to profiles for onboarding data capture.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS preferred_workout_time text;
