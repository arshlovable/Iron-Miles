import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const C = {
  bg: '#0C0B09', surface: '#13120F', surfaceEl: '#1C1A17',
  borderGold: '#5C4A1A', borderSubtle: '#2A2820',
  gold: '#E0C27C', goldMid: '#D4A843', goldDark: '#B89B5F', goldDim: '#5C4A1A',
  greenLight: '#27503B',
  white: '#FFFFFF', offWhite: '#F0EADD', textSec: '#9A9080', textMuted: '#6B6355',
};

type SettingsItem = { label: string; icon: string; sub?: string };
type SettingsSection = { title: string; items: SettingsItem[] };

const SECTIONS: SettingsSection[] = [
  {
    title: 'ACCOUNT',
    items: [
      { label: 'Driver Profile', icon: 'account-circle', sub: 'Name, truck type, goals' },
      { label: 'Equipment Setup', icon: 'dumbbell', sub: 'Available gear' },
    ],
  },
  {
    title: 'NOTIFICATIONS',
    items: [
      { label: 'Workout Reminders', icon: 'bell-outline', sub: 'Dispatch fitness alerts' },
      { label: 'Hydration Reminders', icon: 'water', sub: 'Stay fueled on the road' },
      { label: 'Milestone Alerts', icon: 'flag-checkered', sub: 'Iron Miles achievements' },
    ],
  },
  {
    title: 'APP PREFERENCES',
    items: [
      { label: 'Units & Measurement', icon: 'ruler', sub: 'lbs / kg, miles / km' },
      { label: 'Workout Defaults', icon: 'cog-outline', sub: 'Default duration, style' },
      { label: 'Theme', icon: 'palette-outline', sub: 'Dark Asphalt (default)' },
    ],
  },
  {
    title: 'SUPPORT',
    items: [
      { label: 'Help / Roadside Support', icon: 'lifebuoy', sub: 'FAQ and contact' },
      { label: 'Privacy Policy', icon: 'shield-lock-outline' },
      { label: 'Terms of Service', icon: 'file-document-outline' },
    ],
  },
];

export default function SettingsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Top bar */}
      <View style={s.topBar}>
        <View style={s.topBarLine} />
        <View style={s.topBarContent}>
          <TouchableOpacity testID="settings-back" onPress={() => router.back()} style={s.topBarBtn} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={22} color={C.goldMid} />
          </TouchableOpacity>
          <Text style={s.topBarTitle}>SETTINGS</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={[s.topBarLine, { opacity: 0.25 }]} />
      </View>

      <ScrollView testID="settings-scroll" showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <Text style={s.subtitle}>Trucker Controls</Text>

        {SECTIONS.map((sec, si) => (
          <View key={si} style={s.section}>
            <Text style={s.sectionTitle}>{sec.title}</Text>
            {sec.items.map((item, ii) => (
              <TouchableOpacity key={ii} testID={`setting-${item.label.toLowerCase().replace(/\s/g, '-')}`} style={s.row} activeOpacity={0.7}>
                <View style={s.rowIconWrap}>
                  <MaterialCommunityIcons name={item.icon as any} size={20} color={C.goldMid} />
                </View>
                <View style={s.rowInfo}>
                  <Text style={s.rowLabel}>{item.label}</Text>
                  {item.sub && <Text style={s.rowSub}>{item.sub}</Text>}
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        ))}

        {/* Sign Out */}
        <TouchableOpacity testID="sign-out-btn" style={s.signOut} activeOpacity={0.7}>
          <MaterialCommunityIcons name="logout" size={18} color="#B04040" />
          <Text style={s.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={s.version}>Iron Miles v1.0.0</Text>
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  topBar: {},
  topBarLine: { height: 1, backgroundColor: C.goldDim, opacity: 0.5 },
  topBarContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 10 },
  topBarBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 16, fontWeight: '800', color: C.gold, letterSpacing: 2 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 8 },
  subtitle: { fontSize: 12, color: C.textSec, letterSpacing: 1, textAlign: 'center', marginBottom: 20, fontStyle: 'italic' },

  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '800', color: C.gold, letterSpacing: 3, marginBottom: 10 },
  row: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: C.surface,
    borderWidth: 1, borderColor: C.borderSubtle, borderRadius: 6, padding: 12, marginBottom: 6,
  },
  rowIconWrap: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.surfaceEl,
    borderWidth: 1, borderColor: C.borderSubtle, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  rowInfo: { flex: 1 },
  rowLabel: { fontSize: 14, fontWeight: '700', color: C.offWhite },
  rowSub: { fontSize: 11, color: C.textMuted, marginTop: 1 },

  signOut: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, paddingVertical: 16, marginTop: 8,
    borderWidth: 1, borderColor: '#3A2020', borderRadius: 6, backgroundColor: '#1A0E0E',
  },
  signOutText: { fontSize: 14, fontWeight: '700', color: '#B04040', letterSpacing: 1 },
  version: { fontSize: 11, color: C.textMuted, textAlign: 'center', marginTop: 16 },
});
