import { supabase } from './supabase';

/** Mirrors restSecondsForStyle in generate-workout edge + workout-in-progress. */
export function computeRestSecondsForSnapshot(workoutStyle: string | null | undefined, difficulty: string): number {
  const s = (workoutStyle ?? 'strength').toLowerCase().trim();
  const d = (difficulty ?? 'medium').toLowerCase().trim();
  if (s === 'burn' || s === 'burn_calories') return d === 'easy' ? 15 : d === 'hard' ? 30 : 20;
  if (s === 'mobility') return 0;
  return d === 'hard' ? 45 : 60;
}

export type SaveWorkoutExerciseLine = {
  exercise_id: string;
  order_index: number;
  sets: number;
  reps: string;
  rest_seconds: number | null;
  instruction_override?: string | null;
};

export type SaveGeneratedWorkoutInput = {
  userId: string;
  sourceGeneratedWorkoutId: string;
  title: string;
  target_area: string;
  workout_style: string | null;
  duration_minutes: number;
  estimated_iron_miles: number;
  difficulty: string;
  equipment: string[];
  exercises: SaveWorkoutExerciseLine[];
};

export type SavedWorkoutRow = {
  id: string;
  user_id: string;
  title: string;
  target_area: string | null;
  workout_style: string | null;
  equipment: unknown;
  difficulty: string | null;
  duration_minutes: number;
  estimated_iron_miles: number;
  source: string;
  source_generated_workout_id: string | null;
  created_at: string;
  updated_at: string;
};

export async function fetchSavedWorkoutIdForGenerated(
  userId: string,
  sourceGeneratedWorkoutId: string,
): Promise<string | null> {
  const { data, error } = await supabase
    .from('saved_workouts')
    .select('id')
    .eq('user_id', userId)
    .eq('source_generated_workout_id', sourceGeneratedWorkoutId)
    .maybeSingle();

  if (error) {
    console.warn('[saved-workouts] fetchSavedWorkoutIdForGenerated:', error.message);
    return null;
  }
  return data?.id ?? null;
}

export async function isGeneratedWorkoutSaved(
  userId: string,
  sourceGeneratedWorkoutId: string,
): Promise<boolean> {
  const id = await fetchSavedWorkoutIdForGenerated(userId, sourceGeneratedWorkoutId);
  return Boolean(id);
}

export async function saveGeneratedWorkoutSnapshot(
  input: SaveGeneratedWorkoutInput,
): Promise<{ savedWorkoutId: string; alreadySaved: boolean } | { error: string }> {
  const {
    userId,
    sourceGeneratedWorkoutId,
    title,
    target_area,
    workout_style,
    duration_minutes,
    estimated_iron_miles,
    difficulty,
    equipment,
    exercises,
  } = input;

  if (!userId || !sourceGeneratedWorkoutId) {
    return { error: 'Missing user or workout id.' };
  }

  const lines = exercises.filter((e) => e.exercise_id);
  if (lines.length === 0) {
    return { error: 'No exercises to save.' };
  }

  const existingId = await fetchSavedWorkoutIdForGenerated(userId, sourceGeneratedWorkoutId);
  if (existingId) {
    return { savedWorkoutId: existingId, alreadySaved: true };
  }

  const { data: inserted, error: insertErr } = await supabase
    .from('saved_workouts')
    .insert({
      user_id: userId,
      title,
      target_area,
      workout_style,
      equipment,
      difficulty,
      duration_minutes,
      estimated_iron_miles,
      source: 'generated',
      source_generated_workout_id: sourceGeneratedWorkoutId,
    })
    .select('id')
    .limit(1);

  if (insertErr || !inserted?.length) {
    console.warn('[saved-workouts] insert saved_workouts:', insertErr?.message);
    return { error: insertErr?.message ?? 'Could not save workout.' };
  }

  const savedWorkoutId = inserted[0].id as string;

  const childRows = lines.map((e) => ({
    saved_workout_id: savedWorkoutId,
    exercise_id: e.exercise_id,
    order_index: e.order_index,
    sets: e.sets,
    reps: e.reps,
    rest_seconds: e.rest_seconds,
    instruction_override: e.instruction_override ?? null,
  }));

  const { error: childErr } = await supabase.from('saved_workout_exercises').insert(childRows);
  if (childErr) {
    console.warn('[saved-workouts] insert saved_workout_exercises:', childErr.message);
    await supabase.from('saved_workouts').delete().eq('id', savedWorkoutId);
    return { error: childErr.message ?? 'Could not save exercise lines.' };
  }

  return { savedWorkoutId, alreadySaved: false };
}

export async function listSavedWorkouts(userId: string): Promise<SavedWorkoutRow[]> {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('saved_workouts')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.warn('[saved-workouts] listSavedWorkouts:', error.message);
    return [];
  }
  return (data ?? []) as SavedWorkoutRow[];
}

export async function materializeSavedWorkoutToGenerated(
  userId: string,
  savedWorkoutId: string,
): Promise<{ generatedWorkoutId: string } | { error: string }> {
  if (!userId || !savedWorkoutId) {
    return { error: 'Missing ids.' };
  }

  const { data: parent, error: pErr } = await supabase
    .from('saved_workouts')
    .select('*')
    .eq('id', savedWorkoutId)
    .eq('user_id', userId)
    .maybeSingle();

  if (pErr || !parent) {
    return { error: pErr?.message ?? 'Saved workout not found.' };
  }

  const { data: lines, error: lErr } = await supabase
    .from('saved_workout_exercises')
    .select('*')
    .eq('saved_workout_id', savedWorkoutId)
    .order('order_index', { ascending: true });

  if (lErr || !lines?.length) {
    return { error: lErr?.message ?? 'No exercises on this saved workout.' };
  }

  const { data: gwRows, error: gwErr } = await supabase
    .from('generated_workouts')
    .insert({
      user_id: userId,
      title: parent.title as string,
      target_area: (parent.target_area as string) ?? 'full_body',
      equipment_selected: parent.equipment ?? [],
      duration_minutes: parent.duration_minutes as number,
      workout_style: (parent.workout_style as string) ?? 'strength',
      iron_miles_reward: parent.estimated_iron_miles as number,
      status: 'generated',
    })
    .select('id')
    .limit(1);

  if (gwErr || !gwRows?.length) {
    console.warn('[saved-workouts] materialize generated_workouts:', gwErr?.message);
    return { error: gwErr?.message ?? 'Could not create workout.' };
  }

  const generatedWorkoutId = gwRows[0].id as string;

  const gweRows = lines.map((row: any) => ({
    generated_workout_id: generatedWorkoutId,
    exercise_id: row.exercise_id as string,
    exercise_order: row.order_index as number,
    sets_assigned: row.sets as number | null,
    reps_assigned: (row.reps as string) ?? '10',
    instruction_override: (row.instruction_override as string) ?? null,
  }));

  const { error: insErr } = await supabase.from('generated_workout_exercises').insert(gweRows);
  if (insErr) {
    console.warn('[saved-workouts] materialize generated_workout_exercises:', insErr.message);
    await supabase.from('generated_workouts').delete().eq('id', generatedWorkoutId);
    return { error: insErr.message ?? 'Could not attach exercises.' };
  }

  return { generatedWorkoutId };
}

/**
 * Load the current generated workout + lines from Supabase and save as a snapshot
 * (used from Workout Complete when we only have generated_workout_id + difficulty from the session).
 */
export async function saveGeneratedWorkoutFromDb(
  userId: string,
  sourceGeneratedWorkoutId: string,
  difficulty: string,
): Promise<{ savedWorkoutId: string; alreadySaved: boolean } | { error: string }> {
  if (!userId || !sourceGeneratedWorkoutId) {
    return { error: 'Missing user or workout id.' };
  }

  const existingId = await fetchSavedWorkoutIdForGenerated(userId, sourceGeneratedWorkoutId);
  if (existingId) {
    return { savedWorkoutId: existingId, alreadySaved: true };
  }

  const { data: gw, error: gwErr } = await supabase
    .from('generated_workouts')
    .select('id, user_id, title, target_area, equipment_selected, duration_minutes, workout_style, iron_miles_reward')
    .eq('id', sourceGeneratedWorkoutId)
    .maybeSingle();

  if (gwErr || !gw) {
    return { error: gwErr?.message ?? 'Workout not found.' };
  }

  if (gw.user_id !== userId) {
    return { error: 'Not allowed.' };
  }

  const joinedSelect = `
    exercise_order,
    sets_assigned,
    reps_assigned,
    instruction_override,
    exercises(id)
  `;

  const { data: lines, error: lErr } = await supabase
    .from('generated_workout_exercises')
    .select(joinedSelect)
    .eq('generated_workout_id', sourceGeneratedWorkoutId)
    .order('exercise_order', { ascending: true });

  if (lErr || !lines?.length) {
    return { error: lErr?.message ?? 'No exercises for this workout.' };
  }

  const rest = computeRestSecondsForSnapshot(gw.workout_style as string | null, difficulty);
  const equipment = equipmentToStrings(gw.equipment_selected);

  const exercises: SaveWorkoutExerciseLine[] = (lines as any[]).map((row) => {
    const ex = row.exercises;
    const eid = ex?.id ? String(ex.id) : '';
    return {
      exercise_id: eid,
      order_index: row.exercise_order as number,
      sets: Number(row.sets_assigned ?? 3) || 3,
      reps: String(row.reps_assigned ?? '10'),
      rest_seconds: rest,
      instruction_override: (row.instruction_override as string) ?? null,
    };
  }).filter((e) => e.exercise_id);

  if (exercises.length === 0) {
    return { error: 'Could not resolve exercise ids.' };
  }

  return saveGeneratedWorkoutSnapshot({
    userId,
    sourceGeneratedWorkoutId,
    title: gw.title as string,
    target_area: (gw.target_area as string) ?? 'full_body',
    workout_style: (gw.workout_style as string) ?? null,
    duration_minutes: gw.duration_minutes as number,
    estimated_iron_miles: (gw.iron_miles_reward as number) ?? 0,
    difficulty,
    equipment,
    exercises,
  });
}

export async function deleteSavedWorkout(userId: string, savedWorkoutId: string): Promise<boolean> {
  const { error } = await supabase.from('saved_workouts').delete().eq('id', savedWorkoutId).eq('user_id', userId);
  if (error) {
    console.warn('[saved-workouts] deleteSavedWorkout:', error.message);
    return false;
  }
  return true;
}

function equipmentToStrings(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x ?? '')).filter(Boolean);
  }
  return [];
}

export function formatEquipmentLabel(equipment: unknown): string {
  const arr = equipmentToStrings(equipment);
  if (arr.length === 0) return 'Bodyweight';
  return arr.map((s) => s.replace(/_/g, ' ')).map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(', ');
}
