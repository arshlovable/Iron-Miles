import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';

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

// Placeholder data
const LIFETIME_MILES = 4820;
const NEXT_MILESTONE_MILES = 5000;
const MILES_TO_NEXT = NEXT_MILESTONE_MILES - LIFETIME_MILES;

type Milestone = {
  miles: number;
  title: string;
  unlocked: boolean;
  current?: boolean;
  icon: string;
};

const MILESTONES: Milestone[] = [
  { miles: 100, title: 'Left the Parking Lot', unlocked: true, icon: 'key-variant' },
  { miles: 500, title: 'First Long Haul', unlocked: true, icon: 'truck-delivery' },
  { miles: 1000, title: 'Road Warrior', unlocked: true, icon: 'shield-star' },
  { miles: 2500, title: 'Highway Legend', unlocked: true, icon: 'highway' },
  { miles: 5000, title: 'Iron Driver', unlocked: false, current: true, icon: 'medal' },
  { miles: 10000, title: 'Diesel Discipline', unlocked: false, icon: 'fire' },
];

const WEEKLY = { workouts: 4, miles: 85, streak: 3 };

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

// ─── Lifetime Miles Card ───────────────────────────────────────
function LifetimeMilesCard() {
  const pct = Math.min((LIFETIME_MILES / NEXT_MILESTONE_MILES) * 100, 100);
  return (
    <View style={s.lifeCard}>
      <Text style={s.lifeLabel}>LIFETIME IRON MILES</Text>
      <View style={s.lifeRow}>
        <Text style={s.lifeNumber}>{LIFETIME_MILES.toLocaleString()}</Text>
        <Text style={s.lifeUnit}>miles</Text>
      </View>
      <View style={s.lifeProgress}>
        <LinearGradient
          colors={[C.goldDim, C.goldMid, C.goldBright]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[s.lifeProgressFill, { width: `${pct}%` }]}
        />
      </View>
      <Text style={s.lifeNext}>
        {MILES_TO_NEXT.toLocaleString()} miles to <Text style={s.lifeNextGold}>Iron Driver</Text>
      </Text>
    </View>
  );
}

// ─── Road Journey ──────────────────────────────────────────────
function RoadJourney() {
  return (
    <View style={s.roadContainer}>
      <Text style={s.sectionLabel}>THE ROAD</Text>
      <View style={s.road}>
        {MILESTONES.map((ms, i) => {
          const isLast = i === MILESTONES.length - 1;
          return (
            <View key={ms.miles} testID={`milestone-${ms.miles}`}>
              {/* Milestone marker */}
              <View style={s.msRow}>
                {/* Left: shield badge */}
                <View style={[s.msShield, ms.unlocked && s.msShieldUnlocked, ms.current && s.msShieldCurrent]}>
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
                    <Text style={s.msShieldMile}>{ms.miles.toLocaleString()}</Text>
                  </LinearGradient>
                </View>

                {/* Center: road node */}
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
                      <MaterialCommunityIcons name="truck" size={12} color={C.bg} />
                    )}
                  </View>
                </View>

                {/* Right: title + status */}
                <View style={s.msInfo}>
                  <Text style={[s.msTitle, ms.unlocked && s.msTitleUnlocked, ms.current && s.msTitleCurrent]}>
                    {ms.title}
                  </Text>
                  <Text style={s.msStatus}>
                    {ms.current
                      ? `${MILES_TO_NEXT} miles to go`
                      : ms.unlocked
                      ? 'Unlocked'
                      : `${(ms.miles - LIFETIME_MILES).toLocaleString()} miles away`}
                  </Text>
                </View>
              </View>

              {/* Road segment between milestones */}
              {!isLast && (
                <View style={s.roadSegment}>
                  <View style={s.roadSegmentLine}>
                    <View style={s.roadDash} />
                    <View style={s.roadDash} />
                    <View style={s.roadDash} />
                  </View>
                </View>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── Milestones Unlocked List ──────────────────────────────────
function MilestonesList() {
  const unlocked = MILESTONES.filter((m) => m.unlocked);
  return (
    <View style={s.mlCard}>
      <Text style={s.sectionLabel}>MILESTONES UNLOCKED</Text>
      {unlocked.map((ms) => (
        <View key={ms.miles} style={s.mlRow}>
          <View style={s.mlCheck}>
            <MaterialIcons name="check" size={14} color={C.greenLight} />
          </View>
          <Text style={s.mlTitle}>{ms.title}</Text>
          <Text style={s.mlMiles}>{ms.miles.toLocaleString()} mi</Text>
        </View>
      ))}
    </View>
  );
}

// ─── Weekly Progress ───────────────────────────────────────────
function WeeklyProgress() {
  return (
    <View style={s.weekRow}>
      <View style={s.weekCard}>
        <MaterialCommunityIcons name="dumbbell" size={20} color={C.goldMid} />
        <Text style={s.weekValue}>{WEEKLY.workouts}</Text>
        <Text style={s.weekLabel}>Workouts</Text>
        <Text style={s.weekPeriod}>this week</Text>
      </View>
      <View style={s.weekCard}>
        <MaterialCommunityIcons name="road-variant" size={20} color={C.goldMid} />
        <Text style={s.weekValue}>{WEEKLY.miles}</Text>
        <Text style={s.weekLabel}>Miles</Text>
        <Text style={s.weekPeriod}>this week</Text>
      </View>
      <View style={s.weekCard}>
        <MaterialCommunityIcons name="fire" size={20} color={C.goldMid} />
        <Text style={s.weekValue}>{WEEKLY.streak}</Text>
        <Text style={s.weekLabel}>Day Streak</Text>
        <Text style={s.weekPeriod}>current</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────
export default function ProgressMapScreen() {
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView
        testID="progress-map-scroll"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <Header />
        <LifetimeMilesCard />
        <WeeklyProgress />
        <RoadJourney />
        <MilestonesList />
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 8 },

  // Header
  header: {},
  headerLine: { height: 1, backgroundColor: C.goldDim, opacity: 0.5 },
  headerContent: { alignItems: 'center', paddingVertical: 12 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: C.gold, letterSpacing: 3 },
  headerSub: { fontSize: 11, color: C.textSec, letterSpacing: 1, marginTop: 3, fontStyle: 'italic' },

  // Section label
  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.gold, letterSpacing: 3, marginBottom: 14 },

  // Lifetime Miles
  lifeCard: {
    marginHorizontal: 14,
    marginTop: 8,
    marginBottom: 14,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.borderGold,
    borderRadius: 6,
    padding: 18,
    alignItems: 'center',
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
  weekRow: { flexDirection: 'row', marginHorizontal: 14, gap: 8, marginBottom: 18 },
  weekCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    borderRadius: 6,
    padding: 12,
    alignItems: 'center',
    gap: 2,
  },
  weekValue: { fontSize: 22, fontWeight: '900', color: C.offWhite, marginTop: 4 },
  weekLabel: { fontSize: 11, fontWeight: '700', color: C.textSec, letterSpacing: 0.5 },
  weekPeriod: { fontSize: 9, color: C.textMuted, letterSpacing: 0.5 },

  // Road Journey
  roadContainer: { marginHorizontal: 14, marginBottom: 18 },
  road: {},
  msRow: { flexDirection: 'row', alignItems: 'center' },
  msShield: {
    width: 56,
    borderWidth: 2,
    borderColor: C.borderSubtle,
    borderRadius: 4,
    overflow: 'hidden',
  },
  msShieldUnlocked: { borderColor: C.greenLight },
  msShieldCurrent: { borderColor: C.goldMid },
  msShieldInner: { paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  msShieldMile: { fontSize: 13, fontWeight: '900', color: C.white, letterSpacing: 0.5 },

  msNodeCol: { width: 32, alignItems: 'center', marginHorizontal: 6 },
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
  msNodeCurrent: { backgroundColor: C.goldBright, borderColor: C.goldBright },

  msInfo: { flex: 1 },
  msTitle: { fontSize: 14, fontWeight: '800', color: C.textMuted, letterSpacing: 0.5 },
  msTitleUnlocked: { color: C.offWhite },
  msTitleCurrent: { color: C.goldBright },
  msStatus: { fontSize: 11, color: C.textMuted, marginTop: 1 },

  roadSegment: { paddingLeft: 76, height: 28, justifyContent: 'center' },
  roadSegmentLine: { flexDirection: 'column', alignItems: 'center', gap: 3, height: '100%', justifyContent: 'center' },
  roadDash: { width: 2, height: 5, backgroundColor: C.goldDim, opacity: 0.5, borderRadius: 1 },

  // Milestones List
  mlCard: {
    marginHorizontal: 14,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    borderRadius: 6,
    padding: 16,
  },
  mlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSubtle,
    gap: 10,
  },
  mlCheck: {
    width: 22,
    height: 22,
    borderRadius: 4,
    backgroundColor: '#132A1E',
    borderWidth: 1,
    borderColor: C.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mlTitle: { flex: 1, fontSize: 14, fontWeight: '700', color: C.offWhite },
  mlMiles: { fontSize: 12, fontWeight: '700', color: C.goldDark, letterSpacing: 0.5 },
});
