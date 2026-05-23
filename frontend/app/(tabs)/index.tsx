import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import * as Haptics from 'expo-haptics';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Dimensions,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useFocusEffect } from 'expo-router';
import HamburgerMenu from '../../src/components/HamburgerMenu';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';
import { computeMilestoneProgress } from '../../src/lib/milestones';
import { PrimaryCtaPressable } from '../../src/components/PrimaryCtaPressable';
import { getDailySignalQuote } from '../../src/lib/dailySignalQuotes';
import { playAirBrakeRelease } from '../../src/lib/airBrakeSound';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// ── Circular Gauge Dimensions
const GAUGE_OUTER = Math.min(SCREEN_WIDTH - 44, 300);
const GAUGE_BEZEL = 19;
const GAUGE_GOLD = 14;
const GAUGE_INNER = GAUGE_OUTER - 2 * (GAUGE_BEZEL + GAUGE_GOLD);
const GAUGE_GOLD_RING_SIZE = GAUGE_OUTER - 2 * GAUGE_BEZEL;

// Iron Miles Color Palette — asphalt charcoal, metallic gold
const C = {
  bg: '#0C0C0B',
  bgCharcoal: '#0E0E0D',
  surface: '#15130F',
  surfaceElevated: '#1E1B16',
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

// Generate Workout CTA (vertical fill — stays deep); logo E/S are lifted tints for contrast on dark asphalt
const CTA_BUTTON_GRADIENT = ['#111E16', '#172A1E', '#14261A', '#0D1A10'] as const;
// Muted sage from same hue family as CTA / shield green; E slightly brighter than S for readability
const CTA_MILES_LOGO_S = '#5A7A6A';
const CTA_MILES_LOGO_E = '#6F8F7C';

// Default driver data (used as fallback before API loads)
const DEFAULT_DATA = {
  name: 'Driver',
  lifetimeMiles: 0,
  currentMile: 100,
  targetMile: 500,
  milesEarned: 0,
  mileMarker: 100,
  nextMileMarker: 500,
  progressPct: 0,
  lastWorkout: { type: 'No workouts completed yet', miles: 0 },
  primaryGoal: null as string | null,
  truckType: null as string | null,
  stats: { workouts: 0, steps: '0', calories: 0 },
};

type ReplayExerciseItem = {
  exercise_id: string;
  name: string;
  sets: number;
  reps: number;
  sets_assigned: number | string;
  reps_assigned: number | string;
  instruction_text: string;
  video_url: string;
  thumbnail_url: string;
  equipment_type?: string;
  target_muscle?: string;
  movement_type?: 'reps' | 'time';
  repsRaw: string;
  rest: number;
  equipmentTag?: string;
};

type LastWorkoutReplayData = {
  workoutTitle: string;
  milesReward: number;
  generatedWorkoutId: string;
  workoutStyle: string;
  difficultyLevel: string;
  exercises: ReplayExerciseItem[];
};

// Gold → soft gold → soft green → green (horizontal feel via per-glyph lerp)
const LOGO_MILES_STOPS = [
  { pos: 0, hex: '#D4AF37' },
  { pos: 0.38, hex: '#E8C55A' },
  { pos: 0.66, hex: '#9FD68B' },
  { pos: 1, hex: '#4CAF50' },
] as const;

function logoLerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function logoHexToRgb(hex: string) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  };
}

function logoRgbToHex(r: number, g: number, b: number) {
  const c = (n: number) => Math.max(0, Math.min(255, Math.round(n)));
  return `#${c(r).toString(16).padStart(2, '0')}${c(g).toString(16).padStart(2, '0')}${c(b).toString(16).padStart(2, '0')}`;
}

function milesGradientColor(t: number): string {
  const tt = Math.max(0, Math.min(1, t));
  let i = 0;
  while (i < LOGO_MILES_STOPS.length - 1 && tt > LOGO_MILES_STOPS[i + 1].pos) {
    i += 1;
  }
  const a = LOGO_MILES_STOPS[i];
  const b = LOGO_MILES_STOPS[i + 1];
  if (!b) return a.hex;
  const span = b.pos - a.pos || 1;
  const u = (tt - a.pos) / span;
  const A = logoHexToRgb(a.hex);
  const B = logoHexToRgb(b.hex);
  return logoRgbToHex(logoLerp(A.r, B.r, u), logoLerp(A.g, B.g, u), logoLerp(A.b, B.b, u));
}

function GradientLogoText({ text }: { text: string }) {
  const chars = text.split('');
  const milesStart = text.indexOf('MILES');
  const milesChars = milesStart === -1 ? [] : text.slice(milesStart).split('');
  const milesDenom = Math.max(milesChars.length - 1, 1);

  return (
    <Text style={styles.headerTitle}>
      {chars.map((char, index) => {
        if (milesStart === -1 || index < milesStart) {
          return (
            <Text key={`${char}-${index}`} style={styles.headerTitleIron}>
              {char}
            </Text>
          );
        }

        const milesIndex = index - milesStart;
        let milesColor: string;
        if (milesIndex === 3 && char === 'E') {
          milesColor = CTA_MILES_LOGO_E;
        } else if (milesIndex === 4 && char === 'S') {
          milesColor = CTA_MILES_LOGO_S;
        } else {
          const t = milesChars.length <= 1 ? 0 : milesIndex / milesDenom;
          milesColor = milesGradientColor(t);
        }
        return (
          <Text key={`${char}-${index}`} style={[styles.headerTitleMilesLetter, { color: milesColor }]}>
            {char}
          </Text>
        );
      })}
    </Text>
  );
}

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
function Header({ onMenuPress, onSettingsPress }: { onMenuPress: () => void; onSettingsPress: () => void }) {
  return (
    <View style={styles.header}>
      <View style={styles.headerTopLines}>
        <View style={styles.headerGoldLine} />
        <View style={[styles.headerGoldLine, { opacity: 0.3 }]} />
      </View>

      <View style={styles.headerContent}>
        <TouchableOpacity testID="menu-button" onPress={onMenuPress} style={styles.headerIconBtn} activeOpacity={0.7}>
          <MaterialIcons name="menu" size={24} color={C.goldMid} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerTitleRow}>
            <View style={styles.headerTitleLine} />
            <GradientLogoText text="IRON MILES" />
            <View style={styles.headerTitleLine} />
          </View>
          <Text style={styles.headerSubtitle}>Fitness Journey for Truck Drivers</Text>
        </View>

        <TouchableOpacity testID="settings-button" onPress={onSettingsPress} style={styles.headerIconBtn} activeOpacity={0.7}>
          <Ionicons name="settings-outline" size={22} color={C.goldMid} />
        </TouchableOpacity>
      </View>

      <View style={styles.headerBottomLines}>
        <View style={[styles.headerGoldLine, { opacity: 0.3 }]} />
        <View style={styles.headerGoldLine} />
      </View>
    </View>
  );
}

// ─── Mile Shield Badge ─────────────────────────────────────────────────────
function MileShield({ mile, size = 'normal', dimmed = false }: { mile: number; size?: 'normal' | 'small'; dimmed?: boolean }) {
  const isSmall = size === 'small';
  return (
    <View
      style={[
        styles.shieldOuter,
        isSmall && styles.shieldOuterSmall,
        dimmed && styles.shieldOuterDimmed,
        dimmed && isSmall && styles.shieldOuterSmallDimmed,
      ]}
    >
      <LinearGradient
        colors={dimmed ? ['#172E25', '#132820', '#0E1E18'] : [C.shieldGreenLight, C.shieldGreen, '#163028']}
        style={[styles.shieldInner, isSmall && styles.shieldInnerSmall, dimmed && styles.shieldInnerDimmed]}
      >
        <Text style={[styles.shieldLabel, isSmall && styles.shieldLabelSmall, dimmed && styles.shieldLabelDimmed]}>MILE</Text>
        <Text style={[styles.shieldNumber, isSmall && styles.shieldNumberSmall, dimmed && styles.shieldNumberDimmed]}>{mile}</Text>
      </LinearGradient>
    </View>
  );
}

// ─── Gauge Glow Layer ─────────────────────────────────────────────────────
function GaugeGlowLayer({ on }: { on: boolean }) {
  const glowAnim = useRef(new Animated.Value(on ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(glowAnim, {
      toValue: on ? 1 : 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  }, [on]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.gaugeGlowWrap, { opacity: glowAnim }]}
    >
      <LinearGradient
        colors={['rgba(230,200,120,0)', 'rgba(230,200,120,0.11)', 'rgba(230,200,120,0)']}
        start={{ x: 0.5, y: 0.1 }}
        end={{ x: 0.5, y: 0.9 }}
        style={{ width: GAUGE_OUTER + 72, height: GAUGE_OUTER + 72, borderRadius: (GAUGE_OUTER + 72) / 2 }}
      />
    </Animated.View>
  );
}

// ─── Lifetime Gauge Section ─────────────────────────────────────────────────
function LifetimeHeroSection({ lifetimeMiles, headlightsOn }: { lifetimeMiles: number; currentMile?: number; targetMile?: number; headlightsOn?: boolean }) {
  const goldRingRadius = GAUGE_GOLD_RING_SIZE / 2;
  const [displayedMiles, setDisplayedMiles] = useState(0);
  const milesAnim = useRef(new Animated.Value(0)).current;
  const prevLifetimeRef = useRef<number | null>(null);

  // ── Flip state ────────────────────────────────────────────────────────────
  const [flipped, setFlipped] = useState(false);
  const flipAnim = useRef(new Animated.Value(0)).current;

  const toggleFlip = () => {
    const toValue = flipped ? 0 : 1;
    Animated.timing(flipAnim, {
      toValue,
      duration: 520,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
    setFlipped(!flipped);
  };

  // ── Daily quote (refreshed when tab gains focus) ──────────────────────────
  const [dayKey, setDayKey] = useState(() => new Date().toDateString());
  useFocusEffect(
    useCallback(() => {
      setDayKey(new Date().toDateString());
    }, [])
  );
  const dailyQuote = useMemo(() => getDailySignalQuote(new Date(dayKey)), [dayKey]);

  // ── Front/back rotation interpolations ───────────────────────────────────
  const frontRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });
  const backRotate = flipAnim.interpolate({ inputRange: [0, 1], outputRange: ['180deg', '360deg'] });

  useEffect(() => {
    const targetMiles = Math.max(0, Math.floor(lifetimeMiles));
    if (prevLifetimeRef.current === targetMiles) return;
    prevLifetimeRef.current = targetMiles;

    if (targetMiles === 0) {
      milesAnim.stopAnimation();
      setDisplayedMiles(0);
      return;
    }

    milesAnim.setValue(0);
    const listenerId = milesAnim.addListener(({ value }) => {
      setDisplayedMiles(Math.round(value));
    });

    Animated.timing(milesAnim, {
      toValue: targetMiles,
      duration: 1100,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start(({ finished }) => {
      if (finished) {
        setDisplayedMiles(targetMiles);
      }
    });

    return () => {
      milesAnim.removeListener(listenerId);
    };
  }, [lifetimeMiles, milesAnim]);

  return (
    <View style={styles.gaugeWrapper}>
      <GaugeGlowLayer on={!!headlightsOn} />
      {/* Dark outer bezel ring */}
      <View style={styles.gaugeOuter}>
        {/* Outer bezel depth gradient */}
        <LinearGradient
          colors={['#2C2824', '#080706', '#141210', '#252220']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        {/* Subtle top-edge highlight on outer ring */}
        <LinearGradient
          colors={['rgba(92,74,40,0.5)', 'rgba(50,40,22,0)']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 0.2 }}
          style={StyleSheet.absoluteFillObject}
        />

        {/* Gold metallic ring */}
        <LinearGradient
          colors={['#7A5410', '#A67818', '#D4A843', '#F0D575', '#E8C96A', '#B8892E', '#8A6012', '#C8941E', '#E6CA7A']}
          locations={[0, 0.14, 0.32, 0.46, 0.56, 0.68, 0.8, 0.9, 1]}
          start={{ x: 0.12, y: 0.1 }}
          end={{ x: 0.9, y: 0.92 }}
          style={styles.gaugeGoldRing}
        >
          {/* Curved-metal highlight + shadow (under inner face; shows in gold band only) */}
          <LinearGradient
            colors={['rgba(255,244,210,0.32)', 'rgba(255,250,235,0.06)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.22)', 'rgba(24,14,4,0.38)']}
            locations={[0, 0.2, 0.45, 0.72, 1]}
            start={{ x: 0.18, y: 0.08 }}
            end={{ x: 0.88, y: 0.94 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: goldRingRadius }]}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['transparent', 'rgba(212,168,67,0.12)']}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[StyleSheet.absoluteFillObject, { borderRadius: goldRingRadius }]}
            pointerEvents="none"
          />

          {/* ── Flip container: wraps both faces of the inner dial ── */}
          <Pressable
            onPress={toggleFlip}
            onLongPress={toggleFlip}
            delayLongPress={380}
            style={styles.gaugeInnerFace}
          >
            {/* ── FRONT FACE ─────────────────────────────────────────────── */}
            <Animated.View
              style={[
                styles.gaugeInnerFace,
                StyleSheet.absoluteFillObject,
                { backfaceVisibility: 'hidden', transform: [{ perspective: 1000 }, { rotateY: frontRotate }] },
              ]}
            >
              {/* Inner face depth gradient */}
              <LinearGradient
                colors={['#1A1815', '#070605', '#0C0B09', '#181613']}
                start={{ x: 0.12, y: 0 }}
                end={{ x: 0.88, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              {/* Faint center amber lift */}
              <LinearGradient
                colors={['rgba(28,20,8,0)', 'rgba(36,26,10,0.1)', 'rgba(28,20,8,0)']}
                start={{ x: 0.2, y: 0 }}
                end={{ x: 0.8, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              {/* Recessed well: soft shadow toward inner perimeter */}
              <LinearGradient
                colors={['rgba(0,0,0,0.32)', 'rgba(0,0,0,0.06)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.24)']}
                locations={[0, 0.14, 0.42, 0.72, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />

              {/* Tick marks around the inner face edge */}
              {Array.from({ length: 60 }).map((_, i) => {
                const isMajor = i % 5 === 0;
                return (
                  <View
                    key={i}
                    style={[
                      StyleSheet.absoluteFillObject,
                      { alignItems: 'center', transform: [{ rotate: `${i * 6}deg` }] },
                    ]}
                  >
                    <View
                      style={{
                        width: isMajor ? 2 : 1,
                        height: isMajor ? 13 : 7,
                        backgroundColor: isMajor ? 'rgba(212,184,110,0.92)' : 'rgba(110,88,48,0.55)',
                        marginTop: 3,
                        opacity: isMajor ? 0.92 : 0.48,
                        borderRadius: isMajor ? 1 : 0.5,
                        shadowColor: isMajor ? '#D4A843' : 'transparent',
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: isMajor ? 0.35 : 0,
                        shadowRadius: isMajor ? 2 : 0,
                      }}
                    />
                  </View>
                );
              })}

              {/* Edge vignette: ticks read as cut into the dial */}
              <LinearGradient
                colors={['rgba(0,0,0,0.22)', 'transparent', 'rgba(0,0,0,0.16)']}
                locations={[0, 0.45, 1]}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
              <LinearGradient
                colors={['rgba(0,0,0,0.14)', 'transparent', 'rgba(0,0,0,0.14)']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
              {/* Restrained night-cluster illumination */}
              <LinearGradient
                colors={['rgba(255,218,150,0)', 'rgba(255,206,130,0.055)', 'rgba(255,218,150,0)']}
                start={{ x: 0.35, y: 0.28 }}
                end={{ x: 0.65, y: 0.68 }}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />

              {/* ── Gauge content ── */}
              <Text style={styles.gaugeTopLabel}>LIFETIME</Text>
              <View style={styles.gaugeIronMilesRow}>
                <View style={styles.gaugeLabelDash} />
                <Text style={styles.gaugeIronMilesLabel}>IRON MILES</Text>
                <View style={styles.gaugeLabelDash} />
              </View>

              <Text style={styles.gaugeNumber}>{displayedMiles.toLocaleString()}</Text>
              <Text style={styles.gaugeUnit}>MILES</Text>

              {/* Road + truck image strip */}
              <View style={styles.gaugeRoadImageWrap}>
                <Image
                  source={require('../../assets/gauge-road-truck.png')}
                  style={styles.gaugeRoadImage}
                  resizeMode="cover"
                />
              </View>
            </Animated.View>

            {/* ── BACK FACE ──────────────────────────────────────────────── */}
            <Animated.View
              style={[
                styles.gaugeInnerFace,
                StyleSheet.absoluteFillObject,
                styles.gaugeBackFace,
                { backfaceVisibility: 'hidden', transform: [{ perspective: 1000 }, { rotateY: backRotate }] },
              ]}
            >
              <LinearGradient
                colors={['#141210', '#080706', '#0F0D0B', '#181613']}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.85, y: 1 }}
                style={StyleSheet.absoluteFillObject}
              />
              {/* Subtle amber center glow */}
              <LinearGradient
                colors={['rgba(0,0,0,0)', 'rgba(42,30,10,0.14)', 'rgba(0,0,0,0)']}
                start={{ x: 0.25, y: 0.3 }}
                end={{ x: 0.75, y: 0.7 }}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
              />
              <Text style={styles.gaugeSignalLabel}>TODAY'S SIGNAL</Text>
              <View style={styles.gaugeSignalRule} />
              <Text style={styles.gaugeSignalQuote}>{dailyQuote}</Text>
              <View style={styles.gaugeSignalRule} />
              <Text style={styles.gaugeSignalFooter}>STAY ON ROUTE</Text>
            </Animated.View>
          </Pressable>
        </LinearGradient>
      </View>
    </View>
  );
}

// ─── Headlight Toggle ──────────────────────────────────────────────────────
function HeadlightToggle({ on, onPress }: { on: boolean; onPress: () => void }) {
  const anim = useRef(new Animated.Value(on ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: on ? 1 : 0,
      duration: 250,
      useNativeDriver: false,
    }).start();
  }, [on]);

  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [C.goldDim, C.goldMid],
  });
  const bgColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(26,25,22,0)', 'rgba(220,168,60,0.12)'],
  });
  const iconColor = on ? C.goldBright : '#4A4538';

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} testID="headlight-toggle">
      <Animated.View style={[styles.headlightToggle, { borderColor, backgroundColor: bgColor }]}>
        <MaterialCommunityIcons name="car-light-high" size={15} color={iconColor} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ─── Welcome Section ───────────────────────────────────────────────────────
function WelcomeSection({ name, currentMile, headlightsOn, onToggle }: { name: string; currentMile: number; headlightsOn: boolean; onToggle: () => void }) {
  return (
    <View style={styles.welcomeRow}>
      <Text style={styles.welcomeText}>Welcome, {name}!</Text>
      <View style={styles.welcomeRight}>
        <MileShield mile={currentMile} size="small" dimmed />
        <HeadlightToggle on={headlightsOn} onPress={onToggle} />
      </View>
    </View>
  );
}

const GENERATE_WORKOUT_NAV_DELAY_MS = 1500;
const GENERATE_WORKOUT_RESET_AFTER_NAV_MS = 280;

// ─── Generate Workout CTA ──────────────────────────────────────────────────
function GenerateWorkoutCTA({ onPress, disabled, active }: { onPress: () => void; disabled?: boolean; active?: boolean }) {
  const [pressVisualActive, setPressVisualActive] = useState(false);
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const idleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let pulseLoop: Animated.CompositeAnimation | null = null;
    if (active || pressVisualActive) {
      pulseAnim.setValue(0);
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 480,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 520,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
    } else {
      pulseAnim.stopAnimation();
      Animated.timing(pulseAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      pulseLoop?.stop();
    };
  }, [active, pressVisualActive, pulseAnim]);

  useEffect(() => {
    let idleLoop: Animated.CompositeAnimation | null = null;
    if (!active && !pressVisualActive) {
      idleAnim.setValue(0);
      idleLoop = Animated.loop(
        Animated.sequence([
          Animated.delay(6500),
          Animated.timing(idleAnim, {
            toValue: 1,
            duration: 700,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(idleAnim, {
            toValue: 0,
            duration: 950,
            easing: Easing.inOut(Easing.quad),
            useNativeDriver: true,
          }),
        ])
      );
      idleLoop.start();
    } else {
      idleAnim.stopAnimation();
      Animated.timing(idleAnim, {
        toValue: 0,
        duration: 160,
        useNativeDriver: true,
      }).start();
    }

    return () => {
      idleLoop?.stop();
    };
  }, [active, pressVisualActive, idleAnim]);

  const glowOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 0.45],
  });
  const glowScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.025],
  });
  const ctaScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.01],
  });
  const idleGlowOpacity = idleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.04, 0.13],
  });
  const idleGlowScale = idleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.015],
  });
  const edgeGlowOpacity = idleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.12, 0.22],
  });
  const topAmbientBloomOpacity = idleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.82, 1],
  });

  const onPressIn = useCallback(() => {
    setPressVisualActive(true);
    try {
      playAirBrakeRelease();
    } catch {
      /* optional audio */
    }
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      /* optional haptic */
    }
  }, []);

  const onPressOut = useCallback(() => {
    if (!active) {
      setPressVisualActive(false);
    }
  }, [active]);

  return (
    <View style={styles.ctaContainer}>
      <View pointerEvents="none" style={styles.ctaBackdrop} />
      <View pointerEvents="none" style={styles.ctaWhiteEdgeGlow} />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ctaGlow,
          {
            opacity: glowOpacity,
            transform: [{ scale: glowScale }],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ctaIdleGlow,
          {
            opacity: idleGlowOpacity,
            transform: [{ scale: idleGlowScale }],
          },
        ]}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.ctaEdgeAura,
          { opacity: edgeGlowOpacity },
        ]}
      />
      <PrimaryCtaPressable
        testID="generate-workout-btn"
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        pressScale={0.97}
        disabled={disabled}
        animatedWrapStyle={{ alignSelf: 'stretch' }}
      >
        <Animated.View style={{ transform: [{ scale: ctaScale }] }}>
          <View style={[styles.ctaOuterBorder, (active || pressVisualActive) && styles.ctaOuterBorderActive]}>
            <LinearGradient
              colors={[...CTA_BUTTON_GRADIENT]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.ctaButton}
            >
              {/* Industrial left-edge accent strip */}
              <View style={styles.ctaLeftAccent} />
              {/* Subtle horizontal cross-grain sheen */}
              <View style={styles.ctaCrossGrain} />
              {/* Soft center lift for premium depth (restrained, non-neon) */}
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.ctaInnerGreenGlow,
                  { opacity: idleGlowOpacity },
                ]}
              />
              {/* Subtle inner vignette to add industrial recessed depth */}
              <LinearGradient
                pointerEvents="none"
                colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.06)', 'rgba(0,0,0,0.3)']}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={styles.ctaInnerVignetteH}
              />
              <LinearGradient
                pointerEvents="none"
                colors={['rgba(0,0,0,0.26)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.22)']}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.ctaInnerVignetteV}
              />
              <Animated.View
                pointerEvents="none"
                style={[styles.ctaTopAmbientBloom, { opacity: active || pressVisualActive ? 1 : topAmbientBloomOpacity }]}
              >
                <LinearGradient
                  colors={[
                    'rgba(196, 162, 88, 0.16)',
                    'rgba(176, 142, 78, 0.06)',
                    'rgba(140, 112, 58, 0)',
                  ]}
                  locations={[0, 0.42, 1]}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={['transparent', 'rgba(212, 175, 95, 0.05)', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaTopAmbientBloomSheen}
                />
              </Animated.View>
              <View style={[styles.ctaInnerBorder, (active || pressVisualActive) && styles.ctaInnerBorderActive]}>
                <Text style={styles.ctaText}>{active ? 'IGNITING WORKOUT' : 'GENERATE WORKOUT'}</Text>
                <Text style={styles.ctaReleaseBrakes}>{active ? 'Air system priming...' : 'Release Brakes'}</Text>
              </View>
            </LinearGradient>
          </View>
        </Animated.View>
      </PrimaryCtaPressable>
      <Text style={[styles.ctaSubtext, active && styles.ctaSubtextActive]}>
        {active ? 'Starting engine sequence...' : 'Build a workout for your current stop.'}
      </Text>
    </View>
  );
}

// ─── Current Miles Card ────────────────────────────────────────────────────
function CurrentMilesCard({
  milesEarned,
  mileMarker,
  nextMileMarker,
  progressPct,
}: {
  milesEarned: number;
  mileMarker: number;
  nextMileMarker: number;
  progressPct: number;
}) {
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
              style={[styles.meterFill, { width: `${Math.max(0, Math.min(100, progressPct))}%` }]}
            />
          </View>
          <View style={styles.meterLabels}>
            <View style={styles.meterLabelRow}>
              <View style={styles.meterDashLong} />
              <Text style={styles.meterText}>MILE {mileMarker} / {nextMileMarker}</Text>
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
          <Text style={styles.milesEarnedPlus}>+{milesEarned}</Text>
          <Text style={styles.milesLabel}>Miles</Text>
          <Text style={styles.milesLast7Days} testID="miles-last-7-days">
            Last 7 Days
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Last Workout Card ─────────────────────────────────────────────────────
function LastWorkoutCard({
  type,
  miles,
  onPress,
  ctaLabel = 'Hammer Down',
  disabled = false,
}: {
  type: string;
  miles: number;
  onPress?: () => void;
  ctaLabel?: string;
  disabled?: boolean;
}) {
  return (
    <View style={[styles.card, styles.halfCard]}>
      <Text style={styles.smallCardTitle}>LAST WORKOUT</Text>
      <View style={styles.smallCardDivider} />
      <View style={styles.workoutRow}>
        <MaterialCommunityIcons name="arm-flex" size={20} color={C.goldMid} />
        <Text style={styles.workoutType} numberOfLines={2} ellipsizeMode="tail">
          {type}
        </Text>
      </View>
      <Text style={styles.workoutMiles}>+{miles} Miles</Text>
      <TouchableOpacity
        testID="last-workout-details"
        style={[styles.lastWorkoutCtaWrap, disabled && styles.lastWorkoutCtaWrapDisabled]}
        activeOpacity={disabled ? 1 : 0.7}
        disabled={disabled}
        onPress={onPress}
      >
        <Text style={[styles.lastWorkoutCtaText, disabled && styles.lastWorkoutCtaTextDisabled]}>
          {ctaLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── Quick Stats Card ──────────────────────────────────────────────────────
function QuickStatsCard({ workouts, steps, calories }: { workouts: number; steps: string; calories: number }) {
  return (
    <View style={[styles.card, styles.halfCard]}>
      <Text style={styles.smallCardTitle}>QUICK STATS</Text>
      <View style={styles.smallCardDivider} />
      <View style={styles.statRow}>
        <MaterialCommunityIcons name="fire" size={17} color={C.goldMid} />
        <Text style={styles.statValue}>{workouts}</Text>
        <Text style={styles.statLabel}>Workouts</Text>
      </View>
      <View style={styles.statRow}>
        <MaterialCommunityIcons name="shoe-sneaker" size={17} color={C.goldMid} />
        <Text style={styles.statValue}>{steps}</Text>
        <Text style={styles.statLabel}>Steps</Text>
      </View>
      <View style={styles.statRow}>
        <MaterialCommunityIcons name="lightning-bolt" size={17} color={C.goldMid} />
        <Text style={styles.statValue}>{calories}</Text>
        <Text style={styles.statLabel}>Calories</Text>
      </View>
    </View>
  );
}

// ─── Asphalt Background Layer ─────────────────────────────────────────────
// One charcoal veil (~20%) keeps texture readable; light gradients only nudge
// tone (stacking heavy alphas would bury the asset).
function BackgroundLayer() {
  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <Image
        source={require('../../assets/home-asphalt-bg.png')}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
        blurRadius={1}
      />
      <View style={[StyleSheet.absoluteFillObject, bgStyles.charcoalVeil]} />
      <LinearGradient
        colors={['rgba(6,6,8,0.1)', 'rgba(4,4,6,0.22)', 'rgba(6,6,8,0.1)']}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFillObject}
      />
      <LinearGradient
        colors={['rgba(0,0,0,0.12)', 'rgba(0,0,0,0)', 'rgba(0,0,0,0.1)']}
        locations={[0, 0.48, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />
    </View>
  );
}

const bgStyles = StyleSheet.create({
  charcoalVeil: {
    backgroundColor: 'rgba(10, 10, 12, 0.2)',
  },
});

// ─── Dashboard Screen ──────────────────────────────────────────────────────
export default function DashboardScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [driverData, setDriverData] = useState(DEFAULT_DATA);
  const [headlightsOn, setHeadlightsOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastWorkoutReplay, setLastWorkoutReplay] = useState<LastWorkoutReplayData | null>(null);
  const [generateWorkoutNavPending, setGenerateWorkoutNavPending] = useState(false);
  const generateNavTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generateNavResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const generateNavPendingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (generateNavTimeoutRef.current) {
        clearTimeout(generateNavTimeoutRef.current);
        generateNavTimeoutRef.current = null;
      }
      if (generateNavResetTimeoutRef.current) {
        clearTimeout(generateNavResetTimeoutRef.current);
        generateNavResetTimeoutRef.current = null;
      }
      generateNavPendingRef.current = false;
    };
  }, []);

  const onGenerateWorkoutPress = useCallback(() => {
    if (generateNavPendingRef.current) return;
    generateNavPendingRef.current = true;
    setGenerateWorkoutNavPending(true);
    if (generateNavTimeoutRef.current) clearTimeout(generateNavTimeoutRef.current);
    if (generateNavResetTimeoutRef.current) clearTimeout(generateNavResetTimeoutRef.current);
    generateNavTimeoutRef.current = setTimeout(() => {
      generateNavTimeoutRef.current = null;
      router.push('/generate-workout');
      generateNavResetTimeoutRef.current = setTimeout(() => {
        generateNavResetTimeoutRef.current = null;
        generateNavPendingRef.current = false;
        setGenerateWorkoutNavPending(false);
      }, GENERATE_WORKOUT_RESET_AFTER_NAV_MS);
    }, GENERATE_WORKOUT_NAV_DELAY_MS);
  }, [router]);

  const onHammerDownPress = useCallback(async () => {
    if (!lastWorkoutReplay || lastWorkoutReplay.exercises.length === 0) return;

    let activeSessionId = '';
    try {
      const { data: startedSession, error: startError } = await supabase.functions.invoke(
        'start-workout-session',
        {
          body: {
            generated_workout_id: lastWorkoutReplay.generatedWorkoutId,
            user_id: user?.id,
          },
        }
      );
      if (startError) {
        console.log('[Dashboard] start-workout-session failed (continuing replay):', startError);
      } else if (startedSession?.id) {
        activeSessionId = startedSession.id;
      }
    } catch (error) {
      console.log('[Dashboard] failed to start replay session (continuing replay):', error);
    }

    router.push({
      pathname: '/workout-in-progress',
      params: {
        workoutTitle: lastWorkoutReplay.workoutTitle,
        exercises: JSON.stringify(lastWorkoutReplay.exercises),
        sessionId: activeSessionId,
        ironMilesReward: String(lastWorkoutReplay.milesReward),
        generatedWorkoutId: lastWorkoutReplay.generatedWorkoutId,
        workoutStyle: lastWorkoutReplay.workoutStyle,
        difficultyLevel: lastWorkoutReplay.difficultyLevel,
      },
    });
  }, [lastWorkoutReplay, router, user?.id]);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const userId = user?.id;
      if (!userId) {
        setDriverData(DEFAULT_DATA);
        return;
      }

      let fullName = profile?.full_name ?? 'Driver';
      let lifetimeMiles = 0;
      let primaryGoal: string | null = null;
      let truckType: string | null = null;

      const { data: profileRow, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name, lifetime_iron_miles, primary_goal, truck_type')
        .eq('id', userId)
        .maybeSingle();
      if (profileError) {
        console.log('[Dashboard] profile fetch error:', profileError);
      } else {
        fullName = profileRow?.full_name || fullName;
        lifetimeMiles = Number(profileRow?.lifetime_iron_miles ?? 0);
        primaryGoal = profileRow?.primary_goal ?? null;
        truckType = profileRow?.truck_type ?? null;
      }

      const { data: latestRows, error: latestError } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          generated_workout_id,
          iron_miles_earned,
          completed_at,
          generated_workouts(
            id,
            title,
            target_area,
            duration_minutes,
            workout_style,
            generated_workout_exercises(
              exercise_order,
              sets_assigned,
              reps_assigned,
              exercises(
                id,
                name,
                instruction_text,
                video_url,
                thumbnail_url,
                equipment_type,
                target_muscle,
                movement_type,
                reps_default
              )
            )
          )
        `)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1);
      if (latestError) {
        console.log('[Dashboard] latest workout fetch error:', latestError);
      }

      const latestWorkout = latestRows && latestRows.length > 0 ? latestRows[0] : null;
      const latestWorkoutRel = latestWorkout?.generated_workouts as
        | {
            id?: string | null;
            title?: string | null;
            target_area?: string | null;
            duration_minutes?: number | null;
            workout_style?: string | null;
            generated_workout_exercises?: Array<{
              exercise_order?: number | null;
              sets_assigned?: number | string | null;
              reps_assigned?: number | string | null;
              exercises?: {
                id?: string | null;
                name?: string | null;
                instruction_text?: string | null;
                video_url?: string | null;
                thumbnail_url?: string | null;
                equipment_type?: string | null;
                target_muscle?: string | null;
                movement_type?: string | null;
                reps_default?: string | number | null;
              } | null;
            }>;
          }
        | null;
      const latestWorkoutTitle =
        latestWorkoutRel?.title ||
        (latestWorkoutRel?.target_area
          ? latestWorkoutRel.target_area.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())
          : 'No workouts completed yet');
      const latestWorkoutMiles = Number(latestWorkout?.iron_miles_earned ?? 0);
      const latestWorkoutExerciseRows = Array.isArray(latestWorkoutRel?.generated_workout_exercises)
        ? [...latestWorkoutRel.generated_workout_exercises]
        : [];
      latestWorkoutExerciseRows.sort(
        (a, b) => Number(a?.exercise_order ?? 999) - Number(b?.exercise_order ?? 999)
      );
      const replayExercises: ReplayExerciseItem[] = latestWorkoutExerciseRows
        .map((row) => {
          const ex = row?.exercises ?? {};
          const repsValue = String(row?.reps_assigned ?? ex?.reps_default ?? 10);
          return {
            exercise_id: ex?.id ?? '',
            name: ex?.name ?? 'Exercise',
            sets: Number(row?.sets_assigned ?? 3),
            reps: parseInt(repsValue, 10) || 10,
            sets_assigned: row?.sets_assigned ?? 3,
            reps_assigned: row?.reps_assigned ?? 10,
            instruction_text: ex?.instruction_text ?? '',
            video_url: ex?.video_url ?? '',
            thumbnail_url: ex?.thumbnail_url ?? '',
            equipment_type: ex?.equipment_type ?? undefined,
            target_muscle: ex?.target_muscle ?? undefined,
            movement_type: ex?.movement_type === 'time' ? 'time' : 'reps',
            repsRaw: repsValue,
            rest: 30,
            equipmentTag: ex?.equipment_type ?? undefined,
          };
        })
        .filter((item) => item.exercise_id && item.name);

      const generatedWorkoutId = String(latestWorkout?.generated_workout_id ?? latestWorkoutRel?.id ?? '');
      const canReplayLatest = Boolean(latestWorkout && generatedWorkoutId && replayExercises.length > 0);
      setLastWorkoutReplay(
        canReplayLatest
          ? {
              workoutTitle: latestWorkoutTitle || 'Workout',
              milesReward: latestWorkoutMiles,
              generatedWorkoutId,
              workoutStyle: String(latestWorkoutRel?.workout_style ?? 'strength'),
              difficultyLevel: 'medium',
              exercises: replayExercises,
            }
          : null
      );

      const weekAgoIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const [{ count: weeklyCompletedCount, error: weeklyCompletedError }, { data: weeklyMilesRows, error: weeklyMilesError }] =
        await Promise.all([
          supabase
            .from('workout_sessions')
            .select('id', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('status', 'completed')
            .gte('completed_at', weekAgoIso),
          supabase
            .from('iron_miles_log')
            .select('miles_amount, created_at')
            .eq('user_id', userId)
            .gte('created_at', weekAgoIso),
        ]);
      if (weeklyCompletedError) {
        console.log('[Dashboard] weekly completed count error:', weeklyCompletedError);
      }
      if (weeklyMilesError) {
        console.log('[Dashboard] weekly miles error:', weeklyMilesError);
      }

      const milesThisWeek = (weeklyMilesRows || []).reduce(
        (sum, row) => sum + Number(row.miles_amount || 0),
        0
      );
      const completedWorkoutsThisWeek = weeklyCompletedCount || 0;

      const milestone = computeMilestoneProgress(lifetimeMiles);
      const currentMarker = milestone.currentMilestone.miles;
      const nextMarker = milestone.nextMilestone?.miles ?? milestone.currentMilestone.miles;

      setDriverData({
        name: fullName || 'Driver',
        lifetimeMiles: Math.max(0, Math.floor(lifetimeMiles)),
        currentMile: currentMarker,
        targetMile: nextMarker,
        milesEarned: Math.max(0, Math.floor(milesThisWeek)),
        mileMarker: currentMarker,
        nextMileMarker: nextMarker,
        progressPct: milestone.progressPctToCurrentMilestone,
        lastWorkout: latestWorkout
          ? { type: latestWorkoutTitle || 'Workout', miles: latestWorkoutMiles }
          : { type: 'No workouts completed yet', miles: 0 },
        primaryGoal,
        truckType,
        stats: {
          workouts: Math.max(0, completedWorkoutsThisWeek),
          steps: '—',
          calories: milesThisWeek ? Math.max(0, Math.floor(milesThisWeek * 30)) : 0,
        },
      });
    } catch (error) {
      console.log('[Dashboard] failed to load dashboard:', error);
      setDriverData(DEFAULT_DATA);
      setLastWorkoutReplay(null);
    } finally {
      setLoading(false);
    }
  }, [profile?.full_name, user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboard();
    }, [fetchDashboard])
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <BackgroundLayer />
      <ScrollView
        testID="dashboard-scroll"
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Header onMenuPress={() => setMenuOpen(true)} onSettingsPress={() => router.push('/settings')} />
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={C.goldMid} />
            <Text style={styles.loadingText}>Loading dashboard...</Text>
          </View>
        ) : null}
        <LifetimeHeroSection lifetimeMiles={driverData.lifetimeMiles} currentMile={driverData.currentMile} targetMile={driverData.targetMile} headlightsOn={headlightsOn} />
        <WelcomeSection name={profile?.full_name || driverData.name} currentMile={driverData.currentMile} headlightsOn={headlightsOn} onToggle={() => setHeadlightsOn(v => !v)} />
        <GenerateWorkoutCTA onPress={onGenerateWorkoutPress} disabled={generateWorkoutNavPending} active={generateWorkoutNavPending} />
        <CurrentMilesCard
          milesEarned={driverData.milesEarned}
          mileMarker={driverData.mileMarker}
          nextMileMarker={driverData.nextMileMarker}
          progressPct={driverData.progressPct}
        />
        <View style={styles.cardsRow}>
          <LastWorkoutCard
            type={driverData.lastWorkout.type}
            miles={driverData.lastWorkout.miles}
            onPress={onHammerDownPress}
            disabled={!lastWorkoutReplay}
            ctaLabel={lastWorkoutReplay ? 'Hammer Down' : 'Complete a workout first'}
          />
          <QuickStatsCard workouts={driverData.stats.workouts} steps={driverData.stats.steps} calories={driverData.stats.calories} />
        </View>
        <View style={{ height: 16 }} />
      </ScrollView>
      <HamburgerMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
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
    backgroundColor: 'transparent',
  },
  scrollContent: {
    paddingBottom: 8,
    backgroundColor: 'transparent',
  },
  loadingRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: {
    color: C.textSecondary,
    fontSize: 12,
    letterSpacing: 0.5,
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
    backgroundColor: 'transparent',
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
    color: C.offWhite,
    letterSpacing: 5,
    textShadowColor: 'rgba(0,0,0,0.85)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  headerTitleIron: {
    color: '#E8E6DF',
  },
  headerTitleMilesLetter: {
    // Subtle rim so gold/green glyphs stay legible on the dark header (RN allows one shadow per Text)
    textShadowColor: 'rgba(0, 0, 0, 0.62)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: C.goldDark,
    letterSpacing: 1.5,
    marginTop: 3,
    fontStyle: 'italic',
  },

  // ── Gauge glow overlay (headlight mode)
  gaugeGlowWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 0,
  },

  // ── Circular Gauge
  gaugeWrapper: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
    shadowColor: '#C9A24A',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  gaugeOuter: {
    width: GAUGE_OUTER,
    height: GAUGE_OUTER,
    borderRadius: GAUGE_OUTER / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeGoldRing: {
    width: GAUGE_GOLD_RING_SIZE,
    height: GAUGE_GOLD_RING_SIZE,
    borderRadius: GAUGE_GOLD_RING_SIZE / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeInnerFace: {
    width: GAUGE_INNER,
    height: GAUGE_INNER,
    borderRadius: GAUGE_INNER / 2,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeTopLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#C4A86A',
    letterSpacing: 4,
    marginTop: 28,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gaugeIronMilesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginTop: 2,
    marginBottom: 2,
  },
  gaugeLabelDash: {
    width: 16,
    height: 1,
    backgroundColor: C.goldMid,
    opacity: 0.5,
  },
  gaugeIronMilesLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#D4B870',
    letterSpacing: 3,
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  gaugeNumber: {
    fontSize: 52,
    fontWeight: '900',
    color: '#FDFCF9',
    letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginTop: 2,
  },
  gaugeUnit: {
    fontSize: 12,
    fontWeight: '800',
    color: C.goldMid,
    letterSpacing: 6,
    marginTop: 1,
    marginBottom: 10,
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  gaugeRoadImageWrap: {
    width: '80%',
    marginTop: 6,
    borderRadius: 3,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(0,0,0,0.55)',
  },
  gaugeRoadImage: {
    width: '100%',
    height: 36,
  },

  // ── Back face (quote card inside the gauge inner face)
  gaugeBackFace: {
    backgroundColor: '#0A0907',
    paddingHorizontal: 18,
    gap: 8,
  },
  gaugeSignalLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#C4A86A',
    letterSpacing: 3,
    textShadowColor: 'rgba(0,0,0,0.55)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
    marginTop: 10,
  },
  gaugeSignalRule: {
    width: '55%',
    height: 1,
    backgroundColor: 'rgba(212,168,67,0.28)',
    alignSelf: 'center',
  },
  gaugeSignalQuote: {
    fontSize: 13,
    fontWeight: '700',
    color: '#E8E4DC',
    textAlign: 'center',
    lineHeight: 19,
    letterSpacing: 0.2,
    paddingHorizontal: 4,
  },
  gaugeSignalFooter: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7A6340',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 8,
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
  shieldOuterDimmed: {
    borderColor: 'rgba(168,132,58,0.38)',
    opacity: 0.82,
  },
  shieldOuterSmallDimmed: {
    borderColor: 'rgba(168,132,58,0.32)',
  },
  shieldInnerDimmed: {
    borderColor: 'rgba(200,170,100,0.1)',
  },
  shieldLabelDimmed: {
    color: 'rgba(237,231,217,0.68)',
  },
  shieldNumberDimmed: {
    color: 'rgba(255,255,255,0.72)',
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
  welcomeRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headlightToggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1916',
  },

  // ── CTA
  ctaContainer: {
    marginHorizontal: 14,
    marginTop: 16,
    marginBottom: 18,
    alignItems: 'center',
    position: 'relative',
  },
  ctaBackdrop: {
    position: 'absolute',
    top: -6,
    width: SCREEN_WIDTH - 22,
    height: 90,
    borderRadius: 12,
    backgroundColor: 'rgba(8,8,9,0.34)',
  },
  ctaWhiteEdgeGlow: {
    position: 'absolute',
    top: -2,
    width: SCREEN_WIDTH - 24,
    height: 82,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 1,
  },
  ctaGlow: {
    position: 'absolute',
    top: 0,
    width: SCREEN_WIDTH - 28,
    height: 78,
    borderRadius: 10,
    backgroundColor: 'rgba(224,194,124,0.12)',
  },
  ctaIdleGlow: {
    position: 'absolute',
    top: 1,
    width: SCREEN_WIDTH - 28,
    height: 78,
    borderRadius: 10,
    backgroundColor: 'rgba(39,80,59,0.24)',
  },
  ctaEdgeAura: {
    position: 'absolute',
    top: -1,
    width: SCREEN_WIDTH - 26,
    height: 80,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: 'rgba(194,166,101,0.17)',
  },
  ctaOuterBorder: {
    width: SCREEN_WIDTH - 28,
    borderRadius: 8,
    borderWidth: 5,
    borderColor: '#9A7B41',
    overflow: 'hidden',
  },
  ctaOuterBorderActive: {
    borderColor: '#B38E46',
  },
  ctaButton: {
    borderRadius: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(184,155,95,0.12)',
  },
  ctaLeftAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2.5,
    backgroundColor: C.goldDim,
    opacity: 0.65,
  },
  ctaCrossGrain: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    width: '60%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  ctaInnerGreenGlow: {
    position: 'absolute',
    top: 10,
    alignSelf: 'center',
    width: '70%',
    height: '54%',
    borderRadius: 11,
    backgroundColor: 'rgba(60,128,89,0.28)',
  },
  ctaInnerVignetteH: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 5,
  },
  ctaInnerVignetteV: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 5,
  },
  /** Cinematic top-edge ambient bloom only — diffused gold, fades before button center. */
  ctaTopAmbientBloom: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 28,
    zIndex: 2,
    overflow: 'hidden',
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  ctaTopAmbientBloomSheen: {
    position: 'absolute',
    top: 0,
    left: '12%',
    right: '12%',
    height: 10,
  },
  ctaInnerBorder: {
    paddingTop: 16,
    paddingBottom: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(184,155,95,0.07)',
    borderRadius: 4,
    margin: 2,
  },
  ctaInnerBorderActive: {
    borderColor: 'rgba(196,166,102,0.2)',
    backgroundColor: 'rgba(168,129,47,0.06)',
  },
  ctaText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFDF7',
    letterSpacing: 3.5,
    fontStyle: 'italic',
    textShadowColor: 'rgba(0,0,0,0.65)',
    textShadowOffset: { width: 0, height: 1.2 },
    textShadowRadius: 1.8,
  },
  ctaReleaseBrakes: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 1,
    color: 'rgba(207, 175, 106, 0.68)',
  },
  ctaSubtext: {
    fontSize: 13,
    color: C.goldDark,
    marginTop: 10,
    letterSpacing: 0.5,
    fontStyle: 'italic',
  },
  ctaSubtextActive: {
    color: C.gold,
  },

  // ── Cards (shared)
  card: {
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.borderGold,
    borderRadius: 6,
    padding: 16,
    marginHorizontal: 14,
    marginTop: 12,
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
    width: '0%',
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
  milesLast7Days: {
    marginTop: 6,
    fontSize: 10,
    fontWeight: '600',
    color: C.textMuted,
    letterSpacing: 0.4,
    textAlign: 'center',
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
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 4,
  },
  workoutType: {
    flex: 1,
    flexShrink: 1,
    fontSize: 16,
    lineHeight: 20,
    fontWeight: '800',
    color: C.offWhite,
  },
  workoutMiles: {
    fontSize: 13,
    color: C.goldMid,
    fontWeight: '700',
    marginTop: 2,
  },
  lastWorkoutCtaWrap: {
    alignSelf: 'flex-end',
    marginTop: 10,
    paddingVertical: 3,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: 'rgba(184,155,95,0.2)',
    borderRadius: 4,
  },
  lastWorkoutCtaText: {
    fontSize: 13,
    color: C.goldDark,
    letterSpacing: 0.5,
    fontWeight: '800',
  },
  lastWorkoutCtaWrapDisabled: {
    borderColor: 'rgba(184,155,95,0.12)',
    opacity: 0.65,
  },
  lastWorkoutCtaTextDisabled: {
    color: C.textMuted,
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
