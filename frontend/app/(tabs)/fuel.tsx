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
  blue: '#1A2A3A',
};

type Meal = { name: string; cals: string; quality: string; qualityColor: string; icon: string; time: string };
const MEALS: Meal[] = [
  { name: 'Chicken Wrap + Water', cals: '420 cal', quality: 'Premium Fuel', qualityColor: '#27503B', icon: 'food-turkey', time: '7:30 AM' },
  { name: 'Protein Bar + Coffee', cals: '280 cal', quality: 'Strong Fuel', qualityColor: '#3A2A10', icon: 'food-croissant', time: '10:15 AM' },
  { name: 'Greek Yogurt + Nuts', cals: '310 cal', quality: 'Premium Fuel', qualityColor: '#27503B', icon: 'food-apple', time: '1:00 PM' },
  { name: 'Turkey Sub + Gatorade', cals: '520 cal', quality: 'Neutral Fuel', qualityColor: '#2A2820', icon: 'food', time: '5:45 PM' },
];

type Suggestion = { title: string; desc: string; icon: string };
const SUGGESTIONS: Suggestion[] = [
  { title: 'Better options at Pilot', desc: 'Grilled chicken, salads, protein packs', icon: 'gas-station' },
  { title: "Protein picks at Love's", desc: 'Hardboiled eggs, jerky, string cheese', icon: 'store' },
  { title: 'Late night fuel ideas', desc: 'Avoid fried — grab wraps or yogurt', icon: 'weather-night' },
];

function Header() {
  return (
    <View style={s.header}>
      <View style={s.headerLine} />
      <View style={s.headerContent}>
        <Text style={s.headerTitle}>FUEL</Text>
        <Text style={s.headerSub}>Road nutrition made simple</Text>
      </View>
      <View style={[s.headerLine, { opacity: 0.25 }]} />
    </View>
  );
}

function DailySummary() {
  return (
    <View style={s.summaryRow}>
      <View style={s.summaryCard}>
        <MaterialCommunityIcons name="silverware-fork-knife" size={20} color={C.goldMid} />
        <Text style={s.summaryVal}>4</Text>
        <Text style={s.summaryLabel}>Fuel Stops</Text>
        <Text style={s.summaryPeriod}>today</Text>
      </View>
      <View style={s.summaryCard}>
        <MaterialCommunityIcons name="water" size={20} color="#4A90D9" />
        <Text style={s.summaryVal}>3/6</Text>
        <Text style={s.summaryLabel}>Hydration</Text>
        <Text style={s.summaryPeriod}>bottles</Text>
      </View>
      <View style={s.summaryCard}>
        <MaterialCommunityIcons name="gauge" size={20} color={C.greenLight} />
        <Text style={s.summaryVal}>Good</Text>
        <Text style={s.summaryLabel}>Fuel Quality</Text>
        <Text style={s.summaryPeriod}>today</Text>
      </View>
    </View>
  );
}

function HydrationCard() {
  return (
    <View style={s.hydroCard}>
      <View style={s.hydroHeader}>
        <MaterialCommunityIcons name="water" size={18} color="#4A90D9" />
        <Text style={s.sectionLabel}>HYDRATION</Text>
      </View>
      <View style={s.hydroRow}>
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={[s.hydroBottle, i <= 3 && s.hydroBottleFilled]}>
            <MaterialCommunityIcons name="bottle-soda" size={20} color={i <= 3 ? '#4A90D9' : C.textMuted} />
          </View>
        ))}
      </View>
      <View style={s.hydroProgress}>
        <View style={[s.hydroProgressFill, { width: '50%' }]} />
      </View>
      <Text style={s.hydroText}>3 of 6 bottles — keep fueling</Text>
    </View>
  );
}

function FuelStops() {
  return (
    <View style={s.section}>
      <Text style={s.sectionLabel}>{"TODAY'S FUEL STOPS"}</Text>
      {MEALS.map((m, i) => (
        <View key={i} testID={`meal-${i}`} style={s.mealCard}>
          <View style={s.mealIconWrap}>
            <MaterialCommunityIcons name={m.icon as any} size={22} color={C.goldMid} />
          </View>
          <View style={s.mealInfo}>
            <Text style={s.mealName}>{m.name}</Text>
            <View style={s.mealMeta}>
              <Text style={s.mealMetaText}>{m.cals}</Text>
              <View style={s.mealDot} />
              <Text style={s.mealMetaText}>{m.time}</Text>
            </View>
          </View>
          <View style={[s.qualityChip, { backgroundColor: m.qualityColor }]}>
            <Text style={s.qualityText}>{m.quality}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

function RoadSuggestions() {
  return (
    <View style={s.section}>
      <Text style={s.sectionLabel}>ROAD SUGGESTIONS</Text>
      {SUGGESTIONS.map((sg, i) => (
        <TouchableOpacity key={i} testID={`suggestion-${i}`} style={s.sugCard} activeOpacity={0.7}>
          <View style={s.sugIconWrap}>
            <MaterialCommunityIcons name={sg.icon as any} size={22} color={C.goldMid} />
          </View>
          <View style={s.sugInfo}>
            <Text style={s.sugTitle}>{sg.title}</Text>
            <Text style={s.sugDesc}>{sg.desc}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export default function FuelScreen() {
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView testID="fuel-scroll" showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <Header />
        <DailySummary />
        <HydrationCard />
        <FuelStops />
        <RoadSuggestions />
        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 8 },

  header: {},
  headerLine: { height: 1, backgroundColor: C.goldDim, opacity: 0.5 },
  headerContent: { alignItems: 'center', paddingVertical: 12 },
  headerTitle: { fontSize: 20, fontWeight: '900', color: C.gold, letterSpacing: 3 },
  headerSub: { fontSize: 11, color: C.textSec, letterSpacing: 1, marginTop: 3, fontStyle: 'italic' },

  section: { marginHorizontal: 14, marginBottom: 18 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.gold, letterSpacing: 3, marginBottom: 14 },

  summaryRow: { flexDirection: 'row', marginHorizontal: 14, gap: 8, marginTop: 4, marginBottom: 14 },
  summaryCard: {
    flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.borderSubtle,
    borderRadius: 6, padding: 12, alignItems: 'center', gap: 2,
  },
  summaryVal: { fontSize: 22, fontWeight: '900', color: C.offWhite, marginTop: 4 },
  summaryLabel: { fontSize: 11, fontWeight: '700', color: C.textSec, letterSpacing: 0.5 },
  summaryPeriod: { fontSize: 9, color: C.textMuted },

  hydroCard: {
    marginHorizontal: 14, marginBottom: 18, backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 6, padding: 14,
  },
  hydroHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 12 },
  hydroRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10 },
  hydroBottle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: C.surfaceEl,
    borderWidth: 1, borderColor: C.borderSubtle, alignItems: 'center', justifyContent: 'center',
  },
  hydroBottleFilled: { borderColor: '#4A90D9', backgroundColor: '#0D1A2A' },
  hydroProgress: { height: 6, backgroundColor: C.surfaceEl, borderRadius: 3, overflow: 'hidden', marginBottom: 6 },
  hydroProgressFill: { height: '100%', backgroundColor: '#4A90D9', borderRadius: 3 },
  hydroText: { fontSize: 11, color: C.textMuted, textAlign: 'center' },

  mealCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 6, padding: 12, marginBottom: 8,
  },
  mealIconWrap: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: C.surfaceEl,
    borderWidth: 1, borderColor: C.borderSubtle, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  mealInfo: { flex: 1 },
  mealName: { fontSize: 14, fontWeight: '800', color: C.offWhite, marginBottom: 2 },
  mealMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  mealMetaText: { fontSize: 11, color: C.textMuted },
  mealDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: C.goldDim },
  qualityChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, borderWidth: 1, borderColor: C.borderSubtle },
  qualityText: { fontSize: 9, fontWeight: '700', color: C.offWhite, letterSpacing: 0.5 },

  sugCard: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 6, padding: 12, marginBottom: 8,
  },
  sugIconWrap: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: C.surfaceEl,
    borderWidth: 1, borderColor: C.goldDim, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  sugInfo: { flex: 1 },
  sugTitle: { fontSize: 14, fontWeight: '800', color: C.offWhite, marginBottom: 2 },
  sugDesc: { fontSize: 11, color: C.textMuted, lineHeight: 16 },
});
