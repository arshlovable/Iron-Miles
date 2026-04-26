import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import ExerciseDetail from '../src/components/ExerciseDetail';

export default function ExerciseDetailScreen() {
  const { exerciseData, stepCurrent, stepTotal } = useLocalSearchParams<{
    exerciseData?: string;
    stepCurrent?: string;
    stepTotal?: string;
  }>();

  let parsed: any = null;
  try {
    parsed = exerciseData ? JSON.parse(exerciseData) : null;
  } catch {
    parsed = null;
  }

  if (!parsed) {
    return (
      <View style={s.fallbackWrap}>
        <Text style={s.fallbackText}>Exercise details unavailable.</Text>
      </View>
    );
  }

  const instructionText = String(parsed.instruction_text || parsed.instruction || '').trim();
  const setupLines = [
    parsed.equipment_type ? `Equipment: ${parsed.equipment_type}` : 'Equipment: bodyweight',
    parsed.target_muscle ? `Target: ${parsed.target_muscle}` : 'Target: full body',
  ];
  const executionLines = instructionText
    ? [instructionText]
    : ['Maintain controlled tempo and stable form for each set.'];
  const progressionLines = ['Adjust load or tempo while preserving form.'];

  return (
    <ExerciseDetail
      exerciseName={parsed.name || 'Exercise'}
      videoUrl={parsed.video_url || ''}
      thumbnailUrl={parsed.thumbnail_url || ''}
      equipmentTag={parsed.equipment_type || 'Bodyweight'}
      sets={parsed.sets_assigned ?? parsed.sets ?? 3}
      reps={parsed.reps_assigned ?? parsed.reps ?? 10}
      rest={parsed.rest ?? 30}
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
