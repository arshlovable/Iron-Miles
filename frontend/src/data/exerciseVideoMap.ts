/**
 * Iron Miles v1 Exercise Video Map
 *
 * Maps each exercise slug to a locally bundled require() asset.
 * All require() calls must be static strings — the bundler resolves them at
 * build time. Do NOT use dynamic require() here.
 *
 * Filenames match the actual files inside frontend/assets/exercise-videos/.
 * Note: two filenames contain a typo ("Dumbell" instead of "Dumbbell") and
 * one has a trailing space — these match the real files exactly.
 */

import { nameToSlug } from './exerciseLibraryV1';

const EXERCISE_VIDEO_MAP: Record<string, number> = {
  // Upper Body / Bodyweight
  push_up: require('../../assets/exercise-videos/Push Ups.mp4'),
  wide_push_up: require('../../assets/exercise-videos/Wide Push Ups.mp4'),
  diamond_push_up: require('../../assets/exercise-videos/Diamond Push Ups.mp4'),
  pike_push_up: require('../../assets/exercise-videos/Pike Push Ups.mp4'),
  incline_push_up: require('../../assets/exercise-videos/Incline Push Ups.mp4'),
  decline_push_up: require('../../assets/exercise-videos/Decline Push Ups.mp4'),
  tricep_dip: require('../../assets/exercise-videos/Tricep Dips.mp4'),
  shoulder_tap_plank: require('../../assets/exercise-videos/Shoulder Tap Plank.mp4'),

  // Upper Body / Bands
  band_face_pull: require('../../assets/exercise-videos/Band Face Pulls.mp4'),
  band_lateral_raise: require('../../assets/exercise-videos/Band Lateral Raises.mp4'),
  band_pull_apart: require('../../assets/exercise-videos/Band Pull Apart.mp4'),
  band_upright_row: require('../../assets/exercise-videos/Band Upright Row.mp4'),
  banded_bent_over_row: require('../../assets/exercise-videos/Banded Bent Over Row.mp4'),
  banded_row: require('../../assets/exercise-videos/Banded Row.mp4'),

  // Upper Body / Dumbbells
  arnold_press: require('../../assets/exercise-videos/Arnold Press.mp4'),
  dumbbell_bicep_curl: require('../../assets/exercise-videos/Dumbbell Bicep Curls.mp4'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  dumbbell_chest_press_in_cab: require('../../assets/exercise-videos/Dumbbell Chest Press (In Cab).mp4'),
  dumbbell_front_raise: require('../../assets/exercise-videos/Dumbbell Front Raises.mp4'),
  dumbbell_lateral_raise: require('../../assets/exercise-videos/Dumbell Lateral Raises.mp4'),
  dumbbell_overhead_tricep_extension: require('../../assets/exercise-videos/Dumbbell Overhead Tricep Extension.mp4'),
  dumbbell_shoulder_press: require('../../assets/exercise-videos/Dumbell Shoulder Press .mp4'),
  single_arm_dumbbell_row: require('../../assets/exercise-videos/Single Arm Dumbbell Row.mp4'),

  // Lower Body / Bodyweight
  bodyweight_squat: require('../../assets/exercise-videos/Bodyweight Squats.mp4'),
  front_lunge: require('../../assets/exercise-videos/Front Lunges.mp4'),
  glute_bridge: require('../../assets/exercise-videos/Glute Bridge.mp4'),
  step_up: require('../../assets/exercise-videos/Step Ups.mp4'),
  sumo_squat: require('../../assets/exercise-videos/Sumo Squats.mp4'),
  wall_sit: require('../../assets/exercise-videos/Wall Sit.mp4'),

  // Lower Body / Bands
  band_lateral_walk: require('../../assets/exercise-videos/Band Lateral Walk.mp4'),

  // Lower Body / Dumbbells
  dumbbell_front_lunge: require('../../assets/exercise-videos/Dumbbell Front Lunges.mp4'),
  dumbbell_split_squat: require('../../assets/exercise-videos/Dumbbell Split Squats.mp4'),
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  dumbbell_split_squat_outside: require('../../assets/exercise-videos/Dumbbell Split Squats (Outside).mp4'),
  goblet_squat: require('../../assets/exercise-videos/Goblet Squats.mp4'),
  romanian_deadlift: require('../../assets/exercise-videos/Romanian Deadlift.mp4'),

  // Core / Bodyweight
  bicycle_crunch: require('../../assets/exercise-videos/Bicycle Crunches.mp4'),
  bird_dog: require('../../assets/exercise-videos/Bird Dog.mp4'),
  dead_bug: require('../../assets/exercise-videos/Dead Bug.mp4'),
  flutter_kicks: require('../../assets/exercise-videos/Flutter Kicks.mp4'),
  hollow_body_hold: require('../../assets/exercise-videos/Hollow Body Hold.mp4'),
  leg_raise: require('../../assets/exercise-videos/Leg Raises.mp4'),
  mountain_climber: require('../../assets/exercise-videos/Mountain Climbers.mp4'),
  plank_hold: require('../../assets/exercise-videos/Plank Hold.mp4'),
  side_plank: require('../../assets/exercise-videos/Side Plank.mp4'),

  // Mobility / Bodyweight
  cobra_stretch: require('../../assets/exercise-videos/Cobra Stretch.mp4'),
  doorway_chest_stretch: require('../../assets/exercise-videos/Doorway Chest Stretch.mp4'),
  pigeon_stretch: require('../../assets/exercise-videos/Pigeon Stretch.mp4'),
  seated_forward_fold: require('../../assets/exercise-videos/Seated Forward Fold.mp4'),
  shoulder_circles: require('../../assets/exercise-videos/Shoulder Circles.mp4'),
  thoracic_rotation: require('../../assets/exercise-videos/Thoracic Rotation.mp4'),
};

/**
 * Returns the local bundled video asset for the given exercise slug.
 * Returns null when no mapping exists (triggers "coming soon" fallback).
 */
export function getLocalVideoBySlug(slug: string): number | null {
  const asset = EXERCISE_VIDEO_MAP[slug];
  if (__DEV__ && !asset) {
    console.warn(`[exerciseVideoMap] no local video for slug: "${slug}"`);
  }
  return asset ?? null;
}

/**
 * Returns the local bundled video asset for the given exercise display name.
 * Returns null when no mapping exists.
 */
export function getLocalVideoByName(name: string): number | null {
  const slug = nameToSlug(name);
  return getLocalVideoBySlug(slug);
}

if (__DEV__) {
  const mapped = Object.keys(EXERCISE_VIDEO_MAP).length;
  console.log(`[exerciseVideoMap] ${mapped} exercises have local videos`);
}
