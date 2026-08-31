import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useOnboarding } from '../../src/context/OnboardingContext';
import OnboardingEmblem from '../../src/components/OnboardingEmblem';
import { onboardingGoalLabel } from '../../src/lib/onboardingGoals';

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

const EQUIPMENT_LABELS: Record<string, string> = {
  bodyweight: 'Bodyweight',
  bands: 'Resistance Bands',
  dumbbells: 'Dumbbells',
};

const TIME_LABELS: Record<string, string> = {
  '10': '10 Minutes',
  '20': '20 Minutes',
  '30': '30 Minutes',
  '45': '45+ Minutes',
};

const DRIVER_LABELS: Record<string, string> = {
  local: 'Local',
  regional: 'Regional',
  long_haul: 'Long Haul',
  owner_operator: 'Owner Operator',
};

function ProfileRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={s.row}>
      <OnboardingEmblem name={icon as any} size="xs" selected />
      <View style={s.rowContent}>
        <Text style={s.rowLabel}>{label}</Text>
        <Text style={s.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function SummaryScreen() {
  const { answers, markOnboardingComplete } = useOnboarding();

  const goalLabel = onboardingGoalLabel(answers.goal);
  const equipmentLabel = answers.equipment.length
    ? answers.equipment.map((e) => EQUIPMENT_LABELS[e] ?? e).join(', ')
    : 'Bodyweight';
  const timeLabel = answers.preferredWorkoutTime
    ? (TIME_LABELS[answers.preferredWorkoutTime] ?? answers.preferredWorkoutTime)
    : '—';
  const driverLabel = answers.driverType
    ? (DRIVER_LABELS[answers.driverType] ?? answers.driverType)
    : '—';

  const handleCreateAccount = async () => {
    await markOnboardingComplete();
    router.replace('/auth');
  };

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={C.textSec} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <View style={s.topBadge}>
          <OnboardingEmblem name="check-circle-outline" size="sm" selected />
          <Text style={s.badgeText}>ROAD PROFILE READY</Text>
        </View>

        <Text style={s.title}>Your Road Profile</Text>
        <Text style={s.subtitle}>
          Here's what we built for you. Create your account to save it.
        </Text>

        <View style={s.card}>
          <ProfileRow icon="arm-flex" label="GOAL" value={goalLabel} />
          <View style={s.separator} />
          <ProfileRow icon="dumbbell" label="EQUIPMENT" value={equipmentLabel} />
          <View style={s.separator} />
          <ProfileRow icon="clock-outline" label="WORKOUT TIME" value={timeLabel} />
          <View style={s.separator} />
          <ProfileRow icon="truck" label="DRIVER TYPE" value={driverLabel} />
        </View>

        <Text style={s.note}>
          These preferences are saved to your driver profile and used to personalise your workouts.
        </Text>
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity onPress={handleCreateAccount} activeOpacity={0.85}>
          <LinearGradient
            colors={[C.greenLight, C.green]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.ctaBtn}
          >
            <MaterialCommunityIcons name="account-plus-outline" size={20} color={C.white} />
            <Text style={s.ctaBtnText}>SAVE MY MILES / CREATE ACCOUNT</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: { padding: 4, alignSelf: 'flex-start' },
  scroll: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
  topBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  badgeText: {
    color: C.goldDark,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2,
  },
  title: {
    color: C.white,
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: C.textSec,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  card: {
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.borderGold,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 14,
  },
  rowContent: { flex: 1 },
  rowLabel: {
    color: C.goldDark,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  rowValue: {
    color: C.offWhite,
    fontSize: 15,
    fontWeight: '700',
  },
  separator: {
    height: 1,
    backgroundColor: C.borderSubtle,
    marginHorizontal: 16,
  },
  note: {
    color: C.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
  footer: { paddingHorizontal: 20, paddingBottom: 16, paddingTop: 8 },
  ctaBtn: {
    height: 56,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.goldMid,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 12,
  },
  ctaBtnText: {
    color: C.white,
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
