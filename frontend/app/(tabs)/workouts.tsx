import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import type { WorkoutTabSlug } from '../../src/lib/workout-tab-category-map';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import {
  listSavedWorkouts,
  materializeSavedWorkoutToGenerated,
  formatEquipmentLabel,
  type SavedWorkoutRow,
} from '../../src/lib/saved-workouts';
import { difficultyDisplayLabel } from '../../src/lib/difficulty-display';

const C = {
  bg: '#0C0B09',
  surface: '#13120F',
  surfaceEl: '#1C1A17',
  borderGold: '#5C4A1A',
  borderSubtle: '#2A2820',
  gold: '#E0C27C',
  goldBright: '#FFD700',
  goldMid: '#D4A843',
  goldDark: '#B89B5F',
  goldDim: '#5C4A1A',
  green: '#1F4037',
  greenLight: '#27503B',
  white: '#FFFFFF',
  offWhite: '#F0EADD',
  textSec: '#9A9080',
  textMuted: '#6B6355',
};

type Category = { id: WorkoutTabSlug; label: string; icon: string; color: string };
const CATEGORIES: Category[] = [
  { id: 'cab', label: 'Cab\nWorkouts', icon: 'truck', color: '#27503B' },
  { id: 'truck_stop', label: 'Truck Stop\nWorkouts', icon: 'gas-station', color: '#3A2A10' },
  { id: 'core', label: 'Core', icon: 'shield-star', color: '#252014' },
  { id: 'mobility', label: 'Mobility', icon: 'yoga', color: '#152018' },
];

type WorkoutListItem = { id: string; title: string; duration: string; miles: number; when: string; icon: string };

const SUGGESTED_ROUTES: WorkoutListItem[] = [
  { id: 'sug-cab', title: 'Cab Upper Body Strength', duration: '10 min', miles: 10, when: 'Today', icon: 'arm-flex' },
  { id: 'sug-back', title: 'Back Saver Reset', duration: '5 min', miles: 5, when: 'Yesterday', icon: 'yoga' },
  { id: 'sug-truck', title: 'Truck Stop Full Body', duration: '20 min', miles: 20, when: '2 days ago', icon: 'human' },
  { id: 'sug-core', title: 'Core Lockdown', duration: '10 min', miles: 10, when: '3 days ago', icon: 'shield-star' },
];

function relativeWhen(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  const now = new Date();
  const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startThat = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((startToday.getTime() - startThat.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function titleFromWorkout(g: { title?: string | null; target_area?: string | null } | null): string {
  if (g?.title) return g.title;
  if (g?.target_area) return g.target_area.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  return 'Workout';
}

function iconForTitle(title: string): string {
  const t = title.toLowerCase();
  if (t.includes('back')) return 'yoga';
  if (t.includes('truck') || t.includes('full body')) return 'human';
  if (t.includes('core')) return 'shield-star';
  if (t.includes('cab') || t.includes('upper')) return 'arm-flex';
  return 'arm-flex';
}

function targetAreaLabel(ta: string | null): string {
  if (!ta) return '—';
  return ta.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function difficultyLabel(d: string | null): string {
  return difficultyDisplayLabel(d);
}

type SessionRow = {
  id: string;
  completed_at: string | null;
  iron_miles_earned: number | null;
  generated_workouts: { title?: string | null; duration_minutes?: number | null; target_area?: string | null } | null;
};

function mapSessionToItem(row: SessionRow): WorkoutListItem {
  const g = row.generated_workouts;
  const title = titleFromWorkout(g);
  const dur = g?.duration_minutes;
  const durationLabel = typeof dur === 'number' && dur > 0 ? `${dur} min` : '—';
  return {
    id: row.id,
    title,
    duration: durationLabel,
    miles: Math.max(0, Math.floor(Number(row.iron_miles_earned ?? 0))),
    when: relativeWhen(row.completed_at),
    icon: iconForTitle(title),
  };
}

// ─── Header (typography aligned with Fuel tab) ─────────────────
function Header() {
  return (
    <View style={s.header}>
      <View style={s.headerInner}>
        <Text style={s.headerTitle}>WORKOUTS</Text>
        <Text style={s.headerSub}>Quick workouts built for truckers</Text>
      </View>
    </View>
  );
}

// ─── Category Grid ─────────────────────────────────────────────
function CategoryGrid() {
  const router = useRouter();
  return (
    <View style={[s.section, s.sectionAfterHeader, s.sectionCategories]}>
      <Text style={s.sectionLabel}>CATEGORIES</Text>
      <View style={s.catGrid}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            testID={`cat-${cat.id}`}
            style={s.catCard}
            activeOpacity={0.7}
            onPress={() =>
              router.push({
                pathname: '/workout-category',
                params: { tab: cat.id },
              })
            }
          >
            <LinearGradient
              colors={[cat.color, '#0C0B09']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.catCardBg}
            >
              <MaterialCommunityIcons name={cat.icon as any} size={26} color={C.goldMid} />
              <Text style={s.catLabel}>{cat.label}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function MySavedRuns() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<SavedWorkoutRow[]>([]);
  const [runBusyId, setRunBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user?.id) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const rows = await listSavedWorkouts(user.id);
      setItems(rows);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRunAgain = async (row: SavedWorkoutRow) => {
    if (!user?.id) return;
    setRunBusyId(row.id);
    try {
      const result = await materializeSavedWorkoutToGenerated(user.id, row.id);
      if ('error' in result) {
        console.warn('[MySavedRuns] materialize:', result.error);
        Alert.alert('Could not open workout', result.error);
        return;
      }
      router.push({
        pathname: '/workout-ready',
        params: {
          generatedWorkoutId: result.generatedWorkoutId,
          difficultyLevel: row.difficulty ?? 'medium',
          workoutStyle: row.workout_style ?? 'strength',
        },
      });
    } finally {
      setRunBusyId(null);
    }
  };

  return (
    <View style={[s.section, s.sectionSaved]}>
      <Text style={s.sectionLabel}>MY SAVED RUNS</Text>
      {loading ? (
        <View style={s.recentLoading}>
          <ActivityIndicator color={C.goldMid} size="small" />
        </View>
      ) : items.length === 0 ? (
        <View style={s.savedEmpty}>
          <Text style={s.savedEmptyTitle}>No saved runs yet.</Text>
          <Text style={s.savedEmptySub}>
            When a generated workout hits right, save it here and run it again later.
          </Text>
        </View>
      ) : (
        items.map((row) => (
          <View key={row.id} style={s.savedCard}>
            <View style={s.savedCardTop}>
              <View style={s.histIconWrap}>
                <MaterialCommunityIcons name={iconForTitle(row.title) as any} size={22} color={C.goldMid} />
              </View>
              <View style={s.histInfo}>
                <Text style={s.histTitle}>{row.title}</Text>
                <Text style={s.savedMetaLine}>
                  {targetAreaLabel(row.target_area)} · {row.duration_minutes} min ·{' '}
                  {difficultyLabel(row.difficulty)}
                </Text>
                <Text style={s.savedMetaLine}>
                  {formatEquipmentLabel(row.equipment)} · +{row.estimated_iron_miles} mi
                </Text>
              </View>
            </View>
            <TouchableOpacity
              testID={`run-again-${row.id}`}
              style={s.runAgainBtn}
              activeOpacity={0.85}
              disabled={runBusyId !== null}
              onPress={() => onRunAgain(row)}
            >
              {runBusyId === row.id ? (
                <ActivityIndicator color={C.bg} size="small" />
              ) : (
                <Text style={s.runAgainBtnText}>Run Again</Text>
              )}
            </TouchableOpacity>
          </View>
        ))
      )}
    </View>
  );
}

// ─── Recent Workouts / Suggested Routes ────────────────────────
function RecentOrSuggestedWorkouts() {
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [recentItems, setRecentItems] = useState<WorkoutListItem[]>([]);

  const load = useCallback(async () => {
    if (!user?.id) {
      setRecentItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('workout_sessions')
        .select('id, completed_at, iron_miles_earned, generated_workouts(title, duration_minutes, target_area)')
        .eq('user_id', user.id)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(5);
      if (error) {
        console.warn('[workouts] recent sessions:', error.message);
        setRecentItems([]);
      } else {
        const rows = ((data as SessionRow[]) ?? []).slice(0, 5).map(mapSessionToItem);
        setRecentItems(rows);
      }
    } catch (e) {
      console.warn('[workouts] recent sessions exception', e);
      setRecentItems([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const showRecent = recentItems.length > 0;
  const listItems: WorkoutListItem[] = showRecent ? recentItems.slice(0, 5) : SUGGESTED_ROUTES;
  const sectionTitle = showRecent ? 'RECENT WORKOUTS' : 'SUGGESTED ROUTES';

  const goGenerate = useCallback(() => {
    router.push('/generate-workout');
  }, [router]);

  return (
    <View style={[s.section, s.sectionRecent]}>
      <View style={s.sectionHeader}>
        <Text style={[s.sectionLabel, s.sectionLabelInline]}>{sectionTitle}</Text>
        {showRecent ? (
          <TouchableOpacity testID="see-all-recent" activeOpacity={0.7} onPress={() => router.push('/workout-log')}>
            <Text style={s.seeAll}>See All</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.seeAllPlaceholder} />
        )}
      </View>
      {loading ? (
        <View style={s.recentLoading}>
          <ActivityIndicator color={C.goldMid} size="small" />
        </View>
      ) : (
        listItems.map((item) => (
          <TouchableOpacity
            key={item.id}
            testID={showRecent ? `recent-${item.id}` : `suggested-${item.id}`}
            style={s.histCard}
            activeOpacity={0.7}
            onPress={goGenerate}
          >
            <View style={s.histIconWrap}>
              <MaterialCommunityIcons name={item.icon as any} size={22} color={C.goldMid} />
            </View>
            <View style={s.histInfo}>
              <Text style={s.histTitle}>{item.title}</Text>
              <View style={s.histMeta}>
                <Text style={s.histMetaText}>{item.duration}</Text>
                <View style={s.histDot} />
                <Text style={s.histMetaText}>+{item.miles} mi</Text>
                <View style={s.histDot} />
                <Text style={s.histMetaText}>{item.when}</Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────
export default function WorkoutsScreen() {
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView
        testID="workouts-scroll"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <Header />
        <CategoryGrid />
        <MySavedRuns />
        <RecentOrSuggestedWorkouts />
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 16, paddingTop: 4 },

  // Header — matches Fuel tab (`fuel.tsx` header / headerInner / headerTitle / headerSub)
  header: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerInner: {
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  headerTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: C.gold,
    letterSpacing: 1,
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textSec,
    letterSpacing: 1,
    textAlign: 'center',
  },

  // Section
  section: { marginHorizontal: 14, marginBottom: 24 },
  sectionAfterHeader: { marginTop: 0 },
  sectionCategories: { marginTop: 12 },
  sectionRecent: { marginTop: 14 },
  sectionSaved: { marginTop: 14 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.gold, letterSpacing: 3, marginBottom: 16 },
  sectionLabelInline: { marginBottom: 0 },
  seeAll: { fontSize: 12, fontWeight: '700', color: C.goldDark, letterSpacing: 0.5 },
  seeAllPlaceholder: { minWidth: 56, height: 16 },
  recentLoading: { paddingVertical: 24, alignItems: 'center', justifyContent: 'center' },

  // Category Grid (2×2 for four cards)
  catGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
    rowGap: 14,
    justifyContent: 'space-between',
  },
  catCard: {
    width: '48%',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    overflow: 'hidden',
  },
  catCardBg: {
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
    gap: 10,
    minHeight: 100,
    justifyContent: 'center',
  },
  catLabel: { fontSize: 11, fontWeight: '800', color: C.offWhite, textAlign: 'center', letterSpacing: 0.5, lineHeight: 14 },

  // History
  histCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    borderRadius: 6,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  histIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.surfaceEl,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  histInfo: { flex: 1 },
  histTitle: { fontSize: 14, fontWeight: '800', color: C.offWhite, marginBottom: 4 },
  histMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  histMetaText: { fontSize: 11, color: C.textMuted },
  histDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.goldDim },

  savedEmpty: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    borderRadius: 6,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  savedEmptyTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: C.offWhite,
    marginBottom: 8,
    textAlign: 'center',
  },
  savedEmptySub: {
    fontSize: 12,
    color: C.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  savedCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    borderRadius: 6,
    padding: 14,
    marginBottom: 12,
    gap: 12,
  },
  savedCardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  savedMetaLine: { fontSize: 11, color: C.textMuted, marginTop: 4 },
  runAgainBtn: {
    backgroundColor: C.goldMid,
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  runAgainBtnText: { fontSize: 14, fontWeight: '800', color: C.bg, letterSpacing: 0.5 },
});
