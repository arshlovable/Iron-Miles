import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MvpScreenHeader, MVP_C } from '../src/components/MvpScreenHeader';

const SECTIONS = [
  {
    title: 'INFORMATIONAL USE',
    body: 'Iron Miles provides fitness and meal-logging tools for informational purposes only. It is not medical advice, physical therapy, or a substitute for professional care.',
  },
  {
    title: 'FITNESS & HEALTH',
    body: 'Consult a qualified professional before starting a new exercise program, especially if you have injuries, pain, or medical conditions. Stop any activity that causes sharp pain, dizziness, or shortness of breath.',
  },
  {
    title: 'SAFE USE ON THE ROAD',
    body: 'Use the app only when it is safe and legal to do so. Complete workouts when parked or off-duty as appropriate. Do not use the app in a way that distracts you while driving.',
  },
  {
    title: 'LIMITATION OF LIABILITY',
    body: 'To the fullest extent permitted by law, Iron Miles and its operators are not liable for injuries, losses, or damages arising from use or misuse of the app, including workouts performed using generated plans.',
  },
  {
    title: 'CHANGES',
    body: 'Features and terms may change during MVP and beta periods. Continued use after updates means you accept the revised experience.',
  },
];

export default function TermsOfServiceScreen() {
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <MvpScreenHeader title="TERMS OF SERVICE" subtitle="MVP summary" testID="terms-of-service-header" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.lead}>
          This MVP summary highlights fitness safety and liability. A full terms document may be provided before public
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
