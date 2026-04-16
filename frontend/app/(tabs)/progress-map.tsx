import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FontAwesome5 } from '@expo/vector-icons';

const GOLD = '#D4AF37';

export default function ProgressMapScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <FontAwesome5 name="map-marked-alt" size={48} color={GOLD} />
        </View>
        <Text style={styles.title}>PROGRESS MAP</Text>
        <Text style={styles.subtitle}>Your mileage journey awaits</Text>
        <View style={styles.divider} />
        <Text style={styles.comingSoon}>COMING SOON</Text>
        <Text style={styles.description}>
          Track your Iron Miles across every route and rest stop on an interactive map.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#080808',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#121212',
    borderWidth: 2,
    borderColor: GOLD,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 3,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#A0A0A0',
    letterSpacing: 1,
    marginBottom: 24,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: GOLD,
    marginBottom: 24,
    opacity: 0.6,
  },
  comingSoon: {
    fontSize: 12,
    fontWeight: '800',
    color: GOLD,
    letterSpacing: 3,
    marginBottom: 16,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
  },
});
