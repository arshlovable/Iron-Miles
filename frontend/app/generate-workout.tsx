import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { supabase } from '../src/lib/supabase';
import { useAuth } from '../src/context/AuthContext';

const TOTAL_STEPS = 5;

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
  { id: 'strength', label: 'Build Muscle', desc: 'Build raw power', icon: 'weight-lifter' },
  { id: 'burn', label: 'Cardio/Burn', desc: 'Torch calories fast', icon: 'fire' },
  { id: 'mobility', label: 'Mobility', desc: 'Move better, feel better', icon: 'yoga' },
];

const DIFFICULTY_OPTIONS: Option[] = [
  {
    id: 'easy',
    label: 'Easy',
    desc: 'Light session. Good for low energy days.',
    icon: 'weather-sunset-down',
  },
  {
    id: 'medium',
    label: 'Medium',
    desc: 'Balanced effort. Best default.',
    icon: 'gauge',
  },
  {
    id: 'hard',
    label: 'Hard',
    desc: 'Push harder. More volume and intensity.',
    icon: 'fire',
  },
];

// Workout data type from API
type WorkoutExercise = {
  exercise_id?: string;
  name: string;
  sets: string;
  reps: string;
  sets_assigned?: number | string;
  reps_assigned?: number | string;
  instruction_text?: string;
  video_url?: string;
  thumbnail_url?: string;
  target_muscle?: string;
  movement_type?: 'reps' | 'time';
  icon: string;
  instruction: string;
  order: number;
  equipment_type?: string;
};

type WorkoutData = {
  id: string;
  title: string;
  target_area: string;
  duration_minutes: number;
  workout_style: string | null;
  iron_miles_reward: number;
  status: string;
  exercises: WorkoutExercise[];
};

// Map UI option IDs to API field values
function mapTargetToApi(id: string): string {
  return id.replace(/-/g, '_').replace('back_relief', 'mobility');
}

function inferMovementType(rawReps: unknown): 'reps' | 'time' {
  const raw = String(rawReps ?? '').trim().toLowerCase();
  if (!raw) return 'reps';
  if (/(sec|secs|second|seconds|hold|min|mins|minute|minutes)/.test(raw)) return 'time';
  // Fallback heuristic for numeric durations like "30"
  if (/^\d+$/.test(raw) && Number(raw) >= 20) return 'time';
  return 'reps';
}

// Map exercise name/equipment to an appropriate icon
function pickExerciseIcon(name: string, equipment?: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('push') || lower.includes('press')) return 'arm-flex';
  if (lower.includes('row') || lower.includes('pull')) return 'rowing';
  if (lower.includes('squat') || lower.includes('glute') || lower.includes('lateral')) return 'human-handsdown';
  if (lower.includes('stretch') || lower.includes('rotation') || lower.includes('cat') || lower.includes('cow')) return 'yoga';
  if (lower.includes('dead bug') || lower.includes('core')) return 'shield-outline';
  if (lower.includes('hold') || lower.includes('sec')) return 'timer-sand';
  if (lower.includes('band')) return 'resistor';
  if (equipment === 'dumbbells') return 'dumbbell';
  if (equipment === 'bands') return 'resistor';
  return 'weight-lifter';
}

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
        {TIME_OPTIONS.map((opt) => (
          <SelectionCard
            key={opt.id}
            testID={`time-${opt.id}`}
            option={opt}
            selected={value === opt.id}
            onPress={() => onChange(opt.id)}
          />
        ))}
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
      <NavButtons onBack={onBack} onNext={onNext} nextDisabled={!value} />
    </>
  );
}

// ─── Step 5: Difficulty (final questionnaire step before generate) ─────────
function Step5Difficulty({
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
      <StepHeader title="How hard do you want to go?" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.stepContent}>
        {DIFFICULTY_OPTIONS.map((opt) => (
          <SelectionCard
            key={opt.id}
            testID={`difficulty-${opt.id}`}
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

// ─── Step 6: Loading / Generating ──────────────────────────────────────────
function Step6Generating({ onComplete, onError }: { onComplete: () => void; onError: (msg: string) => void }) {
  const pulse = useRef(new Animated.Value(0.4)).current;
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ])
    ).start();
    Animated.timing(progress, { toValue: 0.85, duration: 2000, useNativeDriver: false }).start();
  }, []);

  // onComplete is called externally by the main component after API resolves
  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={s.loadingWrap}>
      <Animated.View style={[s.loadingIconWrap, { opacity: pulse }]}>
        <MaterialCommunityIcons name="dumbbell" size={56} color={C.goldBright} />
      </Animated.View>
      <Text style={s.loadingTitle}>10-4, DRIVER.</Text>
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
      <Text style={s.loadingSubtext}>Building your workout...</Text>
      <Text style={s.loadingSubtext2}>Matching your route, gear, and goal.</Text>
    </View>
  );
}

// ─── Step 7: Workout Result ────────────────────────────────────────────────
function Step7WorkoutResult({
  workout,
  onBack,
  onStartWorkout,
  onExercisePress,
}: {
  workout: WorkoutData;
  onBack: () => void;
  onStartWorkout: () => void;
  onExercisePress: (exercise: WorkoutExercise, index: number) => void;
}) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.resultContent}>
      <View style={s.resultHeader}>
        <View style={s.resultBadge}>
          <MaterialCommunityIcons name="check-circle" size={20} color={C.goldBright} />
          <Text style={s.resultBadgeText}>WORKOUT READY</Text>
        </View>
        <Text style={s.resultTitle}>{workout.title.toUpperCase()}</Text>
        <View style={s.resultMetaRow}>
          <View style={s.resultMeta}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={C.goldMid} />
            <Text style={s.resultMetaValue}>{workout.duration_minutes} min</Text>
          </View>
          <View style={s.resultMetaDivider} />
          <View style={s.resultMeta}>
            <LinearGradient colors={[C.shieldGreenLight, C.shieldGreen]} style={s.resultMilesShield}>
              <Text style={s.resultMilesText}>+{workout.iron_miles_reward}</Text>
            </LinearGradient>
            <Text style={s.resultMetaValue}>Iron Miles</Text>
          </View>
        </View>
      </View>
      <View style={s.resultDivider}>
        <View style={s.resultDividerDash} /><View style={s.resultDividerDash} /><View style={s.resultDividerDash} /><View style={s.resultDividerDash} /><View style={s.resultDividerDash} /><View style={s.resultDividerDash} /><View style={s.resultDividerDash} />
      </View>
      <Text style={s.resultSectionLabel}>EXERCISES</Text>
      {workout.exercises.length === 0 && (
        <Text style={s.resultEmptyText}>No matching exercises found. Try different filters.</Text>
      )}
      {workout.exercises.map((ex, i) => (
        <TouchableOpacity
          key={i}
          style={s.exerciseCard}
          testID={`exercise-${i}`}
          activeOpacity={0.8}
          onPress={() => onExercisePress(ex, i)}
        >
          <View style={s.exerciseNumWrap}><Text style={s.exerciseNum}>{i + 1}</Text></View>
          <View style={s.exerciseIconWrap}><OptionIcon name={ex.icon} size={20} color={C.goldMid} /></View>
          <View style={s.exerciseInfo}>
            <Text style={s.exerciseName}>{ex.name}</Text>
            <Text style={s.exerciseDetail}>{ex.sets} x {ex.reps}</Text>
          </View>
        </TouchableOpacity>
      ))}
      <View style={{ marginTop: 24 }}>
        <TouchableOpacity testID="start-workout-btn" onPress={onStartWorkout} activeOpacity={0.85}>
          <LinearGradient colors={[C.shieldGreenLight, C.ctaGreenMid, C.ctaGreen]} style={s.startBtn}>
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

// ─── Step 8: Workout In Progress ────────────────────────────────────────────
function Step8WorkoutInProgress({
  workout,
  exerciseIndex,
  onPrev,
  onNext,
  onPause,
}: {
  workout: WorkoutData;
  exerciseIndex: number;
  onPrev: () => void;
  onNext: () => void;
  onPause: () => void;
}) {
  const exercises = workout.exercises;
  const current = exercises[exerciseIndex];
  const total = exercises.length;
  const isFirst = exerciseIndex === 0;
  const isLast = exerciseIndex === total - 1;
  const progressPct = ((exerciseIndex + 1) / total) * 100;

  return (
    <View style={s.ipWrap}>
      <View style={s.ipProgressSection}>
        <Text style={s.ipWorkoutTitle}>{workout.title.toUpperCase()}</Text>
        <View style={s.ipProgressRow}>
          <Text style={s.ipProgressText}>Exercise {exerciseIndex + 1} of {total}</Text>
          <View style={s.ipMilesChip}>
            <MaterialCommunityIcons name="shield-check" size={12} color={C.goldBright} />
            <Text style={s.ipMilesChipText}>+{workout.iron_miles_reward} mi</Text>
          </View>
        </View>
        <View style={s.ipProgressTrack}>
          <View style={[s.ipProgressFill, { width: `${progressPct}%` }]} />
        </View>
      </View>

      {/* Main exercise display */}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.ipMainContent}>
        {/* Exercise icon */}
        <View style={s.ipIconWrap}>
          <OptionIcon name={current.icon} size={40} color={C.goldBright} />
        </View>

        {/* Exercise name */}
        <Text style={s.ipExerciseName}>{current.name}</Text>

        {/* Sets / Reps */}
        <View style={s.ipSetsRepsWrap}>
          <View style={s.ipSetsRepsCard}>
            <Text style={s.ipSetsRepsValue}>{current.sets}</Text>
            <Text style={s.ipSetsRepsLabel}>SETS</Text>
          </View>
          <View style={s.ipSetsRepsDivider} />
          <View style={s.ipSetsRepsCard}>
            <Text style={s.ipSetsRepsValue}>{current.reps}</Text>
            <Text style={s.ipSetsRepsLabel}>TARGET</Text>
          </View>
        </View>

        {/* Instruction */}
        <View style={s.ipInstructionCard}>
          <MaterialCommunityIcons name="information-outline" size={16} color={C.goldDark} />
          <Text style={s.ipInstructionText}>{current.instruction}</Text>
        </View>

        {/* Exercise dots */}
        <View style={s.ipDotsRow}>
          {exercises.map((_, i) => (
            <View
              key={i}
              style={[
                s.ipDot,
                i === exerciseIndex && s.ipDotActive,
                i < exerciseIndex && s.ipDotDone,
              ]}
            />
          ))}
        </View>
      </ScrollView>

      {/* Controls: Previous | Pause | Next */}
      <View style={s.ipControls}>
        <TouchableOpacity
          testID="ip-prev-btn"
          onPress={onPrev}
          disabled={isFirst}
          style={[s.ipControlBtn, isFirst && s.ipControlBtnDisabled]}
          activeOpacity={0.7}
        >
          <MaterialIcons name="skip-previous" size={28} color={isFirst ? C.textMuted : C.offWhite} />
          <Text style={[s.ipControlLabel, isFirst && s.ipControlLabelDisabled]}>PREV</Text>
        </TouchableOpacity>

        <TouchableOpacity
          testID="ip-pause-btn"
          onPress={onPause}
          style={s.ipPauseBtn}
          activeOpacity={0.7}
        >
          <View style={s.ipPauseBtnInner}>
            <MaterialIcons name="pause" size={28} color={C.goldMid} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          testID="ip-next-btn"
          onPress={onNext}
          activeOpacity={0.7}
        >
          <LinearGradient
            colors={isLast ? [C.goldMid, C.goldDark] : [C.shieldGreenLight, C.ctaGreen]}
            style={s.ipNextBtn}
          >
            <Text style={s.ipNextBtnText}>{isLast ? 'FINISH' : 'NEXT'}</Text>
            <MaterialIcons
              name={isLast ? 'check' : 'skip-next'}
              size={24}
              color={C.white}
            />
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Step 9: Workout Complete ───────────────────────────────────────────────
function Step9WorkoutComplete({ workout, onDone }: { workout: WorkoutData; onDone: () => void }) {
  return (
    <View style={s.completeWrap}>
      <View style={s.completeIconOuter}>
        <LinearGradient colors={[C.shieldGreenLight, C.shieldGreen]} style={s.completeIconInner}>
          <MaterialCommunityIcons name="check-bold" size={48} color={C.white} />
        </LinearGradient>
      </View>
      <Text style={s.completeTitle}>WORKOUT COMPLETE</Text>
      <Text style={s.completeSubtitle}>Another mile earned on the road of discipline</Text>
      <View style={s.completeMilesCard}>
        <View style={s.completeMilesRow}>
          <LinearGradient colors={[C.shieldGreenLight, C.shieldGreen]} style={s.completeMilesShield}>
            <Text style={s.completeMilesShieldText}>+{workout.iron_miles_reward}</Text>
          </LinearGradient>
          <View>
            <Text style={s.completeMilesValue}>Iron Miles Earned</Text>
            <Text style={s.completeMilesWorkout}>{workout.title.toUpperCase()}</Text>
          </View>
        </View>
        <View style={s.completeMilesDivider} />
        <View style={s.completeStatsRow}>
          <View style={s.completeStat}>
            <MaterialCommunityIcons name="clock-outline" size={16} color={C.goldMid} />
            <Text style={s.completeStatText}>{workout.duration_minutes} min</Text>
          </View>
          <View style={s.completeStat}>
            <MaterialCommunityIcons name="dumbbell" size={16} color={C.goldMid} />
            <Text style={s.completeStatText}>{workout.exercises.length} exercises</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity testID="back-to-dashboard-btn" onPress={onDone} activeOpacity={0.85}>
        <LinearGradient colors={[C.shieldGreenLight, C.ctaGreenMid, C.ctaGreen]} style={s.completeCta}>
          <View style={s.completeCtaInner}>
            <MaterialCommunityIcons name="home" size={20} color={C.white} />
            <Text style={s.completeCtaText}>BACK TO DASHBOARD</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────
export default function GenerateWorkoutScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [target, setTarget] = useState<string | null>(null);
  const [equipment, setEquipment] = useState<string[]>([]);
  const [time, setTime] = useState<string | null>(null);
  const [style, setStyle] = useState<string | null>(null);
  /** Final questionnaire step; default Medium so user can tap GENERATE immediately. */
  const [difficulty, setDifficulty] = useState<string | null>('medium');
  const [generatedWorkout, setGeneratedWorkout] = useState<WorkoutData | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Call the backend generation function and map the payload for Workout Ready
  const generateWorkout = async () => {
    try {
      setError(null);
      const selectedMuscle = mapTargetToApi(target || 'full_body');
      const selectedEquipment = equipment.length > 0 ? equipment : ['bodyweight'];
      const durationMinutes = parseInt(time || '10', 10);
      const workoutStyle = style || 'strength';
      const difficultyLevel = difficulty === 'easy' || difficulty === 'hard' ? difficulty : 'medium';
      const requestUserId = user?.id;
      if (!requestUserId) {
        throw new Error('Sign in is required to generate a workout.');
      }
      const requestBody = {
        target_area: selectedMuscle,
        equipment_selected: selectedEquipment,
        duration_minutes: durationMinutes,
        workout_style: workoutStyle,
        difficulty: difficultyLevel,
        user_id: requestUserId,
      };

      console.log('generate-workout invoke request', requestBody);

      const { data, error: invokeError } = await supabase.functions.invoke('generate-workout', {
        body: requestBody,
      });

      if (invokeError) {
        console.error('Generate workout function failed:', invokeError);
        throw new Error(invokeError.message || 'Unable to generate workout right now.');
      }

      const generated = data?.generated_workout ?? data;
      const exerciseRows = data?.exercises ?? generated?.exercises ?? [];
      console.log('generate-workout invoke payload shape', {
        hasGeneratedWorkout: !!data?.generated_workout || !!generated,
        exercisesCount: Array.isArray(exerciseRows) ? exerciseRows.length : 0,
        rootKeys: data && typeof data === 'object' ? Object.keys(data) : [],
      });

      if (!generated || typeof generated !== 'object' || !generated.id) {
        console.error('Generate workout returned invalid payload:', data);
        throw new Error('Unable to generate workout right now.');
      }

      if (!Array.isArray(exerciseRows) || exerciseRows.length === 0) {
        setError('No exercises were returned for this workout. Try again in a moment.');
      }

      const normalizedExercises = Array.isArray(exerciseRows) ? [...exerciseRows] : [];
      normalizedExercises.sort((a: any, b: any) => (a.order ?? a.exercise_order ?? 999) - (b.order ?? b.exercise_order ?? 999));

      const enriched: WorkoutExercise[] = normalizedExercises.map((ex: any, index: number) => ({
        exercise_id: ex.exercise_id ?? ex.id,
        name: ex.name,
        sets: String(ex.sets ?? ex.sets_assigned ?? ex.sets_default ?? 3),
        reps: String(ex.reps ?? ex.reps_assigned ?? ex.reps_default ?? 10),
        sets_assigned: ex.sets_assigned ?? ex.sets_default ?? 3,
        reps_assigned: ex.reps_assigned ?? ex.reps_default ?? 10,
        instruction_text: ex.instruction_text,
        video_url: ex.video_url,
        thumbnail_url: ex.thumbnail_url,
        target_muscle: ex.target_muscle,
        movement_type: ex.movement_type ?? inferMovementType(ex.reps ?? ex.reps_assigned ?? ex.reps_default),
        icon: pickExerciseIcon(ex.name, ex.equipment_type),
        instruction: ex.instruction || ex.instruction_text || 'Perform the exercise with controlled form.',
        order: ex.order ?? ex.exercise_order ?? index + 1,
        equipment_type: ex.equipment_type,
      }));

      const workout: WorkoutData = {
        id: generated.id,
        title: generated.title ?? `${selectedMuscle.replace(/_/g, ' ').toUpperCase()} ROUTE`,
        target_area: generated.target_area ?? selectedMuscle,
        duration_minutes: generated.duration_minutes ?? durationMinutes,
        workout_style: generated.workout_style ?? workoutStyle,
        iron_miles_reward: generated.iron_miles_reward ?? durationMinutes,
        status: generated.status ?? 'generated',
        exercises: enriched,
      };

      setGeneratedWorkout(workout);
      setStep(7);
    } catch (e: any) {
      console.error('Workout generation failed:', e);
      const userMessage = e?.message || 'Failed to generate workout';
      setError(userMessage);
      Alert.alert('Unable to Generate Workout', 'Please try again. If this continues, check your connection and settings.');
      setStep(5); // back to difficulty (last questionnaire step)
    }
  };

  // Trigger API call when entering generating step (after difficulty)
  useEffect(() => {
    if (step === 6) {
      generateWorkout();
    }
  }, [step]);

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
    setDifficulty('medium');
    setGeneratedWorkout(null);
    setSessionId(null);
    setError(null);
  };

  const startWorkout = async () => {
    if (!generatedWorkout) return;

    let activeSessionId: string | null = null;
    try {
      const sessionUserId = user?.id;
      const { data: startedSession, error: startError } = await supabase.functions.invoke(
        'start-workout-session',
        {
          body: {
            generated_workout_id: generatedWorkout.id,
            user_id: sessionUserId,
          },
        }
      );

      if (startError) {
        // Recoverable: continue workout using local data even if session row write fails.
        console.warn('start-workout-session invoke failed:', startError);
      } else if (startedSession?.id) {
        activeSessionId = startedSession.id;
        setSessionId(startedSession.id);
      }
    } catch (e) {
      // Recoverable: continue with local exercises so user can still train.
      console.warn('Failed to start session (continuing with local workout):', e);
    }

    // Map API exercise shape → WorkoutExerciseItem (sets/reps are strings from API)
    const mappedExercises = generatedWorkout.exercises.map((ex: any) => ({
      exercise_id: ex.exercise_id ?? '',
      name: ex.name,
      sets: parseInt(ex.sets, 10) || 3,
      reps: parseInt(ex.reps, 10) || 10,
      sets_assigned: ex.sets_assigned ?? ex.sets ?? 3,
      reps_assigned: ex.reps_assigned ?? ex.reps ?? 10,
      instruction_text: ex.instruction_text ?? ex.instruction ?? '',
      video_url: ex.video_url ?? '',
      thumbnail_url: ex.thumbnail_url ?? '',
      equipment_type: ex.equipment_type ?? undefined,
      target_muscle: ex.target_muscle ?? undefined,
      movement_type: ex.movement_type ?? inferMovementType(ex.reps),
      repsRaw: String(ex.reps ?? ''),
      rest: ex.rest_seconds ?? 30,
      equipmentTag: ex.equipment_type ?? undefined,
    }));

    router.push({
      pathname: '/workout-in-progress',
      params: {
        workoutTitle: generatedWorkout.title,
        exercises: JSON.stringify(mappedExercises),
        sessionId: activeSessionId ?? '',
        ironMilesReward: String(generatedWorkout.iron_miles_reward),
        generatedWorkoutId: generatedWorkout.id,
      },
    });
  };

  const openExerciseDetail = (exercise: WorkoutExercise, index: number) => {
    router.push({
      pathname: '/exercise-detail',
      params: {
        exerciseData: JSON.stringify(exercise),
        stepCurrent: String(index + 1),
        stepTotal: String(generatedWorkout?.exercises.length ?? 1),
      },
    });
  };

  const isQuestionStep = step >= 1 && step <= 5;

  const topBarTitle = () => {
    if (step === 6) return 'GENERATING';
    if (step === 7) return 'YOUR WORKOUT';
    return 'GENERATE WORKOUT';
  };

  const topBarBack = () => {
    if (step === 7) return resetFlow;
    return goBack;
  };

  const topBarIcon = (): 'close' | 'arrow-back' => {
    if (step === 7) return 'close';
    return 'arrow-back';
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.topBar}>
        <View style={s.topBarGoldLine} />
        <View style={s.topBarContent}>
          <TouchableOpacity
            testID="back-button"
            onPress={topBarBack()}
            style={s.topBarBtn}
            activeOpacity={0.7}
          >
            <MaterialIcons name={topBarIcon()} size={22} color={C.goldMid} />
          </TouchableOpacity>
          <Text style={s.topBarTitle}>{topBarTitle()}</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={[s.topBarGoldLine, { opacity: 0.25 }]} />
      </View>

      {isQuestionStep && <StepProgressBar current={step} total={TOTAL_STEPS} />}

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
        {step === 5 && (
          <Step5Difficulty
            value={difficulty}
            onChange={setDifficulty}
            onNext={() => setStep(6)}
            onBack={goBack}
          />
        )}
        {step === 6 && <Step6Generating onComplete={() => {}} onError={(msg) => setError(msg)} />}
        {step === 7 && generatedWorkout && (
          <Step7WorkoutResult
            workout={generatedWorkout}
            onBack={resetFlow}
            onStartWorkout={startWorkout}
            onExercisePress={openExerciseDetail}
          />
        )}
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
  timeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  timeCard: {
    flex: 1,
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.borderSubtle,
    borderRadius: 6,
    paddingVertical: 20,
    paddingHorizontal: 12,
    alignItems: 'center',
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
  resultEmptyText: {
    fontSize: 12,
    color: C.textSec,
    marginBottom: 10,
    fontStyle: 'italic',
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

  // ── Step 7: Workout In Progress
  ipWrap: { flex: 1 },
  ipProgressSection: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.borderSubtle,
  },
  ipWorkoutTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: C.goldDark,
    letterSpacing: 2,
    marginBottom: 6,
  },
  ipProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  ipProgressText: {
    fontSize: 14,
    fontWeight: '700',
    color: C.offWhite,
    letterSpacing: 0.5,
  },
  ipMilesChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#15130D',
    borderWidth: 1,
    borderColor: C.goldDim,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  ipMilesChipText: { fontSize: 11, fontWeight: '700', color: C.gold },
  ipProgressTrack: {
    height: 4,
    backgroundColor: C.surfaceElevated,
    borderRadius: 2,
    overflow: 'hidden',
  },
  ipProgressFill: {
    height: '100%',
    backgroundColor: C.goldMid,
    borderRadius: 2,
  },
  ipMainContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 32,
    paddingBottom: 20,
  },
  ipIconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: C.surface,
    borderWidth: 2,
    borderColor: C.goldDim,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  ipExerciseName: {
    fontSize: 24,
    fontWeight: '900',
    color: C.white,
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 20,
  },
  ipSetsRepsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.borderGold,
    borderRadius: 6,
    marginBottom: 20,
    width: '80%',
  },
  ipSetsRepsCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 16,
  },
  ipSetsRepsDivider: {
    width: 1,
    height: '60%',
    backgroundColor: C.borderGold,
  },
  ipSetsRepsValue: {
    fontSize: 22,
    fontWeight: '900',
    color: C.goldBright,
    letterSpacing: 0.5,
  },
  ipSetsRepsLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 2,
    marginTop: 2,
  },
  ipInstructionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    borderRadius: 6,
    padding: 14,
    gap: 10,
    marginBottom: 24,
    width: '100%',
  },
  ipInstructionText: {
    flex: 1,
    fontSize: 13,
    color: C.textSec,
    lineHeight: 20,
  },
  ipDotsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  ipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.surfaceElevated,
    borderWidth: 1,
    borderColor: C.borderSubtle,
  },
  ipDotActive: {
    backgroundColor: C.goldMid,
    borderColor: C.goldMid,
  },
  ipDotDone: {
    backgroundColor: C.goldDim,
    borderColor: C.goldDim,
  },
  ipControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderTopWidth: 1,
    borderTopColor: C.borderSubtle,
    backgroundColor: C.bg,
  },
  ipControlBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 64,
    paddingVertical: 8,
  },
  ipControlBtnDisabled: { opacity: 0.4 },
  ipControlLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: C.offWhite,
    letterSpacing: 1,
    marginTop: 2,
  },
  ipControlLabelDisabled: { color: C.textMuted },
  ipPauseBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: C.borderGold,
    backgroundColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ipPauseBtnInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  ipNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: C.goldDim,
    gap: 6,
  },
  ipNextBtnText: {
    fontSize: 14,
    fontWeight: '900',
    color: C.white,
    letterSpacing: 2,
  },

  // ── Step 8: Workout Complete
  completeWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  completeIconOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    borderWidth: 3,
    borderColor: C.goldMid,
    padding: 3,
    marginBottom: 24,
  },
  completeIconInner: {
    flex: 1,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completeTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: C.white,
    letterSpacing: 3,
    marginBottom: 8,
  },
  completeSubtitle: {
    fontSize: 13,
    color: C.textSec,
    textAlign: 'center',
    marginBottom: 28,
    fontStyle: 'italic',
  },
  completeMilesCard: {
    width: '100%',
    backgroundColor: C.surface,
    borderWidth: 1.5,
    borderColor: C.borderGold,
    borderRadius: 6,
    padding: 18,
    marginBottom: 28,
  },
  completeMilesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 14,
  },
  completeMilesShield: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(224,194,124,0.2)',
  },
  completeMilesShieldText: {
    fontSize: 20,
    fontWeight: '900',
    color: C.white,
  },
  completeMilesValue: {
    fontSize: 14,
    fontWeight: '800',
    color: C.gold,
    letterSpacing: 0.5,
  },
  completeMilesWorkout: {
    fontSize: 11,
    color: C.textMuted,
    marginTop: 2,
    letterSpacing: 0.5,
  },
  completeMilesDivider: {
    height: 1,
    backgroundColor: C.borderGold,
    opacity: 0.5,
    marginBottom: 12,
  },
  completeStatsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  completeStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completeStatText: {
    fontSize: 13,
    fontWeight: '600',
    color: C.textSec,
  },
  completeCta: {
    width: '100%',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: C.goldMid,
    overflow: 'hidden',
  },
  completeCtaInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 10,
  },
  completeCtaText: {
    fontSize: 16,
    fontWeight: '900',
    color: C.white,
    letterSpacing: 3,
  },
});
