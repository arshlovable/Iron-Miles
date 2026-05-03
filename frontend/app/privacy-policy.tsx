import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MvpScreenHeader, MVP_C } from '../src/components/MvpScreenHeader';

const SECTIONS = [
  {
    title: 'WHAT WE STORE',
    body: 'Iron Miles stores the account information you provide (such as email and name), your driver profile (goals, truck type, equipment preferences), and data you create in the app including workouts, Iron Miles history, and Fuel / meal logs tied to your account.',
  },
  {
    title: 'HOW WE USE IT',
    body: 'Profile and log data are used to run the app: show progress, generate workouts that fit your setup, and display Fuel and fitness history. We do not sell your personal data.',
  },
  {
    title: 'SECURITY',
    body: 'We rely on industry-standard authentication and database providers. You should use a strong password and keep your device secure.',
  },
  {
    title: 'CONTACT',
    body: 'Questions about this policy: a dedicated support inbox is coming soon. Until then, reach out through your usual fleet or coaching channel.',
  },
];

export default function PrivacyPolicyScreen() {
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <MvpScreenHeader title="PRIVACY POLICY" subtitle="MVP summary" testID="privacy-policy-header" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.lead}>
          This is a short MVP summary, not a full legal document. A complete privacy policy may be published before public
          launch.
        </Text>
        {SECTIONS.map((sec) => (
          <View key={sec.title} style={s.block}>
            <Text style={s.blockTitle}>{sec.title}</Text>
            <Text style={s.blockBody}>{sec.body}</Text>
          </View>
        ))}
        <Text style={s.footer}>Last updated: MVP build</Text>
        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: MVP_C.bg },
  scroll: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 24 },
  lead: { fontSize: 13, color: MVP_C.textSec, lineHeight: 20, marginBottom: 20, fontWeight: '500' },
  block: { marginBottom: 18 },
  blockTitle: { fontSize: 11, fontWeight: '800', color: MVP_C.gold, letterSpacing: 1.5, marginBottom: 8 },
  blockBody: { fontSize: 14, color: MVP_C.textSec, lineHeight: 21 },
  footer: { fontSize: 11, color: MVP_C.textMuted, marginTop: 8, fontStyle: 'italic' },
});
