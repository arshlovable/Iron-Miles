import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GOLD = '#D4AF37';
const GOLD_DIM = '#8B7025';
const GRAY = '#666666';
const BG = '#080808';
const SURFACE = '#0E0E0E';

type TabConfig = {
  name: string;
  label: string;
  icon: (color: string, size: number) => React.ReactNode;
};

const TAB_CONFIG: TabConfig[] = [
  {
    name: 'index',
    label: 'DASHBOARD',
    icon: (color, size) => <MaterialCommunityIcons name="view-dashboard" size={size} color={color} />,
  },
  {
    name: 'progress-map',
    label: 'PROGRESS MAP',
    icon: (color, size) => <FontAwesome5 name="map-marked-alt" size={size - 2} color={color} />,
  },
  {
    name: 'workouts',
    label: 'WORKOUTS',
    icon: (color, size) => <MaterialCommunityIcons name="dumbbell" size={size} color={color} />,
  },
  {
    name: 'fuel',
    label: 'FUEL',
    icon: (color, size) => <MaterialCommunityIcons name="gas-station" size={size} color={color} />,
  },
];

function CustomTabBar({ state, navigation }: { state: any; navigation: any }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.tabBarContainer, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.tabBarTopLine} />
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const tabConfig = TAB_CONFIG[index];
        if (!tabConfig) return null;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            testID={`tab-${tabConfig.name}`}
            onPress={onPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            <View style={[styles.iconOval, isFocused && styles.iconOvalActive]}>
              {tabConfig.icon(isFocused ? GOLD : GRAY, 22)}
            </View>
            <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
              {tabConfig.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="progress-map" />
      <Tabs.Screen name="workouts" />
      <Tabs.Screen name="fuel" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: BG,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1A1A1A',
  },
  tabBarTopLine: {
    position: 'absolute',
    top: 0,
    left: '10%',
    right: '10%',
    height: 1,
    backgroundColor: GOLD_DIM,
    opacity: 0.4,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    minHeight: 56,
  },
  iconOval: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#141414',
    borderWidth: 1.5,
    borderColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOvalActive: {
    borderColor: GOLD,
    backgroundColor: '#1A1708',
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: GRAY,
    marginTop: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: GOLD,
  },
});
