import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Text, View, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import ExerciseDetail from '../src/components/ExerciseDetail';

// Row shape from Supabase `exercises` table
type ExerciseRow = {
  id: string;
  name: string;
  instruction_text: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  equipment_type: string | null;
  target_muscle: string | null;
  sets_default: number | null;
  reps_default: number | null;
};

export default function ExerciseDetailScreen() {
  const { exerciseData, stepCurrent, stepTotal } = useLocalSearchParams<{
    exerciseData?: string;
    stepCurrent?: string;
    stepTotal?: string;
  }>();

  // Base data from route params (always available immediately)
  let base: Record<string, any> = {};
  try {
    base = exerciseData ? JSON.parse(exerciseData as string) : {};
  } catch {
    base = {};
  }

  const exerciseId: string = base.exercise_id ?? '';

  const [dbRow, setDbRow] = useState<ExerciseRow | null>(null);
  const [loading, setLoading] = useState(!!exerciseId);
  const [fetchFailed, setFetchFailed] = useState(false);

  const fetchById = useCallback(async () => {
    if (!exerciseId) return;
    setLoading(true);
    setFetchFailed(false);
    try {
      const { data, error } = await supabase
        .from('exercises')
        .select('id, name, instruction_text, video_url, thumbnail_url, equipment_type, target_muscle, sets_default, reps_default')
        .eq('id', exerciseId)
        .maybeSingle();
      if (error) {
        console.error('[exercise-detail] Supabase fetch error:', error);
        setFetchFailed(true);
      } else {
        setDbRow((data as ExerciseRow) ?? null);
      }
    } catch (e) {
      console.error('[exercise-detail] fetch exception:', e);
      setFetchFailed(true);
    } finally {
      setLoading(false);
    }
  }, [exerciseId]);

  useEffect(() => {
    void fetchById();
  }, [fetchById]);

  // If no base data at all and loading is done, show fallback
  if (!base.name && !loading) {
    return (
      <View style={s.fallbackWrap}>
        <Text style={s.fallbackText}>Exercise details unavailable.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={s.fallbackWrap}>
        <ActivityIndicator color="#D4A843" size="large" />
      </View>
    );
  }

  // Merge: DB row wins for instruction/video/target; params win for sets/reps/rest (session values)
  const name: string = dbRow?.name || base.name || 'Exercise';
  const videoUrl: string = dbRow?.video_url || base.video_url || '';
  const thumbnailUrl: string = dbRow?.thumbnail_url || base.thumbnail_url || '';
  const equipmentType: string =
    dbRow?.equipment_type || base.equipment_type || 'Bodyweight';
  const targetMuscle: string =
    dbRow?.target_muscle || base.target_muscle || 'Full body';
  const instructionText: string =
    String(dbRow?.instruction_text || base.instruction_text || base.instruction || '').trim();

  // Workout-session values from params take precedence over DB defaults
  const sets = base.sets_assigned ?? base.sets ?? dbRow?.sets_default ?? 3;
  const reps = base.reps_assigned ?? base.reps ?? dbRow?.reps_default ?? 10;
  const rest = base.rest ?? 30;

  const setupLines = [
    `Equipment: ${equipmentType}`,
    `Target: ${targetMuscle}`,
  ];
  const executionLines = instructionText
    ? [instructionText]
    : ['Maintain controlled tempo and stable form for each set.'];
  const progressionLines = ['Adjust load or tempo while preserving form.'];

  return (
    <ExerciseDetail
      exerciseName={name}
      videoUrl={videoUrl}
      thumbnailUrl={thumbnailUrl}
      equipmentTag={equipmentType}
      sets={sets}
      reps={reps}
      rest={rest}
      instructions={{
        setup: setupLines,
        execution: executionLines,
        progression: progressionLines,
      }}
      stepCurrent={Number(stepCurrent || 1)}
      stepTotal={Number(stepTotal || 1)}
      onBack={() => router.back()}
      onStart={() => router.back()}
      onMarkComplete={() => {}}
    />
  );
}

const s = StyleSheet.create({
  fallbackWrap: {
    flex: 1,
    backgroundColor: '#0C0B09',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  fallbackText: {
    color: '#9A9080',
    fontSize: 16,
  },
});
