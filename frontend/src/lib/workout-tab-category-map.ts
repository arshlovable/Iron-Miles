/**
 * Internal reference: Workouts tab categories → equipment buckets → exercise names.
 * No Supabase client; no DB schema. Duplicating a display name across tabs is intentional
 * (one DB row can appear in multiple views later via tags).
 *
 * `equipment` slugs align with `exercises.equipment_type` where possible: bodyweight | bands | dumbbells.
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

/** Display / canonical name as used in the Iron Miles library spec. */
export type ExerciseDisplayName = string;

/**
 * When `exercises.name` (or query filter) differs from the display label, list every
 * string that should match a Supabase `.in('name', ...)` or client-side filter.
 * Keys are display names as they appear in WORKOUT_TAB_EXERCISE_MAP.
 */
export const SUPABASE_NAME_ALIASES: Partial<Record<string, readonly string[]>> = {
  'Marching Carry Hold with Dumbbell': ['Marching Carry Hold'],
  'Pall of Hold Banded': ['Pallof Hold (Banded)', 'Pallof Hold Banded', 'Pall of Hold Banded'],
  'Pallof Press Banded': ['Pallof Press (Banded)', 'Pallof Press Banded'],
  'Banded Paused Squats': ['Banded Paused Squat', 'Banded Paused Squats'],
  'Band Rows': ['Band Row', 'Band Rows'],
  'Band Face Pulls': ['Band Face Pull', 'Band Face Pulls'],
  'Dumbbell Rear Delt Flies': ['Dumbbell Rear Delt Fly', 'Dumbbell Rear Delt Flies'],
  'Dumbbell Squat Slow Eccentric': ['Dumbbell Squat (Slow Eccentric)', 'Dumbbell Squat Slow Eccentric'],
  'Single-Leg Dumbbell RDL': ['Single-Leg Dumbbell RDL', 'Single Leg Dumbbell RDL'],
  'Glute Bridge Holds': ['Glute Bridge', 'Glute Bridge Holds'],
};

/**
 * Nested: tab → equipment → display names (order = UI / spec order).
 */
export const WORKOUT_TAB_EXERCISE_MAP: Record<
  WorkoutTabSlug,
  Record<EquipmentSlug, readonly ExerciseDisplayName[]>
> = {
  cab: {
    bodyweight: [
      'Wall Sit',
      'Bodyweight Squat',
      'Tempo Squat',
      'Squat Pulse Hold',
      'Deep Squat Hold with Breathing',
      'Glute Bridge',
      'Single-Leg Glute Bridge',
      'Hip Extension March Bridge',
      'Hip Hinge Drill',
      'Isometric Hinge Hold',
      'Incline Push-Ups',
      'Seated Knee Raises',
      'Single-Leg Dead Bugs',
      'Plank',
      'Side Plank',
      'Marching in Place Hold',
      'Cat-Cow + Thoracic Rotation Flow',
      'Deep Breathing Reset',
      'Neck Mobility',
      'Shoulder Circles',
    ],
    bands: [
      'Banded Squat',
      'Banded Tempo Squat',
      'Banded Paused Squats',
      'Band Good Morning',
      'Band Chest Press',
      'Band Overhead Press',
      'Single Arm Banded Side Lateral Raises',
      'Band Rows',
      'One-Arm Band Row',
      'Isometric Band Row Hold',
      'Pall of Hold Banded',
    ],
    dumbbells: [
      'Single Arm Side Laterals',
      'Dumbbell Shoulder Press',
      'Dumbbell Leg Raises',
      'Marching Carry Hold with Dumbbell',
    ],
  },
  truck_stop: {
    bodyweight: [
      'Step-Ups',
      'Reverse Lunge',
      'Walking Lunge',
      'Push-Ups',
      'Decline Push-Ups',
      'Paused Push-Ups',
      'Shoulder Tap Push-Ups',
      'Single-Leg Bird Dogs',
      'Loaded Plank',
      'Slow Mountain Climber',
      'Backpack Deadlift',
      'Backpack Carry',
      'Marching Carry Hold',
    ],
    bands: [
      'Banded Squat',
      'Banded Tempo Squat',
      'Banded Paused Squats',
      'Band Good Morning',
      'Banded Hip Thrust',
      'Banded Hamstring Curls',
      'Band Rows',
      'One-Arm Band Row',
      'Band Face Pulls',
      'Band Lat Pulldown',
      'Band Resisted Push-Ups',
      'Pallof Press Banded',
    ],
    dumbbells: [
      'Goblet Squat',
      'Dumbbell Front Squat',
      'Dumbbell Squat Slow Eccentric',
      'Dumbbell Romanian Deadlift',
      'Single-Leg Dumbbell RDL',
      'Dumbbell Split Squat',
      'Dumbbell Floor Press',
      'Dumbbell Shoulder Press',
      'Arnold Press',
      'Single Arm Side Laterals',
      'Dumbbell One-Arm Row',
      'Dumbbell Rear Delt Flies',
      'Dumbbell Shrugs',
      'Farmer Carry',
      'Marching Carry Hold with Dumbbell',
    ],
  },
  core: {
    bodyweight: [
      'Single-Leg Dead Bugs',
      'Plank',
      'Side Plank',
      'Knee Raises',
      'Seated Knee Raises',
      'Single-Leg Bird Dogs',
      'Loaded Plank',
      'Slow Mountain Climber',
    ],
    bands: ['Pallof Press Banded', 'Pall of Hold Banded'],
    dumbbells: ['Dumbbell Leg Raises', 'Marching Carry Hold with Dumbbell', 'Farmer Carry'],
  },
  mobility: {
    bodyweight: [
      'Cat-Cow + Thoracic Rotation Flow',
      'Deep Squat Hold with Breathing',
      'Hip Hinge Drill',
      'Glute Bridge',
      'Glute Bridge Holds',
      'Shoulder Circles',
      'Neck Mobility',
      'Thoracic Rotations',
      'Marching in Place',
      'Walking',
      'Deep Diaphragmatic Breathing',
      'Deep Breathing Reset',
    ],
    bands: ['Band Pull-Aparts', 'Band Face Pulls', 'Isometric Band Row Hold', 'Pall of Hold Banded'],
    dumbbells: ['Marching Carry Hold with Dumbbell', 'Farmer Carry'],
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
  return [displayName, ...extra];
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
