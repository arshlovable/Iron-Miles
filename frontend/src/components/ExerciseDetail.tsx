import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type ExerciseInstructions = {
  setup: string[];
  execution: string[];
  progression: string[];
};

export type ExerciseDetailProps = {
  exerciseName: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  equipmentTag: string;
  sets: string | number;
  reps: string | number;
  rest: string | number;
  instructions: ExerciseInstructions;
  stepCurrent: number;
  stepTotal: number;
  optionalToggle?: {
    label: string;
    description?: string;
    value: boolean;
    onValueChange: (next: boolean) => void;
  };
  onBack: () => void;
  onStart: () => void;
  onMarkComplete: () => void;
};

const C = {
  bg: '#0C0B09',
  surface: '#13120F',
  surfaceEl: '#1C1A17',
  borderSubtle: '#2A2820',
  gold: '#E0C27C',
  goldMid: '#D4A843',
  goldDark: '#B89B5F',
  green: '#1F4037',
  textSec: '#9A9080',
  textMuted: '#6B6355',
  white: '#FFFFFF',
  startBg: '#A8A7EE',
  startText: '#FFFFFF',
};

function InstructionSection({ label, items }: { label: string; items: string[] }) {
  if (!items || items.length === 0) return null;

  return (
    <View style={s.instructionSection}>
      <View style={s.sectionHeader}>
        <Text style={s.sectionLabel}>{label}</Text>
        <View style={s.sectionRule} />
      </View>
      {items.map((item, idx) => (
        <View key={`${label}-${idx}`} style={s.bulletRow}>
          <Text style={s.bulletDot}>•</Text>
          <Text style={s.bulletText}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

export default function ExerciseDetail({
  exerciseName,
  videoUrl,
  thumbnailUrl,
  equipmentTag,
  sets,
  reps,
  rest,
  instructions,
  stepCurrent,
  stepTotal,
  optionalToggle,
  onBack,
  onStart,
  onMarkComplete,
}: ExerciseDetailProps) {
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={onBack} style={s.backBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={30} color={C.white} />
        </TouchableOpacity>
        <Text style={s.stepText}>
          Step {stepCurrent} of {stepTotal}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 110 }]}
      >
        <Text style={s.titleTop}>{exerciseName}</Text>

        <View style={s.videoCard}>
          {videoUrl ? (
            <>
              <Image source={{ uri: videoUrl }} style={s.videoImage} resizeMode="cover" />
              <TouchableOpacity style={s.playBtn} onPress={onStart} activeOpacity={0.8}>
                <MaterialCommunityIcons name="play" size={40} color={C.white} />
              </TouchableOpacity>
            </>
          ) : (
            <View style={s.videoPlaceholder}>
              {thumbnailUrl ? (
                <Image source={{ uri: thumbnailUrl }} style={s.videoImage} resizeMode="cover" />
              ) : null}
              <View style={s.videoPlaceholderOverlay}>
                <MaterialCommunityIcons name="video-off-outline" size={34} color={C.goldDark} />
                <Text style={s.videoPlaceholderText}>Video demo coming soon</Text>
              </View>
            </View>
          )}
        </View>

        <Text style={s.exerciseName}>{exerciseName}</Text>
        <View style={s.tagPill}>
          <Text style={s.tagText}>{equipmentTag}</Text>
        </View>

        <Text style={s.metricsText}>
          Sets: {sets}  Reps: {reps}  Rest: {rest}
        </Text>

        {optionalToggle ? (
          <View style={s.toggleRow}>
            <Switch
              value={optionalToggle.value}
              onValueChange={optionalToggle.onValueChange}
              thumbColor={optionalToggle.value ? C.goldMid : '#6A6358'}
              trackColor={{ false: '#3A372F', true: '#5A4820' }}
            />
            <View style={s.toggleTextWrap}>
              <Text style={s.toggleLabel}>{optionalToggle.label}</Text>
              {optionalToggle.description ? (
                <Text style={s.toggleDescription}>{optionalToggle.description}</Text>
              ) : null}
            </View>
          </View>
        ) : null}

        <InstructionSection label="SETUP" items={instructions.setup} />
        <InstructionSection label="EXECUTION" items={instructions.execution} />
        <InstructionSection label="PROGRESSION" items={instructions.progression} />
      </ScrollView>

      <View style={[s.stickyBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TouchableOpacity style={s.completeBtn} onPress={onMarkComplete} activeOpacity={0.8}>
          <MaterialCommunityIcons name="check-circle-outline" size={24} color={C.textSec} />
          <Text style={s.completeBtnText}>Mark as completed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.startBtn} onPress={onStart} activeOpacity={0.8}>
          <MaterialCommunityIcons name="play" size={22} color={C.startText} />
          <Text style={s.startBtnText}>Start</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: 14,
  },
  backBtn: {
    position: 'absolute',
    left: 10,
    top: 8,
    padding: 4,
  },
  stepText: {
    color: C.textSec,
    fontSize: 16,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 16,
    gap: 12,
  },
  titleTop: {
    textAlign: 'center',
    color: C.white,
    fontSize: 40,
    fontWeight: '300',
    letterSpacing: 1,
    marginTop: 2,
  },
  videoCard: {
    height: 250,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: C.borderSubtle,
    backgroundColor: '#111',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoImage: {
    width: '100%',
    height: '100%',
  },
  playBtn: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: 'rgba(37,37,168,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.75)',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoPlaceholderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10,10,10,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  videoPlaceholderText: {
    color: C.textSec,
    fontSize: 16,
    fontWeight: '700',
  },
  exerciseName: {
    color: C.white,
    fontSize: 42,
    fontWeight: '300',
    letterSpacing: 0.8,
  },
  tagPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#4C4539',
    borderColor: '#6B5B3C',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tagText: {
    color: C.gold,
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  metricsText: {
    color: C.textSec,
    fontSize: 22,
    marginTop: 2,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  toggleTextWrap: {
    flex: 1,
  },
  toggleLabel: {
    color: C.white,
    fontSize: 20,
    fontWeight: '600',
  },
  toggleDescription: {
    color: C.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  instructionSection: {
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  sectionLabel: {
    color: C.gold,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 2,
  },
  sectionRule: {
    flex: 1,
    height: 1,
    backgroundColor: C.borderSubtle,
  },
  bulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  bulletDot: {
    color: C.goldDark,
    fontSize: 24,
    lineHeight: 24,
    marginRight: 8,
  },
  bulletText: {
    flex: 1,
    color: C.white,
    fontSize: 18,
    lineHeight: 26,
  },
  stickyBar: {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 10,
    backgroundColor: C.bg,
  },
  completeBtn: {
    flex: 1,
    height: 58,
    borderRadius: 29,
    borderWidth: 2,
    borderColor: '#8A867C',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: 'transparent',
  },
  completeBtnText: {
    color: '#D1CFC8',
    fontSize: 20,
    fontWeight: '700',
  },
  startBtn: {
    width: 138,
    height: 58,
    borderRadius: 29,
    backgroundColor: C.green,
    borderWidth: 1.5,
    borderColor: C.goldMid,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  startBtnText: {
    color: C.startText,
    fontSize: 20,
    fontWeight: '700',
  },
});
