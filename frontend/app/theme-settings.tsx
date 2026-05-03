import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { MvpScreenHeader, MVP_C } from '../src/components/MvpScreenHeader';

const THEMES = [
  { id: 'asphalt', name: 'Dark Asphalt', sub: 'Default · high contrast gold on deep charcoal', selected: true },
  { id: 'night', name: 'Night Drive', sub: 'Cooler blues, softer gold', selected: false },
  { id: 'highway', name: 'Highway Gold', sub: 'Brighter highlights for daylight cabs', selected: false },
  { id: 'cab', name: 'Cab Light', sub: 'Slightly lifted mid-tones for dim interiors', selected: false },
];

export default function ThemeSettingsScreen() {
  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <MvpScreenHeader title="THEME" subtitle="Cab interior" testID="theme-settings-header" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <Text style={s.intro}>Choose how Iron Miles feels on your screen. Additional themes ship after MVP.</Text>
        {THEMES.map((t) => (
          <View key={t.id} style={[s.row, t.selected ? s.rowOn : s.rowOff]} accessibilityState={{ disabled: !t.selected }}>
            <View style={s.rowIcon}>
              <MaterialCommunityIcons name="palette-outline" size={22} color={t.selected ? MVP_C.goldMid : MVP_C.textMuted} />
            </View>
            <View style={s.rowBody}>
              <Text style={[s.rowTitle, !t.selected && s.rowTitleMuted]}>{t.name}</Text>
              <Text style={s.rowSub}>{t.sub}</Text>
            </View>
            {t.selected ? (
              <View style={s.check}>
                <Text style={s.checkText}>ACTIVE</Text>
              </View>
            ) : (
              <View style={s.soonBadge}>
                <Text style={s.soonText}>SOON</Text>
              </View>
            )}
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
  intro: { color: MVP_C.textSec, fontSize: 14, lineHeight: 20, marginBottom: 16, fontWeight: '500' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  rowOn: {
    backgroundColor: MVP_C.surface,
    borderColor: MVP_C.greenLight,
  },
  rowOff: {
    backgroundColor: MVP_C.surfaceEl,
    borderColor: MVP_C.borderSubtle,
    opacity: 0.75,
  },
  rowIcon: { marginRight: 12 },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 15, fontWeight: '800', color: MVP_C.offWhite },
  rowTitleMuted: { color: MVP_C.textMuted },
  rowSub: { fontSize: 12, color: MVP_C.textMuted, marginTop: 4, lineHeight: 17 },
  check: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: MVP_C.ctaGreen,
    borderWidth: 1,
    borderColor: MVP_C.greenLight,
  },
  checkText: { fontSize: 9, fontWeight: '900', color: MVP_C.offWhite, letterSpacing: 0.8 },
  soonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: '#1A1712',
    borderWidth: 1,
    borderColor: MVP_C.goldDim,
  },
  soonText: { fontSize: 9, fontWeight: '900', color: MVP_C.goldDark, letterSpacing: 0.8 },
});
