import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

export default function MissionScreen() {
  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={C.textSec} />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <OnboardingEmblem name="road-variant" size="md" accent style={s.heroEmblem} />

        <Text style={s.title}>
          The road shouldn't cost you your health.
        </Text>

        <View style={s.divider} />

        <Text style={s.body}>
          Truck driving is one of the toughest lifestyles for staying fit.
        </Text>
        <Text style={s.body}>
          Long hours. Limited equipment. Inconsistent schedules.
        </Text>
        <Text style={s.bodyHighlight}>
          Iron Miles was built for drivers who want to stay strong, healthy, and disciplined on the road.
        </Text>

        <View style={s.statsRow}>
          {[
            { icon: 'clock-outline', stat: '10–45 min', label: 'Per session' },
            { icon: 'map-marker-check', stat: 'Any stop', label: 'Truck stop or lot' },
            { icon: 'dumbbell', stat: '56 exercises', label: 'Road-ready library' },
          ].map((item) => (
            <View key={item.stat} style={s.statCard}>
              <MaterialCommunityIcons name={item.icon as any} size={20} color={C.gold} />
              <Text style={s.statNum}>{item.stat}</Text>
              <Text style={s.statLabel}>{item.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={s.footer}>
        <TouchableOpacity
          onPress={() => router.push('/(onboarding)/summary')}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={[C.greenLight, C.green]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.ctaBtn}
          >
            <Text style={s.ctaBtnText}>BUILD MY ROAD PROFILE</Text>
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
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  backBtn: { padding: 4, alignSelf: 'flex-start' },
  scroll: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  heroEmblem: {
    alignSelf: 'center',
    marginBottom: 28,
  },
  title: {
    color: C.gold,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 32,
    textAlign: 'center',
    marginBottom: 24,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: C.borderGold,
    alignSelf: 'center',
    marginBottom: 24,
  },
  body: {
    color: C.textSec,
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 8,
  },
  bodyHighlight: {
    color: C.offWhite,
    fontSize: 16,
    lineHeight: 26,
    textAlign: 'center',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 32,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'center',
  },
  statCard: {
    flex: 1,
    backgroundColor: C.surfaceEl,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 4,
  },
  statNum: {
    color: C.white,
    fontSize: 13,
    fontWeight: '800',
    textAlign: 'center',
  },
  statLabel: {
    color: C.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
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
  },
  ctaBtnText: { color: C.white, fontSize: 14, fontWeight: '900', letterSpacing: 1.5 },
});
