import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import type { WorkoutTabSlug } from '../../src/lib/workout-tab-category-map';

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

type HistoryItem = { title: string; duration: string; miles: number; when: string; icon: string };
const HISTORY: HistoryItem[] = [
  { title: 'Cab Upper Body Strength', duration: '10 min', miles: 10, when: 'Today', icon: 'arm-flex' },
  { title: 'Back Saver Reset', duration: '5 min', miles: 5, when: 'Yesterday', icon: 'yoga' },
  { title: 'Truck Stop Full Body', duration: '20 min', miles: 20, when: '2 days ago', icon: 'human' },
  { title: 'Core Lockdown', duration: '10 min', miles: 10, when: '3 days ago', icon: 'shield-star' },
];

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

// ─── Recent Workouts ───────────────────────────────────────────
function RecentWorkouts() {
  return (
    <View style={[s.section, s.sectionRecent]}>
      <View style={s.sectionHeader}>
        <Text style={[s.sectionLabel, s.sectionLabelInline]}>RECENT WORKOUTS</Text>
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
        <RecentWorkouts />
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.gold, letterSpacing: 3, marginBottom: 16 },
  sectionLabelInline: { marginBottom: 0 },
  seeAll: { fontSize: 12, fontWeight: '700', color: C.goldDark, letterSpacing: 0.5 },

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
});
