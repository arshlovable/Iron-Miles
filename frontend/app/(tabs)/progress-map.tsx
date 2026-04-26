import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/context/AuthContext';
import { computeMilestoneProgress, type MilestoneProgressItem } from '../../src/lib/milestones';

// Iron Miles palette
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
  asphalt: '#181715',
  road: '#1E1D1A',
};

const EMPTY_WEEKLY = { workouts: 0, miles: 0, streak: 0 };

function toUtcDateString(value: string) {
  const d = new Date(value);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
    d.getUTCDate()
  ).padStart(2, '0')}`;
}

function computeDayStreak(completedAtRows: Array<{ completed_at?: string | null }>): number {
  const doneDates = new Set(
    completedAtRows
      .map((r) => r.completed_at)
      .filter((v): v is string => Boolean(v))
      .map((iso) => toUtcDateString(iso))
  );
  if (doneDates.size === 0) return 0;

  const today = new Date();
  const dayCursor = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()));
  let streak = 0;

  while (true) {
    const key = toUtcDateString(dayCursor.toISOString());
    if (!doneDates.has(key)) break;
    streak += 1;
    dayCursor.setUTCDate(dayCursor.getUTCDate() - 1);
  }

  return streak;
}

// ─── Header ────────────────────────────────────────────────────
function Header() {
  return (
    <View style={s.header}>
      <View style={s.headerLine} />
      <View style={s.headerContent}>
        <Text style={s.headerTitle}>PROGRESS MAP</Text>
        <Text style={s.headerSub}>Your Miles of Discipline journey</Text>
      </View>
      <View style={[s.headerLine, { opacity: 0.25 }]} />
    </View>
  );
}

// ─── Ambient Glow (behind Lifetime card only) ─────────────────
function AmbientGlow() {
  const outerScale = useSharedValue(1);
  const outerOpacity = useSharedValue(0.22);
  const innerScale = useSharedValue(1);
  const innerOpacity = useSharedValue(0.16);

  const cfg = { duration: 5000, easing: Easing.inOut(Easing.sin) };

  useEffect(() => {
    outerScale.value = withRepeat(withTiming(1.12, cfg), -1, true);
    outerOpacity.value = withRepeat(withTiming(0.06, cfg), -1, true);
    innerScale.value = withDelay(800, withRepeat(withTiming(1.08, cfg), -1, true));
    innerOpacity.value = withDelay(800, withRepeat(withTiming(0.04, cfg), -1, true));
  }, []);

  const outerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: outerScale.value }],
    opacity: outerOpacity.value,
  }));

  const innerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: innerScale.value }],
    opacity: innerOpacity.value,
  }));

  return (
    <View style={s.ambientWrap} pointerEvents="none">
      <Animated.View style={[s.ambientOuter, outerStyle]}>
        <LinearGradient
          colors={['rgba(180,140,60,0.65)', 'rgba(180,140,60,0.22)', 'transparent']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Animated.View style={[s.ambientInner, innerStyle]}>
        <LinearGradient
          colors={['rgba(212,168,67,0.30)', 'rgba(212,168,67,0.10)', 'transparent']}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
    </View>
  );
}

// ─── Lifetime Miles Card ───────────────────────────────────────
function LifetimeMilesCard({
  lifetimeMiles,
  progressPct,
  milesToNext,
  nextMilestoneTitle,
}: {
  lifetimeMiles: number;
  progressPct: number;
  milesToNext: number;
  nextMilestoneTitle: string;
}) {
  return (
    <View style={s.lifeCard}>
      <AmbientGlow />
      <Text style={s.lifeLabel}>LIFETIME IRON MILES</Text>
      <View style={s.lifeRow}>
        <Text style={s.lifeNumber}>{Math.max(0, Math.floor(lifetimeMiles)).toLocaleString()}</Text>
        <Text style={s.lifeUnit}>miles</Text>
      </View>
      <View style={s.lifeProgress}>
        <LinearGradient
          colors={[C.goldDim, C.goldMid, C.goldBright]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[s.lifeProgressFill, { width: `${Math.max(0, Math.min(100, progressPct))}%` }]}
        />
      </View>
      <Text style={s.lifeNext}>
        {Math.max(0, Math.floor(milesToNext)).toLocaleString()} miles to{' '}
        <Text style={s.lifeNextGold}>{nextMilestoneTitle}</Text>
      </Text>
    </View>
  );
}

// ─── Road Journey ──────────────────────────────────────────────
function RoadJourney({
  milestones,
  lifetimeMiles,
  milesToCurrentMilestone,
}: {
  milestones: MilestoneProgressItem[];
  lifetimeMiles: number;
  milesToCurrentMilestone: number;
}) {
  return (
    <View style={s.roadContainer}>
      <ImageBackground
        source={require('../../assets/road-image.png')}
        style={s.roadBg}
        imageStyle={s.roadBgImage}
        resizeMode="contain"
      >
        {/* Dark cinematic overlay */}
        <LinearGradient
          colors={['rgba(12,11,9,0.42)', 'rgba(12,11,9,0.22)', 'rgba(12,11,9,0.46)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {/* Bottom fade to remove visible image cutoff */}
        <LinearGradient
          colors={['transparent', 'rgba(12,11,9,0.28)', 'rgba(12,11,9,0.82)', C.bg]}
          locations={[0, 0.45, 0.82, 1]}
          start={{ x: 0, y: 0.55 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <Text style={s.sectionLabel}>THE ROAD</Text>

        <View style={s.roadSpineWrap}>
          {/* Continuous dashed vertical spine */}
          <View style={s.roadSpine} pointerEvents="none" />

          {milestones.map((ms) => {
            const isLocked = !ms.unlocked && !ms.current;
            return (
              <View
                key={ms.miles}
                testID={`milestone-${ms.miles}`}
                style={[s.msRow, isLocked && s.msRowLocked]}
              >
                {/* Left: mile badge */}
                <View
                  style={[
                    s.msShield,
                    ms.unlocked && s.msShieldUnlocked,
                    ms.current && s.msShieldCurrent,
                  ]}
                >
                  <LinearGradient
                    colors={
                      ms.current
                        ? [C.goldMid, C.goldDark]
                        : ms.unlocked
                        ? [C.greenLight, C.green]
                        : ['#1A1918', '#13120F']
                    }
                    style={s.msShieldInner}
                  >
                    <Text style={[s.msShieldMile, ms.current && s.msShieldMileCurrent]}>
                      {ms.miles.toLocaleString()}
                    </Text>
                  </LinearGradient>
                </View>

                {/* Center: spine node */}
                <View style={s.msNodeCol}>
                  <View
                    style={[
                      s.msNode,
                      ms.unlocked && s.msNodeUnlocked,
                      ms.current && s.msNodeCurrent,
                    ]}
                  >
                    {ms.unlocked && !ms.current && (
                      <MaterialIcons name="check" size={12} color={C.white} />
                    )}
                    {ms.current && (
                      <MaterialCommunityIcons name="truck" size={13} color={C.bg} />
                    )}
                  </View>
                </View>

                {/* Right: title + status */}
                <View style={s.msInfo}>
                  <Text
                    style={[
                      s.msTitle,
                      ms.unlocked && s.msTitleUnlocked,
                      ms.current && s.msTitleCurrent,
                    ]}
                  >
                    {ms.title}
                  </Text>
                  <Text
                    style={[s.msStatus, ms.current && s.msStatusCurrent]}
                  >
                    {ms.current
                      ? `${Math.max(0, Math.floor(milesToCurrentMilestone)).toLocaleString()} miles to go`
                      : ms.unlocked
                      ? 'Unlocked'
                      : `${Math.max(0, ms.miles - Math.floor(lifetimeMiles)).toLocaleString()} miles away`}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </ImageBackground>
    </View>
  );
}

// ─── Weekly Progress ───────────────────────────────────────────
function WeeklyProgress({ weekly }: { weekly: { workouts: number; miles: number; streak: number } }) {
  return (
    <View style={s.weekRoadWrap}>
      <LinearGradient
        colors={['#161411', '#1B1915', '#15130F']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.weekRoadBase}
      >
        <View style={s.weekRoadInner}>
          {/* Curved lane center guide */}
          <View style={[s.weekRoadDashLine, s.weekRoadDashLineLeft]}>
            {Array.from({ length: 10 }).map((_, i) => (
              <View key={`left-dash-${i}`} style={s.weekRoadDash} />
            ))}
          </View>
          <View style={[s.weekRoadDashLine, s.weekRoadDashLineMid]}>
            <View style={s.weekRoadDash} />
            <View style={s.weekRoadDash} />
            <View style={s.weekRoadDash} />
          </View>
          <View style={[s.weekRoadDashLine, s.weekRoadDashLineRight]}>
            {Array.from({ length: 10 }).map((_, i) => (
              <View key={`right-dash-${i}`} style={s.weekRoadDash} />
            ))}
          </View>

          <View style={[s.weekStop, s.weekStopLeft]}>
            <MaterialCommunityIcons name="dumbbell" size={18} color={C.goldMid} />
            <Text style={s.weekStopValue}>{weekly.workouts}</Text>
            <Text style={s.weekStopLabel}>Workouts</Text>
            <Text style={s.weekStopPeriod}>this week</Text>
          </View>

          <View style={[s.weekStop, s.weekStopMid]}>
            <MaterialCommunityIcons name="road-variant" size={18} color={C.goldMid} />
            <Text style={s.weekStopValue}>{weekly.miles}</Text>
            <Text style={s.weekStopLabel}>Miles</Text>
            <Text style={s.weekStopPeriod}>this week</Text>
          </View>

          <View style={[s.weekStop, s.weekStopRight]}>
            <MaterialCommunityIcons name="fire" size={18} color={C.goldMid} />
            <Text style={s.weekStopValue}>{weekly.streak}</Text>
            <Text style={s.weekStopLabel}>Day Streak</Text>
            <Text style={s.weekStopPeriod}>current</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────
export default function ProgressMapScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lifetimeMiles, setLifetimeMiles] = useState(0);
  const [weekly, setWeekly] = useState(EMPTY_WEEKLY);

  const computed = useMemo(() => computeMilestoneProgress(lifetimeMiles), [lifetimeMiles]);
  const nextMilestoneTitle = computed.currentMilestone.title;

  const loadProgress = useCallback(async () => {
    setLoading(true);
    try {
      const userId = user?.id || '';
      console.log('[ProgressMap] loaded user id:', userId || '(none)');

      if (!userId) {
        setLifetimeMiles(0);
        setWeekly(EMPTY_WEEKLY);
        return;
      }

      let profileMiles = 0;
      const profileRes = await supabase
        .from('profiles')
        .select('id, lifetime_iron_miles, full_name')
        .eq('id', userId)
        .maybeSingle();

      if (profileRes.error) {
        console.log('[ProgressMap] profile fetch error:', profileRes.error);
      } else {
        profileMiles = Number(profileRes.data?.lifetime_iron_miles ?? 0);
      }
      setLifetimeMiles(profileMiles);
      console.log('[ProgressMap] profile lifetime miles:', profileMiles);

      const weekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

      const [{ data: milesRows, error: milesErr }, { count: completedCount, error: completedErr }, { data: completedRows, error: completedRowsErr }] =
        await Promise.all([
          supabase
            .from('iron_miles_log')
            .select('miles_amount, created_at')
            .eq('user_id', userId)
            .gte('created_at', weekAgoIso),
          supabase
            .from('workout_sessions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('completed_at', weekAgoIso),
          supabase
            .from('workout_sessions')
            .select('completed_at')
            .eq('user_id', userId)
            .eq('status', 'completed')
            .not('completed_at', 'is', null)
            .order('completed_at', { ascending: false })
            .limit(180),
        ]);

      if (milesErr) console.log('[ProgressMap] weekly miles query error:', milesErr);
      if (completedErr) console.log('[ProgressMap] weekly workouts query error:', completedErr);
      if (completedRowsErr) console.log('[ProgressMap] streak query error:', completedRowsErr);

      const milesThisWeek = (milesRows || []).reduce(
        (sum, row) => sum + Number(row.miles_amount || 0),
        0
      );
      const workoutsThisWeek = completedCount || 0;
      const dayStreak = computeDayStreak(completedRows || []);

      setWeekly({
        miles: Math.max(0, Math.floor(milesThisWeek)),
        workouts: Math.max(0, workoutsThisWeek),
        streak: Math.max(0, dayStreak),
      });

      const refreshedComputed = computeMilestoneProgress(profileMiles);
      console.log('[ProgressMap] miles this week:', Math.max(0, Math.floor(milesThisWeek)));
      console.log('[ProgressMap] completed workouts count:', Math.max(0, workoutsThisWeek));
      console.log(
        '[ProgressMap] computed next milestone:',
        refreshedComputed.nextMilestone?.title || '(none)'
      );
    } catch (error) {
      console.log('[ProgressMap] failed to load progress data:', error);
      setLifetimeMiles(0);
      setWeekly(EMPTY_WEEKLY);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      loadProgress();
    }, [loadProgress])
  );

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView
        testID="progress-map-scroll"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <Header />
        {loading ? <Text style={s.loadingText}>Loading progress...</Text> : null}
        <LifetimeMilesCard
          lifetimeMiles={lifetimeMiles}
          progressPct={computed.progressPctToCurrentMilestone}
          milesToNext={computed.milesToCurrentMilestone}
          nextMilestoneTitle={nextMilestoneTitle}
        />
        <WeeklyProgress weekly={weekly} />
        <RoadJourney
          milestones={computed.milestones}
          lifetimeMiles={lifetimeMiles}
          milesToCurrentMilestone={computed.milesToCurrentMilestone}
        />
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 8 },
  loadingText: {
    color: C.textSec,
    fontSize: 11,
    textAlign: 'center',
    letterSpacing: 1,
    marginTop: 6,
  },

  // Header
  header: {},
  headerLine: { height: 1, backgroundColor: C.goldDim, opacity: 0.5 },
  headerContent: { alignItems: 'center', paddingVertical: 12 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: C.gold, letterSpacing: 3 },
  headerSub: { fontSize: 11, color: C.textSec, letterSpacing: 1, marginTop: 3, fontStyle: 'italic' },

  // Section label
  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.gold, letterSpacing: 3, marginBottom: 16 },

  // Ambient glow (behind Lifetime card only)
  ambientWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  ambientOuter: {
    width: 260,
    height: 260,
    borderRadius: 130,
    overflow: 'hidden',
  },
  ambientInner: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    overflow: 'hidden',
  },

  // Lifetime Miles
  lifeCard: {
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 14,
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: C.borderGold,
    borderRadius: 6,
    padding: 18,
    alignItems: 'center',
    overflow: 'hidden',
  },
  lifeLabel: { fontSize: 11, fontWeight: '700', color: C.goldDark, letterSpacing: 3, marginBottom: 4 },
  lifeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6, marginBottom: 14 },
  lifeNumber: { fontSize: 44, fontWeight: '900', color: C.white, letterSpacing: 2 },
  lifeUnit: { fontSize: 16, fontWeight: '700', color: C.textSec, letterSpacing: 1 },
  lifeProgress: {
    width: '100%',
    height: 8,
    backgroundColor: C.surfaceEl,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.borderGold,
    marginBottom: 10,
  },
  lifeProgressFill: { height: '100%', borderRadius: 4 },
  lifeNext: { fontSize: 12, color: C.textMuted },
  lifeNextGold: { color: C.goldMid, fontWeight: '700' },

  // Weekly Progress
  weekRoadWrap: { marginHorizontal: 14, marginBottom: 18 },
  weekRoadBase: {
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    overflow: 'hidden',
  },
  weekRoadInner: {
    minHeight: 142,
    paddingHorizontal: 10,
    paddingVertical: 12,
    position: 'relative',
  },
  weekRoadDashLine: {
    position: 'absolute',
    flexDirection: 'column',
    gap: 3,
    alignItems: 'center',
  },
  weekRoadDashLineLeft: {
    left: '31%',
    top: 24,
    transform: [{ rotate: '-10deg' }],
  },
  weekRoadDashLineMid: {
    left: '48%',
    top: 20,
  },
  weekRoadDashLineRight: {
    left: '67%',
    top: 24,
    transform: [{ rotate: '10deg' }],
  },
  weekRoadDash: {
    width: 2,
    height: 10,
    borderRadius: 1,
    backgroundColor: C.goldDim,
    opacity: 0.45,
  },
  weekStop: {
    position: 'absolute',
    width: 92,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(92,74,26,0.28)',
    backgroundColor: 'rgba(19,18,15,0.84)',
    alignItems: 'center',
  },
  weekStopLeft: { left: 6, top: 36 },
  weekStopMid: { left: '50%', top: 10, marginLeft: -44 },
  weekStopRight: { right: 6, top: 36 },
  weekStopValue: { fontSize: 22, fontWeight: '900', color: C.offWhite, marginTop: 3 },
  weekStopLabel: { fontSize: 11, fontWeight: '700', color: C.textSec, letterSpacing: 0.5 },
  weekStopPeriod: { fontSize: 9, color: C.textMuted, letterSpacing: 0.5 },

  // Road Journey
  roadContainer: { marginHorizontal: 14, marginBottom: 18 },
  roadBg: {
    borderRadius: 10,
    overflow: 'hidden',
    padding: 18,
  },
  roadBgImage: {
    opacity: 0.78,
    borderRadius: 10,
  },
  roadSpineWrap: { position: 'relative' },
  roadSpine: {
    position: 'absolute',
    left: 84,
    top: 0,
    bottom: 0,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    borderColor: C.goldDim,
    opacity: 0.35,
  },

  // Milestone rows
  msRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
  msRowLocked: { opacity: 0.40 },

  msShield: {
    width: 62,
    borderWidth: 2,
    borderColor: C.borderSubtle,
    borderRadius: 6,
    overflow: 'hidden',
  },
  msShieldUnlocked: { borderColor: C.greenLight },
  msShieldCurrent: {
    borderColor: C.goldMid,
    shadowColor: C.goldMid,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 5,
  },
  msShieldInner: { paddingVertical: 9, alignItems: 'center', justifyContent: 'center' },
  msShieldMile: { fontSize: 13, fontWeight: '900', color: C.white, letterSpacing: 0.5 },
  msShieldMileCurrent: { fontSize: 14, color: C.bg },

  msNodeCol: { width: 34, alignItems: 'center', marginHorizontal: 6 },
  msNode: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.surfaceEl,
    borderWidth: 2,
    borderColor: C.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  msNodeUnlocked: { backgroundColor: C.greenLight, borderColor: C.greenLight },
  msNodeCurrent: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: C.goldBright,
    borderColor: C.goldBright,
    shadowColor: C.goldBright,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 8,
  },

  msInfo: { flex: 1 },
  msTitle: { fontSize: 14, fontWeight: '800', color: C.textMuted, letterSpacing: 0.5 },
  msTitleUnlocked: { color: C.offWhite },
  msTitleCurrent: { fontSize: 15, fontWeight: '900', color: C.goldBright },
  msStatus: { fontSize: 11, color: C.textMuted, marginTop: 2 },
  msStatusCurrent: { color: C.goldMid, fontWeight: '600' },
});
