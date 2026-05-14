import { useLocalSearchParams, router } from 'expo-router';
import WorkoutComplete from '../src/components/WorkoutComplete';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/context/AuthContext';

export default function WorkoutCompleteRoute() {
  const { user } = useAuth();
  const {
    workoutTitle,
    totalExercises,
    durationSeconds,
    milesEarned,
    currentMilestone,
    milesUntilNext,
    prevMilesUntilNext,
    exercises,
    generatedWorkoutId,
    workoutStyle,
    difficultyLevel,
  } = useLocalSearchParams<{
    workoutTitle: string;
    totalExercises: string;
    durationSeconds: string;
    milesEarned: string;
    currentMilestone: string;
    milesUntilNext: string;
    prevMilesUntilNext: string;
    exercises: string;
    generatedWorkoutId: string;
    workoutStyle: string;
    difficultyLevel: string;
  }>();

  const handleHammerDown = async () => {
    const wid = generatedWorkoutId as string;
    let nextSessionId = '';

    // If this workout originated from generated_workouts, start a new tracked session.
    if (wid) {
      try {
        const restartUserId = user?.id;
        const { data, error } = await supabase.functions.invoke('start-workout-session', {
          body: {
            generated_workout_id: wid,
            user_id: restartUserId,
          },
        });
        if (error) {
          console.warn('start-workout-session restart failed:', error);
        } else if (data) {
          nextSessionId = data.id ?? '';
        }
      } catch (e) {
        console.error('Failed to restart workout session:', e);
      }
    }

    router.replace({
      pathname: '/workout-in-progress',
      params: {
        workoutTitle: workoutTitle ?? 'Workout',
        exercises: exercises ?? '[]',
        sessionId: nextSessionId,
        generatedWorkoutId: wid,
        ironMilesReward: milesEarned ?? '0',
        workoutStyle: (workoutStyle as string) ?? 'strength',
        difficultyLevel: (difficultyLevel as string) ?? 'medium',
      },
    });
  };

  const handleDashboard = () => {
    router.dismissAll();
  };

  return (
    <WorkoutComplete
      workoutTitle={workoutTitle ?? 'Workout'}
      totalExercises={Number(totalExercises ?? 0)}
      durationSeconds={Number(durationSeconds ?? 0)}
      milesEarned={Number(milesEarned ?? 0)}
      currentMilestone={currentMilestone ?? 'IRON DRIVER'}
      milesUntilNext={Number(milesUntilNext ?? 0)}
      prevMilesUntilNext={Number(prevMilesUntilNext ?? 0)}
      generatedWorkoutId={(generatedWorkoutId as string) ?? ''}
      userId={user?.id ?? null}
      workoutStyle={(workoutStyle as string) ?? 'strength'}
      difficultyLevel={(difficultyLevel as string) ?? 'medium'}
      onHammerDown={handleHammerDown}
      onDashboard={handleDashboard}
    />
  );
}
