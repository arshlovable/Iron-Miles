import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { supabase } from '../src/lib/supabase';
import {
  WORKOUT_TABS,
  EQUIPMENT_BUCKETS,
  EQUIPMENT_SLUGS,
  EQUIPMENT_SECTION_HEADING,
  WORKOUT_TAB_EXERCISE_MAP,
  isWorkoutTabSlug,
  expandDisplayNameForQuery,
  type WorkoutTabSlug,
  type EquipmentSlug,
} from '../src/lib/workout-tab-category-map';

const C = {
  bg: '#0C0B09',
  surface: '#13120F',
  surfaceEl: '#1C1A17',
  borderGold: '#5C4A1A',
  borderSubtle: '#2A2820',
  gold: '#E0C27C',
  goldBright: '#FFD700',
  goldMid: '#D4A843',
  goldDark: '#B89B5F',
  goldDim: '#5C4A1A',
  green: '#1F4037',
  greenLight: '#27503B',
  white: '#FFFFFF',
  offWhite: '#F0EADD',
  textSec: '#9A9080',
  textMuted: '#6B6355',
};

function equipmentUiLabel(slug: EquipmentSlug): string {
  return EQUIPMENT_BUCKETS.find((b) => b.slug === slug)?.label ?? slug;
}

type ExerciseRow = Record<string, unknown>;

async function fetchExerciseFromSupabase(
  displayName: string,
  equipmentSlug: EquipmentSlug
): Promise<ExerciseRow | null> {
  const names = [...expandDisplayNameForQuery(displayName)];
  const { data, error } = await supabase
    .from('exercises')
    .select('*')
    .in('name', names)
    .eq('is_active', true)
    .limit(24);
  if (error || !data?.length) return null;
  const eq = (r: ExerciseRow) => String(r.equipment_type ?? '').toLowerCase();
  const preferred = data.find((r) => eq(r) === equipmentSlug);
  return (preferred ?? data[0]) as ExerciseRow;
}

function buildExerciseDetailPayload(
  displayName: string,
  equipmentSlug: EquipmentSlug,
  hit: ExerciseRow | null
): Record<string, unknown> {
  if (hit && typeof hit.name === 'string') {
    return {
      exercise_id: hit.id,
      name: hit.name,
      equipment_type: String(hit.equipment_type ?? equipmentSlug),
      instruction_text: String(hit.instruction_text ?? '').trim(),
      video_url: String(hit.video_url ?? ''),
      thumbnail_url: String(hit.thumbnail_url ?? ''),
      target_muscle: String(hit.target_muscle ?? hit.category ?? ''),
      sets_assigned: Number(hit.sets_default ?? 3) || 3,
      reps_assigned: hit.reps_default != null ? String(hit.reps_default) : '10',
      instruction: String(hit.instruction_text ?? '').trim(),
    };
  }
  return {
    name: displayName,
    equipment_type: equipmentSlug,
    instruction_text: `Library reference: ${displayName}. No matching Supabase row was found for this name and equipment. Use controlled form; adjust range of motion to your space.`,
    instruction: `Perform ${displayName} using ${equipmentUiLabel(equipmentSlug)}. Move slowly, breathe steadily, and stop if anything feels sharp or wrong.`,
    sets_assigned: 3,
    reps_assigned: '10',
    video_url: '',
    thumbnail_url: '',
    target_muscle: '',
  };
}

export default function WorkoutCategoryScreen() {
  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [opening, setOpening] = React.useState<string | null>(null);

  const tabSlug = typeof tab === 'string' && isWorkoutTabSlug(tab) ? tab : null;
  const meta = tabSlug ? WORKOUT_TABS.find((t) => t.slug === tabSlug) : null;

  const openExercise = useCallback(async (displayName: string, equipmentSlug: EquipmentSlug) => {
    const key = `${equipmentSlug}:${displayName}`;
    setOpening(key);
    try {
      const hit = await fetchExerciseFromSupabase(displayName, equipmentSlug);
      const payload = buildExerciseDetailPayload(displayName, equipmentSlug, hit);
      router.push({
        pathname: '/exercise-detail',
        params: {
          exerciseData: JSON.stringify(payload),
          stepCurrent: '1',
          stepTotal: '1',
        },
      });
    } catch (e) {
      console.warn('[workout-category] exercise resolve failed', e);
      Alert.alert('Could not open exercise', 'Try again, or check your connection.');
    } finally {
      setOpening(null);
    }
  }, []);

  if (!tabSlug || !meta) {
    return (
      <SafeAreaView style={s.container} edges={['top']}>
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <MaterialCommunityIcons name="chevron-left" size={28} color={C.goldMid} />
          </TouchableOpacity>
          <Text style={s.topTitle}>CATEGORY</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={s.invalidWrap}>
          <Text style={s.invalidText}>Unknown category.</Text>
          <TouchableOpacity onPress={() => router.back()} style={s.invalidBack} activeOpacity={0.8}>
            <Text style={s.invalidBackText}>GO BACK</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const block = WORKOUT_TAB_EXERCISE_MAP[tabSlug];

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
          <MaterialCommunityIcons name="chevron-left" size={28} color={C.goldMid} />
        </TouchableOpacity>
        <Text style={s.topTitle} numberOfLines={1}>
          {meta.label.toUpperCase()}
        </Text>
        <View style={{ width: 40 }} />
      </View>
      <View style={s.topGoldLine} />

      <ScrollView
        testID="workout-category-scroll"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        <Text style={s.pageTitle}>{meta.label}</Text>
        <Text style={s.subtitle}>Browse by equipment. Tap a row for exercise details.</Text>

        {EQUIPMENT_SLUGS.map((slug) => {
          const names = block[slug];
          if (!names.length) return null;
          return (
            <View key={slug} style={s.section}>
              <Text style={s.sectionHeading}>{EQUIPMENT_SECTION_HEADING[slug]}</Text>
              {names.map((displayName) => {
                const rowKey = `${slug}:${displayName}`;
                const busy = opening === rowKey;
                return (
                  <TouchableOpacity
                    key={rowKey}
                    testID={`exercise-row-${slug}-${displayName.replace(/\s+/g, '-').slice(0, 24)}`}
                    style={s.row}
                    activeOpacity={0.75}
                    disabled={!!opening}
                    onPress={() => openExercise(displayName, slug)}
                  >
                    <View style={s.rowTextWrap}>
                      <Text style={s.rowTitle}>{displayName}</Text>
                      <Text style={s.rowEquip}>{equipmentUiLabel(slug)}</Text>
                    </View>
                    {busy ? (
                      <ActivityIndicator size="small" color={C.goldMid} />
                    ) : (
                      <MaterialCommunityIcons name="chevron-right" size={22} color={C.textMuted} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          );
        })}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  topTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '800',
    color: C.gold,
    letterSpacing: 2,
  },
  topGoldLine: { height: 1, backgroundColor: C.goldDim, opacity: 0.45, marginHorizontal: 14 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 12, paddingBottom: 16 },
  pageTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: C.offWhite,
    letterSpacing: 1,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 12,
    color: C.textSec,
    lineHeight: 18,
    marginBottom: 18,
    fontStyle: 'italic',
  },
  section: { marginBottom: 20 },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    color: C.gold,
    letterSpacing: 3,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  rowTextWrap: { flex: 1, paddingRight: 8 },
  rowTitle: { fontSize: 14, fontWeight: '800', color: C.offWhite, marginBottom: 4 },
  rowEquip: { fontSize: 11, fontWeight: '600', color: C.textMuted, letterSpacing: 0.3 },
  invalidWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  invalidText: { color: C.textSec, fontSize: 14, marginBottom: 16 },
  invalidBack: {
    borderWidth: 1,
    borderColor: C.borderGold,
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  invalidBackText: { color: C.goldDark, fontWeight: '800', letterSpacing: 2 },
});
