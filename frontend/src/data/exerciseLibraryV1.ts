/**
 * Iron Miles v1 Active Exercise Registry
 *
 * 49 exercises — each backed by a recorded demo video in
 * frontend/assets/exercise-videos/
 *
 * This file is the single source of truth for the v1 active library.
 * The exerciseVideoMap.ts maps each slug to its local require() asset.
 */

export type ExerciseCategory = 'upper_body' | 'lower_body' | 'core' | 'mobility';
export type EquipmentType = 'bodyweight' | 'bands' | 'dumbbells';
export type WorkoutStyle = 'strength' | 'burn' | 'mobility';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

export type V1Exercise = {
  slug: string;
  name: string;
  category: ExerciseCategory;
  equipment_type: EquipmentType;
  workout_style: WorkoutStyle;
  difficulty_level: DifficultyLevel;
  movement_pattern: string;
  sets_default: number;
  reps_default: string;
  instruction_text: string;
  /** Exact filename on disk inside frontend/assets/exercise-videos/ */
  video_file: string;
  is_active: true;
};

export const EXERCISE_LIBRARY_V1: V1Exercise[] = [
  // ── Upper Body / Bodyweight ────────────────────────────────────────────────
  {
    slug: 'push_up',
    name: 'Push Up',
    category: 'upper_body',
    equipment_type: 'bodyweight',
    workout_style: 'strength',
    difficulty_level: 'medium',
    movement_pattern: 'push',
    sets_default: 3,
    reps_default: '10-12 reps',
    instruction_text:
      'Hands shoulder-width apart on ground. Lower chest toward floor then push back up. Keep body in a straight line.',
    video_file: 'Push Ups.mp4',
    is_active: true,
  },
  {
    slug: 'wide_push_up',
    name: 'Wide Push Up',
    category: 'upper_body',
    equipment_type: 'bodyweight',
    workout_style: 'strength',
    difficulty_level: 'medium',
    movement_pattern: 'push',
    sets_default: 3,
    reps_default: '10-12 reps',
    instruction_text:
      'Hands wider than shoulder-width apart. Lower chest to ground and press back up. Emphasises chest over triceps.',
    video_file: 'Wide Push Ups.mp4',
    is_active: true,
  },
  {
    slug: 'diamond_push_up',
    name: 'Diamond Push Up',
    category: 'upper_body',
    equipment_type: 'bodyweight',
    workout_style: 'strength',
    difficulty_level: 'hard',
    movement_pattern: 'push',
    sets_default: 3,
    reps_default: '8-10 reps',
    instruction_text:
      'Form a diamond shape with index fingers and thumbs directly under chest. Lower and press back up. Heavy tricep focus.',
    video_file: 'Diamond Push Ups.mp4',
    is_active: true,
  },
  {
    slug: 'pike_push_up',
    name: 'Pike Push Up',
    category: 'upper_body',
    equipment_type: 'bodyweight',
    workout_style: 'strength',
    difficulty_level: 'hard',
    movement_pattern: 'push',
    sets_default: 3,
    reps_default: '8-10 reps',
    instruction_text:
      'Start in downward-dog with hips high. Bend elbows to lower head toward floor then push back up. Targets shoulders.',
    video_file: 'Pike Push Ups.mp4',
    is_active: true,
  },
  {
    slug: 'incline_push_up',
    name: 'Incline Push Up',
    category: 'upper_body',
    equipment_type: 'bodyweight',
    workout_style: 'strength',
    difficulty_level: 'easy',
    movement_pattern: 'push',
    sets_default: 3,
    reps_default: '12-15 reps',
    instruction_text:
      'Hands on elevated surface such as a truck step or bumper. Easier than a standard push-up. Good starting point.',
    video_file: 'Incline Push Ups.mp4',
    is_active: true,
  },
  {
    slug: 'decline_push_up',
    name: 'Decline Push Up',
    category: 'upper_body',
    equipment_type: 'bodyweight',
    workout_style: 'strength',
    difficulty_level: 'hard',
    movement_pattern: 'push',
    sets_default: 3,
    reps_default: '8-10 reps',
    instruction_text:
      'Feet elevated on truck step, hands on ground. Shifts the load to upper chest and front shoulders.',
    video_file: 'Decline Push Ups.mp4',
    is_active: true,
  },
  {
    slug: 'tricep_dip',
    name: 'Tricep Dip',
    category: 'upper_body',
    equipment_type: 'bodyweight',
    workout_style: 'strength',
    difficulty_level: 'medium',
    movement_pattern: 'push',
    sets_default: 3,
    reps_default: '10-12 reps',
    instruction_text:
      'Hands on truck step or low ledge behind you, fingers forward. Lower by bending elbows then press back up.',
    video_file: 'Tricep Dips.mp4',
    is_active: true,
  },
  {
    slug: 'shoulder_tap_plank',
    name: 'Shoulder Tap Plank',
    category: 'upper_body',
    equipment_type: 'bodyweight',
    workout_style: 'strength',
    difficulty_level: 'medium',
    movement_pattern: 'push',
    sets_default: 3,
    reps_default: '12 per side',
    instruction_text:
      'Hold a push-up position. Tap opposite shoulder with one hand while keeping hips square. Alternate sides each rep.',
    video_file: 'Shoulder Tap Plank.mp4',
    is_active: true,
  },
  // ── Upper Body / Bands ────────────────────────────────────────────────────
  {
    slug: 'band_face_pull',
    name: 'Band Face Pull',
    category: 'upper_body',
    equipment_type: 'bands',
    workout_style: 'strength',
    difficulty_level: 'medium',
    movement_pattern: 'pull',
    sets_default: 3,
    reps_default: '12-15 reps',
    instruction_text:
      'Anchor band at face height. Pull toward face flaring elbows wide and high. Targets rear delts and upper back.',
    video_file: 'Band Face Pulls.mp4',
    is_active: true,
  },
  {
    slug: 'band_lateral_raise',
    name: 'Band Lateral Raise',
    category: 'upper_body',
    equipment_type: 'bands',
    workout_style: 'strength',
    difficulty_level: 'medium',
    movement_pattern: 'press',
    sets_default: 3,
    reps_default: '12-15 reps',
    instruction_text:
      'Stand on band, arms at sides. Raise arms to shoulder height laterally with a slight elbow bend. Control return.',
    video_file: 'Band Lateral Raises.mp4',
    is_active: true,
  },
  {
    slug: 'band_pull_apart',
    name: 'Band Pull Apart',
    category: 'upper_body',
    equipment_type: 'bands',
    workout_style: 'strength',
    difficulty_level: 'easy',
    movement_pattern: 'pull',
    sets_default: 3,
    reps_default: '15-20 reps',
    instruction_text:
      'Hold band at chest height with arms straight. Pull ends apart until fully extended. Squeeze shoulder blades hard.',
    video_file: 'Band Pull Apart.mp4',
    is_active: true,
  },
  {
    slug: 'band_upright_row',
    name: 'Band Upright Row',
    category: 'upper_body',
    equipment_type: 'bands',
    workout_style: 'strength',
    difficulty_level: 'medium',
    movement_pattern: 'pull',
    sets_default: 3,
    reps_default: '10-12 reps',
    instruction_text:
      'Stand on band with a narrow grip. Pull to chin with elbows high and flared wide. Pause briefly at top.',
    video_file: 'Band Upright Row.mp4',
    is_active: true,
  },
  {
    slug: 'banded_bent_over_row',
    name: 'Banded Bent Over Row',
    category: 'upper_body',
    equipment_type: 'bands',
    workout_style: 'strength',
    difficulty_level: 'medium',
    movement_pattern: 'pull',
    sets_default: 3,
    reps_default: '12-15 reps',
    instruction_text:
      'Stand on band, hinge forward at hips with flat back. Pull band toward torso driving elbows back. Squeeze at top.',
    video_file: 'Banded Bent Over Row.mp4',
    is_active: true,
  },
  {
    slug: 'banded_row',
    name: 'Banded Row',
    category: 'upper_body',
    equipment_type: 'bands',
    workout_style: 'strength',
    difficulty_level: 'medium',
    movement_pattern: 'pull',
    sets_default: 3,
    reps_default: '12-15 reps',
    instruction_text:
      'Anchor band at a low point. Sit or stand and pull band toward torso driving elbows back. Squeeze shoulder blades at top.',
    video_file: 'Banded Row.mp4',
    is_active: true,
  },
  // ── Upper Body / Dumbbells ───────────────────────────────────────────────
  {
    slug: 'arnold_press',
    name: 'Arnold Press',
    category: 'upper_body',
    equipment_type: 'dumbbells',
    workout_style: 'strength',
    difficulty_level: 'hard',
    movement_pattern: 'press',
    sets_default: 3,
    reps_default: '10-12 reps',
    instruction_text:
      'Start with palms facing you at shoulder height. Rotate outward as you press overhead. Reverse on the way down.',
    video_file: 'Arnold Press.mp4',
    is_active: true,
  },
  {
    slug: 'dumbbell_bicep_curl',
    name: 'Dumbbell Bicep Curl',
    category: 'upper_body',
    equipment_type: 'dumbbells',
    workout_style: 'strength',
    difficulty_level: 'easy',
    movement_pattern: 'pull',
    sets_default: 3,
    reps_default: '12-15 reps',
    instruction_text:
      'Curl dumbbells toward shoulders with a controlled motion. Squeeze at top. Keep elbows pinned at sides.',
    video_file: 'Dumbbell Bicep Curls.mp4',
    is_active: true,
  },
  {
    slug: 'dumbbell_chest_press_in_cab',
    name: 'Dumbbell Chest Press In Cab',
    category: 'upper_body',
    equipment_type: 'dumbbells',
    workout_style: 'strength',
    difficulty_level: 'medium',
    movement_pattern: 'push',
    sets_default: 3,
    reps_default: '10-12 reps',
    instruction_text:
      'Lie on your bunk or seat in the cab. Press dumbbells from chest height straight up then lower with control.',
    video_file: 'Dumbbell Chest Press (In Cab).mp4',
    is_active: true,
  },
  {
    slug: 'dumbbell_front_raise',
    name: 'Dumbbell Front Raise',
    category: 'upper_body',
    equipment_type: 'dumbbells',
    workout_style: 'burn',
    difficulty_level: 'easy',
    movement_pattern: 'press',
    sets_default: 3,
    reps_default: '12-15 reps',
    instruction_text:
      'Hold dumbbell in front of thigh. Raise to shoulder height with a controlled motion. Alternate arms.',
    video_file: 'Dumbbell Front Raises.mp4',
    is_active: true,
  },
  {
    slug: 'dumbbell_lateral_raise',
    name: 'Dumbbell Lateral Raise',
    category: 'upper_body',
    equipment_type: 'dumbbells',
    workout_style: 'strength',
    difficulty_level: 'medium',
    movement_pattern: 'press',
    sets_default: 3,
    reps_default: '12-15 reps',
    instruction_text:
      'Raise dumbbells to sides until parallel with floor. Slight bend in elbow. Control them on the way down.',
    video_file: 'Dumbell Lateral Raises.mp4',
    is_active: true,
  },
  {
    slug: 'dumbbell_overhead_tricep_extension',
    name: 'Dumbbell Overhead Tricep Extension',
    category: 'upper_body',
    equipment_type: 'dumbbells',
    workout_style: 'strength',
    difficulty_level: 'medium',
    movement_pattern: 'push',
    sets_default: 3,
    reps_default: '12-15 reps',
    instruction_text:
      'Hold dumbbell overhead with both hands. Lower behind head by bending elbows. Extend fully and repeat.',
    video_file: 'Dumbbell Overhead Tricep Extension.mp4',
    is_active: true,
  },
  {
    slug: 'dumbbell_shoulder_press',
    name: 'Dumbbell Shoulder Press',
    category: 'upper_body',
    equipment_type: 'dumbbells',
    workout_style: 'strength',
    difficulty_level: 'medium',
    movement_pattern: 'press',
    sets_default: 3,
    reps_default: '10-12 reps',
    instruction_text:
      'Press dumbbells overhead from shoulder height. Can be done seated in cab or standing at a truck stop.',
    video_file: 'Dumbell Shoulder Press .mp4',
    is_active: true,
  },
  {
    slug: 'single_arm_dumbbell_row',
    name: 'Single Arm Dumbbell Row',
    category: 'upper_body',
    equipment_type: 'dumbbells',
    workout_style: 'strength',
    difficulty_level: 'medium',
    movement_pattern: 'pull',
    sets_default: 3,
    reps_default: '12 per side',
    instruction_text:
      'Brace one hand on a surface. Pull dumbbell to hip driving elbow back. Keep torso flat. Control the return.',
    video_file: 'Single Arm Dumbbell Row.mp4',
    is_active: true,
  },
  // ── Lower Body / Bodyweight ──────────────────────────────────────────────
  {
    slug: 'bodyweight_squat',
    name: 'Bodyweight Squat',
    category: 'lower_body',
    equipment_type: 'bodyweight',
    workout_style: 'strength',
    difficulty_level: 'easy',
    movement_pattern: 'squat',
    sets_default: 3,
    reps_default: '15-20 reps',
    instruction_text:
      'Feet shoulder-width apart, toes slightly out. Squat until thighs are parallel to floor. Drive through heels to stand.',
    video_file: 'Bodyweight Squats.mp4',
    is_active: true,
  },
  {
    slug: 'front_lunge',
    name: 'Front Lunge',
    category: 'lower_body',
    equipment_type: 'bodyweight',
    workout_style: 'strength',
    difficulty_level: 'medium',
    movement_pattern: 'lunge',
    sets_default: 3,
    reps_default: '12 per side',
    instruction_text:
      'Step forward with one foot into a lunge. Keep front shin vertical. Drive through front heel to return to standing.',
    video_file: 'Front Lunges.mp4',
    is_active: true,
  },
  {
    slug: 'glute_bridge',
    name: 'Glute Bridge',
    category: 'lower_body',
    equipment_type: 'bodyweight',
    workout_style: 'strength',
    difficulty_level: 'easy',
    movement_pattern: 'bridge',
    sets_default: 3,
    reps_default: '15-20 reps',
    instruction_text:
      'Lie on back with feet flat on ground. Drive hips upward squeezing glutes hard at top. Lower slowly and repeat.',
    video_file: 'Glute Bridge.mp4',
    is_active: true,
  },
  {
    slug: 'step_up',
    name: 'Step Up',
    category: 'lower_body',
    equipment_type: 'bodyweight',
    workout_style: 'strength',
    difficulty_level: 'medium',
    movement_pattern: 'lunge',
    sets_default: 3,
    reps_default: '12 per side',
    instruction_text:
      'Step up onto truck step with one foot. Drive through that heel to stand. Step back down and alternate.',
    video_file: 'Step Ups.mp4',
    is_active: true,
  },
  {
    slug: 'sumo_squat',
    name: 'Sumo Squat',
    category: 'lower_body',
    equipment_type: 'bodyweight',
    workout_style: 'strength',
    difficulty_level: 'easy',
    movement_pattern: 'squat',
    sets_default: 3,
    reps_default: '12-15 reps',
    instruction_text:
      'Wide stance with toes turned out. Squat with knees tracking over toes. Drive hips up and squeeze glutes at top.',
    video_file: 'Sumo Squats.mp4',
    is_active: true,
  },
  {
    slug: 'wall_sit',
    name: 'Wall Sit',
    category: 'lower_body',
    equipment_type: 'bodyweight',
    workout_style: 'burn',
    difficulty_level: 'medium',
    movement_pattern: 'squat',
    sets_default: 3,
    reps_default: '30-45 sec',
    instruction_text:
      'Back flat against wall with thighs parallel to floor and knees at 90 degrees. Hold for the full duration.',
    video_file: 'Wall Sit.mp4',
    is_active: true,
  },
  // ── Lower Body / Bands ───────────────────────────────────────────────────
  {
    slug: 'band_lateral_walk',
    name: 'Band Lateral Walk',
    category: 'lower_body',
    equipment_type: 'bands',
    workout_style: 'burn',
    difficulty_level: 'medium',
    movement_pattern: 'lunge',
    sets_default: 3,
    reps_default: '12 per side',
    instruction_text:
      'Band just above knees. Maintain a slight squat. Take controlled side-steps keeping constant tension in the band.',
    video_file: 'Band Lateral Walk.mp4',
    is_active: true,
  },
  // ── Lower Body / Dumbbells ───────────────────────────────────────────────
  {
    slug: 'dumbbell_front_lunge',
    name: 'Dumbbell Front Lunge',
    category: 'lower_body',
    equipment_type: 'dumbbells',
    workout_style: 'strength',
    difficulty_level: 'medium',
    movement_pattern: 'lunge',
    sets_default: 3,
    reps_default: '12 per side',
    instruction_text:
      'Hold dumbbells at sides. Step forward into a lunge keeping torso upright. Push through front heel to return.',
    video_file: 'Dumbbell Front Lunges.mp4',
    is_active: true,
  },
  {
    slug: 'dumbbell_split_squat',
    name: 'Dumbbell Split Squat',
    category: 'lower_body',
    equipment_type: 'dumbbells',
    workout_style: 'strength',
    difficulty_level: 'hard',
    movement_pattern: 'lunge',
    sets_default: 3,
    reps_default: '10 per side',
    instruction_text:
      'Hold dumbbells at sides with rear foot trailing. Lower back knee toward ground. Drive through front heel to rise.',
    video_file: 'Dumbbell Split Squats.mp4',
    is_active: true,
  },
  {
    slug: 'dumbbell_split_squat_outside',
    name: 'Dumbbell Split Squat Outside',
    category: 'lower_body',
    equipment_type: 'dumbbells',
    workout_style: 'strength',
    difficulty_level: 'hard',
    movement_pattern: 'lunge',
    sets_default: 3,
    reps_default: '10 per side',
    instruction_text:
      'Rear foot elevated on truck step. Hold dumbbells at sides. Lower back knee toward ground and drive back up.',
    video_file: 'Dumbbell Split Squats (Outside).mp4',
    is_active: true,
  },
  {
    slug: 'goblet_squat',
    name: 'Goblet Squat',
    category: 'lower_body',
    equipment_type: 'dumbbells',
    workout_style: 'strength',
    difficulty_level: 'medium',
    movement_pattern: 'squat',
    sets_default: 3,
    reps_default: '12-15 reps',
    instruction_text:
      'Hold dumbbell vertically at chest. Squat deep with elbows tracking inside knees. Drive through heels to stand.',
    video_file: 'Goblet Squats.mp4',
    is_active: true,
  },
  {
    slug: 'romanian_deadlift',
    name: 'Romanian Deadlift',
    category: 'lower_body',
    equipment_type: 'dumbbells',
    workout_style: 'strength',
    difficulty_level: 'medium',
    movement_pattern: 'hinge',
    sets_default: 3,
    reps_default: '12-15 reps',
    instruction_text:
      'Hold dumbbells in front of thighs. Hinge at hips with slight knee bend lowering to mid-shin. Drive hips forward to stand.',
    video_file: 'Romanian Deadlift.mp4',
    is_active: true,
  },
  // ── Core / Bodyweight ────────────────────────────────────────────────────
  {
    slug: 'bicycle_crunch',
    name: 'Bicycle Crunch',
    category: 'core',
    equipment_type: 'bodyweight',
    workout_style: 'burn',
    difficulty_level: 'medium',
    movement_pattern: 'anti_rotation',
    sets_default: 3,
    reps_default: '15 per side',
    instruction_text:
      'Hands behind head, legs off ground. Drive elbow to opposite knee while fully extending the other leg. Alternate.',
    video_file: 'Bicycle Crunches.mp4',
    is_active: true,
  },
  {
    slug: 'bird_dog',
    name: 'Bird Dog',
    category: 'core',
    equipment_type: 'bodyweight',
    workout_style: 'strength',
    difficulty_level: 'easy',
    movement_pattern: 'core_stability',
    sets_default: 3,
    reps_default: '10 per side',
    instruction_text:
      'On hands and knees. Extend opposite arm and leg simultaneously keeping hips level. Hold 2 seconds each rep.',
    video_file: 'Bird Dog.mp4',
    is_active: true,
  },
  {
    slug: 'dead_bug',
    name: 'Dead Bug',
    category: 'core',
    equipment_type: 'bodyweight',
    workout_style: 'strength',
    difficulty_level: 'easy',
    movement_pattern: 'core_stability',
    sets_default: 3,
    reps_default: '10 per side',
    instruction_text:
      'Lie face up, arms extended above chest. Lower opposite arm and leg while pressing lower back into floor. Switch sides.',
    video_file: 'Dead Bug.mp4',
    is_active: true,
  },
  {
    slug: 'flutter_kicks',
    name: 'Flutter Kicks',
    category: 'core',
    equipment_type: 'bodyweight',
    workout_style: 'burn',
    difficulty_level: 'medium',
    movement_pattern: 'hip_flexion',
    sets_default: 3,
    reps_default: '20 per side',
    instruction_text:
      'Lie flat with lower back pressed down. Hover legs 6 inches off ground. Alternate small kicks rhythmically.',
    video_file: 'Flutter Kicks.mp4',
    is_active: true,
  },
  {
    slug: 'hollow_body_hold',
    name: 'Hollow Body Hold',
    category: 'core',
    equipment_type: 'bodyweight',
    workout_style: 'strength',
    difficulty_level: 'hard',
    movement_pattern: 'core_stability',
    sets_default: 3,
    reps_default: '20-30 sec',
    instruction_text:
      'Lie on back and press lower back into floor. Raise arms overhead and hover legs 6 inches. Hold and breathe.',
    video_file: 'Hollow Body Hold.mp4',
    is_active: true,
  },
  {
    slug: 'leg_raise',
    name: 'Leg Raise',
    category: 'core',
    equipment_type: 'bodyweight',
    workout_style: 'strength',
    difficulty_level: 'medium',
    movement_pattern: 'hip_flexion',
    sets_default: 3,
    reps_default: '12-15 reps',
    instruction_text:
      'Lie flat on back with hands at sides. Raise straight legs to 90 degrees. Lower slowly without touching the ground.',
    video_file: 'Leg Raises.mp4',
    is_active: true,
  },
  {
    slug: 'mountain_climber',
    name: 'Mountain Climber',
    category: 'core',
    equipment_type: 'bodyweight',
    workout_style: 'burn',
    difficulty_level: 'medium',
    movement_pattern: 'core_stability',
    sets_default: 3,
    reps_default: '20 per side',
    instruction_text:
      'In a push-up position alternate driving knees toward chest at a controlled pace. Keep hips level throughout.',
    video_file: 'Mountain Climbers.mp4',
    is_active: true,
  },
  {
    slug: 'plank_hold',
    name: 'Plank Hold',
    category: 'core',
    equipment_type: 'bodyweight',
    workout_style: 'strength',
    difficulty_level: 'medium',
    movement_pattern: 'core_stability',
    sets_default: 3,
    reps_default: '30-45 sec',
    instruction_text:
      'Forearms on ground, body in a straight line from head to heels. Squeeze glutes and brace core. Hold position.',
    video_file: 'Plank Hold.mp4',
    is_active: true,
  },
  {
    slug: 'side_plank',
    name: 'Side Plank',
    category: 'core',
    equipment_type: 'bodyweight',
    workout_style: 'strength',
    difficulty_level: 'medium',
    movement_pattern: 'anti_rotation',
    sets_default: 3,
    reps_default: '20-30 sec per side',
    instruction_text:
      'Side-lying on forearm with body in a straight line. Stack feet or stagger them for balance. Hold each side.',
    video_file: 'Side Plank.mp4',
    is_active: true,
  },
  // ── Mobility / Bodyweight ────────────────────────────────────────────────
  {
    slug: 'cobra_stretch',
    name: 'Cobra Stretch',
    category: 'mobility',
    equipment_type: 'bodyweight',
    workout_style: 'mobility',
    difficulty_level: 'easy',
    movement_pattern: 'spine_decompression',
    sets_default: 2,
    reps_default: '20-30 sec',
    instruction_text:
      'Lie face down with hands under shoulders. Push upper body up keeping hips on ground. Open chest and breathe.',
    video_file: 'Cobra Stretch.mp4',
    is_active: true,
  },
  {
    slug: 'doorway_chest_stretch',
    name: 'Doorway Chest Stretch',
    category: 'mobility',
    equipment_type: 'bodyweight',
    workout_style: 'mobility',
    difficulty_level: 'easy',
    movement_pattern: 'thoracic_mobility',
    sets_default: 2,
    reps_default: '30 sec per side',
    instruction_text:
      'Place forearm against cab door frame at 90 degrees. Rotate body away to open chest. Hold and breathe deeply.',
    video_file: 'Doorway Chest Stretch.mp4',
    is_active: true,
  },
  {
    slug: 'pigeon_stretch',
    name: 'Pigeon Stretch',
    category: 'mobility',
    equipment_type: 'bodyweight',
    workout_style: 'mobility',
    difficulty_level: 'easy',
    movement_pattern: 'hip_mobility',
    sets_default: 2,
    reps_default: '30 sec per side',
    instruction_text:
      'Bring one leg forward with knee bent at 90 degrees. Extend rear leg back. Lower chest forward for deeper stretch.',
    video_file: 'Pigeon Stretch.mp4',
    is_active: true,
  },
  {
    slug: 'seated_forward_fold',
    name: 'Seated Forward Fold',
    category: 'mobility',
    equipment_type: 'bodyweight',
    workout_style: 'mobility',
    difficulty_level: 'easy',
    movement_pattern: 'spine_decompression',
    sets_default: 2,
    reps_default: '30-45 sec',
    instruction_text:
      'Sit with legs extended. Hinge forward from hips reaching toward feet. Relax shoulders and breathe into the stretch.',
    video_file: 'Seated Forward Fold.mp4',
    is_active: true,
  },
  {
    slug: 'shoulder_circles',
    name: 'Shoulder Circles',
    category: 'mobility',
    equipment_type: 'bodyweight',
    workout_style: 'mobility',
    difficulty_level: 'easy',
    movement_pattern: 'thoracic_mobility',
    sets_default: 2,
    reps_default: '10 each way',
    instruction_text:
      'Roll shoulders slowly in large circles backward then reverse. Warms up shoulder joints before upper body work.',
    video_file: 'Shoulder Circles.mp4',
    is_active: true,
  },
  {
    slug: 'thoracic_rotation',
    name: 'Thoracic Rotation',
    category: 'mobility',
    equipment_type: 'bodyweight',
    workout_style: 'mobility',
    difficulty_level: 'easy',
    movement_pattern: 'thoracic_mobility',
    sets_default: 2,
    reps_default: '10 per side',
    instruction_text:
      'On all fours with one hand behind head. Rotate upper back toward ceiling then back down. Controlled movement.',
    video_file: 'Thoracic Rotation.mp4',
    is_active: true,
  },
];

if (__DEV__) {
  const count = EXERCISE_LIBRARY_V1.length;
  const slugs = EXERCISE_LIBRARY_V1.map((e) => e.slug);
  const unique = new Set(slugs);
  console.log(`[v1 registry] loaded ${count} exercises (${unique.size} unique slugs)`);
  if (unique.size !== count) {
    console.warn('[v1 registry] duplicate slugs detected:', slugs.filter((s, i) => slugs.indexOf(s) !== i));
  }
}

/** Lookup by slug */
export function getV1ExerciseBySlug(slug: string): V1Exercise | undefined {
  return EXERCISE_LIBRARY_V1.find((e) => e.slug === slug);
}

/** Convert a display name to a lookup slug (lowercase, spaces→underscore, strip punctuation) */
export function nameToSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '_');
}

/** Find the v1 entry whose slug matches the normalized display name */
export function getV1ExerciseByName(name: string): V1Exercise | undefined {
  const slug = nameToSlug(name);
  return EXERCISE_LIBRARY_V1.find((e) => e.slug === slug);
}

/** All 49 active exercise display names */
export const V1_EXERCISE_NAMES: string[] = EXERCISE_LIBRARY_V1.map((e) => e.name);
