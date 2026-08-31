import React from 'react';
import { Platform, View, ViewStyle } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const C = {
  surfaceDeep: '#0A0908',
  surfaceInner: '#12100E',
  borderGoldBright: '#7A6428',
  borderGold: '#5C4A1A',
  goldMid: '#D4A843',
  textSec: '#9A9080',
};

type EmblemSize = 'lg' | 'md' | 'sm' | 'xs';

const SIZE_CONFIG: Record<
  EmblemSize,
  { outer: number; inner: number; border: number; icon: number; glowOpacity: number }
> = {
  lg: { outer: 104, inner: 86, border: 3, icon: 56, glowOpacity: 0.26 },
  md: { outer: 72, inner: 60, border: 2.5, icon: 40, glowOpacity: 0.22 },
  sm: { outer: 44, inner: 36, border: 2, icon: 24, glowOpacity: 0.16 },
  xs: { outer: 36, inner: 30, border: 2, icon: 18, glowOpacity: 0.12 },
};

type OnboardingEmblemProps = {
  name: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  size?: EmblemSize;
  selected?: boolean;
  /** Hero emblems always show gold icon (welcome, mission) */
  accent?: boolean;
  style?: ViewStyle;
};

export default function OnboardingEmblem({
  name,
  size = 'lg',
  selected = false,
  accent = false,
  style,
}: OnboardingEmblemProps) {
  const cfg = SIZE_CONFIG[size];
  const radius = cfg.outer / 2;
  const innerRadius = cfg.inner / 2;
  const iconColor = selected || accent ? C.goldMid : C.textSec;

  return (
    <View
      style={[
        {
          borderRadius: radius + 2,
          ...Platform.select({
            ios: {
              shadowColor: '#D4A843',
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: cfg.glowOpacity,
              shadowRadius: size === 'lg' ? 12 : size === 'md' ? 10 : 6,
            },
            android: {
              elevation: size === 'lg' ? 6 : size === 'md' ? 4 : 2,
            },
            web: {
              boxShadow:
                size === 'lg'
                  ? '0 0 18px rgba(212, 168, 67, 0.2), 0 0 36px rgba(212, 168, 67, 0.07)'
                  : size === 'md'
                    ? '0 0 14px rgba(212, 168, 67, 0.16), 0 0 28px rgba(212, 168, 67, 0.05)'
                    : '0 0 8px rgba(212, 168, 67, 0.12)',
            },
            default: {},
          }),
        },
        style,
      ]}
    >
      <View
        style={{
          width: cfg.outer,
          height: cfg.outer,
          borderRadius: radius,
          borderWidth: cfg.border,
          borderColor: selected ? C.borderGold : C.borderGoldBright,
          backgroundColor: C.surfaceDeep,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View
          style={{
            width: cfg.inner,
            height: cfg.inner,
            borderRadius: innerRadius,
            backgroundColor: selected ? '#1C1A0F' : C.surfaceInner,
            borderWidth: 1,
            borderColor: selected ? C.borderGold : '#2A2418',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name={name} size={cfg.icon} color={iconColor} />
        </View>
      </View>
    </View>
  );
}
