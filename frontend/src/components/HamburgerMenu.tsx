import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Pressable,
} from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const C = {
  bg: '#0C0B09', surface: '#13120F', surfaceEl: '#1C1A17',
  borderGold: '#5C4A1A', borderSubtle: '#2A2820',
  gold: '#E0C27C', goldMid: '#D4A843', goldDark: '#B89B5F', goldDim: '#5C4A1A',
  greenLight: '#27503B',
  white: '#FFFFFF', offWhite: '#F0EADD', textSec: '#9A9080', textMuted: '#6B6355',
};

type MenuItem = { label: string; sub?: string; icon: string; route?: string };
type MenuSection = { title: string; items: MenuItem[] };

const MENU_SECTIONS: MenuSection[] = [
  {
    title: '',
    items: [
      { label: 'Driver Profile', sub: 'MILE 27 — ROAD WARRIOR', icon: 'account-circle' },
    ],
  },
  {
    title: 'PROGRESS',
    items: [
      { label: 'Achievements / Mile Markers', icon: 'flag-checkered' },
      { label: 'Workout Log / Highway Exits', icon: 'clipboard-list-outline' },
    ],
  },
  {
    title: 'PERFORMANCE',
    items: [
      { label: 'Stats / Route Metrics', icon: 'chart-line' },
    ],
  },
  {
    title: 'APP',
    items: [
      { label: 'Reminders / Dispatch Fitness Alerts', icon: 'bell-outline' },
      { label: 'Settings / Trucker Controls', icon: 'cog-outline', route: '/settings' },
      { label: 'Help / Roadside Fitness Support', icon: 'lifebuoy' },
    ],
  },
];

type Props = {
  visible: boolean;
  onClose: () => void;
};

export default function HamburgerMenu({ visible, onClose }: Props) {
  const router = useRouter();

  const handlePress = (item: MenuItem) => {
    onClose();
    if (item.route) {
      setTimeout(() => router.push(item.route as any), 200);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent>
      <Pressable style={s.overlay} onPress={onClose}>
        <Pressable style={s.panel} onPress={(e) => e.stopPropagation()}>
          {/* Header */}
          <View style={s.header}>
            <View style={s.headerRow}>
              <MaterialIcons name="menu" size={22} color={C.goldMid} />
              <Text style={s.headerTitle}>MENU</Text>
            </View>
            <TouchableOpacity testID="menu-close" onPress={onClose} style={s.closeBtn} activeOpacity={0.7}>
              <MaterialIcons name="close" size={22} color={C.textMuted} />
            </TouchableOpacity>
          </View>
          <View style={s.headerLine} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
            {MENU_SECTIONS.map((sec, si) => (
              <View key={si} style={s.section}>
                {sec.title !== '' && <Text style={s.sectionTitle}>{sec.title}</Text>}
                {sec.items.map((item, ii) => (
                  <TouchableOpacity
                    key={ii}
                    testID={`menu-item-${item.label.split('/')[0].trim().toLowerCase().replace(/\s/g, '-')}`}
                    style={s.menuItem}
                    onPress={() => handlePress(item)}
                    activeOpacity={0.7}
                  >
                    <View style={s.menuIconWrap}>
                      <MaterialCommunityIcons name={item.icon as any} size={20} color={C.goldMid} />
                    </View>
                    <View style={s.menuInfo}>
                      <Text style={s.menuLabel}>{item.label}</Text>
                      {item.sub && <Text style={s.menuSub}>{item.sub}</Text>}
                    </View>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  panel: {
    backgroundColor: C.bg, borderTopLeftRadius: 16, borderTopRightRadius: 16,
    maxHeight: '85%', borderWidth: 1, borderColor: C.borderGold, borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingTop: 18, paddingBottom: 12,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerTitle: { fontSize: 16, fontWeight: '900', color: C.offWhite, letterSpacing: 2 },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  headerLine: { height: 1, backgroundColor: C.goldDim, opacity: 0.4, marginHorizontal: 18 },

  scrollContent: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 32 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 10, fontWeight: '800', color: C.gold, letterSpacing: 3, marginBottom: 8, marginTop: 4 },

  menuItem: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.borderSubtle,
  },
  menuIconWrap: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: C.surfaceEl,
    borderWidth: 1, borderColor: C.borderSubtle, alignItems: 'center', justifyContent: 'center', marginRight: 14,
  },
  menuInfo: { flex: 1 },
  menuLabel: { fontSize: 15, fontWeight: '700', color: C.offWhite },
  menuSub: { fontSize: 11, color: C.goldDark, marginTop: 1, letterSpacing: 0.5 },
});
