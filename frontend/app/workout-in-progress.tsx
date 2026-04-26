import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import WorkoutInProgress, { WorkoutExerciseItem } from '../src/components/WorkoutInProgress';
import { supabase } from '../src/lib/supabase';

function inferMovementType(rawReps: unknown): 'reps' | 'time' {
  const raw = String(rawReps ?? '').trim().toLowerCase();
  if (!raw) return 'reps';
  if (/(sec|secs|second|seconds|hold|min|mins|minute|minutes)/.test(raw)) return 'time';
  // Fallback heuristic for numeric durations like "30"
  if (/^\d+$/.test(raw) && Number(raw) >= 20) return 'time';
  return 'reps';
}

export default function WorkoutInProgressRoute() {
  const { exercises, workoutTitle, sessionId, ironMilesReward, generatedWorkoutId } = useLocalSearchParams<{
    exercises: string;
    workoutTitle: string;
    sessionId: string;
    ironMilesReward: string;
    generatedWorkoutId: string;
  }>();

  const parsedExercises: WorkoutExerciseItem[] = exercises
    ? JSON.parse(exercises as string)
    : [];
  const [workoutExercises, setWorkoutExercises] = useState<WorkoutExerciseItem[]>(parsedExercises);
  const [resolvedWorkoutTitle, setResolvedWorkoutTitle] = useState((workoutTitle as string) ?? 'Workout');
  const [resolvedMilesReward, setResolvedMilesReward] = useState(Number(ironMilesReward ?? 0));

  useEffect(() => {
    const wid = generatedWorkoutId as string;
    const workoutSessionId = (sessionId as string) ?? '';
    console.log('[WIP] generated_workout_id received:', wid || '(none)');
    console.log('[WIP] workout_session_id received:', workoutSessionId || '(none)');
    if (!wid) {
      console.log('[WIP] Missing generated_workout_id');
      return;
    }

    const loadWorkoutFromDb = async () => {
      try {
        const joinedSelectWithTarget = `
          generated_workout_id,
          exercise_order,
          sets_assigned,
          reps_assigned,
          instruction_override,
          exercises(
            id,
            name,
            instruction_text,
            video_url,
            thumbnail_url,
            category,
            equipment_type,
            target_muscle,
            sets_default,
            reps_default
          )
        `;

        const joinedSelectFallback = `
          generated_workout_id,
          exercise_order,
          sets_assigned,
          reps_assigned,
          instruction_override,
          exercises(
            id,
            name,
            instruction_text,
            video_url,
            thumbnail_url,
            category,
            equipment_type,
            sets_default,
            reps_default
          )
        `;

        let queryResult: any = await supabase
          .from('generated_workout_exercises')
          .select(joinedSelectWithTarget)
          .eq('generated_workout_id', wid)
          .order('exercise_order', { ascending: true });

        // Fallback for schemas that do not yet include exercises.target_muscle
        if (queryResult.error) {
          queryResult = await supabase
            .from('generated_workout_exercises')
            .select(joinedSelectFallback)
            .eq('generated_workout_id', wid)
            .order('exercise_order', { ascending: true });
        }

        const { data: joinedRows, error: joinedError } = queryResult;
        if (joinedError) {
          console.error('[WIP] Supabase query error (full):', joinedError);
          return;
        }

        console.log('[WIP] Supabase query result:', joinedRows);

        if (!joinedRows || joinedRows.length === 0) {
          console.log('[WIP] No generated_workout_exercises found for this generated_workout_id');
          return;
        }

        const dbExercises: WorkoutExerciseItem[] = joinedRows.map((row: any) => {
          const ex = row.exercises ?? {};
          const repsValue = String(row.reps_assigned ?? ex.reps_default ?? 10);
          return {
            name: ex.name ?? 'Exercise',
            sets: Number(row.sets_assigned ?? ex.sets_default ?? 3),
            reps: parseInt(repsValue, 10) || 10,
            movement_type: inferMovementType(repsValue),
            repsRaw: repsValue,
            rest: 30,
            equipmentTag: ex.equipment_type ?? undefined,
          };
        });

        console.log('[WIP] number of exercises loaded:', dbExercises.length);
        setWorkoutExercises(dbExercises);

        // Also load generated_workout metadata (title + miles reward) by id.
        const { data: workoutRow, error: workoutError } = await supabase
          .from('generated_workouts')
          .select('id, title, iron_miles_reward')
          .eq('id', wid)
          .single();

        if (workoutError) {
          console.error('[WIP] generated_workouts metadata query error:', workoutError);
          return;
        }

        if (workoutRow?.title) {
          setResolvedWorkoutTitle(workoutRow.title);
        }
        if (typeof workoutRow?.iron_miles_reward === 'number') {
          setResolvedMilesReward(workoutRow.iron_miles_reward);
        }
      } catch (e) {
        console.error('[WIP] Failed to load workout exercises from Supabase:', e);
      }
    };

    loadWorkoutFromDb();
  }, [generatedWorkoutId, sessionId]);

  // Elapsed timer — starts on mount, read on complete/exit
  const elapsedRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      elapsedRef.current += 1;
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const handleComplete = async () => {
    if (timerRef.current) clearInterval(timerRef.current);

    // Complete tracked session via Edge Function if we have a session id.
    const sid = sessionId as string;
    let completedSession: any = null;
    if (sid) {
      try {
        const { data, error } = await supabase.functions.invoke('complete-workout-session', {
          body: { session_id: sid },
        });
        if (error) {
          console.warn('complete-workout-session invoke failed:', error);
        } else {
          completedSession = data;
        }
      } catch (e) {
        console.error('Failed to complete session:', e);
      }
    }

    // Prefer backend-confirmed miles from completed session, fallback to workout reward.
    const milesEarned = typeof completedSession?.iron_miles_earned === 'number'
      ? completedSession.iron_miles_earned
      : (resolvedMilesReward > 0 ? resolvedMilesReward : workoutExercises.length * 5);

    router.replace({
      pathname: '/workout-complete',
      params: {
        workoutTitle: resolvedWorkoutTitle,
        exercises: JSON.stringify(workoutExercises),
        totalExercises: String(workoutExercises.length),
        durationSeconds: String(elapsedRef.current),
        milesEarned: String(milesEarned),
        currentMilestone: 'IRON DRIVER',
        milesUntilNext: String(Math.max(0, 180 - milesEarned)),
        prevMilesUntilNext: '180',
        generatedWorkoutId: (generatedWorkoutId as string) ?? '',
        sessionId: sid ?? '',
      },
    });
  };

  const handleExit = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    router.back();
  };

  return (
    <WorkoutInProgress
      exercises={workoutExercises}
      workoutTitle={resolvedWorkoutTitle}
      onComplete={handleComplete}
      onExit={handleExit}
    />
  );
}
