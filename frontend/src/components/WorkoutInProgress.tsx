import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  BackHandler,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

// ─── Types ────────────────────────────────────────────────────────────────────

export type WorkoutExerciseItem = {
  exercise_id?: string;
  name: string;
  sets: number;
  reps: number;
  sets_assigned?: number | string;
  reps_assigned?: number | string;
  instruction_text?: string;
  video_url?: string;
  thumbnail_url?: string;
  equipment_type?: string;
  target_muscle?: string;
  movement_type?: 'reps' | 'time';
  repsRaw?: string;
  rest: number; // seconds
  equipmentTag?: string;
};

export type WorkoutInProgressProps = {
  exercises: WorkoutExerciseItem[];
  workoutTitle: string;
  onComplete: () => void;
  onExit: () => void;
  onViewDetails?: (exercise: WorkoutExerciseItem, index: number, total: number) => void;
};

// ─── Palette ─────────────────────────────────────────────────────────────────

const C = {
  bg: '#0C0B09',
  surface: '#13120F',
  surfaceEl: '#1C1A17',
  borderSubtle: '#2A2820',
  borderGold: '#5C4A1A',
  gold: '#E0C27C',
  goldBright: '#FFD700',
  goldMid: '#D4A843',
  goldDark: '#B89B5F',
  goldDim: '#5C4A1A',
  white: '#FFFFFF',
  offWhite: '#F0EADD',
  textSec: '#9A9080',
  textMuted: '#6B6355',
};

// ─── Micro feedback messages ──────────────────────────────────────────────────

const REP_FEEDBACK = ['10-4.', 'Clean rep.', 'Keep rolling.'];
const SET_FEEDBACK = ["That's a clean set."];
const REST_FEEDBACK = 'Hold up… breathe.';

type Phase = 'active' | 'resting' | 'transitioning';

function inferMovementType(rawReps: unknown): 'reps' | 'time' {
  const raw = String(rawReps ?? '').trim().toLowerCase();
  if (!raw) return 'reps';
  if (/(sec|secs|second|seconds|hold|min|mins|minute|minutes)/.test(raw)) return 'time';
  // Fallback heuristic for numeric durations like "30"
  if (/^\d+$/.test(raw) && Number(raw) >= 20) return 'time';
  return 'reps';
}

// ─── WorkoutInProgress ───────────────────────────────────────────────────────

export default function WorkoutInProgress({
  exercises,
  workoutTitle,
  onComplete,
  onExit,
  onViewDetails,
}: WorkoutInProgressProps) {
  const insets = useSafeAreaInsets();

  const [exerciseIndex, setExerciseIndex] = useState(0);
  const [currentSet, setCurrentSet] = useState(1);
  const [phase, setPhase] = useState<Phase>('active');
  const [restSecondsLeft, setRestSecondsLeft] = useState(0);
  const [exitPromptVisible, setExitPromptVisible] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const feedbackIndexRef = useRef(0);

  const current = exercises[exerciseIndex];
  const totalExercises = exercises.length;
  const lastSet = currentSet >= current.sets;
  const lastExercise = exerciseIndex >= totalExercises - 1;

  // ─── Cleanup timers on unmount ──────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
      if (restTimer.current) clearInterval(restTimer.current);
    };
  }, []);

  // ─── Android hardware back ──────────────────────────────────────────────────
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setExitPromptVisible(true);
      return true;
    });
    return () => sub.remove();
  }, []);

  // ─── Rest timer ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== 'resting') {
      if (restTimer.current) clearInterval(restTimer.current);
      return;
    }
    restTimer.current = setInterval(() => {
      setRestSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(restTimer.current!);
          startNextSetFromRest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (restTimer.current) clearInterval(restTimer.current);
    };
  }, [phase]);

  // ─── Feedback helper ────────────────────────────────────────────────────────
  const showFeedback = useCallback((msg: string) => {
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    setFeedback(msg);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 1800);
  }, []);

  // ─── LOG SET ────────────────────────────────────────────────────────────────
  const handleLogSet = () => {
    showFeedback(SET_FEEDBACK[0]);
    if (!lastSet) {
      // more sets — go to rest
      const restSecs = current.rest > 0 ? current.rest : 30;
      setRestSecondsLeft(restSecs);
      setPhase('resting');
    } else if (!lastExercise) {
      // last set of this exercise, but more exercises remain
      setPhase('transitioning');
    } else {
      // last set of last exercise — workout done
      onComplete();
    }
  };

  // ─── Start next set from REST phase ─────────────────────────────────────────
  const startNextSetFromRest = useCallback(() => {
    if (restTimer.current) clearInterval(restTimer.current);
    setCurrentSet((s) => s + 1);
    setPhase('active');
  }, []);

  // ─── Skip rest ───────────────────────────────────────────────────────────────
  const handleSkipRest = () => {
    if (restTimer.current) clearInterval(restTimer.current);
    startNextSetFromRest();
  };

  // ─── Start next exercise from TRANSITIONING phase ────────────────────────────
  const handleStartNextExercise = () => {
    setExerciseIndex((i) => i + 1);
    setCurrentSet(1);
    setPhase('active');
  };

  // ─── Exit handling ───────────────────────────────────────────────────────────
  const handleBackPress = () => setExitPromptVisible(true);
  const handleResume = () => setExitPromptVisible(false);
  const handleEndWorkout = () => {
    setExitPromptVisible(false);
    onExit();
  };

  // ─── Derived display ─────────────────────────────────────────────────────────
  const nextExercise = !lastExercise ? exercises[exerciseIndex + 1] : null;
  const movementType = current.movement_type ?? inferMovementType(current.repsRaw ?? current.reps);
  const unitLabel = movementType === 'time' ? 'SECONDS' : 'REPS';

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      {/* Top bar */}
      <View style={s.topBar}>
        <TouchableOpacity onPress={handleBackPress} style={s.backBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={30} color={C.white} />
        </TouchableOpacity>
        <Text style={s.stopLabel}>
          STOP {exerciseIndex + 1} OF {totalExercises}
        </Text>
        <View style={s.topBarRight} />
      </View>

      {/* Progress dots */}
      <View style={s.dotsRow}>
        {exercises.map((_, i) => (
          <View
            key={i}
            style={[
              s.dot,
              i === exerciseIndex && s.dotActive,
              i < exerciseIndex && s.dotDone,
            ]}
          />
        ))}
      </View>

      {/* ── ACTIVE phase ─────────────────────────────────────────────────────── */}
      {phase === 'active' && (
        <View style={[s.centerArea, { paddingBottom: insets.bottom + 120 }]}>
          {onViewDetails ? (
            <View style={s.detailsRow}>
              <TouchableOpacity
                onPress={() => onViewDetails(current, exerciseIndex, totalExercises)}
                activeOpacity={0.7}
                style={s.detailsBtn}
              >
                <Text style={s.detailsBtnText}>View Details</Text>
              </TouchableOpacity>
            </View>
          ) : null}
          <Text style={s.exerciseName}>{current.name}</Text>
          <Text style={s.setLabel}>
            SET {currentSet} / {current.sets}
          </Text>
          <View style={s.repBlock}>
            <Text style={s.repNumber}>{current.reps}</Text>
            <Text style={s.repDivider}>/</Text>
            <Text style={s.repTotal}>{current.reps}</Text>
          </View>
          <Text style={s.repUnit}>{unitLabel}</Text>
          <Text style={s.feedbackText}>{feedback ?? ' '}</Text>
        </View>
      )}

      {/* ── REST STOP phase ──────────────────────────────────────────────────── */}
      {phase === 'resting' && (
        <View style={[s.centerArea, { paddingBottom: insets.bottom + 120 }]}>
          <Text style={s.phaseHeading}>REST STOP</Text>
          <Text style={s.restTimer}>{restSecondsLeft}</Text>
          <Text style={s.restSubtext}>{REST_FEEDBACK}</Text>
        </View>
      )}

      {/* ── NEXT STOP / TRANSITIONING phase ─────────────────────────────────── */}
      {phase === 'transitioning' && (
        <View style={[s.centerArea, { paddingBottom: insets.bottom + 120 }]}>
          <Text style={s.phaseHeading}>NEXT STOP</Text>
          {nextExercise && (
            <Text style={s.exerciseName}>{nextExercise.name}</Text>
          )}
        </View>
      )}

      {/* ── Bottom action bar ─────────────────────────────────────────────────── */}
      <View style={[s.actionBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        {phase === 'active' && (
          <TouchableOpacity style={s.primaryBtn} onPress={handleLogSet} activeOpacity={0.85}>
            <Text style={s.primaryBtnText}>LOG SET</Text>
          </TouchableOpacity>
        )}

        {phase === 'resting' && (
          <View style={s.twoButtonRow}>
            <TouchableOpacity style={s.outlineBtn} onPress={handleSkipRest} activeOpacity={0.8}>
              <Text style={s.outlineBtnText}>Skip Rest</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.solidBtn} onPress={startNextSetFromRest} activeOpacity={0.8}>
              <Text style={s.solidBtnText}>Start Next Set</Text>
            </TouchableOpacity>
          </View>
        )}

        {phase === 'transitioning' && (
          <TouchableOpacity style={s.primaryBtn} onPress={handleStartNextExercise} activeOpacity={0.85}>
            <Text style={s.primaryBtnText}>START</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Exit confirmation modal ───────────────────────────────────────────── */}
      <Modal
        visible={exitPromptVisible}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={s.modalOverlay}>
          <View style={s.modalCard}>
            <Text style={s.modalTitle}>End your run?</Text>
            <Text style={s.modalSubtext}>
              You are {exerciseIndex + 1} of {totalExercises} stops in.
            </Text>
            <TouchableOpacity style={s.modalResumeBtn} onPress={handleResume} activeOpacity={0.8}>
              <Text style={s.modalResumeBtnText}>Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalEndBtn} onPress={handleEndWorkout} activeOpacity={0.8}>
              <Text style={s.modalEndBtnText}>End Workout</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    minHeight: 52,
  },
  backBtn: { padding: 4 },
  topBarRight: { width: 38 },
  stopLabel: {
    color: C.textSec,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
  },

  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: C.surfaceEl,
    borderWidth: 1,
    borderColor: C.borderSubtle,
  },
  dotActive: {
    backgroundColor: C.goldMid,
    borderColor: C.goldMid,
  },
  dotDone: {
    backgroundColor: C.goldDim,
    borderColor: C.goldDim,
  },

  centerArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 6,
  },
  detailsRow: {
    width: '100%',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  detailsBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  detailsBtnText: {
    color: C.goldDark,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
  },

  exerciseName: {
    color: C.offWhite,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 0.6,
    textAlign: 'center',
    marginBottom: 16,
  },
  setLabel: {
    color: C.textSec,
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 1.5,
  },

  repBlock: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
    marginTop: 4,
  },
  repNumber: {
    color: C.goldBright,
    fontSize: 96,
    fontWeight: '900',
    lineHeight: 100,
  },
  repDivider: {
    color: C.textMuted,
    fontSize: 40,
    fontWeight: '300',
  },
  repTotal: {
    color: C.textSec,
    fontSize: 48,
    fontWeight: '700',
  },
  repUnit: {
    color: C.textMuted,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 3,
    marginTop: 2,
  },

  feedbackText: {
    color: C.goldDark,
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 16,
    minHeight: 22,
  },

  phaseHeading: {
    color: C.gold,
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 4,
    marginBottom: 20,
  },
  restTimer: {
    color: C.goldBright,
    fontSize: 96,
    fontWeight: '900',
    lineHeight: 100,
  },
  restSubtext: {
    color: C.textSec,
    fontSize: 16,
    fontStyle: 'italic',
    marginTop: 12,
  },

  actionBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    backgroundColor: C.bg,
  },

  primaryBtn: {
    width: '100%',
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: C.goldMid,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    color: C.goldBright,
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 2,
  },

  twoButtonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  outlineBtn: {
    flex: 1,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#8A867C',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  outlineBtnText: {
    color: C.offWhite,
    fontSize: 17,
    fontWeight: '700',
  },
  solidBtn: {
    flex: 1,
    height: 58,
    borderRadius: 29,
    backgroundColor: C.goldMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  solidBtnText: {
    color: C.bg,
    fontSize: 17,
    fontWeight: '900',
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#161410',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.borderGold,
    padding: 28,
    alignItems: 'center',
    gap: 12,
  },
  modalTitle: {
    color: C.white,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalSubtext: {
    color: C.textSec,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalResumeBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    backgroundColor: C.goldMid,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalResumeBtnText: {
    color: C.bg,
    fontSize: 17,
    fontWeight: '900',
  },
  modalEndBtn: {
    width: '100%',
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: '#8A867C',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  modalEndBtnText: {
    color: C.offWhite,
    fontSize: 17,
    fontWeight: '700',
  },
});
