import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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

type Category = { id: string; label: string; icon: string; color: string };
const CATEGORIES: Category[] = [
  { id: 'cab', label: 'Cab\nWorkouts', icon: 'truck', color: '#27503B' },
  { id: 'stop', label: 'Truck Stop\nWorkouts', icon: 'gas-station', color: '#3A2A10' },
  { id: 'core', label: 'Core', icon: 'shield-star', color: '#2A1A3A' },
  { id: 'mobility', label: 'Mobility', icon: 'yoga', color: '#1A2A3A' },
  { id: 'full', label: 'Full\nBody', icon: 'human', color: '#3A1A1A' },
  { id: 'reset', label: 'Quick\nReset', icon: 'lightning-bolt', color: '#2A2A10' },
];

type HistoryItem = { title: string; duration: string; miles: number; when: string; icon: string };
const HISTORY: HistoryItem[] = [
  { title: 'Cab Upper Body Strength', duration: '10 min', miles: 10, when: 'Today', icon: 'arm-flex' },
  { title: 'Back Saver Reset', duration: '5 min', miles: 5, when: 'Yesterday', icon: 'yoga' },
  { title: 'Truck Stop Full Body', duration: '20 min', miles: 20, when: '2 days ago', icon: 'human' },
  { title: 'Core Lockdown', duration: '10 min', miles: 10, when: '3 days ago', icon: 'shield-star' },
];

type QuickPick = { title: string; duration: string; miles: number; icon: string };
const QUICK_PICKS: QuickPick[] = [
  { title: '5 Min Quick Reset', duration: '5 min', miles: 5, icon: 'lightning-bolt' },
  { title: '10 Min Upper Body', duration: '10 min', miles: 10, icon: 'arm-flex' },
  { title: 'Back Relief Mobility', duration: '10 min', miles: 10, icon: 'meditation' },
  { title: 'Full Body Stop Workout', duration: '20 min', miles: 20, icon: 'dumbbell' },
];

const FILTERS = ['All', 'Bodyweight', 'Bands', 'Dumbbells', '5 min', '10 min', '20 min'];

// ─── Header ────────────────────────────────────────────────────
function Header() {
  return (
    <View style={s.header}>
      <View style={s.headerLine} />
      <View style={s.headerContent}>
        <Text style={s.headerTitle}>WORKOUTS</Text>
        <Text style={s.headerSub}>Quick workouts built for truckers</Text>
      </View>
      <View style={[s.headerLine, { opacity: 0.25 }]} />
    </View>
  );
}

// ─── Filter Chips ──────────────────────────────────────────────
function FilterChips() {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={s.filterRow}
    >
      {FILTERS.map((f, i) => (
        <TouchableOpacity
          key={f}
          testID={`filter-${f.toLowerCase().replace(/\s/g, '-')}`}
          style={[s.filterChip, i === 0 && s.filterChipActive]}
          activeOpacity={0.7}
        >
          <Text style={[s.filterText, i === 0 && s.filterTextActive]}>{f}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

// ─── Category Grid ─────────────────────────────────────────────
function CategoryGrid() {
  return (
    <View style={s.section}>
      <Text style={s.sectionLabel}>CATEGORIES</Text>
      <View style={s.catGrid}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            testID={`cat-${cat.id}`}
            style={s.catCard}
            activeOpacity={0.7}
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

// ─── Recent Workouts ───────────────────────────────────────────
function RecentWorkouts() {
  return (
    <View style={s.section}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionLabel}>RECENT WORKOUTS</Text>
        <TouchableOpacity testID="see-all-recent" activeOpacity={0.7}>
          <Text style={s.seeAll}>See All</Text>
        </TouchableOpacity>
      </View>
      {HISTORY.map((item, i) => (
        <TouchableOpacity
          key={i}
          testID={`history-${i}`}
          style={s.histCard}
          activeOpacity={0.7}
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
      ))}
    </View>
  );
}

// ─── Quick Picks ───────────────────────────────────────────────
function QuickPicksSection() {
  return (
    <View style={s.section}>
      <Text style={s.sectionLabel}>QUICK PICKS</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={s.qpRow}
      >
        {QUICK_PICKS.map((qp, i) => (
          <TouchableOpacity
            key={i}
            testID={`quick-pick-${i}`}
            style={s.qpCard}
            activeOpacity={0.7}
          >
            <View style={s.qpIconWrap}>
              <MaterialCommunityIcons name={qp.icon as any} size={28} color={C.goldBright} />
            </View>
            <Text style={s.qpTitle}>{qp.title}</Text>
            <View style={s.qpMetaRow}>
              <MaterialCommunityIcons name="clock-outline" size={12} color={C.textMuted} />
              <Text style={s.qpMeta}>{qp.duration}</Text>
            </View>
            <View style={s.qpMilesChip}>
              <Text style={s.qpMilesText}>+{qp.miles} mi</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
        <FilterChips />
        <CategoryGrid />
        <QuickPicksSection />
        <RecentWorkouts />
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

  // Filters
  filterRow: { paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.borderSubtle,
  },
  filterChipActive: { borderColor: C.goldMid, backgroundColor: '#15130D' },
  filterText: { fontSize: 12, fontWeight: '700', color: C.textMuted, letterSpacing: 0.5 },
  filterTextActive: { color: C.gold },

  // Section
  section: { marginHorizontal: 14, marginBottom: 18 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.gold, letterSpacing: 3, marginBottom: 14 },
  seeAll: { fontSize: 12, fontWeight: '700', color: C.goldDark, letterSpacing: 0.5 },

  // Category Grid
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catCard: {
    width: '31.5%',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    overflow: 'hidden',
  },
  catCardBg: {
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 6,
    minHeight: 90,
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
    padding: 12,
    marginBottom: 8,
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
    marginRight: 12,
  },
  histInfo: { flex: 1 },
  histTitle: { fontSize: 14, fontWeight: '800', color: C.offWhite, marginBottom: 3 },
  histMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  histMetaText: { fontSize: 11, color: C.textMuted },
  histDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.goldDim },

  // Quick Picks
  qpRow: { gap: 10, paddingRight: 14 },
  qpCard: {
    width: 150,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    borderRadius: 6,
    padding: 14,
    gap: 6,
  },
  qpIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.surfaceEl,
    borderWidth: 1,
    borderColor: C.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  qpTitle: { fontSize: 13, fontWeight: '800', color: C.offWhite, lineHeight: 17 },
  qpMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  qpMeta: { fontSize: 11, color: C.textMuted },
  qpMilesChip: {
    alignSelf: 'flex-start',
    backgroundColor: '#132A1E',
    borderWidth: 1,
    borderColor: C.greenLight,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  qpMilesText: { fontSize: 10, fontWeight: '700', color: C.greenLight },
});
