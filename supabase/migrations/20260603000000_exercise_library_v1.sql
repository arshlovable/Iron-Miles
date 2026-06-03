-- ─── Iron Miles v1 Exercise Library ────────────────────────────────────────────
-- Establishes the 49-exercise production library backed by recorded demo videos.
--
-- Strategy:
--   1. Add `slug` column (stable identifier, snake_case).
--   2. Deactivate ALL existing exercises (is_active = false).
--   3. Promote exactly ONE legacy row per v1 slug via name→slug map + DISTINCT ON.
--   4. INSERT any v1 exercise whose slug is still missing after the promotion pass.
--   4b. Dedupe safety pass — demote any duplicate slug rows (keep lowest id).
--   5. Create a unique partial index on slug for non-null slugs.
--
-- Old exercises are deactivated, NOT deleted. Their history is preserved.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. Schema additions ───────────────────────────────────────────────────────
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS is_active       boolean DEFAULT true;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS difficulty_level text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS movement_pattern text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS target_muscle    text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS location_type    text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS movement_type    text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS duration_seconds integer;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS goal_tags        jsonb;

-- ── 2. Deactivate all existing exercises ──────────────────────────────────────
UPDATE public.exercises SET is_active = false, slug = NULL;

-- ── 3. Promote one legacy row per v1 slug (DISTINCT ON winner) ────────────────

CREATE TEMP TABLE v1_exercises (
  slug text PRIMARY KEY,
  canonical_name text NOT NULL,
  category text NOT NULL,
  equipment_type text NOT NULL,
  workout_style text NOT NULL,
  sets_default integer NOT NULL,
  reps_default text NOT NULL,
  instruction_text text NOT NULL,
  difficulty_level text NOT NULL,
  movement_pattern text NOT NULL
);

INSERT INTO v1_exercises (slug, canonical_name, category, equipment_type, workout_style, sets_default, reps_default, instruction_text, difficulty_level, movement_pattern) VALUES
  ('push_up', 'Push Up', 'upper_body', 'bodyweight', 'strength', 3, '10-12 reps', 'Hands shoulder-width apart on ground. Lower chest toward floor then push back up. Keep body in a straight line.', 'medium', 'push'),
  ('wide_push_up', 'Wide Push Up', 'upper_body', 'bodyweight', 'strength', 3, '10-12 reps', 'Hands wider than shoulder-width apart. Lower chest to ground and press back up. Emphasises chest over triceps.', 'medium', 'push'),
  ('diamond_push_up', 'Diamond Push Up', 'upper_body', 'bodyweight', 'strength', 3, '8-10 reps', 'Form a diamond shape with index fingers and thumbs directly under chest. Lower and press back up. Heavy tricep focus.', 'hard', 'push'),
  ('pike_push_up', 'Pike Push Up', 'upper_body', 'bodyweight', 'strength', 3, '8-10 reps', 'Start in downward-dog with hips high. Bend elbows to lower head toward floor then push back up. Targets shoulders.', 'hard', 'push'),
  ('incline_push_up', 'Incline Push Up', 'upper_body', 'bodyweight', 'strength', 3, '12-15 reps', 'Hands on elevated surface such as a truck step or bumper. Easier than a standard push-up. Good starting point.', 'easy', 'push'),
  ('decline_push_up', 'Decline Push Up', 'upper_body', 'bodyweight', 'strength', 3, '8-10 reps', 'Feet elevated on truck step, hands on ground. Shifts the load to upper chest and front shoulders.', 'hard', 'push'),
  ('tricep_dip', 'Tricep Dip', 'upper_body', 'bodyweight', 'strength', 3, '10-12 reps', 'Hands on truck step or low ledge behind you, fingers forward. Lower by bending elbows then press back up.', 'medium', 'push'),
  ('shoulder_tap_plank', 'Shoulder Tap Plank', 'upper_body', 'bodyweight', 'strength', 3, '12 per side', 'Hold a push-up position. Tap opposite shoulder with one hand while keeping hips square. Alternate sides each rep.', 'medium', 'push'),
  ('band_face_pull', 'Band Face Pull', 'upper_body', 'bands', 'strength', 3, '12-15 reps', 'Anchor band at face height. Pull toward face flaring elbows wide and high. Targets rear delts and upper back.', 'medium', 'pull'),
  ('band_lateral_raise', 'Band Lateral Raise', 'upper_body', 'bands', 'strength', 3, '12-15 reps', 'Stand on band, arms at sides. Raise arms to shoulder height laterally with a slight elbow bend. Control return.', 'medium', 'press'),
  ('band_pull_apart', 'Band Pull Apart', 'upper_body', 'bands', 'strength', 3, '15-20 reps', 'Hold band at chest height with arms straight. Pull ends apart until fully extended. Squeeze shoulder blades hard.', 'easy', 'pull'),
  ('band_upright_row', 'Band Upright Row', 'upper_body', 'bands', 'strength', 3, '10-12 reps', 'Stand on band with a narrow grip. Pull to chin with elbows high and flared wide. Pause briefly at top.', 'medium', 'pull'),
  ('banded_bent_over_row', 'Banded Bent Over Row', 'upper_body', 'bands', 'strength', 3, '12-15 reps', 'Stand on band, hinge forward at hips with flat back. Pull band toward torso driving elbows back. Squeeze at top.', 'medium', 'pull'),
  ('banded_row', 'Banded Row', 'upper_body', 'bands', 'strength', 3, '12-15 reps', 'Anchor band at a low point. Sit or stand and pull band toward torso driving elbows back. Squeeze shoulder blades at top.', 'medium', 'pull'),
  ('arnold_press', 'Arnold Press', 'upper_body', 'dumbbells', 'strength', 3, '10-12 reps', 'Start with palms facing you at shoulder height. Rotate outward as you press overhead. Reverse on the way down.', 'hard', 'press'),
  ('dumbbell_bicep_curl', 'Dumbbell Bicep Curl', 'upper_body', 'dumbbells', 'strength', 3, '12-15 reps', 'Curl dumbbells toward shoulders with a controlled motion. Squeeze at top. Keep elbows pinned at sides.', 'easy', 'pull'),
  ('dumbbell_chest_press_in_cab', 'Dumbbell Chest Press In Cab', 'upper_body', 'dumbbells', 'strength', 3, '10-12 reps', 'Lie on your bunk or seat in the cab. Press dumbbells from chest height straight up then lower with control.', 'medium', 'push'),
  ('dumbbell_front_raise', 'Dumbbell Front Raise', 'upper_body', 'dumbbells', 'burn', 3, '12-15 reps', 'Hold dumbbell in front of thigh. Raise to shoulder height with a controlled motion. Alternate arms.', 'easy', 'press'),
  ('dumbbell_lateral_raise', 'Dumbbell Lateral Raise', 'upper_body', 'dumbbells', 'strength', 3, '12-15 reps', 'Raise dumbbells to sides until parallel with floor. Slight bend in elbow. Control them on the way down.', 'medium', 'press'),
  ('dumbbell_overhead_tricep_extension', 'Dumbbell Overhead Tricep Extension', 'upper_body', 'dumbbells', 'strength', 3, '12-15 reps', 'Hold dumbbell overhead with both hands. Lower behind head by bending elbows. Extend fully and repeat.', 'medium', 'push'),
  ('dumbbell_shoulder_press', 'Dumbbell Shoulder Press', 'upper_body', 'dumbbells', 'strength', 3, '10-12 reps', 'Press dumbbells overhead from shoulder height. Can be done seated in cab or standing at a truck stop.', 'medium', 'press'),
  ('single_arm_dumbbell_row', 'Single Arm Dumbbell Row', 'upper_body', 'dumbbells', 'strength', 3, '12 per side', 'Brace one hand on a surface. Pull dumbbell to hip driving elbow back. Keep torso flat. Control the return.', 'medium', 'pull'),
  ('bodyweight_squat', 'Bodyweight Squat', 'lower_body', 'bodyweight', 'strength', 3, '15-20 reps', 'Feet shoulder-width apart, toes slightly out. Squat until thighs are parallel to floor. Drive through heels to stand.', 'easy', 'squat'),
  ('front_lunge', 'Front Lunge', 'lower_body', 'bodyweight', 'strength', 3, '12 per side', 'Step forward with one foot into a lunge. Keep front shin vertical. Drive through front heel to return to standing.', 'medium', 'lunge'),
  ('glute_bridge', 'Glute Bridge', 'lower_body', 'bodyweight', 'strength', 3, '15-20 reps', 'Lie on back with feet flat on ground. Drive hips upward squeezing glutes hard at top. Lower slowly and repeat.', 'easy', 'bridge'),
  ('step_up', 'Step Up', 'lower_body', 'bodyweight', 'strength', 3, '12 per side', 'Step up onto truck step with one foot. Drive through that heel to stand. Step back down and alternate.', 'medium', 'lunge'),
  ('sumo_squat', 'Sumo Squat', 'lower_body', 'bodyweight', 'strength', 3, '12-15 reps', 'Wide stance with toes turned out. Squat with knees tracking over toes. Drive hips up and squeeze glutes at top.', 'easy', 'squat'),
  ('wall_sit', 'Wall Sit', 'lower_body', 'bodyweight', 'burn', 3, '30-45 sec', 'Back flat against wall with thighs parallel to floor and knees at 90 degrees. Hold for the full duration.', 'medium', 'squat'),
  ('band_lateral_walk', 'Band Lateral Walk', 'lower_body', 'bands', 'burn', 3, '12 per side', 'Band just above knees. Maintain a slight squat. Take controlled side-steps keeping constant tension in the band.', 'medium', 'lunge'),
  ('dumbbell_front_lunge', 'Dumbbell Front Lunge', 'lower_body', 'dumbbells', 'strength', 3, '12 per side', 'Hold dumbbells at sides. Step forward into a lunge keeping torso upright. Push through front heel to return.', 'medium', 'lunge'),
  ('dumbbell_split_squat', 'Dumbbell Split Squat', 'lower_body', 'dumbbells', 'strength', 3, '10 per side', 'Hold dumbbells at sides with rear foot trailing. Lower back knee toward ground. Drive through front heel to rise.', 'hard', 'lunge'),
  ('dumbbell_split_squat_outside', 'Dumbbell Split Squat Outside', 'lower_body', 'dumbbells', 'strength', 3, '10 per side', 'Rear foot elevated on truck step. Hold dumbbells at sides. Lower back knee toward ground and drive back up.', 'hard', 'lunge'),
  ('goblet_squat', 'Goblet Squat', 'lower_body', 'dumbbells', 'strength', 3, '12-15 reps', 'Hold dumbbell vertically at chest. Squat deep with elbows tracking inside knees. Drive through heels to stand.', 'medium', 'squat'),
  ('romanian_deadlift', 'Romanian Deadlift', 'lower_body', 'dumbbells', 'strength', 3, '12-15 reps', 'Hold dumbbells in front of thighs. Hinge at hips with slight knee bend lowering to mid-shin. Drive hips forward to stand.', 'medium', 'hinge'),
  ('bicycle_crunch', 'Bicycle Crunch', 'core', 'bodyweight', 'burn', 3, '15 per side', 'Hands behind head, legs off ground. Drive elbow to opposite knee while fully extending the other leg. Alternate.', 'medium', 'anti_rotation'),
  ('bird_dog', 'Bird Dog', 'core', 'bodyweight', 'strength', 3, '10 per side', 'On hands and knees. Extend opposite arm and leg simultaneously keeping hips level. Hold 2 seconds each rep.', 'easy', 'core_stability'),
  ('dead_bug', 'Dead Bug', 'core', 'bodyweight', 'strength', 3, '10 per side', 'Lie face up, arms extended above chest. Lower opposite arm and leg while pressing lower back into floor. Switch sides.', 'easy', 'core_stability'),
  ('flutter_kicks', 'Flutter Kicks', 'core', 'bodyweight', 'burn', 3, '20 per side', 'Lie flat with lower back pressed down. Hover legs 6 inches off ground. Alternate small kicks rhythmically.', 'medium', 'hip_flexion'),
  ('hollow_body_hold', 'Hollow Body Hold', 'core', 'bodyweight', 'strength', 3, '20-30 sec', 'Lie on back and press lower back into floor. Raise arms overhead and hover legs 6 inches. Hold and breathe.', 'hard', 'core_stability'),
  ('leg_raise', 'Leg Raise', 'core', 'bodyweight', 'strength', 3, '12-15 reps', 'Lie flat on back with hands at sides. Raise straight legs to 90 degrees. Lower slowly without touching the ground.', 'medium', 'hip_flexion'),
  ('mountain_climber', 'Mountain Climber', 'core', 'bodyweight', 'burn', 3, '20 per side', 'In a push-up position alternate driving knees toward chest at a controlled pace. Keep hips level throughout.', 'medium', 'core_stability'),
  ('plank_hold', 'Plank Hold', 'core', 'bodyweight', 'strength', 3, '30-45 sec', 'Forearms on ground, body in a straight line from head to heels. Squeeze glutes and brace core. Hold position.', 'medium', 'core_stability'),
  ('side_plank', 'Side Plank', 'core', 'bodyweight', 'strength', 3, '20-30 sec per side', 'Side-lying on forearm with body in a straight line. Stack feet or stagger them for balance. Hold each side.', 'medium', 'anti_rotation'),
  ('cobra_stretch', 'Cobra Stretch', 'mobility', 'bodyweight', 'mobility', 2, '20-30 sec', 'Lie face down with hands under shoulders. Push upper body up keeping hips on ground. Open chest and breathe.', 'easy', 'spine_decompression'),
  ('doorway_chest_stretch', 'Doorway Chest Stretch', 'mobility', 'bodyweight', 'mobility', 2, '30 sec per side', 'Place forearm against cab door frame at 90 degrees. Rotate body away to open chest. Hold and breathe deeply.', 'easy', 'thoracic_mobility'),
  ('pigeon_stretch', 'Pigeon Stretch', 'mobility', 'bodyweight', 'mobility', 2, '30 sec per side', 'Bring one leg forward with knee bent at 90 degrees. Extend rear leg back. Lower chest forward for deeper stretch.', 'easy', 'hip_mobility'),
  ('seated_forward_fold', 'Seated Forward Fold', 'mobility', 'bodyweight', 'mobility', 2, '30-45 sec', 'Sit with legs extended. Hinge forward from hips reaching toward feet. Relax shoulders and breathe into the stretch.', 'easy', 'spine_decompression'),
  ('shoulder_circles', 'Shoulder Circles', 'mobility', 'bodyweight', 'mobility', 2, '10 each way', 'Roll shoulders slowly in large circles backward then reverse. Warms up shoulder joints before upper body work.', 'easy', 'thoracic_mobility'),
  ('thoracic_rotation', 'Thoracic Rotation', 'mobility', 'bodyweight', 'mobility', 2, '10 per side', 'On all fours with one hand behind head. Rotate upper back toward ceiling then back down. Controlled movement.', 'easy', 'thoracic_mobility');

CREATE TEMP TABLE v1_aliases (
  legacy_name text PRIMARY KEY,
  slug text NOT NULL,
  name_rank integer NOT NULL DEFAULT 1
);

INSERT INTO v1_aliases (legacy_name, slug, name_rank) VALUES
  ('Push Up', 'push_up', 0), ('Push-Up', 'push_up', 1), ('Push Ups', 'push_up', 1), ('Push-Ups', 'push_up', 1),
  ('Wide Push Up', 'wide_push_up', 0), ('Wide Push-Up', 'wide_push_up', 1), ('Wide Push Ups', 'wide_push_up', 1), ('Wide Push-Ups', 'wide_push_up', 1),
  ('Diamond Push Up', 'diamond_push_up', 0), ('Diamond Push-Up', 'diamond_push_up', 1), ('Diamond Push Ups', 'diamond_push_up', 1), ('Diamond Push-Ups', 'diamond_push_up', 1),
  ('Pike Push Up', 'pike_push_up', 0), ('Pike Push-Up', 'pike_push_up', 1), ('Pike Push Ups', 'pike_push_up', 1), ('Pike Push-Ups', 'pike_push_up', 1),
  ('Incline Push Up', 'incline_push_up', 0), ('Incline Push-Up', 'incline_push_up', 1), ('Incline Push Ups', 'incline_push_up', 1), ('Incline Push-Ups', 'incline_push_up', 1),
  ('Decline Push Up', 'decline_push_up', 0), ('Decline Push-Up', 'decline_push_up', 1), ('Decline Push Ups', 'decline_push_up', 1), ('Decline Push-Ups', 'decline_push_up', 1),
  ('Tricep Dip', 'tricep_dip', 0), ('Tricep Dips', 'tricep_dip', 1),
  ('Shoulder Tap Plank', 'shoulder_tap_plank', 0), ('Shoulder Tap Push-Ups', 'shoulder_tap_plank', 1), ('Shoulder Tap Push Ups', 'shoulder_tap_plank', 1),
  ('Band Face Pull', 'band_face_pull', 0), ('Band Face Pulls', 'band_face_pull', 1), ('Band Face-Pull', 'band_face_pull', 1), ('Band Face-Pulls', 'band_face_pull', 1),
  ('Band Lateral Raise', 'band_lateral_raise', 0), ('Band Lateral Raises', 'band_lateral_raise', 1), ('Single Arm Banded Side Lateral Raises', 'band_lateral_raise', 1),
  ('Band Pull Apart', 'band_pull_apart', 0), ('Band Pull-Apart', 'band_pull_apart', 1), ('Band Pull-Aparts', 'band_pull_apart', 1), ('Band Pull Aparts', 'band_pull_apart', 1),
  ('Band Upright Row', 'band_upright_row', 0), ('Band Upright Rows', 'band_upright_row', 1),
  ('Banded Bent Over Row', 'banded_bent_over_row', 0), ('Banded Bent-Over Row', 'banded_bent_over_row', 1),
  ('Banded Row', 'banded_row', 0), ('Seated Band Row', 'banded_row', 1), ('Band Row', 'banded_row', 1), ('Band Rows', 'banded_row', 1),
  ('Arnold Press', 'arnold_press', 0),
  ('Dumbbell Bicep Curl', 'dumbbell_bicep_curl', 0), ('Dumbbell Bicep Curls', 'dumbbell_bicep_curl', 1), ('Bicep Curl', 'dumbbell_bicep_curl', 1), ('Bicep Curls', 'dumbbell_bicep_curl', 1),
  ('Dumbbell Chest Press In Cab', 'dumbbell_chest_press_in_cab', 0), ('Dumbbell Chest Press (In Cab)', 'dumbbell_chest_press_in_cab', 1), ('Dumbbell Floor Press', 'dumbbell_chest_press_in_cab', 1),
  ('Dumbbell Front Raise', 'dumbbell_front_raise', 0), ('Dumbbell Front Raises', 'dumbbell_front_raise', 1),
  ('Dumbbell Lateral Raise', 'dumbbell_lateral_raise', 0), ('Dumbbell Lateral Raises', 'dumbbell_lateral_raise', 1), ('Single Arm Side Laterals', 'dumbbell_lateral_raise', 1),
  ('Dumbbell Overhead Tricep Extension', 'dumbbell_overhead_tricep_extension', 0), ('Dumbbell Overhead Tricep Extensions', 'dumbbell_overhead_tricep_extension', 1), ('Dumbbell Tricep Kickback', 'dumbbell_overhead_tricep_extension', 1),
  ('Dumbbell Shoulder Press', 'dumbbell_shoulder_press', 0),
  ('Single Arm Dumbbell Row', 'single_arm_dumbbell_row', 0), ('Bent-Over Dumbbell Row', 'single_arm_dumbbell_row', 1), ('Dumbbell One-Arm Row', 'single_arm_dumbbell_row', 1), ('Dumbbell One Arm Row', 'single_arm_dumbbell_row', 1),
  ('Bodyweight Squat', 'bodyweight_squat', 0), ('Bodyweight Squats', 'bodyweight_squat', 1),
  ('Front Lunge', 'front_lunge', 0), ('Front Lunges', 'front_lunge', 1), ('Walking Lunge', 'front_lunge', 1), ('Walking Lunges', 'front_lunge', 1),
  ('Glute Bridge', 'glute_bridge', 0), ('Glute Bridges', 'glute_bridge', 1), ('Glute Bridge Holds', 'glute_bridge', 1),
  ('Step Up', 'step_up', 0), ('Step-Up', 'step_up', 1), ('Step Ups', 'step_up', 1), ('Step-Ups', 'step_up', 1), ('Dumbbell Step-Up', 'step_up', 1),
  ('Sumo Squat', 'sumo_squat', 0), ('Sumo Squats', 'sumo_squat', 1),
  ('Wall Sit', 'wall_sit', 0), ('Wall Sits', 'wall_sit', 1),
  ('Band Lateral Walk', 'band_lateral_walk', 0), ('Banded Lateral Walk', 'band_lateral_walk', 1), ('Monster Walk', 'band_lateral_walk', 1),
  ('Dumbbell Front Lunge', 'dumbbell_front_lunge', 0), ('Dumbbell Front Lunges', 'dumbbell_front_lunge', 1), ('Dumbbell Reverse Lunge', 'dumbbell_front_lunge', 1),
  ('Dumbbell Split Squat', 'dumbbell_split_squat', 0), ('Dumbbell Split Squats', 'dumbbell_split_squat', 1),
  ('Dumbbell Split Squat Outside', 'dumbbell_split_squat_outside', 0), ('Dumbbell Split Squats (Outside)', 'dumbbell_split_squat_outside', 1), ('Dumbbell Split Squat (Outside)', 'dumbbell_split_squat_outside', 1),
  ('Goblet Squat', 'goblet_squat', 0), ('Goblet Squats', 'goblet_squat', 1),
  ('Romanian Deadlift', 'romanian_deadlift', 0), ('Romanian Deadlifts', 'romanian_deadlift', 1), ('Dumbbell Romanian Deadlift', 'romanian_deadlift', 1),
  ('Bicycle Crunch', 'bicycle_crunch', 0), ('Bicycle Crunches', 'bicycle_crunch', 1),
  ('Bird Dog', 'bird_dog', 0), ('Bird Dogs', 'bird_dog', 1), ('Single-Leg Bird Dogs', 'bird_dog', 1),
  ('Dead Bug', 'dead_bug', 0), ('Dead Bugs', 'dead_bug', 1), ('Single-Leg Dead Bugs', 'dead_bug', 1),
  ('Flutter Kicks', 'flutter_kicks', 0), ('Flutter Kick', 'flutter_kicks', 1),
  ('Hollow Body Hold', 'hollow_body_hold', 0), ('Hollow Body', 'hollow_body_hold', 1),
  ('Leg Raise', 'leg_raise', 0), ('Leg Raises', 'leg_raise', 1),
  ('Mountain Climber', 'mountain_climber', 0), ('Mountain Climbers', 'mountain_climber', 1), ('Slow Mountain Climber', 'mountain_climber', 1),
  ('Plank Hold', 'plank_hold', 0), ('Plank', 'plank_hold', 1),
  ('Side Plank', 'side_plank', 0), ('Side Planks', 'side_plank', 1),
  ('Cobra Stretch', 'cobra_stretch', 0), ('Cobra', 'cobra_stretch', 1),
  ('Doorway Chest Stretch', 'doorway_chest_stretch', 0), ('Doorframe Chest Stretch', 'doorway_chest_stretch', 1),
  ('Pigeon Stretch', 'pigeon_stretch', 0), ('Pigeon Pose', 'pigeon_stretch', 1),
  ('Seated Forward Fold', 'seated_forward_fold', 0),
  ('Shoulder Circles', 'shoulder_circles', 0), ('Shoulder Circle', 'shoulder_circles', 1),
  ('Thoracic Rotation', 'thoracic_rotation', 0), ('Thoracic Rotations', 'thoracic_rotation', 1), ('Cat-Cow Stretch', 'thoracic_rotation', 1), ('Cat-Cow', 'thoracic_rotation', 1);

WITH winners AS (
  SELECT DISTINCT ON (a.slug)
    e.id,
    v.slug,
    v.canonical_name,
    v.category,
    v.equipment_type,
    v.workout_style,
    v.sets_default,
    v.reps_default,
    v.instruction_text,
    v.difficulty_level,
    v.movement_pattern
  FROM public.exercises e
  JOIN v1_aliases a ON e.name = a.legacy_name
  JOIN v1_exercises v ON v.slug = a.slug
  ORDER BY a.slug, a.name_rank ASC, e.id ASC
)
UPDATE public.exercises e
SET
  slug = w.slug,
  name = w.canonical_name,
  is_active = true,
  category = w.category,
  equipment_type = w.equipment_type,
  workout_style = w.workout_style,
  sets_default = w.sets_default,
  reps_default = w.reps_default,
  instruction_text = w.instruction_text,
  difficulty_level = w.difficulty_level,
  movement_pattern = w.movement_pattern
FROM winners w
WHERE e.id = w.id;

-- ── 4. Insert any v1 exercise not yet matched by the promotion pass ───────────

INSERT INTO public.exercises (name, slug, category, equipment_type, workout_style, sets_default, reps_default, instruction_text, is_active, difficulty_level, movement_pattern)
SELECT v.canonical_name, v.slug, v.category, v.equipment_type, v.workout_style, v.sets_default, v.reps_default, v.instruction_text, true, v.difficulty_level, v.movement_pattern
FROM v1_exercises v
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises e WHERE e.slug = v.slug
);

-- ── 4b. Dedupe safety pass — keep lowest id per slug, demote the rest ─────────

WITH ranked AS (
  SELECT id, slug,
    ROW_NUMBER() OVER (PARTITION BY slug ORDER BY id ASC) AS rn
  FROM public.exercises
  WHERE slug IS NOT NULL
)
UPDATE public.exercises e
SET slug = NULL, is_active = false
FROM ranked r
WHERE e.id = r.id AND r.rn > 1;

-- ── 5. Unique partial index on slug ──────────────────────────────────────────
CREATE UNIQUE INDEX IF NOT EXISTS exercises_slug_unique
  ON public.exercises(slug)
  WHERE slug IS NOT NULL;

-- ── Verification summary (logged as notices) ──────────────────────────────────
DO $$
DECLARE
  v_active   integer;
  v_inactive integer;
  v_slugged  integer;
  v_dupes    integer;
BEGIN
  SELECT COUNT(*) INTO v_active   FROM public.exercises WHERE is_active = true;
  SELECT COUNT(*) INTO v_inactive FROM public.exercises WHERE is_active = false OR is_active IS NULL;
  SELECT COUNT(*) INTO v_slugged  FROM public.exercises WHERE slug IS NOT NULL;
  SELECT COUNT(*) INTO v_dupes FROM (
    SELECT slug FROM public.exercises WHERE slug IS NOT NULL GROUP BY slug HAVING COUNT(*) > 1
  ) d;
  RAISE NOTICE 'v1 migration complete: % active, % inactive, % with slug, % duplicate slugs', v_active, v_inactive, v_slugged, v_dupes;
END $$;
