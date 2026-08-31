import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import OnboardingEmblem from '../../src/components/OnboardingEmblem';

const C = {
  bg: '#0C0B09',
  surface: '#13120F',
  borderGold: '#5C4A1A',
  borderSubtle: '#2A2820',
  gold: '#E0C27C',
  goldMid: '#D4A843',
  white: '#FFFFFF',
  textSec: '#9A9080',
  textMuted: '#6B6355',
  green: '#1F4037',
  greenLight: '#27503B',
};

export default function WelcomeScreen() {
  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <View style={s.inner}>

        <View style={s.contentBlock}>
          <View style={s.topSection}>
            <OnboardingEmblem name="truck-fast" size="lg" accent style={s.logoEmblem} />
            <Text style={s.brand}>IRON MILES</Text>
            <Text style={s.tagline}>Built For The Road</Text>
          </View>

          <View style={s.midSection}>
            <View style={s.divider} />
            <Text style={s.pitch}>
              Fitness designed around your rig, your stops, and your schedule.
            </Text>
            <View style={s.divider} />
          </View>

          <View style={s.pillsRow}>
            {[
              { icon: 'dumbbell', label: 'No Gym Needed' },
              { icon: 'clock-outline', label: '10–45 Min' },
              { icon: 'road-variant', label: 'On The Road' },
            ].map((p) => (
              <View key={p.label} style={s.pill}>
                <MaterialCommunityIcons name={p.icon as any} size={16} color={C.gold} />
                <Text style={s.pillText}>{p.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View style={s.bottomSection}>
          <Text style={s.promptText}>Let's build your road profile.</Text>
          <TouchableOpacity
            onPress={() => router.push('/(onboarding)/goal')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[C.greenLight, C.green]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={s.ctaBtn}
            >
              <Text style={s.ctaBtnText}>GET STARTED</Text>
              <MaterialCommunityIcons name="arrow-right" size={20} color={C.white} />
            </LinearGradient>
          </TouchableOpacity>
        </View>

      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 14,
  },
  contentBlock: {
    flex: 1,
    justifyContent: 'center',
    gap: 22,
  },
  topSection: {
    alignItems: 'center',
    marginTop: 18,
  },
  logoEmblem: {
    marginBottom: 17,
  },
  brand: {
    color: C.gold,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 6,
    marginBottom: 5,
  },
  tagline: {
    color: C.textSec,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1,
  },
  midSection: {
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  divider: {
    width: 40,
    height: 1,
    backgroundColor: C.borderGold,
    marginVertical: 14,
  },
  pitch: {
    color: C.white,
    fontSize: 17,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 26,
  },
  pillsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pillText: {
    color: C.textSec,
    fontSize: 12,
    fontWeight: '700',
  },
  bottomSection: {
    gap: 14,
    paddingTop: 6,
  },
  promptText: {
    color: C.textMuted,
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
  },
  ctaBtn: {
    height: 58,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: C.goldMid,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  ctaBtnText: {
    color: C.white,
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
});
