import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOnboarding } from '../../src/context/OnboardingContext';
import OnboardingEmblem from '../../src/components/OnboardingEmblem';
import {
  ONBOARDING_GOAL_OPTIONS,
  isDeprecatedOnboardingGoal,
} from '../../src/lib/onboardingGoals';

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

export default function GoalScreen() {
  const { answers, setGoal } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(
    isDeprecatedOnboardingGoal(answers.goal) ? null : answers.goal
  );

  const handleNext = () => {
    if (!selected) return;
    setGoal(selected);
    router.push('/(onboarding)/equipment');
  };

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={C.textSec} />
        </TouchableOpacity>
        <ProgressDots current={1} />
        <View style={s.backBtnPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.stepLabel}>STEP 1 OF 4</Text>
        <Text style={s.title}>What's Your Goal?</Text>
        <Text style={s.subtitle}>We'll build your workouts around this.</Text>

        <View style={s.optionsWrap}>
          {ONBOARDING_GOAL_OPTIONS.map((opt) => {
            const isSelected = selected === opt.value;
            return (
              <TouchableOpacity
                key={opt.value}
                style={[s.card, isSelected && s.cardSelected]}
                onPress={() => setSelected(opt.value)}
                activeOpacity={0.8}
              >
                <OnboardingEmblem name={opt.icon as any} size="sm" selected={isSelected} />
                <View style={s.cardText}>
                  <Text style={[s.cardLabel, isSelected && s.cardLabelSelected]}>{opt.label}</Text>
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
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          onPress={handleNext}
          activeOpacity={selected ? 0.85 : 1}
          disabled={!selected}
        >
          <LinearGradient
            colors={selected ? [C.greenLight, C.green] : ['#1A1A18', '#1A1A18']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[s.nextBtn, !selected && s.nextBtnDisabled]}
          >
            <Text style={[s.nextBtnText, !selected && s.nextBtnTextDisabled]}>NEXT</Text>
            <MaterialCommunityIcons
              name="arrow-right"
              size={20}
              color={selected ? C.white : C.textMuted}
            />
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
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.borderSubtle,
  },
  dotActive: {
    backgroundColor: C.gold,
    width: 20,
    borderRadius: 4,
  },
  dotDone: { backgroundColor: C.goldDark },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    justifyContent: 'center',
  },
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
    marginBottom: 24,
  },
  optionsWrap: { gap: 14 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceEl,
    borderWidth: 1.5,
    borderColor: C.borderSubtle,
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 14,
    minHeight: 88,
  },
  cardSelected: {
    borderColor: C.gold,
    backgroundColor: '#201E16',
  },
  cardText: { flex: 1 },
  cardLabel: {
    color: C.offWhite,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  cardLabelSelected: { color: C.gold },
  cardSub: {
    color: C.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  check: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: C.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkSelected: {
    backgroundColor: C.gold,
    borderColor: C.gold,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    paddingTop: 8,
  },
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
  nextBtnDisabled: {
    borderColor: C.borderSubtle,
  },
  nextBtnText: {
    color: C.white,
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 2,
  },
  nextBtnTextDisabled: { color: C.textMuted },
});
