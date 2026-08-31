import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOnboarding } from '../../src/context/OnboardingContext';
import OnboardingEmblem from '../../src/components/OnboardingEmblem';

const C = {
  bg: '#0C0B09',
  surface: '#13120F',
  surfaceEl: '#1C1A17',
  borderSubtle: '#2A2820',
  borderGold: '#5C4A1A',
  gold: '#E0C27C',
  goldMid: '#D4A843',
  goldDark: '#B89B5F',
  white: '#FFFFFF',
  offWhite: '#F0EADD',
  textSec: '#9A9080',
  textMuted: '#6B6355',
  green: '#1F4037',
  greenLight: '#27503B',
};

const OPTIONS = [
  {
    value: 'bodyweight',
    label: 'Bodyweight',
    sub: 'No equipment required',
    icon: 'human',
  },
  {
    value: 'bands',
    label: 'Resistance Bands',
    sub: 'Lightweight, fits in the cab',
    icon: 'lightning-bolt',
  },
  {
    value: 'dumbbells',
    label: 'Dumbbells',
    sub: 'Adjustable or fixed weight',
    icon: 'dumbbell',
  },
];

function ProgressDots({ current }: { current: number }) {
  return (
    <View style={s.dotsRow}>
      {[1, 2, 3, 4].map((n) => (
        <View
          key={n}
          style={[s.dot, n === current && s.dotActive, n < current && s.dotDone]}
        />
      ))}
    </View>
  );
}

export default function EquipmentScreen() {
  const { answers, setEquipment } = useOnboarding();
  const [selected, setSelected] = useState<string[]>(
    answers.equipment.length ? answers.equipment : ['bodyweight']
  );

  const toggle = (val: string) => {
    if (val === 'bodyweight') {
      if (!selected.includes('bodyweight')) {
        setSelected((prev) => [...prev, 'bodyweight']);
      }
      return;
    }
    setSelected((prev) =>
      prev.includes(val)
        ? prev.filter((v) => v !== val)
        : [...prev, val]
    );
  };

  const handleNext = () => {
    const finalSelection = selected.length ? selected : ['bodyweight'];
    setEquipment(finalSelection);
    router.push('/(onboarding)/time');
  };

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={C.textSec} />
        </TouchableOpacity>
        <ProgressDots current={2} />
        <View style={s.backBtnPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.stepLabel}>STEP 2 OF 4</Text>
        <Text style={s.title}>What's In Your Cab?</Text>
        <Text style={s.subtitle}>Select all that you have. Bodyweight always applies.</Text>

        <View style={s.optionsWrap}>
          {OPTIONS.map((opt) => {
            const isSelected = selected.includes(opt.value);
            const isLocked = opt.value === 'bodyweight';
            return (
              <TouchableOpacity
                key={opt.value}
                style={[s.card, isSelected && s.cardSelected]}
                onPress={() => toggle(opt.value)}
                activeOpacity={isLocked ? 1 : 0.8}
              >
                <OnboardingEmblem name={opt.icon as any} size="sm" selected={isSelected} />
                <View style={s.cardText}>
                  <Text style={[s.cardLabel, isSelected && s.cardLabelSelected]}>
                    {opt.label}
                    {isLocked ? '  ✓' : ''}
                  </Text>
                  <Text style={s.cardSub}>{opt.sub}</Text>
                </View>
                <View style={[s.check, isSelected && s.checkSelected]}>
                  {isSelected && (
                    <MaterialCommunityIcons name="check" size={14} color={C.bg} />
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={s.note}>
          You can change this anytime in Settings → Equipment Setup.
        </Text>
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity onPress={handleNext} activeOpacity={0.85}>
          <LinearGradient
            colors={[C.greenLight, C.green]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.nextBtn}
          >
            <Text style={s.nextBtnText}>NEXT</Text>
            <MaterialCommunityIcons name="arrow-right" size={20} color={C.white} />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: { padding: 4 },
  backBtnPlaceholder: { width: 36 },
  dotsRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.borderSubtle },
  dotActive: { backgroundColor: C.gold, width: 20, borderRadius: 4 },
  dotDone: { backgroundColor: C.goldDark },
  scroll: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 24 },
  stepLabel: {
    color: C.goldDark,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 8,
  },
  title: {
    color: C.white,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  subtitle: {
    color: C.textSec,
    fontSize: 14,
    marginBottom: 28,
  },
  optionsWrap: { gap: 12 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceEl,
    borderWidth: 1.5,
    borderColor: C.borderSubtle,
    borderRadius: 10,
    padding: 16,
    gap: 14,
  },
  cardSelected: { borderColor: C.gold, backgroundColor: '#201E16' },
  cardText: { flex: 1 },
  cardLabel: { color: C.offWhite, fontSize: 16, fontWeight: '700', marginBottom: 2 },
  cardLabelSelected: { color: C.gold },
  cardSub: { color: C.textMuted, fontSize: 12, fontWeight: '500' },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: C.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: { backgroundColor: C.gold, borderColor: C.gold },
  note: {
    marginTop: 20,
    color: C.textMuted,
    fontSize: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  footer: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
  nextBtn: {
    height: 56,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.goldMid,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  nextBtnText: { color: C.white, fontSize: 15, fontWeight: '900', letterSpacing: 2 },
});
