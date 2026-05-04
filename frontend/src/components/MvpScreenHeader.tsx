import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

/** Shared palette for MVP stack screens (matches settings / dashboard). */
export const MVP_C = {
  bg: '#0C0B09',
  surface: '#13120F',
  surfaceEl: '#1C1A17',
  borderGold: '#5C4A1A',
  borderSubtle: '#2A2820',
  gold: '#E0C27C',
  goldMid: '#D4A843',
  goldDark: '#B89B5F',
  goldDim: '#5C4A1A',
  greenLight: '#27503B',
  ctaGreen: '#1A3329',
  white: '#FFFFFF',
  offWhite: '#F0EADD',
  textSec: '#9A9080',
  textMuted: '#6B6355',
};

type Props = {
  title: string;
  subtitle?: string;
  /** Optional test id for the header container (e.g. screen-specific). */
  testID?: string;
  testIDBack?: string;
  rightAction?: React.ReactNode;
};

export function MvpScreenHeader({ title, subtitle, testID, testIDBack = 'mvp-screen-back', rightAction }: Props) {
  const router = useRouter();

  return (
    <View style={s.topBar} testID={testID}>
      <View style={s.topBarLine} />
      <View style={s.topBarContent}>
        <TouchableOpacity testID={testIDBack} onPress={() => router.back()} style={s.topBarBtn} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={22} color={MVP_C.goldMid} />
        </TouchableOpacity>
        <View style={s.titleBlock}>
          <Text style={s.topBarTitle}>{title}</Text>
          {subtitle ? <Text style={s.topBarSub}>{subtitle}</Text> : null}
        </View>
        {rightAction ? <View style={s.rightAction}>{rightAction}</View> : <View style={s.placeholder} />}
      </View>
      <View style={[s.topBarLine, { opacity: 0.25 }]} />
    </View>
  );
}

const s = StyleSheet.create({
  topBar: {},
  topBarLine: { height: 1, backgroundColor: MVP_C.goldDim, opacity: 0.5 },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  topBarBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  placeholder: { width: 40, height: 40 },
  rightAction: { minWidth: 40, alignItems: 'flex-end', justifyContent: 'center' },
  titleBlock: { flex: 1, alignItems: 'center', paddingHorizontal: 4 },
  topBarTitle: { fontSize: 15, fontWeight: '800', color: MVP_C.gold, letterSpacing: 1.8, textAlign: 'center' },
  topBarSub: {
    fontSize: 10,
    fontWeight: '700',
    color: MVP_C.textSec,
    letterSpacing: 0.8,
    marginTop: 2,
    textAlign: 'center',
  },
});
