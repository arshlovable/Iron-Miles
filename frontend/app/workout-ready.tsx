import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/context/AuthContext';
import { PrimaryCtaPressable } from '../src/components/PrimaryCtaPressable';
import { WorkoutExerciseItem } from '../src/components/WorkoutInProgress';
import { computeRestSecondsForSnapshot } from '../src/lib/saved-workouts';

const C = {
  bg: '#0C0B09',
  surface: '#13120F',
  surfaceElevated: '#1C1A17',
  borderSubtle: '#2A2820',
  gold: '#E0C27C',
  goldBright: '#FFD700',
  goldMid: '#D4A843',
  goldDark: '#B89B5F',
  goldDim: '#5C4A1A',
  white: '#FFFFFF',
  offWhite: '#F0EADD',
  textSec: '#9A9080',
  textMuted: '#6B6355',
  shieldGreenLight: '#27503B',
  shieldGreen: '#1F4037',
  ctaGreenMid: '#223D2E',
  ctaGreen: '#1A3329',
};

function inferMovementType(rawReps: unknown): 'reps' | 'time' {
  const raw = String(rawReps ?? '').trim().toLowerCase();
  if (!raw) return 'reps';
  if (/(sec|secs|second|seconds|hold|min|mins|minute|minutes)/.test(raw)) return 'time';
  if (/^\d+$/.test(raw) && Number(raw) >= 20) return 'time';
  return 'reps';
}

function pickExerciseIcon(name: string, equipment?: string): string {
  const lower = name.toLowerCase();
  if (new RegExp('push|press').test(lower)) return 'arm-flex';
  if (new RegExp('row|pull').test(lower)) return 'rowing';
  if (new RegExp('squat|glute|lateral').test(lower)) return 'human-handsdown';
  if (new RegExp('stretch|rotation|cat|cow').test(lower)) return 'yoga';
  if (new RegExp('dead bug|core').test(lower)) return 'shield-outline';
  if (new RegExp('hold|sec').test(lower)) return 'timer-sand';
  if (new RegExp('band').test(lower)) return 'resistor';
  if (equipment === 'dumbbells') return 'dumbbell';
  if (equipment === 'bands') return 'resistor';
  return 'weight-lifter';
}

type PreviewExercise = {
  name: string;
  sets: string;
  reps: string;
  icon: string;
  instruction: string;
};

export default function WorkoutReadyScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { generatedWorkoutId, difficultyLevel, workoutStyle } = useLocalSearchParams<{
    generatedWorkoutId: string;
    difficultyLevel: string;
    workoutStyle: string;
  }>();

  const wid = (generatedWorkoutId as string) ?? '';
  const diff = (difficultyLevel as string) || 'medium';
  const style = (workoutStyle as string) || 'strength';

  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('Workout');
  const [durationMinutes, setDurationMinutes] = useState(10);
  const [ironMiles, setIronMiles] = useState(0);
  const [previewExercises, setPreviewExercises] = useState<PreviewExercise[]>([]);
  const [wipPayload, setWipPayload] = useState<WorkoutExerciseItem[]>([]);

  const load = useCallback(async () => {
    if (!wid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const joinedSelect = `
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

      let queryResult: any = await supabase
        .from('generated_workout_exercises')
        .select(joinedSelect)
        .eq('generated_workout_id', wid)
        .order('exercise_order', { ascending: true });

      if (queryResult.error) {
        queryResult = await supabase
          .from('generated_workout_exercises')
          .select(
            `
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
        `,
          )
          .eq('generated_workout_id', wid)
          .order('exercise_order', { ascending: true });
      }

      const { data: joinedRows, error: joinedError } = queryResult;
      if (joinedError || !joinedRows?.length) {
        setPreviewExercises([]);
        setWipPayload([]);
        setLoading(false);
        return;
      }

      const rest = computeRestSecondsForSnapshot(style, diff);

      const mapped: WorkoutExerciseItem[] = joinedRows.map((row: any) => {
        const ex = row.exercises ?? {};
        const repsValue = String(row.reps_assigned ?? ex.reps_default ?? 10);
        return {
          exercise_id: ex.id ?? undefined,
          name: ex.name ?? 'Exercise',
          sets: Number(row.sets_assigned ?? ex.sets_default ?? 3),
          reps: parseInt(repsValue, 10) || 10,
          sets_assigned: row.sets_assigned ?? ex.sets_default ?? 3,
          reps_assigned: row.reps_assigned ?? ex.reps_default ?? 10,
          instruction_text: row.instruction_override ?? ex.instruction_text ?? '',
          video_url: ex.video_url ?? '',
          thumbnail_url: ex.thumbnail_url ?? '',
          equipment_type: ex.equipment_type ?? undefined,
          target_muscle: ex.target_muscle ?? undefined,
          movement_type: inferMovementType(repsValue),
          repsRaw: repsValue,
          rest,
          equipmentTag: ex.equipment_type ?? undefined,
        };
      });

      setWipPayload(mapped);
      setPreviewExercises(
        mapped.map((m) => ({
          name: m.name,
          sets: String(m.sets_assigned ?? m.sets),
          reps: String(m.reps_assigned ?? m.repsRaw ?? m.reps),
          icon: pickExerciseIcon(m.name, m.equipment_type),
          instruction: m.instruction_text ?? '',
        })),
      );

      const { data: gw } = await supabase
        .from('generated_workouts')
        .select('title, duration_minutes, iron_miles_reward')
        .eq('id', wid)
        .maybeSingle();

      if (gw?.title) setTitle(gw.title);
      if (typeof gw?.duration_minutes === 'number') setDurationMinutes(gw.duration_minutes);
      if (typeof gw?.iron_miles_reward === 'number') setIronMiles(gw.iron_miles_reward);
    } finally {
      setLoading(false);
    }
  }, [wid, style, diff]);

  useEffect(() => {
    void load();
  }, [load]);

  const startWorkout = async () => {
    if (!wid || wipPayload.length === 0) return;

    let activeSessionId = '';
    try {
      const { data: startedSession, error: startError } = await supabase.functions.invoke('start-workout-session', {
        body: {
          generated_workout_id: wid,
          user_id: user?.id,
        },
      });
      if (!startError && startedSession?.id) activeSessionId = startedSession.id;
    } catch {
      /* continue without session */
    }

    router.replace({
      pathname: '/workout-in-progress',
      params: {
        workoutTitle: title,
        exercises: JSON.stringify(wipPayload),
        sessionId: activeSessionId,
        ironMilesReward: String(ironMiles),
        generatedWorkoutId: wid,
        workoutStyle: style,
        difficultyLevel: diff,
      },
    });
  };

  const goBack = () => router.back();

  if (loading) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={goBack} style={s.topBarBtn} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={22} color={C.goldMid} />
          </TouchableOpacity>
          <Text style={s.topBarTitle}>YOUR WORKOUT</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.loadingWrap}>
          <ActivityIndicator color={C.goldMid} size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!wid || previewExercises.length === 0) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={goBack} style={s.topBarBtn} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={22} color={C.goldMid} />
          </TouchableOpacity>
          <Text style={s.topBarTitle}>YOUR WORKOUT</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.loadingWrap}>
          <Text style={s.emptyText}>This workout could not be loaded.</Text>
          <TouchableOpacity onPress={goBack} style={s.outlineBtn}>
            <Text style={s.outlineBtnText}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={goBack} style={s.topBarBtn} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={22} color={C.goldMid} />
        </TouchableOpacity>
        <Text style={s.topBarTitle}>YOUR WORKOUT</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <View style={s.resultHeader}>
          <View style={s.resultBadge}>
            <MaterialCommunityIcons name="check-circle" size={20} color={C.goldBright} />
            <Text style={s.resultBadgeText}>WORKOUT READY</Text>
          </View>
          <Text style={s.resultTitle}>{title.toUpperCase()}</Text>
          <View style={s.resultMetaRow}>
            <View style={s.resultMeta}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={C.goldMid} />
              <Text style={s.resultMetaValue}>{durationMinutes} min</Text>
            </View>
            <View style={s.resultMetaDivider} />
            <View style={s.resultMeta}>
              <LinearGradient colors={[C.shieldGreenLight, C.shieldGreen]} style={s.resultMilesShield}>
                <Text style={s.resultMilesText}>+{ironMiles}</Text>
              </LinearGradient>
              <Text style={s.resultMetaValue}>Iron Miles</Text>
            </View>
          </View>
        </View>
        <Text style={s.sectionLabel}>EXERCISES</Text>
        {previewExercises.map((ex, i) => (
          <View key={i} style={s.exerciseCard}>
            <View style={s.exerciseNumWrap}>
              <Text style={s.exerciseNum}>{i + 1}</Text>
            </View>
            <View style={s.exerciseIconWrap}>
              <MaterialCommunityIcons name={ex.icon as any} size={20} color={C.goldMid} />
            </View>
            <View style={s.exerciseInfo}>
              <Text style={s.exerciseName}>{ex.name}</Text>
              <Text style={s.exerciseDetail}>
                {ex.sets} x {ex.reps}
              </Text>
            </View>
          </View>
        ))}
        <View style={{ marginTop: 24 }}>
          <PrimaryCtaPressable testID="workout-ready-start-btn" onPress={startWorkout}>
            <LinearGradient colors={[C.shieldGreenLight, C.ctaGreenMid, C.ctaGreen]} style={s.startBtn}>
              <View style={s.startBtnInner}>
                <MaterialCommunityIcons name="play" size={22} color={C.white} />
                <Text style={s.startBtnText}>START WORKOUT</Text>
              </View>
            </LinearGradient>
          </PrimaryCtaPressable>
        </View>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSubtle,
  },
  topBarBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 14, fontWeight: '800', color: C.gold, letterSpacing: 2 },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyText: { color: C.textSec, textAlign: 'center', marginBottom: 16 },
  outlineBtn: {
    borderWidth: 2,
    borderColor: C.goldDim,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  outlineBtnText: { color: C.goldMid, fontWeight: '800' },
  scrollContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 24 },
  resultHeader: { marginBottom: 16 },
  resultBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  resultBadgeText: { fontSize: 11, fontWeight: '800', color: C.goldBright, letterSpacing: 2 },
  resultTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: C.offWhite,
    letterSpacing: 1,
    marginBottom: 12,
  },
  resultMetaRow: { flexDirection: 'row', alignItems: 'center' },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  resultMetaDivider: { width: 1, height: 20, backgroundColor: C.borderSubtle, marginHorizontal: 14 },
  resultMetaValue: { fontSize: 13, fontWeight: '700', color: C.textSec },
  resultMilesShield: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 4 },
  resultMilesText: { fontSize: 12, fontWeight: '900', color: C.white },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: C.gold,
    letterSpacing: 3,
    marginBottom: 12,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  exerciseNumWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  exerciseNum: { fontSize: 12, fontWeight: '900', color: C.goldMid },
  exerciseIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 14, fontWeight: '800', color: C.offWhite },
  exerciseDetail: { fontSize: 12, color: C.textSec, marginTop: 1 },
  startBtn: { borderRadius: 8, borderWidth: 2, borderColor: C.goldMid, overflow: 'hidden' },
  startBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  startBtnText: { fontSize: 18, fontWeight: '900', color: C.white, letterSpacing: 3 },
});
