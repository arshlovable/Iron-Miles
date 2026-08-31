-- Add final 6 active v1 exercises (51–56).
-- Reactivates legacy rows if present; otherwise inserts new active rows.

-- ── Band Bicep curls ──────────────────────────────────────────────────────────
UPDATE public.exercises
SET
  slug = 'band_bicep_curls',
  name = 'Band Bicep Curls',
  category = 'upper_body',
  equipment_type = 'bands',
  workout_style = 'strength',
  is_active = true,
  difficulty_level = 'easy',
  movement_pattern = 'pull',
  sets_default = 3,
  reps_default = '12-15 reps',
  instruction_text =
    'Stand on band, arms at sides. Curl hands toward shoulders. Keep elbows pinned to sides throughout.'
WHERE name IN ('Band Bicep curls', 'Band Bicep Curl', 'Band Bicep Curls')
   OR slug = 'band_bicep_curls';

INSERT INTO public.exercises (
  name, slug, category, equipment_type, workout_style,
  sets_default, reps_default, instruction_text,
  is_active, difficulty_level, movement_pattern
)
SELECT
  'Band Bicep Curls', 'band_bicep_curls', 'upper_body', 'bands', 'strength',
  3, '12-15 reps',
  'Stand on band, arms at sides. Curl hands toward shoulders. Keep elbows pinned to sides throughout.',
  true, 'easy', 'pull'
WHERE NOT EXISTS (SELECT 1 FROM public.exercises e WHERE e.slug = 'band_bicep_curls');

UPDATE public.exercises
SET is_active = false, slug = NULL
WHERE name IN ('Band Bicep Curl', 'Band Bicep Curls')
  AND (slug IS DISTINCT FROM 'band_bicep_curls' OR slug IS NULL);

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id ASC) AS rn
  FROM public.exercises WHERE slug = 'band_bicep_curls'
)
UPDATE public.exercises e SET slug = NULL, is_active = false
FROM ranked r WHERE e.id = r.id AND r.rn > 1;

-- ── Calf Raises ───────────────────────────────────────────────────────────────
UPDATE public.exercises
SET
  slug = 'calf_raises',
  name = 'Calf Raises',
  category = 'lower_body',
  equipment_type = 'bodyweight',
  workout_style = 'burn',
  is_active = true,
  difficulty_level = 'easy',
  movement_pattern = 'calf_raise',
  sets_default = 3,
  reps_default = '20-25 reps',
  instruction_text =
    'Stand tall and rise up onto toes. Brief pause at top. Lower slowly back down. Use truck for balance if needed.'
WHERE name IN ('Calf Raises', 'Standing Calf Raise', 'Calf Raise')
   OR slug = 'calf_raises';

INSERT INTO public.exercises (
  name, slug, category, equipment_type, workout_style,
  sets_default, reps_default, instruction_text,
  is_active, difficulty_level, movement_pattern
)
SELECT
  'Calf Raises', 'calf_raises', 'lower_body', 'bodyweight', 'burn',
  3, '20-25 reps',
  'Stand tall and rise up onto toes. Brief pause at top. Lower slowly back down. Use truck for balance if needed.',
  true, 'easy', 'calf_raise'
WHERE NOT EXISTS (SELECT 1 FROM public.exercises e WHERE e.slug = 'calf_raises');

UPDATE public.exercises
SET is_active = false, slug = NULL
WHERE name IN ('Standing Calf Raise', 'Calf Raise')
  AND (slug IS DISTINCT FROM 'calf_raises' OR slug IS NULL);

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id ASC) AS rn
  FROM public.exercises WHERE slug = 'calf_raises'
)
UPDATE public.exercises e SET slug = NULL, is_active = false
FROM ranked r WHERE e.id = r.id AND r.rn > 1;

-- ── Banded squats ─────────────────────────────────────────────────────────────
UPDATE public.exercises
SET
  slug = 'banded_squats',
  name = 'Banded Squats',
  category = 'lower_body',
  equipment_type = 'bands',
  workout_style = 'strength',
  is_active = true,
  difficulty_level = 'medium',
  movement_pattern = 'squat',
  sets_default = 3,
  reps_default = '12-15 reps',
  instruction_text =
    'Place band just above knees. Squat to depth with knees tracking over toes against band resistance.'
WHERE name IN ('Banded squats', 'Banded Squat')
   OR slug = 'banded_squats';

INSERT INTO public.exercises (
  name, slug, category, equipment_type, workout_style,
  sets_default, reps_default, instruction_text,
  is_active, difficulty_level, movement_pattern
)
SELECT
  'Banded Squats', 'banded_squats', 'lower_body', 'bands', 'strength',
  3, '12-15 reps',
  'Place band just above knees. Squat to depth with knees tracking over toes against band resistance.',
  true, 'medium', 'squat'
WHERE NOT EXISTS (SELECT 1 FROM public.exercises e WHERE e.slug = 'banded_squats');

UPDATE public.exercises
SET is_active = false, slug = NULL
WHERE name IN ('Banded Squat')
  AND (slug IS DISTINCT FROM 'banded_squats' OR slug IS NULL);

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id ASC) AS rn
  FROM public.exercises WHERE slug = 'banded_squats'
)
UPDATE public.exercises e SET slug = NULL, is_active = false
FROM ranked r WHERE e.id = r.id AND r.rn > 1;

-- ── Clamshell ─────────────────────────────────────────────────────────────────
UPDATE public.exercises
SET
  slug = 'clamshell',
  name = 'Clamshell',
  category = 'lower_body',
  equipment_type = 'bands',
  workout_style = 'strength',
  is_active = true,
  difficulty_level = 'easy',
  movement_pattern = 'bridge',
  sets_default = 3,
  reps_default = '15 per side',
  instruction_text =
    'Side-lying with band above knees and knees bent 90 degrees. Rotate top knee upward like a clamshell. Control return.'
WHERE name IN ('Clamshell')
   OR slug = 'clamshell';

INSERT INTO public.exercises (
  name, slug, category, equipment_type, workout_style,
  sets_default, reps_default, instruction_text,
  is_active, difficulty_level, movement_pattern
)
SELECT
  'Clamshell', 'clamshell', 'lower_body', 'bands', 'strength',
  3, '15 per side',
  'Side-lying with band above knees and knees bent 90 degrees. Rotate top knee upward like a clamshell. Control return.',
  true, 'easy', 'bridge'
WHERE NOT EXISTS (SELECT 1 FROM public.exercises e WHERE e.slug = 'clamshell');

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id ASC) AS rn
  FROM public.exercises WHERE slug = 'clamshell'
)
UPDATE public.exercises e SET slug = NULL, is_active = false
FROM ranked r WHERE e.id = r.id AND r.rn > 1;

-- ── Band Shoulder Press ───────────────────────────────────────────────────────
UPDATE public.exercises
SET
  slug = 'band_shoulder_press',
  name = 'Band Shoulder Press',
  category = 'upper_body',
  equipment_type = 'bands',
  workout_style = 'strength',
  is_active = true,
  difficulty_level = 'medium',
  movement_pattern = 'press',
  sets_default = 3,
  reps_default = '10-12 reps',
  instruction_text =
    'Stand on centre of band. Press both ends overhead from shoulder height. Fully extend without locking out.'
WHERE name IN ('Band Shoulder Press', 'Band Overhead Press')
   OR slug = 'band_shoulder_press';

INSERT INTO public.exercises (
  name, slug, category, equipment_type, workout_style,
  sets_default, reps_default, instruction_text,
  is_active, difficulty_level, movement_pattern
)
SELECT
  'Band Shoulder Press', 'band_shoulder_press', 'upper_body', 'bands', 'strength',
  3, '10-12 reps',
  'Stand on centre of band. Press both ends overhead from shoulder height. Fully extend without locking out.',
  true, 'medium', 'press'
WHERE NOT EXISTS (SELECT 1 FROM public.exercises e WHERE e.slug = 'band_shoulder_press');

UPDATE public.exercises
SET is_active = false, slug = NULL
WHERE name IN ('Band Overhead Press')
  AND (slug IS DISTINCT FROM 'band_shoulder_press' OR slug IS NULL);

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id ASC) AS rn
  FROM public.exercises WHERE slug = 'band_shoulder_press'
)
UPDATE public.exercises e SET slug = NULL, is_active = false
FROM ranked r WHERE e.id = r.id AND r.rn > 1;

-- ── In cab pull ups ───────────────────────────────────────────────────────────
UPDATE public.exercises
SET
  slug = 'in_cab_pull_ups',
  name = 'In Cab Pull Ups',
  category = 'upper_body',
  equipment_type = 'bodyweight',
  workout_style = 'strength',
  is_active = true,
  difficulty_level = 'medium',
  movement_pattern = 'pull',
  sets_default = 3,
  reps_default = '8-10 reps',
  instruction_text =
    'Grip a sturdy cab ledge or frame overhead. Pull your chin above the ledge, then lower with control. Keep core tight throughout.'
WHERE name IN ('In cab pull ups', 'In Cab Pull Ups', 'Cab Ledge Pull Ups')
   OR slug = 'in_cab_pull_ups';

INSERT INTO public.exercises (
  name, slug, category, equipment_type, workout_style,
  sets_default, reps_default, instruction_text,
  is_active, difficulty_level, movement_pattern
)
SELECT
  'In Cab Pull Ups', 'in_cab_pull_ups', 'upper_body', 'bodyweight', 'strength',
  3, '8-10 reps',
  'Grip a sturdy cab ledge or frame overhead. Pull your chin above the ledge, then lower with control. Keep core tight throughout.',
  true, 'medium', 'pull'
WHERE NOT EXISTS (SELECT 1 FROM public.exercises e WHERE e.slug = 'in_cab_pull_ups');

UPDATE public.exercises
SET is_active = false, slug = NULL
WHERE name IN ('In Cab Pull Ups', 'Cab Ledge Pull Ups')
  AND (slug IS DISTINCT FROM 'in_cab_pull_ups' OR slug IS NULL);

WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id ASC) AS rn
  FROM public.exercises WHERE slug = 'in_cab_pull_ups'
)
UPDATE public.exercises e SET slug = NULL, is_active = false
FROM ranked r WHERE e.id = r.id AND r.rn > 1;
