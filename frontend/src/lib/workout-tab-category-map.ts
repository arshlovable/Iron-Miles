/**
 * Internal reference: Workouts tab categories → equipment buckets → exercise names.
 * No Supabase client; no DB schema. Duplicating a display name across tabs is intentional
 * (one DB row can appear in multiple views later via tags).
 *
 * `equipment` slugs align with `exercises.equipment_type` where possible: bodyweight | bands | dumbbells.
 *
 * All exercise names here are v1 active exercises (backed by recorded demo videos).
 */

export const WORKOUT_TAB_SLUGS = ['cab', 'truck_stop', 'core', 'mobility'] as const;
export type WorkoutTabSlug = (typeof WORKOUT_TAB_SLUGS)[number];

export function isWorkoutTabSlug(value: string): value is WorkoutTabSlug {
  return (WORKOUT_TAB_SLUGS as readonly string[]).includes(value);
}

export const EQUIPMENT_SLUGS = ['bodyweight', 'bands', 'dumbbells'] as const;
export type EquipmentSlug = (typeof EQUIPMENT_SLUGS)[number];

export type WorkoutTabMeta = { slug: WorkoutTabSlug; label: string };
export const WORKOUT_TABS: WorkoutTabMeta[] = [
  { slug: 'cab', label: 'Cab Workouts' },
  { slug: 'truck_stop', label: 'Truck Stop Workouts' },
  { slug: 'core', label: 'Core' },
  { slug: 'mobility', label: 'Mobility' },
];

export type EquipmentMeta = { slug: EquipmentSlug; label: string };
export const EQUIPMENT_BUCKETS: EquipmentMeta[] = [
  { slug: 'bodyweight', label: 'Bodyweight' },
  { slug: 'bands', label: 'Resistance Bands' },
  { slug: 'dumbbells', label: 'Dumbbells' },
];

/** Section headings for category browse UI (no horizontal scroll). */
export const EQUIPMENT_SECTION_HEADING: Record<EquipmentSlug, string> = {
  bodyweight: 'BODYWEIGHT',
  bands: 'RESISTANCE BANDS',
  dumbbells: 'DUMBBELLS',
};

/** Display / canonical name as used in the Iron Miles v1 library. */
export type ExerciseDisplayName = string;

/**
 * When the display label differs from what was originally stored in Supabase,
 * list every string that should match a Supabase `.in('name', ...)` filter.
 * Keys are v1 display names as they appear in WORKOUT_TAB_EXERCISE_MAP.
 *
 * After the v1 migration, DB names will match the display names exactly.
 * These aliases handle any lingering legacy rows.
 */
export const SUPABASE_NAME_ALIASES: Partial<Record<string, readonly string[]>> = {
  'Push Up': ['Push-Up', 'Push Up'],
  'Wide Push Up': ['Wide Push-Up', 'Wide Push Up'],
  'Diamond Push Up': ['Diamond Push-Up', 'Diamond Push Up'],
  'Pike Push Up': ['Pike Push-Up', 'Pike Push Up'],
  'Incline Push Up': ['Incline Push-Up', 'Incline Push Up'],
  'Decline Push Up': ['Decline Push-Up', 'Decline Push Up'],
  'Step Up': ['Step-Up', 'Step Up'],
  'Band Face Pull': ['Band Face Pull', 'Band Face Pulls'],
  'Band Pull Apart': ['Band Pull-Apart', 'Band Pull Apart'],
  'Banded Row': ['Banded Row', 'Seated Band Row'],
  'Plank Hold': ['Plank Hold', 'Plank'],
  'Shoulder Circles': ['Shoulder Circles', 'Shoulder Circle'],
  'Thoracic Rotation': ['Thoracic Rotation', 'Thoracic Rotations'],
  'Doorway Chest Stretch': ['Doorway Chest Stretch', 'Doorframe Chest Stretch'],
  'Dumbbell Chest Press In Cab': ['Dumbbell Chest Press In Cab', 'Dumbbell Floor Press'],
  'Single Arm Dumbbell Row': ['Single Arm Dumbbell Row', 'Bent-Over Dumbbell Row', 'Dumbbell One-Arm Row'],
  'Dumbbell Lateral Raise': ['Dumbbell Lateral Raise', 'Single Arm Side Laterals'],
  'Sumo Squat': ['Sumo Squat', 'Sumo Squats'],
  'Mountain Climber': ['Mountain Climber', 'Slow Mountain Climber'],
};

/**
 * Nested: tab → equipment → v1 display names (order = UI spec order).
 *
 * CAB: exercises done inside or immediately adjacent to the cab.
 * TRUCK STOP: exercises requiring more open space outside the truck.
 * CORE: abdominal and stability work.
 * MOBILITY: stretches and range-of-motion exercises.
 */
export const WORKOUT_TAB_EXERCISE_MAP: Record<
  WorkoutTabSlug,
  Record<EquipmentSlug, readonly ExerciseDisplayName[]>
> = {
  cab: {
    bodyweight: [
      'Incline Push Up',
      'Glute Bridge',
      'Dead Bug',
      'Bird Dog',
      'Plank Hold',
      'Side Plank',
      'Hollow Body Hold',
      'Flutter Kicks',
      'Leg Raise',
      'Shoulder Circles',
    ],
    bands: [
      'Banded Row',
      'Band Face Pull',
      'Band Lateral Raise',
      'Band Pull Apart',
      'Band Upright Row',
      'Banded Bent Over Row',
    ],
    dumbbells: [
      'Dumbbell Chest Press In Cab',
      'Dumbbell Shoulder Press',
      'Dumbbell Lateral Raise',
      'Dumbbell Bicep Curl',
      'Dumbbell Front Raise',
      'Dumbbell Overhead Tricep Extension',
      'Arnold Press',
      'Single Arm Dumbbell Row',
    ],
  },
  truck_stop: {
    bodyweight: [
      'Push Up',
      'Wide Push Up',
      'Decline Push Up',
      'Diamond Push Up',
      'Pike Push Up',
      'Shoulder Tap Plank',
      'Tricep Dip',
      'Bodyweight Squat',
      'Sumo Squat',
      'Front Lunge',
      'Step Up',
      'Wall Sit',
      'Mountain Climber',
      'Bicycle Crunch',
    ],
    bands: [
      'Band Lateral Walk',
      'Banded Row',
      'Band Face Pull',
      'Band Pull Apart',
      'Banded Bent Over Row',
      'Band Upright Row',
      'Band Lateral Raise',
    ],
    dumbbells: [
      'Goblet Squat',
      'Romanian Deadlift',
      'Dumbbell Front Lunge',
      'Dumbbell Split Squat',
      'Dumbbell Split Squat Outside',
      'Dumbbell Shoulder Press',
      'Arnold Press',
      'Single Arm Dumbbell Row',
    ],
  },
  core: {
    bodyweight: [
      'Dead Bug',
      'Bird Dog',
      'Plank Hold',
      'Side Plank',
      'Hollow Body Hold',
      'Bicycle Crunch',
      'Flutter Kicks',
      'Leg Raise',
      'Mountain Climber',
    ],
    bands: [],
    dumbbells: [],
  },
  mobility: {
    bodyweight: [
      'Cobra Stretch',
      'Pigeon Stretch',
      'Doorway Chest Stretch',
      'Seated Forward Fold',
      'Shoulder Circles',
      'Thoracic Rotation',
      'Glute Bridge',
    ],
    bands: [],
    dumbbells: [],
  },
};

/** All display names for one tab and optional equipment bucket (fixed equipment order). */
export function getExerciseDisplayNamesForTab(
  tab: WorkoutTabSlug,
  equipment?: EquipmentSlug
): ExerciseDisplayName[] {
  const block = WORKOUT_TAB_EXERCISE_MAP[tab];
  if (equipment) return [...block[equipment]];
  const out: ExerciseDisplayName[] = [];
  for (const slug of EQUIPMENT_SLUGS) {
    out.push(...block[slug]);
  }
  return out;
}

/** Expand a display name to all strings useful for Supabase `name` filters (includes self + aliases). */
export function expandDisplayNameForQuery(displayName: string): readonly string[] {
  const extra = SUPABASE_NAME_ALIASES[displayName];
  if (!extra?.length) return [displayName];
  return [...new Set([displayName, ...extra])];
}

/** Unique flattened match names for a tab (for `.in('name', names)` style queries). */
export function getAllSupabaseMatchNamesForTab(tab: WorkoutTabSlug): string[] {
  const seen = new Set<string>();
  for (const name of getExerciseDisplayNamesForTab(tab)) {
    for (const n of expandDisplayNameForQuery(name)) {
      seen.add(n);
    }
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}

/** Match names for one tab + equipment bucket. */
export function getSupabaseMatchNamesForTabAndEquipment(
  tab: WorkoutTabSlug,
  equipment: EquipmentSlug
): string[] {
  const seen = new Set<string>();
  for (const name of WORKOUT_TAB_EXERCISE_MAP[tab][equipment]) {
    for (const n of expandDisplayNameForQuery(name)) {
      seen.add(n);
    }
  }
  return [...seen].sort((a, b) => a.localeCompare(b));
}
