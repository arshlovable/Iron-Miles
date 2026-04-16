import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GOLD = '#E0C27C';
const GOLD_BRIGHT = '#FFD700';
const GOLD_MID = '#D4A843';
const GOLD_DIM = '#5C4A1A';
const GOLD_DARK = '#B89B5F';
const GRAY = '#555045';
const GRAY_LIGHT = '#7A7060';
const BG = '#0A0A08';
const SURFACE_DARK = '#0E0E0C';

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
    <View style={[styles.tabBarOuter, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {/* Golden light line across top */}
      <LinearGradient
        colors={['transparent', 'rgba(255,215,0,0.15)', 'rgba(224,194,124,0.35)', 'rgba(255,215,0,0.15)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.tabBarGlowLine}
      />
      {/* Double gold accent lines */}
      <View style={styles.tabBarTopLines}>
        <View style={styles.tabBarGoldLine} />
        <View style={[styles.tabBarGoldLine, { opacity: 0.25 }]} />
      </View>

      {/* Road/highway texture stripe */}
      <View style={styles.tabBarRoadStripe}>
        <View style={styles.roadDash} />
        <View style={styles.roadDash} />
        <View style={styles.roadDash} />
        <View style={styles.roadDash} />
        <View style={styles.roadDash} />
        <View style={styles.roadDash} />
        <View style={styles.roadDash} />
        <View style={styles.roadDash} />
        <View style={styles.roadDash} />
        <View style={styles.roadDash} />
      </View>

      <View style={styles.tabBarContent}>
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
              {/* Medallion icon container */}
              <View style={[styles.medallion, isFocused && styles.medallionActive]}>
                <View style={[styles.medallionInner, isFocused && styles.medallionInnerActive]}>
                  {tabConfig.icon(isFocused ? GOLD_BRIGHT : GRAY_LIGHT, 24)}
                </View>
              </View>
              <Text style={[styles.tabLabel, isFocused && styles.tabLabelActive]}>
                {tabConfig.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
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
  tabBarOuter: {
    backgroundColor: BG,
  },
  tabBarGlowLine: {
    height: 2,
  },
  tabBarTopLines: {
    gap: 1,
  },
  tabBarGoldLine: {
    height: 1,
    backgroundColor: GOLD_DIM,
    opacity: 0.5,
  },
  tabBarRoadStripe: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 3,
  },
  roadDash: {
    width: 16,
    height: 1.5,
    backgroundColor: GOLD_MID,
    opacity: 0.15,
    borderRadius: 1,
  },
  tabBarContent: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 64,
  },
  medallion: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#2A2820',
    backgroundColor: SURFACE_DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallionActive: {
    borderColor: GOLD_MID,
    borderWidth: 2.5,
    backgroundColor: '#141208',
  },
  medallionInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#222018',
    backgroundColor: '#0C0C0A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medallionInnerActive: {
    borderColor: 'rgba(224,194,124,0.2)',
    backgroundColor: '#12100A',
  },
  tabLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: GRAY,
    marginTop: 5,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  tabLabelActive: {
    color: GOLD,
  },
});
