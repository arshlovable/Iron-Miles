import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MvpScreenHeader, MVP_C } from '../src/components/MvpScreenHeader';

const CARDS = [
  { title: 'Workout Reminder', body: 'Gentle nudge before your next stop.', icon: 'dumbbell' as const },
  { title: 'Hydration Reminder', body: 'Keep water within reach on long hauls.', icon: 'cup-water' as const },
  { title: 'Meal Reminder', body: 'Fuel the body like you fuel the rig.', icon: 'food' as const },
];

export default function RemindersScreen() {
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <MvpScreenHeader title="DISPATCH ALERTS" subtitle="Reminders" testID="reminders-back" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.intro}>
          Smart reminders will help you stay consistent on the road. Notifications are not enabled yet — this is a preview
          of what is coming.
        </Text>
        {CARDS.map((c) => (
          <View key={c.title} style={s.card} accessibilityState={{ disabled: true }}>
            <View style={s.cardTop}>
              <View style={s.iconWrap}>
                <MaterialCommunityIcons name={c.icon} size={22} color={MVP_C.textMuted} />
              </View>
              <View style={s.badge}>
                <Text style={s.badgeText}>COMING SOON</Text>
              </View>
            </View>
            <Text style={s.cardTitle}>{c.title}</Text>
            <Text style={s.cardBody}>{c.body}</Text>
          </View>
        ))}
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: MVP_C.bg },
  scroll: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24 },
  intro: {
    color: MVP_C.textSec,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
    fontWeight: '500',
  },
  card: {
    backgroundColor: MVP_C.surfaceEl,
    borderWidth: 1,
    borderColor: MVP_C.borderSubtle,
    borderRadius: 8,
    padding: 14,
    marginBottom: 12,
    opacity: 0.92,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: MVP_C.surface,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: MVP_C.borderSubtle,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#1A1712',
    borderWidth: 1,
    borderColor: MVP_C.goldDim,
  },
  badgeText: { fontSize: 9, fontWeight: '900', color: MVP_C.goldDark, letterSpacing: 0.8 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: MVP_C.offWhite, marginBottom: 4 },
  cardBody: { fontSize: 13, color: MVP_C.textMuted, lineHeight: 18 },
});
