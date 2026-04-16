import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons, FontAwesome5, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Iron Miles Color Palette
const C = {
  bg: '#080808',
  surface: '#121212',
  surfaceElevated: '#1A1A1A',
  borderSubtle: '#2A2A2A',
  gold: '#D4AF37',
  goldDark: '#8B7025',
  goldDim: '#5C4A1A',
  green: '#8A9A5B',
  greenDim: '#4A5530',
  white: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#666666',
};

// Placeholder driver data (to be replaced with real auth data)
const driverData = {
  name: 'Driver',
  currentRoute: { from: 'Chicago', to: 'Denver' },
  currentMile: 27,
  targetMile: 50,
  milesEarned: 27,
  mileMarker: 30,
  lastWorkout: { type: 'Upper Body', miles: 10 },
  stats: { workouts: 65, steps: '8,450', calories: 720 },
};

// ─── Header ────────────────────────────────────────────────────────────────
function Header() {
  return (
    <View style={styles.header}>
      <TouchableOpacity testID="menu-button" style={styles.headerIconBtn} activeOpacity={0.7}>
        <MaterialIcons name="menu" size={24} color={C.gold} />
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>IRON MILES</Text>
        <Text style={styles.headerSubtitle}>Fitness Journey for Truck Drivers</Text>
      </View>
      <TouchableOpacity testID="settings-button" style={styles.headerIconBtn} activeOpacity={0.7}>
        <Ionicons name="settings-outline" size={22} color={C.gold} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Mile Shield Badge ─────────────────────────────────────────────────────
function MileShield({ mile, size = 'normal' }: { mile: number; size?: 'normal' | 'small' }) {
  const isSmall = size === 'small';
  return (
    <View style={[styles.shield, isSmall && styles.shieldSmall]}>
      <Text style={[styles.shieldLabel, isSmall && styles.shieldLabelSmall]}>MILE</Text>
      <Text style={[styles.shieldNumber, isSmall && styles.shieldNumberSmall]}>{mile}</Text>
    </View>
  );
}

// ─── Route Hero Section ────────────────────────────────────────────────────
function RouteHeroSection() {
  return (
    <View style={styles.heroContainer}>
      <ImageBackground
        source={require('../../assets/images/hero-highway.jpg')}
        style={styles.heroBackground}
        imageStyle={styles.heroImage}
      >
        <LinearGradient
          colors={['rgba(8,8,8,0.85)', 'rgba(8,8,8,0.45)', 'rgba(8,8,8,0.9)']}
          style={styles.heroOverlay}
        >
          {/* Highway accent lines */}
          <View style={styles.highwayLines}>
            <View style={styles.highwayLine} />
            <View style={[styles.highwayLine, { backgroundColor: C.gold, opacity: 0.15 }]} />
          </View>

          <Text style={styles.routeLabel}>CURRENT ROUTE</Text>
          <View style={styles.routeRow}>
            <Text style={styles.routeCity}>{driverData.currentRoute.from}</Text>
            <MaterialIcons name="arrow-forward" size={20} color={C.gold} />
            <Text style={styles.routeCity}>{driverData.currentRoute.to}</Text>
          </View>

          {/* Mile shields */}
          <View style={styles.shieldsRow}>
            <MileShield mile={driverData.currentMile} />
            <View style={styles.shieldConnector}>
              <View style={styles.shieldDash} />
              <View style={styles.shieldDash} />
              <View style={styles.shieldDash} />
              <MaterialCommunityIcons name="truck" size={20} color={C.gold} />
              <View style={styles.shieldDash} />
              <View style={styles.shieldDash} />
              <View style={styles.shieldDash} />
            </View>
            <MileShield mile={driverData.targetMile} />
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

// ─── Welcome Section ───────────────────────────────────────────────────────
function WelcomeSection() {
  return (
    <View style={styles.welcomeRow}>
      <Text style={styles.welcomeText}>Welcome, {driverData.name}!</Text>
      <MileShield mile={driverData.currentMile} size="small" />
    </View>
  );
}

// ─── Generate Workout CTA ──────────────────────────────────────────────────
function GenerateWorkoutCTA({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.ctaContainer}>
      <TouchableOpacity testID="generate-workout-btn" onPress={onPress} activeOpacity={0.85}>
        <LinearGradient
          colors={[C.greenDim, '#2A3518', '#1E2A10']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.ctaButton}
        >
          <View style={styles.ctaBorderInner}>
            <Text style={styles.ctaText}>GENERATE WORKOUT</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
      <Text style={styles.ctaSubtext}>Build a workout for your current stop.</Text>
    </View>
  );
}

// ─── Current Miles Card ────────────────────────────────────────────────────
function CurrentMilesCard() {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>CURRENT MILES</Text>
        <View style={styles.cardHeaderLine} />
      </View>

      <View style={styles.milesContent}>
        <View style={styles.milesMeter}>
          {/* Speedometer-style indicator */}
          <View style={styles.meterArc}>
            <View style={styles.meterFill} />
          </View>
          <View style={styles.meterLabels}>
            <Text style={styles.meterText}>MILE {driverData.mileMarker}</Text>
            <View style={styles.meterDashes}>
              <View style={styles.meterDash} />
              <View style={styles.meterDash} />
              <View style={styles.meterDash} />
              <View style={styles.meterDash} />
            </View>
          </View>
        </View>

        <View style={styles.milesInfo}>
          <Text style={styles.milesEarned}>+{driverData.milesEarned}</Text>
          <Text style={styles.milesLabel}>Miles Earned</Text>
          <TouchableOpacity testID="miles-details-btn" style={styles.milesArrow} activeOpacity={0.7}>
            <MaterialIcons name="chevron-right" size={28} color={C.gold} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Last Workout Card ─────────────────────────────────────────────────────
function LastWorkoutCard() {
  return (
    <View style={[styles.card, styles.halfCard]}>
      <Text style={styles.smallCardTitle}>LAST WORKOUT</Text>
      <View style={styles.smallCardDivider} />
      <View style={styles.workoutRow}>
        <MaterialCommunityIcons name="arm-flex" size={20} color={C.gold} />
        <Text style={styles.workoutType}>{driverData.lastWorkout.type}</Text>
      </View>
      <Text style={styles.workoutMiles}>+{driverData.lastWorkout.miles} Miles</Text>
      <TouchableOpacity testID="last-workout-details" style={styles.cardArrow} activeOpacity={0.7}>
        <MaterialIcons name="arrow-forward" size={18} color={C.goldDark} />
      </TouchableOpacity>
    </View>
  );
}

// ─── Quick Stats Card ──────────────────────────────────────────────────────
function QuickStatsCard() {
  return (
    <View style={[styles.card, styles.halfCard]}>
      <Text style={styles.smallCardTitle}>QUICK STATS</Text>
      <View style={styles.smallCardDivider} />
      <View style={styles.statRow}>
        <MaterialCommunityIcons name="fire" size={16} color={C.gold} />
        <Text style={styles.statValue}>{driverData.stats.workouts}</Text>
        <Text style={styles.statLabel}>Workouts</Text>
      </View>
      <View style={styles.statRow}>
        <MaterialCommunityIcons name="shoe-sneaker" size={16} color={C.gold} />
        <Text style={styles.statValue}>{driverData.stats.steps}</Text>
        <Text style={styles.statLabel}>Steps</Text>
      </View>
      <View style={styles.statRow}>
        <MaterialCommunityIcons name="lightning-bolt" size={16} color={C.gold} />
        <Text style={styles.statValue}>{driverData.stats.calories}</Text>
        <Text style={styles.statLabel}>Calories</Text>
      </View>
    </View>
  );
}

// ─── Dashboard Screen ──────────────────────────────────────────────────────
export default function DashboardScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        testID="dashboard-scroll"
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Header />
        <RouteHeroSection />
        <WelcomeSection />
        <GenerateWorkoutCTA onPress={() => router.push('/generate-workout')} />
        <CurrentMilesCard />
        <View style={styles.cardsRow}>
          <LastWorkoutCard />
          <QuickStatsCard />
        </View>
        <View style={{ height: 16 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.goldDim,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: C.white,
    letterSpacing: 4,
  },
  headerSubtitle: {
    fontSize: 10,
    color: C.textSecondary,
    letterSpacing: 1.5,
    marginTop: 2,
    fontStyle: 'italic',
  },

  // ── Hero / Route
  heroContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.goldDim,
  },
  heroBackground: {
    width: '100%',
    minHeight: 200,
  },
  heroImage: {
    opacity: 0.5,
  },
  heroOverlay: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  highwayLines: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  highwayLine: {
    height: 1.5,
    backgroundColor: C.goldDark,
    opacity: 0.3,
    marginBottom: 1,
  },
  routeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.textSecondary,
    letterSpacing: 3,
    marginBottom: 6,
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  routeCity: {
    fontSize: 22,
    fontWeight: '800',
    color: C.white,
    letterSpacing: 1,
  },
  shieldsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  shieldConnector: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    gap: 4,
  },
  shieldDash: {
    width: 8,
    height: 2,
    backgroundColor: C.gold,
    opacity: 0.4,
    borderRadius: 1,
  },

  // ── Mile Shield
  shield: {
    width: 64,
    height: 72,
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.gold,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  shieldSmall: {
    width: 52,
    height: 56,
    borderWidth: 1.5,
  },
  shieldLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: C.gold,
    letterSpacing: 2,
  },
  shieldLabelSmall: {
    fontSize: 7,
  },
  shieldNumber: {
    fontSize: 26,
    fontWeight: '900',
    color: C.white,
    marginTop: -2,
  },
  shieldNumberSmall: {
    fontSize: 20,
  },

  // ── Welcome
  welcomeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '700',
    color: C.white,
  },

  // ── CTA
  ctaContainer: {
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  ctaButton: {
    width: SCREEN_WIDTH - 32,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: C.gold,
    overflow: 'hidden',
  },
  ctaBorderInner: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: {
    fontSize: 20,
    fontWeight: '900',
    color: C.gold,
    letterSpacing: 3,
  },
  ctaSubtext: {
    fontSize: 13,
    color: C.textMuted,
    marginTop: 10,
    letterSpacing: 0.5,
  },

  // ── Cards (shared)
  card: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    borderRadius: 4,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: C.textSecondary,
    letterSpacing: 2,
    marginRight: 10,
  },
  cardHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.gold,
    opacity: 0.25,
  },

  // ── Current Miles
  milesContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milesMeter: {
    flex: 1,
  },
  meterArc: {
    height: 8,
    backgroundColor: C.surfaceElevated,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  meterFill: {
    height: '100%',
    width: '54%',
    backgroundColor: C.gold,
    borderRadius: 4,
  },
  meterLabels: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  meterText: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 1,
  },
  meterDashes: {
    flexDirection: 'row',
    gap: 4,
  },
  meterDash: {
    width: 12,
    height: 2,
    backgroundColor: C.gold,
    opacity: 0.3,
  },
  milesInfo: {
    alignItems: 'center',
    marginLeft: 20,
    paddingLeft: 20,
    borderLeftWidth: 1,
    borderLeftColor: C.borderSubtle,
  },
  milesEarned: {
    fontSize: 28,
    fontWeight: '900',
    color: C.white,
  },
  milesLabel: {
    fontSize: 11,
    color: C.textSecondary,
    letterSpacing: 0.5,
    marginTop: 2,
  },
  milesArrow: {
    marginTop: 6,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Half Cards Row
  cardsRow: {
    flexDirection: 'row',
    marginHorizontal: 16,
    gap: 10,
  },
  halfCard: {
    flex: 1,
    marginHorizontal: 0,
    padding: 14,
  },
  smallCardTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: C.textSecondary,
    letterSpacing: 2,
    marginBottom: 6,
  },
  smallCardDivider: {
    height: 1,
    backgroundColor: C.borderSubtle,
    marginBottom: 10,
  },

  // ── Last Workout
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  workoutType: {
    fontSize: 15,
    fontWeight: '800',
    color: C.white,
  },
  workoutMiles: {
    fontSize: 13,
    color: C.gold,
    fontWeight: '600',
    marginTop: 2,
  },
  cardArrow: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Quick Stats
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '800',
    color: C.white,
  },
  statLabel: {
    fontSize: 11,
    color: C.textMuted,
  },
});
