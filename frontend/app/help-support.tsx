import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MvpScreenHeader, MVP_C } from '../src/components/MvpScreenHeader';

const SUPPORT_EMAIL = 'ironmiles104@gmail.com';
const MAILTO = `mailto:${SUPPORT_EMAIL}`;

const FAQ = [
  {
    q: 'What is Iron Miles?',
    a: 'Iron Miles is your lifetime fitness odometer for truck-friendly workouts. Every completed run adds miles to your total — same spirit as miles on the road.',
  },
  {
    q: 'How are Iron Miles earned?',
    a: 'Complete workouts from the app. Miles are credited when a session finishes and is logged to your account (see Route Metrics and your dashboard).',
  },
  {
    q: 'How does Fuel work?',
    a: 'Fuel is a simple meal log: tap Add Meal or Add Snack. Full meals fill your daily gauge toward four meals; snacks add a small bump without replacing a meal.',
  },
  {
    q: 'How do meal logs work?',
    a: 'Each meal or snack you log in Fuel is stored for that day so you can see how full your daily gauge is. It is for your own awareness and consistency — not a medical diet plan.',
  },
  {
    q: 'How do generated workouts work?',
    a: 'Pick target area, equipment, time, and style — the app builds a session you can start immediately. No food names or macros required.',
  },
];

export default function HelpSupportScreen() {
  const openSupportEmail = useCallback(() => {
    Linking.openURL(MAILTO).catch(() => {
      Alert.alert('Support email', SUPPORT_EMAIL);
    });
  }, []);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <MvpScreenHeader title="ROADSIDE SUPPORT" subtitle="Help & FAQ" testID="help-support-back" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {FAQ.map((item) => (
          <View key={item.q} style={s.faq}>
            <Text style={s.q}>{item.q}</Text>
            <Text style={s.a}>{item.a}</Text>
          </View>
        ))}
        <View style={s.contact}>
          <Text style={s.contactTitle}>CONTACT</Text>
          <Text style={s.contactBody}>
            Questions or feedback? Email us — we read every message from the road.
          </Text>
          <Pressable
            onPress={openSupportEmail}
            accessibilityRole="link"
            accessibilityLabel={`Email ${SUPPORT_EMAIL}`}
            style={({ pressed }) => [s.emailLinkWrap, pressed && s.emailLinkPressed]}
          >
            <Text style={s.contactEmail}>{SUPPORT_EMAIL}</Text>
          </Pressable>
        </View>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: MVP_C.bg },
  scroll: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24 },
  faq: {
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: MVP_C.borderSubtle,
  },
  q: { fontSize: 15, fontWeight: '800', color: MVP_C.gold, marginBottom: 8, letterSpacing: 0.2 },
  a: { fontSize: 14, color: MVP_C.textSec, lineHeight: 21, fontWeight: '500' },
  contact: {
    marginTop: 8,
    padding: 14,
    backgroundColor: MVP_C.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: MVP_C.borderGold,
  },
  contactTitle: { fontSize: 11, fontWeight: '800', color: MVP_C.gold, letterSpacing: 2, marginBottom: 8 },
  contactBody: { fontSize: 13, color: MVP_C.textSec, lineHeight: 19, marginBottom: 10 },
  emailLinkWrap: { alignSelf: 'flex-start', paddingVertical: 4 },
  emailLinkPressed: { opacity: 0.75 },
  contactEmail: {
    fontSize: 15,
    fontWeight: '700',
    color: MVP_C.gold,
    textDecorationLine: 'underline',
  },
});
