import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Pressable,
  Alert,
  RefreshControl,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { MvpScreenHeader, MVP_C } from '../src/components/MvpScreenHeader';
import { useAuth } from '../src/context/AuthContext';
import { supabase } from '../src/lib/supabase';
import { addDays, getWeekRange, isTimestampInRange, localDateKey, localDateKeyFromIso, WEEKDAY_LABELS } from '../src/lib/week-buckets';

type ExerciseRelation = { name?: string | null } | { name?: string | null }[] | null;

type WorkoutExerciseRow = {
  id: string;
  exercise_order: number | null;
  sets_assigned: number | null;
  reps_assigned: string | null;
  exercises: ExerciseRelation;
};

type GeneratedWorkoutRow = {
  title?: string | null;
  duration_minutes?: number | null;
  target_area?: string | null;
  generated_workout_exercises?: WorkoutExerciseRow[] | null;
};

type SessionDbRow = {
  id: string;
  completed_at: string | null;
  iron_miles_earned: number | null;
  status: string | null;
  generated_workouts: GeneratedWorkoutRow | null;
};

type DisplayExercise = {
  id: string;
  order: number;
  name: string;
  sets: number | null;
  reps: string | null;
};

type SessionRow = {
  id: string;
  completedAt: string | null;
  miles: number;
  durationMinutes: number | null;
  title: string;
  exercises: DisplayExercise[];
};

function formatDate(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
  } catch {
    return '—';
  }
}

function formatTime(iso: string): string {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '—';
  }
}

function titleFromWorkout(g: GeneratedWorkoutRow | null): string {
  if (g?.title) return g.title;
  if (g?.target_area) return g.target_area.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return 'Workout';
}

function exerciseNameFromRelation(rel: ExerciseRelation): string {
  if (!rel) return 'Exercise';
  if (Array.isArray(rel)) return rel[0]?.name || 'Exercise';
  return rel.name || 'Exercise';
}

function parseRepCount(reps: string | null): number | null {
  if (!reps) return null;
  const cleaned = reps.trim();
  const rangeMatch = cleaned.match(/(\d+)\s*[-–]\s*(\d+)/);
  if (rangeMatch) return Number(rangeMatch[2]);

  const singleMatch = cleaned.match(/^\d+$/);
  if (singleMatch) return Number(singleMatch[0]);
  return null;
}

function estimateTotalReps(exercises: DisplayExercise[]): number | null {
  let total = 0;
  let hasAny = false;
  exercises.forEach((exercise) => {
    const repCount = parseRepCount(exercise.reps);
    if (!repCount || !exercise.sets || exercise.sets < 1) return;
    total += repCount * exercise.sets;
    hasAny = true;
  });
  return hasAny ? total : null;
}

function normalizeSessionRow(row: SessionDbRow): SessionRow {
  const rawExercises = row.generated_workouts?.generated_workout_exercises ?? [];
  const exercises = rawExercises
    .map((item, idx) => ({
      id: item.id || `${row.id}-${idx}`,
      order: typeof item.exercise_order === 'number' ? item.exercise_order : Number.MAX_SAFE_INTEGER,
      name: exerciseNameFromRelation(item.exercises),
      sets: typeof item.sets_assigned === 'number' ? item.sets_assigned : null,
      reps: item.reps_assigned || null,
    }))
    .sort((a, b) => a.order - b.order);

  return {
    id: row.id,
    completedAt: row.completed_at,
    miles: Math.max(0, Number(row.iron_miles_earned ?? 0)),
    durationMinutes:
      typeof row.generated_workouts?.duration_minutes === 'number' ? row.generated_workouts.duration_minutes : null,
    title: titleFromWorkout(row.generated_workouts),
    exercises,
  };
}

export default function WorkoutLogScreen() {
  const router = useRouter();
  const { user, refreshProfile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [lastWeekExpanded, setLastWeekExpanded] = useState(false);

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  const load = useCallback(async () => {
    if (!user?.id) {
      setRows([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from('workout_sessions')
        .select(
          'id, completed_at, iron_miles_earned, status, generated_workouts(title, duration_minutes, target_area, generated_workout_exercises(id, exercise_order, sets_assigned, reps_assigned, exercises(name)))'
        )
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(100);
      if (qErr) {
        console.error('[workout-log] Supabase error:', qErr);
        setError('Could not load workout history.');
        setRows([]);
      } else {
        setRows(((data as SessionDbRow[]) ?? []).map(normalizeSessionRow));
      }
    } catch (e) {
      console.error('[workout-log] exception:', e);
      setError('Something went wrong.');
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    void load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const now = new Date();
  const thisWeekRange = useMemo(() => getWeekRange(now, 0), [now]);
  const lastWeekRange = useMemo(() => getWeekRange(now, -1), [now]);

  const thisWeekRows = useMemo(
    () => rows.filter((row) => isTimestampInRange(row.completedAt, thisWeekRange)),
    [rows, thisWeekRange]
  );
  const lastWeekRows = useMemo(
    () => rows.filter((row) => isTimestampInRange(row.completedAt, lastWeekRange)),
    [rows, lastWeekRange]
  );

  const thisWeekMiles = thisWeekRows.reduce((sum, row) => sum + row.miles, 0);
  const thisWeekWorkouts = thisWeekRows.length;
  const thisWeekExercises = thisWeekRows.reduce((sum, row) => sum + row.exercises.length, 0);

  const lastWeekMiles = lastWeekRows.reduce((sum, row) => sum + row.miles, 0);
  const completedDayKeys = useMemo(() => {
    const keys = new Set<string>();
    thisWeekRows.forEach((row) => {
      const key = localDateKeyFromIso(row.completedAt);
      if (key) keys.add(key);
    });
    return keys;
  }, [thisWeekRows]);
  const todayKey = localDateKey(now);

  const onToggleLastWeek = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setLastWeekExpanded((prev) => !prev);
  }, []);

  const onPressSession = useCallback((row: SessionRow) => {
    const summary = `${formatDate(row.completedAt || '')} · ${formatTime(row.completedAt || '')}`;
    Alert.alert(row.title, summary);
  }, []);

  const onEditSession = useCallback(() => {
    Alert.alert('Read-only log', 'Editing session logs is not available in this MVP.');
  }, []);

  const onDeleteSession = useCallback(
    (row: SessionRow) => {
      Alert.alert('Delete workout log?', 'This will remove the session and its miles entry for this workout.', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingSessionId(row.id);
            try {
              const { error: rpcError } = await supabase.rpc('delete_completed_workout_session', {
                p_session_id: row.id,
              });
              if (rpcError) {
                console.error('[workout-log] delete rpc error:', rpcError);
                Alert.alert('Could not delete', 'Please try again.');
                return;
              }
              await Promise.all([load(), refreshProfile()]);
            } catch (e) {
              console.error('[workout-log] delete exception:', e);
              Alert.alert('Could not delete', 'Please try again.');
            } finally {
              setDeletingSessionId(null);
            }
          },
        },
      ]);
    },
    [load, refreshProfile]
  );

  const renderSessionCard = (row: SessionRow, dimmed = false) => {
    const repsTotal = estimateTotalReps(row.exercises);
    const durationLabel = row.durationMinutes && row.durationMinutes > 0 ? `${row.durationMinutes} min` : '—';
    return (
      <Pressable key={row.id} onPress={() => onPressSession(row)} style={[s.card, dimmed && s.cardDimmed]}>
        <View style={s.cardHead}>
          <View style={s.cardHeadText}>
            <Text style={s.cardTitle}>{row.title}</Text>
            <Text style={s.cardSub}>{`${durationLabel} • +${row.miles} Iron Miles`}</Text>
          </View>
          <View style={s.cardActions}>
            <Pressable onPress={onEditSession} hitSlop={8} style={s.iconBtn} accessibilityLabel="Edit session">
              <MaterialCommunityIcons name="pencil-outline" size={16} color={MVP_C.textSec} />
            </Pressable>
            <Pressable
              onPress={() => onDeleteSession(row)}
              hitSlop={8}
              style={s.iconBtn}
              disabled={deletingSessionId === row.id}
              accessibilityLabel="Delete session"
            >
              {deletingSessionId === row.id ? (
                <ActivityIndicator size="small" color={MVP_C.goldMid} />
              ) : (
                <MaterialIcons name="close" size={18} color={MVP_C.goldDark} />
              )}
            </Pressable>
          </View>
        </View>

        <View style={s.exerciseList}>
          {row.exercises.length === 0 ? (
            <Text style={s.exerciseEmpty}>No exercise details available.</Text>
          ) : (
            row.exercises.map((exercise) => (
              <View key={exercise.id} style={s.exerciseRow}>
                <Text style={s.exerciseName} numberOfLines={1}>
                  {exercise.name}
                </Text>
                <Text style={s.exerciseMeta}>
                  {exercise.sets ?? '—'} x {exercise.reps ?? '—'}
                </Text>
              </View>
            ))
          )}
        </View>

        <View style={s.statsRow}>
          <Text style={s.statText}>Exercises {row.exercises.length}</Text>
          <Text style={s.statText}>Reps {repsTotal ?? '—'}</Text>
          <Text style={s.statMiles}>+{row.miles} mi</Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <MvpScreenHeader
        title="WORKOUT LOG"
        subtitle="Track your miles of discipline"
        testID="workout-log-back"
        rightAction={
          <Pressable onPress={() => router.push('/generate-workout')} style={s.addBtn} accessibilityLabel="Add workout">
            <Text style={s.addBtnText}>+ Add</Text>
          </Pressable>
        }
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={MVP_C.goldMid} />}
      >
        {!user?.id ? (
          <Text style={s.muted}>Sign in to see completed runs.</Text>
        ) : loading ? (
          <View style={s.center}>
            <ActivityIndicator color={MVP_C.goldMid} />
            <Text style={s.muted}>Loading…</Text>
          </View>
        ) : error ? (
          <Text style={s.error}>{error}</Text>
        ) : rows.length === 0 ? (
          <Text style={s.empty}>No miles logged yet. Start your first workout.</Text>
        ) : (
          <>
            <View style={s.weekCard}>
              <Text style={s.weekLabel}>THIS WEEK</Text>
              <View style={s.weekStatsRow}>
                <View style={s.weekStatItem}>
                  <Text style={s.weekStatValueMiles}>{thisWeekMiles}</Text>
                  <Text style={s.weekStatLabel}>Iron Miles</Text>
                </View>
                <View style={s.weekStatItem}>
                  <Text style={s.weekStatValue}>{thisWeekWorkouts}</Text>
                  <Text style={s.weekStatLabel}>Workouts</Text>
                </View>
                <View style={s.weekStatItem}>
                  <Text style={s.weekStatValue}>{thisWeekExercises}</Text>
                  <Text style={s.weekStatLabel}>Exercises</Text>
                </View>
              </View>

              <View style={s.dayRow}>
                {WEEKDAY_LABELS.map((label, index) => {
                  const date = addDays(thisWeekRange.start, index);
                  const key = localDateKey(date);
                  const completed = completedDayKeys.has(key);
                  const isToday = key === todayKey;
                  return (
                    <View key={label} style={s.dayItem}>
                      <View style={[s.dayDot, completed && s.dayDotActive, isToday && s.dayDotToday]} />
                      <Text style={[s.dayLabel, isToday && s.dayLabelToday]}>{label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>

            {thisWeekRows.length > 0 ? (
              thisWeekRows.map((row) => renderSessionCard(row))
            ) : (
              <Text style={s.sectionEmpty}>No sessions completed this week.</Text>
            )}

            <View style={s.lastWeekWrap}>
              <Pressable style={s.lastWeekHeader} onPress={onToggleLastWeek}>
                <View>
                  <Text style={s.lastWeekTitle}>LAST WEEK</Text>
                  <Text style={s.lastWeekSummary}>{`${lastWeekRows.length} sessions • ${lastWeekMiles} miles`}</Text>
                </View>
                <MaterialIcons
                  name={lastWeekExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                  size={20}
                  color={MVP_C.textSec}
                />
              </Pressable>
              {lastWeekExpanded && (
                <View style={s.lastWeekBody}>
                  {lastWeekRows.length > 0 ? (
                    lastWeekRows.map((row) => renderSessionCard(row, true))
                  ) : (
                    <Text style={s.sectionEmpty}>No sessions completed last week.</Text>
                  )}
                </View>
              )}
            </View>
          </>
        )}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: MVP_C.bg },
  scroll: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24 },
  addBtn: {
    borderWidth: 1,
    borderColor: MVP_C.borderSubtle,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: MVP_C.surfaceEl,
  },
  addBtnText: { color: MVP_C.textSec, fontWeight: '700', fontSize: 12, letterSpacing: 0.3 },
  center: { alignItems: 'center', paddingVertical: 24, gap: 10 },
  muted: { color: MVP_C.textSec, fontSize: 14, textAlign: 'center', marginTop: 8 },
  error: { color: MVP_C.goldDark, textAlign: 'center', marginTop: 12, fontWeight: '600' },
  empty: {
    color: MVP_C.textSec,
    fontSize: 15,
    textAlign: 'center',
    marginTop: 32,
    fontWeight: '600',
    lineHeight: 22,
  },
  weekCard: {
    backgroundColor: MVP_C.surface,
    borderWidth: 1,
    borderColor: MVP_C.borderGold,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  weekLabel: { color: MVP_C.gold, fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
  weekStatsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  weekStatItem: { flex: 1, alignItems: 'flex-start' },
  weekStatValueMiles: { color: MVP_C.goldMid, fontSize: 24, fontWeight: '900' },
  weekStatValue: { color: MVP_C.offWhite, fontSize: 20, fontWeight: '800' },
  weekStatLabel: { color: MVP_C.textSec, fontSize: 11, marginTop: 2, fontWeight: '700' },
  dayRow: { flexDirection: 'row', justifyContent: 'space-between' },
  dayItem: { alignItems: 'center', gap: 6 },
  dayDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: MVP_C.borderSubtle,
    backgroundColor: '#22201B',
  },
  dayDotActive: {
    backgroundColor: MVP_C.greenLight,
    borderColor: '#3E7E5E',
  },
  dayDotToday: {
    borderColor: MVP_C.goldMid,
    borderWidth: 2,
  },
  dayLabel: { color: MVP_C.textMuted, fontSize: 10, fontWeight: '700' },
  dayLabelToday: { color: MVP_C.goldDark },
  card: {
    backgroundColor: MVP_C.surface,
    borderWidth: 1,
    borderColor: MVP_C.borderSubtle,
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
  },
  cardDimmed: { opacity: 0.9, borderColor: MVP_C.borderSubtle },
  cardHead: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 10 },
  cardHeadText: { flex: 1, paddingRight: 8 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: MVP_C.offWhite, marginBottom: 6 },
  cardSub: { fontSize: 12, color: MVP_C.textSec, fontWeight: '700' },
  cardActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { width: 26, height: 26, alignItems: 'center', justifyContent: 'center' },
  exerciseList: {
    borderTopWidth: 1,
    borderTopColor: MVP_C.borderSubtle,
    borderBottomWidth: 1,
    borderBottomColor: MVP_C.borderSubtle,
    paddingVertical: 8,
    gap: 6,
  },
  exerciseRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  exerciseName: { color: MVP_C.offWhite, fontSize: 13, flex: 1, fontWeight: '600' },
  exerciseMeta: { color: MVP_C.textSec, fontSize: 12, fontWeight: '700' },
  exerciseEmpty: { color: MVP_C.textMuted, fontSize: 12, fontWeight: '600' },
  statsRow: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statText: { color: MVP_C.textSec, fontSize: 12, fontWeight: '700' },
  statMiles: { color: '#5EB88A', fontSize: 12, fontWeight: '800' },
  lastWeekWrap: {
    marginTop: 10,
    backgroundColor: '#11100D',
    borderWidth: 1,
    borderColor: MVP_C.borderSubtle,
    borderRadius: 10,
    overflow: 'hidden',
  },
  lastWeekHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  lastWeekTitle: { color: MVP_C.textSec, fontSize: 11, fontWeight: '800', letterSpacing: 1.6 },
  lastWeekSummary: { color: MVP_C.textMuted, fontSize: 12, marginTop: 2, fontWeight: '600' },
  lastWeekBody: { paddingHorizontal: 10, paddingBottom: 10 },
  sectionEmpty: { color: MVP_C.textMuted, textAlign: 'center', fontSize: 13, marginVertical: 10, fontWeight: '600' },
});
