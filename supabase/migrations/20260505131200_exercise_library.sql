-- ─── Iron Miles Exercise Library ──────────────────────────────────────────────
-- Adds a comprehensive, properly-categorized exercise library covering all
-- user-facing workout combinations:
--   target:    upper_body / lower_body / core / mobility
--   equipment: bodyweight / bands / dumbbells
--
-- Also ensures optional columns expected by the generate-workout edge function
-- are present (ADD COLUMN IF NOT EXISTS is a no-op when they already exist).
--
-- All inserts use WHERE NOT EXISTS (by name) to safely skip duplicates.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Ensure optional columns exist ────────────────────────────────────────────
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS is_active       boolean  DEFAULT true;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS difficulty_level text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS movement_pattern text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS target_muscle    text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS location_type    text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS movement_type    text;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS duration_seconds integer;
ALTER TABLE public.exercises ADD COLUMN IF NOT EXISTS goal_tags        jsonb;

-- Mark any previously-inserted exercises as active (null is already treated as
-- active by the edge function, but being explicit avoids confusion)
UPDATE public.exercises SET is_active = true WHERE is_active IS NULL;

-- ── Insert library (skip exact name duplicates) ───────────────────────────────
INSERT INTO public.exercises
  (name, category, equipment_type, workout_style,
   sets_default, reps_default, instruction_text,
   is_active, difficulty_level, movement_pattern)
SELECT
  v.name, v.category, v.equipment_type, v.workout_style,
  v.sets_default::integer, v.reps_default, v.instruction_text,
  true, v.difficulty_level, v.movement_pattern
FROM (VALUES

  -- ── Upper Body / Bodyweight ─────────────────────────────────────────────
  ('Push-Up',
   'upper_body', 'bodyweight', 'strength', '3', '10-12 reps',
   'Hands shoulder-width apart on ground. Lower chest toward floor then push back up. Keep body in a straight line.',
   'medium', 'push'),

  ('Wide Push-Up',
   'upper_body', 'bodyweight', 'strength', '3', '10-12 reps',
   'Hands wider than shoulder-width apart. Lower chest to ground and press back up. Emphasises chest over triceps.',
   'medium', 'push'),

  ('Diamond Push-Up',
   'upper_body', 'bodyweight', 'strength', '3', '8-10 reps',
   'Form a diamond shape with index fingers and thumbs directly under chest. Lower and press back up. Heavy tricep focus.',
   'hard', 'push'),

  ('Pike Push-Up',
   'upper_body', 'bodyweight', 'strength', '3', '8-10 reps',
   'Start in downward-dog with hips high. Bend elbows to lower head toward floor then push back up. Targets shoulders.',
   'hard', 'push'),

  ('Incline Push-Up',
   'upper_body', 'bodyweight', 'strength', '3', '12-15 reps',
   'Hands on elevated surface such as a truck step or bumper. Easier than a standard push-up. Good starting point.',
   'easy', 'push'),

  ('Decline Push-Up',
   'upper_body', 'bodyweight', 'strength', '3', '8-10 reps',
   'Feet elevated on truck step, hands on ground. Shifts the load to upper chest and front shoulders.',
   'hard', 'push'),

  ('Tricep Dip',
   'upper_body', 'bodyweight', 'strength', '3', '10-12 reps',
   'Hands on truck step or low ledge behind you, fingers forward. Lower by bending elbows then press back up.',
   'medium', 'push'),

  ('Shoulder Tap Plank',
   'upper_body', 'bodyweight', 'strength', '3', '12 per side',
   'Hold a push-up position. Tap opposite shoulder with one hand while keeping hips square. Alternate sides each rep.',
   'medium', 'push'),

  -- ── Upper Body / Bands ──────────────────────────────────────────────────
  ('Seated Band Row',
   'upper_body', 'bands', 'strength', '3', '12-15 reps',
   'Anchor band at a low point. Sit and pull band toward torso driving elbows back. Squeeze shoulder blades at top.',
   'medium', 'pull'),

  ('Band Pull-Apart',
   'upper_body', 'bands', 'strength', '3', '15-20 reps',
   'Hold band at chest height with arms straight. Pull ends apart until fully extended. Squeeze shoulder blades hard.',
   'easy', 'pull'),

  ('Band Face Pull',
   'upper_body', 'bands', 'strength', '3', '12-15 reps',
   'Anchor band at face height. Pull toward face flaring elbows wide and high. Targets rear delts and upper back.',
   'medium', 'pull'),

  ('Band Overhead Press',
   'upper_body', 'bands', 'strength', '3', '10-12 reps',
   'Stand on centre of band. Press both ends overhead from shoulder height. Fully extend without locking out.',
   'medium', 'press'),

  ('Band Bicep Curl',
   'upper_body', 'bands', 'strength', '3', '12-15 reps',
   'Stand on band, arms at sides. Curl hands toward shoulders. Keep elbows pinned to sides throughout.',
   'easy', 'pull'),

  ('Band Tricep Pushdown',
   'upper_body', 'bands', 'strength', '3', '12-15 reps',
   'Anchor band above head. Grip and push straight down extending arms fully. Keep elbows tucked at sides.',
   'easy', 'push'),

  ('Band Lateral Raise',
   'upper_body', 'bands', 'strength', '3', '12-15 reps',
   'Stand on band, arms at sides. Raise arms to shoulder height laterally with a slight elbow bend. Control return.',
   'medium', 'press'),

  ('Band Upright Row',
   'upper_body', 'bands', 'strength', '3', '10-12 reps',
   'Stand on band with a narrow grip. Pull to chin with elbows high and flared wide. Pause briefly at top.',
   'medium', 'pull'),

  -- ── Upper Body / Dumbbells ──────────────────────────────────────────────
  ('Dumbbell Floor Press',
   'upper_body', 'dumbbells', 'strength', '3', '10-12 reps',
   'Lie on ground with dumbbells at chest. Press straight up then lower under control. Ground limits range safely.',
   'medium', 'push'),

  ('Dumbbell Shoulder Press',
   'upper_body', 'dumbbells', 'strength', '3', '10-12 reps',
   'Press dumbbells overhead from shoulder height. Can be done seated in cab or standing at a truck stop.',
   'medium', 'press'),

  ('Bent-Over Dumbbell Row',
   'upper_body', 'dumbbells', 'strength', '3', '10-12 reps',
   'Hinge forward at hips with flat back. Pull dumbbell to hip driving elbow back. Alternate or do both at once.',
   'medium', 'pull'),

  ('Dumbbell Lateral Raise',
   'upper_body', 'dumbbells', 'strength', '3', '12-15 reps',
   'Raise dumbbells to sides until parallel with floor. Slight bend in elbow. Control them on the way down.',
   'medium', 'press'),

  ('Dumbbell Bicep Curl',
   'upper_body', 'dumbbells', 'strength', '3', '12-15 reps',
   'Curl dumbbells toward shoulders with a controlled motion. Squeeze at top. Keep elbows pinned at sides.',
   'easy', 'pull'),

  ('Dumbbell Tricep Kickback',
   'upper_body', 'dumbbells', 'strength', '3', '12 per side',
   'Hinge forward with upper arm parallel to floor. Extend arm fully behind you. Keep upper arm completely still.',
   'medium', 'push'),

  ('Dumbbell Front Raise',
   'upper_body', 'dumbbells', 'strength', '3', '12-15 reps',
   'Hold dumbbell in front of thigh. Raise to shoulder height with a controlled motion. Alternate arms.',
   'medium', 'press'),

  ('Arnold Press',
   'upper_body', 'dumbbells', 'strength', '3', '10-12 reps',
   'Start with palms facing you at shoulder height. Rotate outward as you press overhead. Reverse on the way down.',
   'hard', 'press'),

  -- ── Lower Body / Bodyweight ─────────────────────────────────────────────
  ('Reverse Lunge',
   'lower_body', 'bodyweight', 'strength', '3', '12 per side',
   'Step back with one foot into a lunge. Keep front shin vertical. Drive through front heel to return to standing.',
   'medium', 'lunge'),

  ('Glute Bridge',
   'lower_body', 'bodyweight', 'strength', '3', '15-20 reps',
   'Lie on back with feet flat on ground. Drive hips upward squeezing glutes hard at top. Lower slowly and repeat.',
   'easy', 'bridge'),

  ('Standing Calf Raise',
   'lower_body', 'bodyweight', 'burn', '3', '20-25 reps',
   'Stand tall and rise up onto toes. Brief pause at top. Lower slowly back down. Use truck for balance if needed.',
   'easy', 'calf_raise'),

  ('Wall Sit',
   'lower_body', 'bodyweight', 'burn', '3', '30-45 sec',
   'Back flat against wall with thighs parallel to floor and knees at 90 degrees. Hold for the full duration.',
   'medium', 'squat'),

  ('Step-Up',
   'lower_body', 'bodyweight', 'strength', '3', '12 per side',
   'Step up onto truck step with one foot. Drive through that heel to stand. Step back down and alternate.',
   'medium', 'lunge'),

  ('Jump Squat',
   'lower_body', 'bodyweight', 'burn', '3', '10-12 reps',
   'Squat to parallel then explode upward. Land softly with knees bent. Reset briefly between reps.',
   'hard', 'squat'),

  -- ── Lower Body / Bands ──────────────────────────────────────────────────
  ('Banded Squat',
   'lower_body', 'bands', 'strength', '3', '12-15 reps',
   'Place band just above knees. Squat to depth with knees tracking over toes against band resistance.',
   'medium', 'squat'),

  ('Banded Lateral Walk',
   'lower_body', 'bands', 'burn', '3', '12 per side',
   'Band just above knees. Maintain a slight squat. Take controlled side-steps keeping constant tension in the band.',
   'medium', 'lunge'),

  ('Clamshell',
   'lower_body', 'bands', 'strength', '3', '15 per side',
   'Side-lying with band above knees and knees bent 90 degrees. Rotate top knee upward like a clamshell. Control return.',
   'easy', 'bridge'),

  ('Banded Hip Thrust',
   'lower_body', 'bands', 'strength', '3', '12-15 reps',
   'Loop band across hips and anchor ends under hands. Drive hips straight up from a seated position. Squeeze glutes hard.',
   'medium', 'bridge'),

  ('Monster Walk',
   'lower_body', 'bands', 'burn', '3', '10 per direction',
   'Band above knees in a squat stance. Walk forward then backward in a controlled squat maintaining band tension throughout.',
   'medium', 'lunge'),

  ('Banded Glute Bridge',
   'lower_body', 'bands', 'strength', '3', '15-20 reps',
   'Band across hips anchored under hands. Perform a glute bridge against the resistance. Extra squeeze at top.',
   'easy', 'bridge'),

  -- ── Lower Body / Dumbbells ──────────────────────────────────────────────
  ('Goblet Squat',
   'lower_body', 'dumbbells', 'strength', '3', '12-15 reps',
   'Hold dumbbell vertically at chest. Squat deep with elbows tracking inside knees. Drive through heels to stand.',
   'medium', 'squat'),

  ('Romanian Deadlift',
   'lower_body', 'dumbbells', 'strength', '3', '12-15 reps',
   'Hold dumbbells in front of thighs. Hinge at hips with slight knee bend lowering to mid-shin. Drive hips forward to stand.',
   'medium', 'hinge'),

  ('Dumbbell Split Squat',
   'lower_body', 'dumbbells', 'strength', '3', '10 per side',
   'Hold dumbbells at sides with rear foot trailing. Lower back knee toward ground. Drive through front heel to rise.',
   'hard', 'lunge'),

  ('Dumbbell Reverse Lunge',
   'lower_body', 'dumbbells', 'strength', '3', '12 per side',
   'Hold dumbbells at sides. Step backward into a lunge keeping torso upright. Push through front heel to return.',
   'medium', 'lunge'),

  ('Sumo Squat',
   'lower_body', 'dumbbells', 'strength', '3', '12-15 reps',
   'Wide stance with toes turned out. Hold dumbbell between legs. Squat with knees tracking over toes. Drive hips up.',
   'medium', 'squat'),

  ('Dumbbell Step-Up',
   'lower_body', 'dumbbells', 'strength', '3', '12 per side',
   'Hold dumbbells at sides. Step up onto truck step driving through the heel. Stand fully before stepping down.',
   'hard', 'lunge'),

  -- ── Core ────────────────────────────────────────────────────────────────
  ('Dead Bug',
   'core', 'bodyweight', 'strength', '3', '10 per side',
   'Lie face up, arms extended above chest. Lower opposite arm and leg while pressing lower back into floor. Switch sides.',
   'easy', 'core_stability'),

  ('Plank',
   'core', 'bodyweight', 'strength', '3', '30-45 sec',
   'Forearms on ground, body in a straight line from head to heels. Squeeze glutes and brace core. Hold position.',
   'medium', 'core_stability'),

  ('Bird Dog',
   'core', 'bodyweight', 'strength', '3', '10 per side',
   'On hands and knees. Extend opposite arm and leg simultaneously keeping hips level. Hold 2 seconds each rep.',
   'easy', 'core_stability'),

  ('Hollow Body Hold',
   'core', 'bodyweight', 'strength', '3', '20-30 sec',
   'Lie on back and press lower back into floor. Raise arms overhead and hover legs 6 inches. Hold and breathe.',
   'hard', 'core_stability'),

  ('Mountain Climber',
   'core', 'bodyweight', 'burn', '3', '20 per side',
   'In a push-up position alternate driving knees toward chest at a controlled pace. Keep hips level throughout.',
   'medium', 'core_stability'),

  ('Russian Twist',
   'core', 'bodyweight', 'burn', '3', '15 per side',
   'Sit at 45 degrees with feet raised. Rotate torso side to side touching ground each rep. Keep chest tall.',
   'medium', 'anti_rotation'),

  ('Leg Raise',
   'core', 'bodyweight', 'strength', '3', '12-15 reps',
   'Lie flat on back with hands at sides. Raise straight legs to 90 degrees. Lower slowly without touching the ground.',
   'medium', 'hip_flexion'),

  ('Flutter Kicks',
   'core', 'bodyweight', 'burn', '3', '20 per side',
   'Lie flat with lower back pressed down. Hover legs 6 inches off ground. Alternate small kicks rhythmically.',
   'medium', 'hip_flexion'),

  ('Bicycle Crunch',
   'core', 'bodyweight', 'burn', '3', '15 per side',
   'Hands behind head, legs off ground. Drive elbow to opposite knee while fully extending the other leg. Alternate.',
   'medium', 'anti_rotation'),

  ('Side Plank',
   'core', 'bodyweight', 'strength', '3', '20-30 sec per side',
   'Side-lying on forearm with body in a straight line. Stack feet or stagger them for balance. Hold each side.',
   'medium', 'anti_rotation'),

  -- ── Mobility ────────────────────────────────────────────────────────────
  ('Cat-Cow Stretch',
   'mobility', 'bodyweight', 'mobility', '2', '10 reps',
   'On all fours arch back up toward ceiling (cat) then drop belly down (cow). Move slowly and breathe with each rep.',
   'easy', 'spine_mobility'),

  ('Thoracic Rotation',
   'mobility', 'bodyweight', 'mobility', '2', '10 per side',
   'On all fours with one hand behind head. Rotate upper back toward ceiling then back down. Controlled movement.',
   'easy', 'thoracic_mobility'),

  ('Hip Flexor Stretch',
   'mobility', 'bodyweight', 'mobility', '2', '30 sec per side',
   'Step into a lunge position. Push hips forward gently while keeping torso upright. Hold and breathe. Switch sides.',
   'easy', 'spine_decompression'),

  ('Doorframe Chest Stretch',
   'mobility', 'bodyweight', 'mobility', '2', '30 sec per side',
   'Place forearm against cab door frame at 90 degrees. Rotate body away to open chest. Hold and breathe deeply.',
   'easy', 'thoracic_mobility'),

  ('Seated Forward Fold',
   'mobility', 'bodyweight', 'mobility', '2', '30-45 sec',
   'Sit with legs extended. Hinge forward from hips reaching toward feet. Relax shoulders and breathe into the stretch.',
   'easy', 'spine_decompression'),

  ('Cobra Stretch',
   'mobility', 'bodyweight', 'mobility', '2', '20-30 sec',
   'Lie face down with hands under shoulders. Push upper body up keeping hips on ground. Open chest and breathe.',
   'easy', 'spine_decompression'),

  ('Shoulder Circle',
   'mobility', 'bodyweight', 'mobility', '2', '10 each way',
   'Roll shoulders slowly in large circles backward then reverse. Warms up shoulder joints before upper body work.',
   'easy', 'thoracic_mobility'),

  ('Pigeon Stretch',
   'mobility', 'bodyweight', 'mobility', '2', '30 sec per side',
   'Bring one leg forward with knee bent at 90 degrees. Extend rear leg back. Lower chest forward for deeper stretch.',
   'easy', 'hip_mobility')

) AS v(name, category, equipment_type, workout_style, sets_default, reps_default, instruction_text, difficulty_level, movement_pattern)
WHERE NOT EXISTS (
  SELECT 1 FROM public.exercises e WHERE e.name = v.name
);
