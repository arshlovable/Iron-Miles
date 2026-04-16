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
import { MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Iron Miles Color Palette — asphalt charcoal, metallic gold
const C = {
  bg: '#0C0B09',
  bgCharcoal: '#0E0D0B',
  surface: '#13120F',
  surfaceElevated: '#1C1A17',
  borderSubtle: '#2A2820',
  borderGold: '#5C4A1A',
  gold: '#E0C27C',
  goldBright: '#FFD700',
  goldMid: '#D4A843',
  goldDark: '#B89B5F',
  goldDim: '#5C4A1A',
  shieldGreen: '#1F4037',
  shieldGreenLight: '#27503B',
  ctaGreen: '#1A3329',
  ctaGreenMid: '#223D2E',
  asphalt: '#181715',
  asphaltLight: '#222019',
  roadEdge: '#3A3830',
  roadCenter: '#D4A843',
  white: '#FFFFFF',
  offWhite: '#F0EADD',
  textSecondary: '#9A9080',
  textMuted: '#6B6355',
};

// Placeholder driver data
const driverData = {
  name: 'Driver',
  lifetimeMiles: '4,820',
  currentMile: 27,
  targetMile: 50,
  milesEarned: 27,
  mileMarker: 30,
  lastWorkout: { type: 'Upper Body', miles: 10 },
  stats: { workouts: 65, steps: '8,450', calories: 720 },
};

// ─── Decorative Gold Line ──────────────────────────────────────────────────
function GoldAccentLine({ style }: { style?: object }) {
  return (
    <View style={[styles.accentLineWrap, style]}>
      <View style={styles.accentLineDash} />
      <View style={styles.accentLineCenter} />
      <View style={styles.accentLineDash} />
    </View>
  );
}

// ─── Header ────────────────────────────────────────────────────────────────
function Header() {
  return (
    <View style={styles.header}>
      {/* Top double gold lines */}
      <View style={styles.headerTopLines}>
        <View style={styles.headerGoldLine} />
        <View style={[styles.headerGoldLine, { opacity: 0.3 }]} />
      </View>

      <View style={styles.headerContent}>
        <TouchableOpacity testID="menu-button" style={styles.headerIconBtn} activeOpacity={0.7}>
          <MaterialIcons name="menu" size={24} color={C.goldMid} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerTitleLine} />
            <Text style={styles.headerTitle}>IRON MILES</Text>
            <View style={styles.headerTitleLine} />
          </View>
          <Text style={styles.headerSubtitle}>Fitness Journey for Truck Drivers</Text>
        </View>

        <TouchableOpacity testID="settings-button" style={styles.headerIconBtn} activeOpacity={0.7}>
          <Ionicons name="settings-outline" size={22} color={C.goldMid} />
        </TouchableOpacity>
      </View>

      {/* Bottom double gold lines */}
      <View style={styles.headerBottomLines}>
        <View style={[styles.headerGoldLine, { opacity: 0.3 }]} />
        <View style={styles.headerGoldLine} />
      </View>
    </View>
  );
}

// ─── Mile Shield Badge ─────────────────────────────────────────────────────
function MileShield({ mile, size = 'normal' }: { mile: number; size?: 'normal' | 'small' }) {
  const isSmall = size === 'small';
  return (
    <View style={[styles.shieldOuter, isSmall && styles.shieldOuterSmall]}>
      <LinearGradient
        colors={[C.shieldGreenLight, C.shieldGreen, '#163028']}
        style={[styles.shieldInner, isSmall && styles.shieldInnerSmall]}
      >
        <Text style={[styles.shieldLabel, isSmall && styles.shieldLabelSmall]}>MILE</Text>
        <Text style={[styles.shieldNumber, isSmall && styles.shieldNumberSmall]}>{mile}</Text>
      </LinearGradient>
    </View>
  );
}

// ─── Lifetime Hero Section ──────────────────────────────────────────────────
function LifetimeHeroSection() {
  return (
    <View style={styles.heroContainer}>
      <ImageBackground
        source={require('../../assets/images/hero-highway.jpg')}
        style={styles.heroBackground}
        imageStyle={styles.heroImage}
      >
        <LinearGradient
          colors={[
            'rgba(12,11,9,0.96)',
            'rgba(12,11,9,0.72)',
            'rgba(25,20,10,0.48)',
            'rgba(12,11,9,0.94)',
          ]}
          locations={[0, 0.3, 0.55, 1]}
          style={styles.heroOverlay}
        >
          {/* Top highway accent lines */}
          <View style={styles.heroTopAccent}>
            <View style={styles.heroAccentLine} />
            <View style={[styles.heroAccentLine, { backgroundColor: C.goldBright, opacity: 0.12 }]} />
          </View>

          <GoldAccentLine style={{ marginBottom: 6 }} />

          {/* Lifetime label */}
          <View style={styles.lifetimeLabelRow}>
            <View style={styles.lifetimeLabelDash} />
            <Text style={styles.lifetimeLabel}>LIFETIME IRON MILES</Text>
            <View style={styles.lifetimeLabelDash} />
          </View>

          {/* Large mileage number — primary focal point */}
          <View style={styles.lifetimeNumberWrap}>
            <Text style={styles.lifetimeNumber}>{driverData.lifetimeMiles}</Text>
          </View>
          <Text style={styles.lifetimeUnit}>MILES</Text>

          {/* Road / Highway visual element */}
          <View style={styles.roadVisual}>
            <View style={styles.roadSurface}>
              <View style={styles.roadEdgeTop} />
              <View style={styles.roadLanes}>
                <View style={styles.roadLaneSolid} />
                <View style={styles.roadCenterDashes}>
                  <View style={styles.roadDash} />
                  <View style={styles.roadDash} />
                  <View style={styles.roadDash} />
                  <View style={styles.roadDash} />
                  <View style={styles.roadDash} />
                  <View style={styles.roadDash} />
                  <View style={styles.roadDash} />
                </View>
                <View style={styles.roadLaneSolid} />
              </View>
              <View style={styles.roadEdgeBottom} />
            </View>
          </View>

          {/* Mile shields with truck on the road */}
          <View style={styles.shieldsRow}>
            <MileShield mile={driverData.currentMile} />
            <View style={styles.shieldRoadConnector}>
              <View style={styles.connectorRoad}>
                <View style={styles.connectorEdge} />
                <View style={styles.connectorDashes}>
                  <View style={styles.connectorDash} />
                  <View style={styles.connectorDash} />
                </View>
                <MaterialCommunityIcons name="truck" size={16} color={C.goldBright} />
                <View style={styles.connectorDashes}>
                  <View style={styles.connectorDash} />
                  <View style={styles.connectorDash} />
                </View>
                <View style={styles.connectorEdge} />
              </View>
            </View>
            <MileShield mile={driverData.targetMile} />
          </View>

          {/* Bottom highway accent lines */}
          <View style={styles.heroBottomAccent}>
            <View style={[styles.heroAccentLine, { backgroundColor: C.goldBright, opacity: 0.1 }]} />
            <View style={styles.heroAccentLine} />
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
        <View style={styles.ctaOuterBorder}>
          <LinearGradient
            colors={['#27503B', C.ctaGreenMid, C.ctaGreen, '#132A1E']}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.ctaButton}
          >
            <View style={styles.ctaInnerBorder}>
              <Text style={styles.ctaText}>GENERATE WORKOUT</Text>
            </View>
          </LinearGradient>
        </View>
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
          {/* Speedometer-style progress */}
          <View style={styles.meterTrack}>
            <LinearGradient
              colors={[C.goldDim, C.goldMid, C.goldBright]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.meterFill}
            />
          </View>
          <View style={styles.meterLabels}>
            <View style={styles.meterLabelRow}>
              <View style={styles.meterDashLong} />
              <Text style={styles.meterText}>MILE {driverData.mileMarker}</Text>
              <View style={styles.meterDashLong} />
            </View>
            <View style={styles.meterDashes}>
              <View style={styles.meterDash} />
              <View style={styles.meterDash} />
              <View style={styles.meterDash} />
              <View style={styles.meterDash} />
              <View style={styles.meterDash} />
            </View>
          </View>
        </View>

        <View style={styles.milesInfoDivider} />

        <View style={styles.milesInfo}>
          <Text style={styles.milesEarnedPlus}>+{driverData.milesEarned}</Text>
          <Text style={styles.milesLabel}>Miles Earned</Text>
          <TouchableOpacity testID="miles-details-btn" style={styles.milesArrow} activeOpacity={0.7}>
            <MaterialIcons name="chevron-right" size={28} color={C.goldMid} />
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
        <MaterialCommunityIcons name="arm-flex" size={20} color={C.goldMid} />
        <Text style={styles.workoutType}>{driverData.lastWorkout.type}</Text>
      </View>
      <Text style={styles.workoutMiles}>+{driverData.lastWorkout.miles} Miles</Text>
      <TouchableOpacity testID="last-workout-details" style={styles.cardArrow} activeOpacity={0.7}>
        <View style={styles.arrowCircle}>
          <MaterialIcons name="arrow-forward" size={14} color={C.goldDark} />
        </View>
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
        <MaterialCommunityIcons name="fire" size={17} color={C.goldMid} />
        <Text style={styles.statValue}>{driverData.stats.workouts}</Text>
        <Text style={styles.statLabel}>Workouts</Text>
      </View>
      <View style={styles.statRow}>
        <MaterialCommunityIcons name="shoe-sneaker" size={17} color={C.goldMid} />
        <Text style={styles.statValue}>{driverData.stats.steps}</Text>
        <Text style={styles.statLabel}>Steps</Text>
      </View>
      <View style={styles.statRow}>
        <MaterialCommunityIcons name="lightning-bolt" size={17} color={C.goldMid} />
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
        <LifetimeHeroSection />
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
    backgroundColor: C.bgCharcoal,
  },
  scrollContent: {
    paddingBottom: 8,
    backgroundColor: C.bg,
  },

  // ── Decorative accent line
  accentLineWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '80%',
    alignSelf: 'center',
  },
  accentLineDash: {
    flex: 1,
    height: 1,
    backgroundColor: C.goldDim,
    opacity: 0.6,
  },
  accentLineCenter: {
    width: 6,
    height: 6,
    backgroundColor: C.goldMid,
    transform: [{ rotate: '45deg' }],
    marginHorizontal: 8,
    opacity: 0.5,
  },

  // ── Header
  header: {
    backgroundColor: C.bgCharcoal,
  },
  headerTopLines: {
    paddingTop: 2,
    gap: 2,
  },
  headerBottomLines: {
    gap: 2,
    paddingBottom: 2,
  },
  headerGoldLine: {
    height: 1,
    backgroundColor: C.goldDim,
    opacity: 0.5,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitleLine: {
    width: 24,
    height: 1.5,
    backgroundColor: C.goldMid,
    opacity: 0.5,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: C.gold,
    letterSpacing: 5,
  },
  headerSubtitle: {
    fontSize: 11,
    color: C.goldDark,
    letterSpacing: 1.5,
    marginTop: 3,
    fontStyle: 'italic',
  },

  // ── Hero / Lifetime
  heroContainer: {
    marginHorizontal: 14,
    marginTop: 10,
    borderRadius: 6,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: C.borderGold,
  },
  heroBackground: {
    width: '100%',
    minHeight: 260,
  },
  heroImage: {
    opacity: 0.5,
  },
  heroOverlay: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTopAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    gap: 1,
  },
  heroBottomAccent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    gap: 1,
  },
  heroAccentLine: {
    height: 1.5,
    backgroundColor: C.goldDim,
    opacity: 0.4,
  },

  // ── Lifetime Miles
  lifetimeLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 4,
  },
  lifetimeLabelDash: {
    width: 20,
    height: 1,
    backgroundColor: C.goldMid,
    opacity: 0.4,
  },
  lifetimeLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: C.goldDark,
    letterSpacing: 4,
  },
  lifetimeNumberWrap: {
    marginVertical: 2,
  },
  lifetimeNumber: {
    fontSize: 52,
    fontWeight: '900',
    color: C.white,
    letterSpacing: 3,
  },
  lifetimeUnit: {
    fontSize: 14,
    fontWeight: '800',
    color: C.goldMid,
    letterSpacing: 6,
    marginBottom: 12,
  },

  // ── Road Visual Element
  roadVisual: {
    width: '90%',
    marginBottom: 14,
  },
  roadSurface: {
    backgroundColor: C.asphalt,
    borderRadius: 2,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: C.roadEdge,
  },
  roadEdgeTop: {
    height: 1.5,
    backgroundColor: C.goldDim,
    opacity: 0.5,
    marginHorizontal: 8,
    marginBottom: 4,
  },
  roadEdgeBottom: {
    height: 1.5,
    backgroundColor: C.goldDim,
    opacity: 0.5,
    marginHorizontal: 8,
    marginTop: 4,
  },
  roadLanes: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  roadLaneSolid: {
    width: 2,
    height: 6,
    backgroundColor: C.goldDark,
    opacity: 0.5,
  },
  roadCenterDashes: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  roadDash: {
    width: 18,
    height: 2.5,
    backgroundColor: C.roadCenter,
    opacity: 0.45,
    borderRadius: 1,
  },

  // ── Shield connector with road
  shieldsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  shieldRoadConnector: {
    marginHorizontal: 4,
  },
  connectorRoad: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.asphalt,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: C.roadEdge,
    gap: 3,
  },
  connectorEdge: {
    width: 2,
    height: 8,
    backgroundColor: C.goldDim,
    opacity: 0.5,
  },
  connectorDashes: {
    flexDirection: 'row',
    gap: 4,
  },
  connectorDash: {
    width: 8,
    height: 2,
    backgroundColor: C.roadCenter,
    opacity: 0.45,
    borderRadius: 1,
  },

  // ── Mile Shield (green highway badge)
  shieldOuter: {
    borderWidth: 3,
    borderColor: C.goldMid,
    borderRadius: 6,
    padding: 2,
  },
  shieldOuterSmall: {
    borderWidth: 2,
    borderRadius: 4,
    padding: 1,
  },
  shieldInner: {
    width: 58,
    height: 66,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(224,194,124,0.25)',
  },
  shieldInnerSmall: {
    width: 44,
    height: 48,
    borderRadius: 2,
  },
  shieldLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: C.offWhite,
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
    fontSize: 18,
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
    color: C.gold,
  },

  // ── CTA
  ctaContainer: {
    marginHorizontal: 14,
    marginTop: 10,
    marginBottom: 18,
    alignItems: 'center',
  },
  ctaOuterBorder: {
    width: SCREEN_WIDTH - 28,
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: C.goldMid,
    overflow: 'hidden',
  },
  ctaButton: {
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(224,194,124,0.15)',
  },
  ctaInnerBorder: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(224,194,124,0.08)',
    borderRadius: 4,
    margin: 2,
  },
  ctaText: {
    fontSize: 22,
    fontWeight: '900',
    color: C.white,
    letterSpacing: 4,
  },
  ctaSubtext: {
    fontSize: 13,
    color: C.goldDark,
    marginTop: 10,
    letterSpacing: 0.5,
    fontStyle: 'italic',
  },

  // ── Cards (shared)
  card: {
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.borderGold,
    borderRadius: 6,
    padding: 16,
    marginHorizontal: 14,
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
    color: C.gold,
    letterSpacing: 2,
    marginRight: 10,
  },
  cardHeaderLine: {
    flex: 1,
    height: 1.5,
    backgroundColor: C.goldDim,
    opacity: 0.5,
  },

  // ── Current Miles
  milesContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  milesMeter: {
    flex: 1,
  },
  meterTrack: {
    height: 10,
    backgroundColor: C.surfaceElevated,
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.borderGold,
  },
  meterFill: {
    height: '100%',
    width: '54%',
    borderRadius: 5,
  },
  meterLabels: {
    gap: 4,
  },
  meterLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  meterDashLong: {
    width: 16,
    height: 1.5,
    backgroundColor: C.goldMid,
    opacity: 0.4,
  },
  meterText: {
    fontSize: 12,
    fontWeight: '800',
    color: C.textSecondary,
    letterSpacing: 1.5,
  },
  meterDashes: {
    flexDirection: 'row',
    gap: 5,
  },
  meterDash: {
    width: 14,
    height: 2,
    backgroundColor: C.goldMid,
    opacity: 0.3,
  },
  milesInfoDivider: {
    width: 1.5,
    height: '80%',
    backgroundColor: C.borderGold,
    marginHorizontal: 16,
  },
  milesInfo: {
    alignItems: 'center',
  },
  milesEarnedPlus: {
    fontSize: 30,
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
    marginHorizontal: 14,
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
    color: C.gold,
    letterSpacing: 2,
    marginBottom: 6,
  },
  smallCardDivider: {
    height: 1.5,
    backgroundColor: C.borderGold,
    marginBottom: 10,
    opacity: 0.6,
  },

  // ── Last Workout
  workoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  workoutType: {
    fontSize: 16,
    fontWeight: '800',
    color: C.offWhite,
  },
  workoutMiles: {
    fontSize: 13,
    color: C.goldMid,
    fontWeight: '700',
    marginTop: 2,
  },
  cardArrow: {
    position: 'absolute',
    bottom: 12,
    right: 12,
  },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: C.borderGold,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surfaceElevated,
  },

  // ── Quick Stats
  statRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 7,
    gap: 7,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '900',
    color: C.offWhite,
  },
  statLabel: {
    fontSize: 11,
    color: C.textSecondary,
  },
});
