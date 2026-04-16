import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

const { width: SW } = Dimensions.get('window');
const TOTAL_STEPS = 4;

// Iron Miles palette (matching dashboard)
const C = {
  bg: '#0C0B09',
  surface: '#13120F',
  surfaceElevated: '#1C1A17',
  borderGold: '#5C4A1A',
  borderSubtle: '#2A2820',
  gold: '#E0C27C',
  goldBright: '#FFD700',
  goldMid: '#D4A843',
  goldDark: '#B89B5F',
  goldDim: '#5C4A1A',
  shieldGreen: '#1F4037',
  shieldGreenLight: '#27503B',
  ctaGreen: '#1A3329',
  ctaGreenMid: '#223D2E',
  white: '#FFFFFF',
  offWhite: '#F0EADD',
  textSec: '#9A9080',
  textMuted: '#6B6355',
  asphalt: '#181715',
};

// ─── Option Data ───────────────────────────────────────────────────────────
type Option = { id: string; label: string; desc: string; icon: string; iconSet?: string };

const TARGET_OPTIONS: Option[] = [
  { id: 'full-body', label: 'Full Body', desc: 'Complete head-to-toe workout', icon: 'human' },
  { id: 'upper-body', label: 'Upper Body', desc: 'Arms, chest, shoulders, back', icon: 'arm-flex' },
  { id: 'lower-body', label: 'Lower Body', desc: 'Legs, glutes, calves', icon: 'human-handsdown' },
  { id: 'core', label: 'Core', desc: 'Abs, obliques, lower back', icon: 'shield-outline' },
  { id: 'mobility', label: 'Mobility', desc: 'Joint mobility and flexibility', icon: 'yoga' },
  { id: 'back-relief', label: 'Back Relief', desc: 'Stretch and decompress', icon: 'meditation' },
];

const EQUIPMENT_OPTIONS: Option[] = [
  { id: 'bodyweight', label: 'Bodyweight', desc: 'No equipment needed', icon: 'human' },
  { id: 'bands', label: 'Resistance Bands', desc: 'Portable and versatile', icon: 'resistor' },
  { id: 'dumbbells', label: 'Dumbbells', desc: 'Free weights on hand', icon: 'dumbbell' },
];

const TIME_OPTIONS: Option[] = [
  { id: '5', label: '5 min', desc: 'Quick burst', icon: 'timer-sand' },
  { id: '10', label: '10 min', desc: 'Rest stop special', icon: 'clock-fast' },
  { id: '20', label: '20 min', desc: 'Solid session', icon: 'clock-outline' },
  { id: '30', label: '30+ min', desc: 'Full send', icon: 'clock-check-outline' },
];

const STYLE_OPTIONS: Option[] = [
  { id: 'strength', label: 'Strength', desc: 'Build raw power', icon: 'weight-lifter' },
  { id: 'burn', label: 'Burn', desc: 'Torch calories fast', icon: 'fire' },
  { id: 'mobility', label: 'Mobility', desc: 'Move better, feel better', icon: 'yoga' },
  { id: 'recovery', label: 'Recovery', desc: 'Recover from the road', icon: 'bed-outline' },
  { id: 'quick-reset', label: 'Quick Reset', desc: 'Fast mind-body reset', icon: 'lightning-bolt' },
];

const SAMPLE_WORKOUT = {
  title: 'CAB UPPER BODY STRENGTH',
  time: '10 min',
  miles: 10,
  exercises: [
    { name: 'Seated Band Rows', sets: '3', reps: '12 reps', icon: 'rowing' },
    { name: 'Incline Push-Ups', sets: '3', reps: '10 reps', icon: 'arm-flex' },
    { name: 'Seated Shoulder Press', sets: '3', reps: '10 reps', icon: 'weight-lifter' },
    { name: 'Band Pull-Aparts', sets: '3', reps: '15 reps', icon: 'resistor' },
    { name: 'Steering Wheel Holds', sets: '3', reps: '20 sec', icon: 'timer-sand' },
  ],
};

// ─── Icon renderer ─────────────────────────────────────────────────────────
function OptionIcon({ name, color, size }: { name: string; color: string; size: number }) {
  return <MaterialCommunityIcons name={name as any} size={size} color={color} />;
}

// ─── Progress Bar ──────────────────────────────────────────────────────────
function StepProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <View style={s.progressWrap}>
      <View style={s.progressTrack}>
        {Array.from({ length: total }).map((_, i) => (
          <View
            key={i}
            style={[
              s.progressSegment,
              i < current && s.progressSegmentFilled,
              i === 0 && { borderTopLeftRadius: 3, borderBottomLeftRadius: 3 },
              i === total - 1 && { borderTopRightRadius: 3, borderBottomRightRadius: 3 },
            ]}
          />
        ))}
      </View>
      <Text style={s.progressLabel}>{current} / {total}</Text>
    </View>
  );
}

// ─── Selection Card ────────────────────────────────────────────────────────
function SelectionCard({
  option,
  selected,
  onPress,
  testID,
}: {
  option: Option;
  selected: boolean;
  onPress: () => void;
  testID: string;
}) {
  return (
    <TouchableOpacity
      testID={testID}
      onPress={onPress}
      activeOpacity={0.75}
      style={[s.selCard, selected && s.selCardActive]}
    >
      <View style={[s.selIconWrap, selected && s.selIconWrapActive]}>
        <OptionIcon name={option.icon} size={24} color={selected ? C.goldBright : C.textMuted} />
      </View>
      <View style={s.selTextWrap}>
        <Text style={[s.selLabel, selected && s.selLabelActive]}>{option.label}</Text>
        <Text style={s.selDesc}>{option.desc}</Text>
      </View>
      {selected && (
        <View style={s.selCheck}>
          <MaterialIcons name="check" size={16} color={C.bg} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Nav Buttons ───────────────────────────────────────────────────────────
function NavButtons({
  onBack,
  onNext,
  nextDisabled,
  nextLabel = 'NEXT',
  showBack = true,
}: {
  onBack: () => void;
  onNext: () => void;
  nextDisabled: boolean;
  nextLabel?: string;
  showBack?: boolean;
}) {
  return (
    <View style={s.navRow}>
      {showBack ? (
        <TouchableOpacity testID="nav-back" onPress={onBack} style={s.navBackBtn} activeOpacity={0.7}>
          <MaterialIcons name="arrow-back" size={20} color={C.goldDark} />
          <Text style={s.navBackText}>BACK</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ flex: 1 }} />
      )}
      <TouchableOpacity
        testID="nav-next"
        onPress={onNext}
        disabled={nextDisabled}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={nextDisabled ? [C.asphalt, C.asphalt] : [C.shieldGreenLight, C.ctaGreen]}
          style={[s.navNextBtn, nextDisabled && s.navNextBtnDisabled]}
        >
          <Text style={[s.navNextText, nextDisabled && s.navNextTextDisabled]}>{nextLabel}</Text>
          {nextLabel === 'NEXT' && (
            <MaterialIcons name="arrow-forward" size={18} color={nextDisabled ? C.textMuted : C.white} />
          )}
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ─── Step Header ───────────────────────────────────────────────────────────
function StepHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={s.stepHeader}>
      <Text style={s.stepTitle}>{title}</Text>
      {subtitle && <Text style={s.stepSubtitle}>{subtitle}</Text>}
      <View style={s.stepDivider}>
        <View style={s.stepDividerLine} />
        <View style={s.stepDividerDot} />
        <View style={s.stepDividerLine} />
      </View>
    </View>
  );
}

// ─── Step 1: Target Area ───────────────────────────────────────────────────
function Step1({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: string | null;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <StepHeader title="What do you want to target?" subtitle="Pick your focus for this stop" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.stepContent}>
        {TARGET_OPTIONS.map((opt) => (
          <SelectionCard
            key={opt.id}
            testID={`target-${opt.id}`}
            option={opt}
            selected={value === opt.id}
            onPress={() => onChange(opt.id)}
          />
        ))}
        <View style={{ height: 80 }} />
      </ScrollView>
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!value} showBack={true} />
    </>
  );
}

// ─── Step 2: Equipment ─────────────────────────────────────────────────────
function Step2({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  const toggle = (id: string) => {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  };
  return (
    <>
      <StepHeader title="What equipment do you have?" subtitle="Select all that apply" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.stepContent}>
        {EQUIPMENT_OPTIONS.map((opt) => (
          <SelectionCard
            key={opt.id}
            testID={`equip-${opt.id}`}
            option={opt}
            selected={value.includes(opt.id)}
            onPress={() => toggle(opt.id)}
          />
        ))}
        <View style={{ height: 80 }} />
      </ScrollView>
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={value.length === 0} />
    </>
  );
}

// ─── Step 3: Time Available ────────────────────────────────────────────────
function Step3({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: string | null;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <StepHeader title="How much time do you have?" subtitle="We'll fit the workout to your window" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.stepContent}>
        <View style={s.timeGrid}>
          {TIME_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt.id}
              testID={`time-${opt.id}`}
              onPress={() => onChange(opt.id)}
              activeOpacity={0.75}
              style={[s.timeCard, value === opt.id && s.timeCardActive]}
            >
              <OptionIcon name={opt.icon} size={28} color={value === opt.id ? C.goldBright : C.textMuted} />
              <Text style={[s.timeLabel, value === opt.id && s.timeLabelActive]}>{opt.label}</Text>
              <Text style={s.timeDesc}>{opt.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <View style={{ height: 80 }} />
      </ScrollView>
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!value} />
    </>
  );
}

// ─── Step 4: Workout Style ─────────────────────────────────────────────────
function Step4({
  value,
  onChange,
  onNext,
  onBack,
}: {
  value: string | null;
  onChange: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}) {
  return (
    <>
      <StepHeader title="What kind of workout?" subtitle="Match the energy of your stop" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.stepContent}>
        {STYLE_OPTIONS.map((opt) => (
          <SelectionCard
            key={opt.id}
            testID={`style-${opt.id}`}
            option={opt}
            selected={value === opt.id}
            onPress={() => onChange(opt.id)}
          />
        ))}
        <View style={{ height: 80 }} />
      </ScrollView>
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!value} nextLabel="GENERATE" />
    </>
  );
}

// ─── Step 5: Loading / Generating ──────────────────────────────────────────
function Step5({ onComplete }: { onComplete: () => void }) {
  const pulse = useRef(new Animated.Value(0.4)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Pulsing icon
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();

    // Progress bar fills up
    Animated.timing(progress, { toValue: 1, duration: 2400, useNativeDriver: false }).start();

    // Auto-advance after delay
    const timer = setTimeout(onComplete, 2800);
    return () => clearTimeout(timer);
  }, []);

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={s.loadingWrap}>
      <Animated.View style={[s.loadingIconWrap, { opacity: pulse }]}>
        <MaterialCommunityIcons name="dumbbell" size={56} color={C.goldBright} />
      </Animated.View>

      <Text style={s.loadingTitle}>BUILDING YOUR WORKOUT</Text>

      <View style={s.loadingProgressTrack}>
        <Animated.View style={[s.loadingProgressFill, { width: progressWidth }]}>
          <LinearGradient
            colors={[C.goldDim, C.goldMid, C.goldBright]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ flex: 1, borderRadius: 4 }}
          />
        </Animated.View>
      </View>

      <Text style={s.loadingSubtext}>Matching your target, equipment, and stop time</Text>
      <Text style={s.loadingSubtext2}>Building your Iron Miles session...</Text>
    </View>
  );
}

// ─── Step 6: Workout Result ────────────────────────────────────────────────
function Step6({ onBack, onStartWorkout }: { onBack: () => void; onStartWorkout: () => void }) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.resultContent}>
      {/* Result Header */}
      <View style={s.resultHeader}>
        <View style={s.resultBadge}>
          <MaterialCommunityIcons name="check-circle" size={20} color={C.goldBright} />
          <Text style={s.resultBadgeText}>WORKOUT READY</Text>
        </View>
        <Text style={s.resultTitle}>{SAMPLE_WORKOUT.title}</Text>
        <View style={s.resultMetaRow}>
          <View style={s.resultMeta}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={C.goldMid} />
            <Text style={s.resultMetaValue}>{SAMPLE_WORKOUT.time}</Text>
          </View>
          <View style={s.resultMetaDivider} />
          <View style={s.resultMeta}>
            <LinearGradient
              colors={[C.shieldGreenLight, C.shieldGreen]}
              style={s.resultMilesShield}
            >
              <Text style={s.resultMilesText}>+{SAMPLE_WORKOUT.miles}</Text>
            </LinearGradient>
            <Text style={s.resultMetaValue}>Iron Miles</Text>
          </View>
        </View>
      </View>

      {/* Divider with road dashes */}
      <View style={s.resultDivider}>
        <View style={s.resultDividerDash} />
        <View style={s.resultDividerDash} />
        <View style={s.resultDividerDash} />
        <View style={s.resultDividerDash} />
        <View style={s.resultDividerDash} />
        <View style={s.resultDividerDash} />
        <View style={s.resultDividerDash} />
      </View>

      {/* Exercises */}
      <Text style={s.resultSectionLabel}>EXERCISES</Text>
      {SAMPLE_WORKOUT.exercises.map((ex, i) => (
        <View key={i} style={s.exerciseCard} testID={`exercise-${i}`}>
          <View style={s.exerciseNumWrap}>
            <Text style={s.exerciseNum}>{i + 1}</Text>
          </View>
          <View style={s.exerciseIconWrap}>
            <OptionIcon name={ex.icon} size={20} color={C.goldMid} />
          </View>
          <View style={s.exerciseInfo}>
            <Text style={s.exerciseName}>{ex.name}</Text>
            <Text style={s.exerciseDetail}>{ex.sets} x {ex.reps}</Text>
          </View>
        </View>
      ))}

      {/* Action Buttons */}
      <View style={{ marginTop: 24 }}>
        <TouchableOpacity testID="start-workout-btn" onPress={onStartWorkout} activeOpacity={0.85}>
          <LinearGradient
            colors={[C.shieldGreenLight, C.ctaGreenMid, C.ctaGreen]}
            style={s.startBtn}
          >
            <View style={s.startBtnInner}>
              <MaterialCommunityIcons name="play" size={22} color={C.white} />
              <Text style={s.startBtnText}>START WORKOUT</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity testID="generate-again-btn" onPress={onBack} style={s.secondaryBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="refresh" size={18} color={C.goldDark} />
          <Text style={s.secondaryBtnText}>GENERATE AGAIN</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function GenerateWorkoutScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [target, setTarget] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [time, setTime] = useState<string | null>(null);
  const [style, setStyle] = useState<string | null>(null);

  const goBack = () => {
    if (step === 1) {
      router.back();
    } else {
      setStep(step - 1);
    }
  };

  const resetFlow = () => {
    setStep(1);
    setTarget(null);
    setEquipment([]);
    setTime(null);
    setStyle(null);
  };

  const isQuestionStep = step >= 1 && step <= 4;

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Top bar */}
      <View style={s.topBar}>
        <View style={s.topBarGoldLine} />
        <View style={s.topBarContent}>
          <TouchableOpacity
            testID="back-button"
            onPress={step === 6 ? resetFlow : goBack}
            style={s.topBarBtn}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={step === 6 ? 'close' : 'arrow-back'}
              size={22}
              color={C.goldMid}
            />
          </TouchableOpacity>
          <Text style={s.topBarTitle}>
            {step === 5 ? 'GENERATING' : step === 6 ? 'YOUR WORKOUT' : 'GENERATE WORKOUT'}
          </Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={[s.topBarGoldLine, { opacity: 0.25 }]} />
      </View>

      {/* Step progress (only for question steps) */}
      {isQuestionStep && <StepProgressBar current={step} total={TOTAL_STEPS} />}

      {/* Step content */}
      <View style={s.body}>
        {step === 1 && (
          <Step1 value={target} onChange={setTarget} onNext={() => setStep(2)} onBack={goBack} />
        )}
        {step === 2 && (
          <Step2 value={equipment} onChange={setEquipment} onNext={() => setStep(3)} onBack={goBack} />
        )}
        {step === 3 && (
          <Step3 value={time} onChange={setTime} onNext={() => setStep(4)} onBack={goBack} />
        )}
        {step === 4 && (
          <Step4 value={style} onChange={setStyle} onNext={() => setStep(5)} onBack={goBack} />
        )}
        {step === 5 && <Step5 onComplete={() => setStep(6)} />}
        {step === 6 && <Step6 onBack={resetFlow} onStartWorkout={() => router.back()} />}
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // ── Top Bar
  topBar: {},
  topBarGoldLine: { height: 1, backgroundColor: C.goldDim, opacity: 0.5 },
  topBarContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  topBarBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontSize: 14, fontWeight: '800', color: C.gold, letterSpacing: 2 },

  // ── Progress
  progressWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  progressTrack: { flex: 1, flexDirection: 'row', height: 6, gap: 3 },
  progressSegment: {
    flex: 1,
    backgroundColor: C.surfaceElevated,
    borderWidth: 1,
    borderColor: C.borderSubtle,
  },
  progressSegmentFilled: {
    backgroundColor: C.goldMid,
    borderColor: C.goldDim,
  },
  progressLabel: { fontSize: 11, fontWeight: '700', color: C.textMuted, letterSpacing: 1 },

  // ── Body
  body: { flex: 1 },

  // ── Step Header
  stepHeader: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4 },
  stepTitle: { fontSize: 20, fontWeight: '900', color: C.white, letterSpacing: 1, textAlign: 'center' },
  stepSubtitle: { fontSize: 13, color: C.textSec, marginTop: 4, textAlign: 'center' },
  stepDivider: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  stepDividerLine: { width: 24, height: 1, backgroundColor: C.goldDim, opacity: 0.5 },
  stepDividerDot: {
    width: 5,
    height: 5,
    backgroundColor: C.goldMid,
    transform: [{ rotate: '45deg' }],
    opacity: 0.5,
  },

  // ── Step Content
  stepContent: { paddingHorizontal: 16, paddingTop: 12 },

  // ── Selection Card
  selCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.borderSubtle,
    borderRadius: 6,
    padding: 14,
    marginBottom: 10,
  },
  selCardActive: {
    borderColor: C.goldMid,
    backgroundColor: '#15130D',
  },
  selIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.surfaceElevated,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  selIconWrapActive: {
    borderColor: C.goldDim,
    backgroundColor: '#1A1508',
  },
  selTextWrap: { flex: 1 },
  selLabel: { fontSize: 15, fontWeight: '800', color: C.offWhite, letterSpacing: 0.5 },
  selLabelActive: { color: C.gold },
  selDesc: { fontSize: 11, color: C.textMuted, marginTop: 1 },
  selCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.goldMid,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Time Grid
  timeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  timeCard: {
    width: (SW - 42) / 2,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.borderSubtle,
    borderRadius: 6,
    padding: 18,
    alignItems: 'center',
    gap: 6,
  },
  timeCardActive: {
    borderColor: C.goldMid,
    backgroundColor: '#15130D',
  },
  timeLabel: { fontSize: 20, fontWeight: '900', color: C.offWhite, letterSpacing: 1 },
  timeLabelActive: { color: C.goldBright },
  timeDesc: { fontSize: 11, color: C.textMuted },

  // ── Nav Buttons
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.borderSubtle,
    backgroundColor: C.bg,
  },
  navBackBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 10, paddingRight: 16 },
  navBackText: { fontSize: 13, fontWeight: '700', color: C.goldDark, letterSpacing: 1 },
  navNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: C.goldDim,
    gap: 6,
  },
  navNextBtnDisabled: { borderColor: C.borderSubtle },
  navNextText: { fontSize: 14, fontWeight: '900', color: C.white, letterSpacing: 2 },
  navNextTextDisabled: { color: C.textMuted },

  // ── Loading
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  loadingIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: C.gold,
    letterSpacing: 3,
    marginBottom: 20,
  },
  loadingProgressTrack: {
    width: '80%',
    height: 8,
    backgroundColor: C.surfaceElevated,
    borderRadius: 4,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.borderGold,
    marginBottom: 24,
  },
  loadingProgressFill: { height: '100%', borderRadius: 4 },
  loadingSubtext: { fontSize: 13, color: C.textSec, textAlign: 'center', marginBottom: 6 },
  loadingSubtext2: { fontSize: 12, color: C.textMuted, textAlign: 'center', fontStyle: 'italic' },

  // ── Result
  resultContent: { paddingHorizontal: 16, paddingTop: 16 },
  resultHeader: { alignItems: 'center', marginBottom: 16 },
  resultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#15130D',
    borderWidth: 1,
    borderColor: C.goldDim,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 12,
  },
  resultBadgeText: { fontSize: 10, fontWeight: '800', color: C.gold, letterSpacing: 2 },
  resultTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: C.white,
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 12,
  },
  resultMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  resultMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resultMetaValue: { fontSize: 14, fontWeight: '700', color: C.offWhite },
  resultMetaDivider: { width: 1, height: 18, backgroundColor: C.borderGold },
  resultMilesShield: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 3,
  },
  resultMilesText: { fontSize: 13, fontWeight: '900', color: C.white, letterSpacing: 0.5 },

  // ── Result Divider
  resultDivider: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  resultDividerDash: { width: 18, height: 2, backgroundColor: C.goldMid, opacity: 0.25, borderRadius: 1 },

  // ── Exercise List
  resultSectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: C.gold,
    letterSpacing: 3,
    marginBottom: 12,
  },
  exerciseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    borderRadius: 6,
    padding: 12,
    marginBottom: 8,
  },
  exerciseNumWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  exerciseNum: { fontSize: 12, fontWeight: '900', color: C.goldMid },
  exerciseIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  exerciseInfo: { flex: 1 },
  exerciseName: { fontSize: 14, fontWeight: '800', color: C.offWhite },
  exerciseDetail: { fontSize: 12, color: C.textSec, marginTop: 1 },

  // ── Action Buttons
  startBtn: {
    borderRadius: 8,
    borderWidth: 2,
    borderColor: C.goldMid,
    overflow: 'hidden',
  },
  startBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  startBtnText: {
    fontSize: 18,
    fontWeight: '900',
    color: C.white,
    letterSpacing: 3,
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 12,
    gap: 8,
  },
  secondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: C.goldDark,
    letterSpacing: 1.5,
  },
});
