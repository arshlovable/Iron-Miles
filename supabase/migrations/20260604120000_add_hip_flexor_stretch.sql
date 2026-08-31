-- Add Hip Flexor Stretch as the 50th active v1 exercise.
-- Reactivates legacy row if present; otherwise inserts a new active row.

UPDATE public.exercises
SET
  slug = 'hip_flexor_stretch',
  name = 'Hip Flexor Stretch',
  category = 'mobility',
  equipment_type = 'bodyweight',
  workout_style = 'mobility',
  is_active = true,
  difficulty_level = 'easy',
  movement_pattern = 'hip_mobility',
  sets_default = 2,
  reps_default = '30 sec per side',
  instruction_text =
    'Step one foot forward into a split stance and gently lower your hips forward. Keep your chest upright and breathe steadily as you feel the stretch through the front of the hip on the back leg. Do not force the position. Hold, then switch sides.'
WHERE name IN ('Hip Flexor Stretch', 'Hip Flexor', 'Hip Stretch')
   OR slug = 'hip_flexor_stretch';

INSERT INTO public.exercises (
  name,
  slug,
  category,
  equipment_type,
  workout_style,
  sets_default,
  reps_default,
  instruction_text,
  is_active,
  difficulty_level,
  movement_pattern
)
SELECT
  'Hip Flexor Stretch',
  'hip_flexor_stretch',
  'mobility',
  'bodyweight',
  'mobility',
  2,
  '30 sec per side',
  'Step one foot forward into a split stance and gently lower your hips forward. Keep your chest upright and breathe steadily as you feel the stretch through the front of the hip on the back leg. Do not force the position. Hold, then switch sides.',
  true,
  'easy',
  'hip_mobility'
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises e WHERE e.slug = 'hip_flexor_stretch'
);

-- Demote duplicate name variants that are not the canonical slug row
UPDATE public.exercises
SET is_active = false, slug = NULL
WHERE name IN ('Hip Flexor', 'Hip Stretch')
  AND (slug IS DISTINCT FROM 'hip_flexor_stretch' OR slug IS NULL);

-- Dedupe: keep lowest id for hip_flexor_stretch
WITH ranked AS (
  SELECT id,
    ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id ASC) AS rn
  FROM public.exercises
  WHERE slug = 'hip_flexor_stretch'
)
UPDATE public.exercises e
SET slug = NULL, is_active = false
FROM ranked r
WHERE e.id = r.id AND r.rn > 1;
