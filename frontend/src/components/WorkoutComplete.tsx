import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WorkoutCompleteProps = {
  workoutTitle: string;
  totalExercises: number;
  durationSeconds: number;
  milesEarned: number;
  currentMilestone: string;
  milesUntilNext: number;
  prevMilesUntilNext: number;
  onHammerDown: () => void;
  onDashboard: () => void;
};

// ─── Palette ─────────────────────────────────────────────────────────────────

const C = {
  bg: '#0C0B09',
  surface: '#13120F',
  surfaceEl: '#1C1A17',
  borderSubtle: '#2A2820',
  borderGold: '#5C4A1A',
  gold: '#E0C27C',
  goldBright: '#FFD700',
  goldMid: '#D4A843',
  goldDark: '#B89B5F',
  white: '#FFFFFF',
  offWhite: '#F0EADD',
  textSec: '#9A9080',
  textMuted: '#6B6355',
};

// ─── CB Radio messages ────────────────────────────────────────────────────────

const CB_MESSAGES = [
  '10-4… that\'s a clean run.',
  'You stayed on route.',
  'Miles stacking up.',
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── WorkoutComplete ─────────────────────────────────────────────────────────

export default function WorkoutComplete({
  workoutTitle,
  totalExercises,
  durationSeconds,
  milesEarned,
  currentMilestone,
  milesUntilNext,
  prevMilesUntilNext,
  onHammerDown,
  onDashboard,
}: WorkoutCompleteProps) {
  const insets = useSafeAreaInsets();

  const [displayedMiles, setDisplayedMiles] = useState(0);
  const countTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Pick one CB message on mount
  const cbMessage = useRef(CB_MESSAGES[Math.floor(Math.random() * CB_MESSAGES.length)]).current;

  // Count-up animation: 0 → milesEarned over ~1.2s
  useEffect(() => {
    if (milesEarned <= 0) return;
    const steps = 30;
    const interval = 1200 / steps;
    let step = 0;
    countTimer.current = setInterval(() => {
      step += 1;
      const progress = step / steps;
      // ease-out curve
      const eased = 1 - Math.pow(1 - progress, 2);
      setDisplayedMiles(Math.round(eased * milesEarned));
      if (step >= steps) {
        clearInterval(countTimer.current!);
        setDisplayedMiles(milesEarned);
      }
    }, interval);
    return () => {
      if (countTimer.current) clearInterval(countTimer.current);
    };
  }, [milesEarned]);

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <View style={[s.inner, { paddingBottom: Math.max(insets.bottom, 16) }]}>

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <View style={s.heroSection}>
          <Text style={s.routeCompleteLabel}>ROUTE COMPLETE</Text>
          <Text style={s.heroSubtext}>You put in the miles.</Text>
        </View>

        {/* ── Miles earned (count-up) ───────────────────────────────────────── */}
        <View style={s.milesBlock}>
          <Text style={s.milesBadge}>+{displayedMiles}</Text>
          <Text style={s.milesUnit}>MILES</Text>
        </View>

        {/* ── Stats row ────────────────────────────────────────────────────── */}
        <View style={s.statsCard}>
          <View style={s.statItem}>
            <Text style={s.statValue}>{totalExercises}</Text>
            <Text style={s.statLabel}>Stops Completed</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statValue}>{formatDuration(durationSeconds)}</Text>
            <Text style={s.statLabel}>Time on Route</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statValue}>+{milesEarned}</Text>
            <Text style={s.statLabel}>Miles Earned</Text>
          </View>
        </View>

        {/* ── Milestone progression ────────────────────────────────────────── */}
        <View style={s.milestoneBlock}>
          <Text style={s.milestoneName}>{currentMilestone}</Text>
          <Text style={s.milestoneProgress}>
            {milesUntilNext} miles to {currentMilestone}
          </Text>
        </View>

        {/* ── CB Radio message ─────────────────────────────────────────────── */}
        <Text style={s.cbMessage}>{`"${cbMessage}"`}</Text>

        {/* ── Action buttons ───────────────────────────────────────────────── */}
        <View style={s.buttonGroup}>
          <TouchableOpacity style={s.primaryBtn} onPress={onHammerDown} activeOpacity={0.85}>
            <Text style={s.primaryBtnText}>HAMMER DOWN AGAIN</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.outlineBtn} onPress={onDashboard} activeOpacity={0.8}>
            <Text style={s.outlineBtnText}>BACK TO DASHBOARD</Text>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between',
    paddingTop: 24,
  },

  heroSection: {
    alignItems: 'center',
    gap: 8,
  },
  routeCompleteLabel: {
    color: C.goldMid,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 4,
  },
  heroSubtext: {
    color: C.textSec,
    fontSize: 16,
    fontStyle: 'italic',
  },

  milesBlock: {
    alignItems: 'center',
    gap: 2,
  },
  milesBadge: {
    color: C.goldBright,
    fontSize: 88,
    fontWeight: '900',
    lineHeight: 92,
  },
  milesUnit: {
    color: C.textMuted,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 4,
  },

  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceEl,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  statDivider: {
    width: 1,
    height: 36,
    backgroundColor: C.borderSubtle,
  },
  statValue: {
    color: C.offWhite,
    fontSize: 20,
    fontWeight: '800',
  },
  statLabel: {
    color: C.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },

  milestoneBlock: {
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
  },
  milestoneName: {
    color: C.gold,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 2,
  },
  milestoneProgress: {
    color: C.textSec,
    fontSize: 14,
  },

  cbMessage: {
    color: C.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 16,
  },

  buttonGroup: {
    gap: 12,
  },
  primaryBtn: {
    height: 60,
    borderRadius: 30,
    backgroundColor: C.goldMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: C.bg,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
  outlineBtn: {
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: '#8A867C',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  outlineBtnText: {
    color: C.offWhite,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});
