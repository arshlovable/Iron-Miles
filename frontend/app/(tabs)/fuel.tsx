import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Platform,
  Animated,
  Easing,
  ActivityIndicator,
  Modal,
  FlatList,
  TextInput,
} from 'react-native';
import { PrimaryCtaPressable } from '../../src/components/PrimaryCtaPressable';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '../../src/context/AuthContext';
import {
  DAILY_MEAL_TARGET,
  buildFuelLogDisplayRows,
  computeFuelLevel,
  countMealsAndSnacks,
  fetchTodayFuelLogs,
  insertFuelLog,
  type FuelLogRow,
} from '../../src/lib/fuel-logs';
import {
  categoryDisplayLabel,
  fetchActiveFoods,
  filterFoodsForPicker,
  foodsForLogType,
  pickFoodRowTagChips,
  type FoodOption,
  type MealPickerCategory,
  type SnackPickerCategory,
} from '../../src/lib/foods';

const C = {
  bg: '#0C0B09',
  surface: '#13120F',
  surfaceEl: '#1C1A17',
  borderGold: '#5C4A1A',
  borderSubtle: '#2A2820',
  gold: '#E0C27C',
  goldMid: '#D4A843',
  goldDark: '#B89B5F',
  goldDim: '#5C4A1A',
  green: '#1F4037',
  greenLight: '#27503B',
  ctaGreen: '#1A3329',
  ctaGreenMid: '#223D2E',
  white: '#FFFFFF',
  offWhite: '#F0EADD',
  textSec: '#9A9080',
  textMuted: '#6B6355',
};

/** Semicircle sweep aligned with tick marks (-85° … +85°). E = left, top = half, F = right. */
const GAUGE_MIN_DEG = -85;
const GAUGE_MAX_DEG = 85;

function fuelLevelToAngle(level: number) {
  const t = Math.max(0, Math.min(1, level));
  return GAUGE_MIN_DEG + t * (GAUGE_MAX_DEG - GAUGE_MIN_DEG);
}

function getFuelStatus(mealsCompleted: number) {
  const n = Math.max(0, mealsCompleted);
  if (n <= 0) {
    return {
      title: 'Low Fuel',
      subtitle: 'Get your first meal in.',
      tone: 'low' as const,
    };
  }
  if (n === 1) {
    return {
      title: 'Running Light',
      subtitle: 'You need more fuel today.',
      tone: 'low' as const,
    };
  }
  if (n === 2) {
    return {
      title: 'On Track',
      subtitle: 'Keep moving toward 4 meals.',
      tone: 'track' as const,
    };
  }
  if (n === 3) {
    return {
      title: 'Strong',
      subtitle: 'One more meal tops off the tank.',
      tone: 'strong' as const,
    };
  }
  return {
    title: 'Full Tank',
    subtitle: 'You kept your engine running strong.',
    tone: 'full' as const,
  };
}

const WHATS_THIS_HELP =
  "This works like a rig's fuel gauge: E is low on meals today, F is full. Full meals move the needle in big steps (4 meals = full). Snacks add a small bump—enough to feel it, not enough to replace a meal.";

function Header() {
  return (
    <View style={s.header}>
      <View style={s.headerInner}>
        <MaterialCommunityIcons name="fuel" size={32} color={C.goldMid} />
        <Text style={s.headerTitle}>FUEL</Text>
        <Text style={s.headerSub}>FUEL YOUR BODY. DRIVE FARTHER.</Text>
      </View>
    </View>
  );
}

function FuelGaugeCard({
  mealsCompleted,
  fuelLevel,
}: {
  mealsCompleted: number;
  fuelLevel: number;
}) {
  const status = getFuelStatus(mealsCompleted);
  const [whatsThisOpen, setWhatsThisOpen] = useState(false);
  const needleDeg = useRef(new Animated.Value(fuelLevelToAngle(fuelLevel))).current;

  useEffect(() => {
    Animated.timing(needleDeg, {
      toValue: fuelLevelToAngle(fuelLevel),
      duration: 580,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [fuelLevel, needleDeg]);

  const needleRotate = needleDeg.interpolate({
    inputRange: [GAUGE_MIN_DEG - 5, GAUGE_MAX_DEG + 5],
    outputRange: [`${GAUGE_MIN_DEG - 5}deg`, `${GAUGE_MAX_DEG + 5}deg`],
  });

  return (
    <View style={s.gaugeCard}>
      <View style={s.gaugeTopRow}>
        <Text style={s.sectionLabel}>TODAY'S FUEL</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="What is today’s fuel gauge?"
          accessibilityHint={WHATS_THIS_HELP}
          accessibilityState={{ expanded: whatsThisOpen }}
          onPress={() => setWhatsThisOpen((v) => !v)}
          onHoverIn={() => Platform.OS === 'web' && setWhatsThisOpen(true)}
          onHoverOut={() => Platform.OS === 'web' && setWhatsThisOpen(false)}
          onFocus={() => setWhatsThisOpen(true)}
          onBlur={() => setWhatsThisOpen(false)}
          style={({ pressed }) => [s.whatsThis, pressed && s.whatsThisPressed]}
        >
          <MaterialCommunityIcons name="information-outline" size={15} color={C.goldMid} />
          <Text style={s.whatsThisText}>What's this?!</Text>
        </Pressable>
      </View>
      {whatsThisOpen ? (
        <Text style={s.whatsThisExplainer}>{WHATS_THIS_HELP}</Text>
      ) : null}

      <View style={s.gaugeWrap}>
        <View style={s.gaugeGlow} />
        <View style={s.gaugeArcBase} />
        <View style={s.gaugeArcLeft} />
        <View style={s.gaugeArcRight} />
        <View style={s.gaugeInnerWell} />
        <View style={s.tickOverlay}>
          {Array.from({ length: 15 }).map((_, i) => {
            const t = i / 14;
            const deg = -85 + t * 170;
            return <View key={`tick-${i}`} style={[s.tick, { transform: [{ rotate: `${deg}deg` }] }]} />;
          })}
        </View>

        <Text style={s.eLabel}>E</Text>
        <Text style={s.fLabel}>F</Text>

        <View style={s.needlePivot} pointerEvents="none">
          <Animated.View
            style={[
              s.needleArm,
              {
                transform: [{ rotate: needleRotate }],
                transformOrigin: '50% 100%',
              },
            ]}
          >
            <View style={s.needleShaftShadow} />
            <View style={s.needleShaft} />
          </Animated.View>
          <View style={s.needleHubOuter} pointerEvents="none">
            <View style={s.needleHubInner} />
          </View>
        </View>

        <MaterialCommunityIcons name="fuel" size={26} color={C.textSec} style={s.gaugeCenterFuel} />
      </View>

      <Text style={s.gaugeCount}>
        <Text style={s.gaugeCountLeft}>{mealsCompleted}</Text>
        <Text style={s.gaugeCountSlash}> / </Text>
        <Text style={s.gaugeCountRight}>{DAILY_MEAL_TARGET}</Text>
      </Text>
      <Text style={s.gaugeCountLabel}>MEALS COMPLETED</Text>
      <View style={s.statusBlock}>
        <View style={s.statusLineRow}>
          <MaterialCommunityIcons name="speedometer-medium" size={14} color={C.textSec} />
          <Text
            style={[
              s.statusTitle,
              status.tone === 'low' && s.statusTitleLow,
              status.tone === 'track' && s.statusTitleTrack,
              status.tone === 'strong' && s.statusTitleStrong,
              status.tone === 'full' && s.statusTitleFull,
            ]}
          >
            {status.title}
          </Text>
        </View>
        <Text style={s.statusSubtitle}>{status.subtitle}</Text>
      </View>
    </View>
  );
}

function MealTargetCard({ mealsCompleted }: { mealsCompleted: number }) {
  const completed = Math.max(0, mealsCompleted);
  return (
    <View style={s.targetCard}>
      <Text style={s.targetTitle}>DAILY MEAL TARGET</Text>
      <View style={s.targetPumpRow}>
        {Array.from({ length: DAILY_MEAL_TARGET }).map((_, i) => {
          const done = i < completed;
          return (
            <View key={`target-${i}`} style={s.targetPumpWrap}>
              <View style={[s.targetPumpBadge, done && s.targetPumpBadgeDone]}>
                <MaterialCommunityIcons
                  name="fuel"
                  size={24}
                  color={done ? C.goldMid : C.textMuted}
                />
              </View>
              {done ? (
                <View style={s.targetCheck}>
                  <MaterialIcons name="check" size={10} color={C.offWhite} />
                </View>
              ) : null}
            </View>
          );
        })}
      </View>
      <Text style={s.targetSub}>4 meals per day keeps your engine running strong.</Text>
    </View>
  );
}

function QuickActions({
  onAddMeal,
  onAddSnack,
  actionsDisabled,
}: {
  onAddMeal: () => void;
  onAddSnack: () => void;
  actionsDisabled: boolean;
}) {
  return (
    <View style={s.actionRow}>
      <PrimaryCtaPressable
        testID="add-meal-btn"
        style={s.actionCardWrap}
        onPress={onAddMeal}
        disabled={actionsDisabled}
        animatedWrapStyle={{ flex: 1 }}
      >
        <View style={s.actionPrimaryOuter}>
          <LinearGradient colors={[C.greenLight, C.ctaGreenMid, C.ctaGreen]} style={s.actionPrimaryInner}>
            <View style={s.actionPrimaryAccent} />
            <View style={s.actionPrimarySheen} />
            <View style={s.actionPrimaryContent}>
              <View style={[s.actionPlus, s.actionPlusPrimary]}>
                <MaterialIcons name="add" size={18} color={C.white} />
              </View>
              <View>
                <Text style={[s.actionTitle, s.actionTitlePrimary]}>ADD MEAL</Text>
                <Text style={s.actionSub}>Log a full meal</Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      </PrimaryCtaPressable>

      <Pressable
        testID="add-snack-btn"
        onPress={onAddSnack}
        disabled={actionsDisabled}
        style={({ pressed }) => [
          s.actionCardWrap,
          s.snackButton,
          actionsDisabled && s.snackButtonDisabled,
          pressed && !actionsDisabled && s.actionSnackPressed,
        ]}
      >
        <View style={[s.actionPlus, s.actionPlusSnack]}>
          <MaterialIcons name="add" size={18} color={C.textSec} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[s.actionTitle, s.actionTitleSnack]}>ADD SNACK</Text>
          <Text style={s.actionSubSnack}>Log a snack (optional)</Text>
        </View>
      </Pressable>
    </View>
  );
}

function TodaysLog({
  displayRows,
  loading,
}: {
  displayRows: ReturnType<typeof buildFuelLogDisplayRows>;
  loading: boolean;
}) {
  return (
    <View style={s.section}>
      <View style={s.logHeaderRow}>
        <Text style={[s.sectionLabel, s.sectionLabelLog]}>TODAY'S LOG</Text>
        <TouchableOpacity activeOpacity={0.7} disabled>
          <Text style={s.logViewAll}>VIEW ALL</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={s.logLoading}>
          <ActivityIndicator color={C.goldMid} />
          <Text style={s.logLoadingText}>Loading log…</Text>
        </View>
      ) : (
        <View style={s.logCard}>
          {displayRows.map((row, i) => {
            const isLast = i === displayRows.length - 1;
            if (row.kind === 'meal') {
              return (
                <View key={row.id} style={[s.logRow, isLast && s.logRowLast]}>
                  <View style={[s.logIconWrap, s.logIconDone]}>
                    <MaterialCommunityIcons name="silverware-fork-knife" size={17} color={C.greenLight} />
                  </View>
                  <View style={s.logInfo}>
                    <Text style={s.logTitleLine} numberOfLines={2}>
                      {`Meal ${row.mealIndex} — ${row.detail} — ${row.time}`}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="check-circle-outline" size={18} color={C.greenLight} />
                </View>
              );
            }
            if (row.kind === 'snack') {
              return (
                <View key={row.id} style={[s.logRow, isLast && s.logRowLast]}>
                  <View style={[s.logIconWrap, s.logIconSnack]}>
                    <MaterialCommunityIcons name="food-apple" size={17} color={C.goldMid} />
                  </View>
                  <View style={s.logInfo}>
                    <Text style={s.logTitleLine} numberOfLines={2}>
                      {`Snack — ${row.detail} — ${row.time}`}
                    </Text>
                  </View>
                  <View style={s.logSnackSpacer} />
                </View>
              );
            }
            return (
              <View key={`meal-empty-${row.mealIndex}`} style={[s.logRow, isLast && s.logRowLast]}>
                <View style={[s.logIconWrap, s.logIconPending]}>
                  <MaterialCommunityIcons name="fuel" size={17} color={C.goldDark} />
                </View>
                <View style={s.logInfo}>
                  <Text style={s.logTitle}>{`Meal ${row.mealIndex}`}</Text>
                  <Text style={s.logSubtitle}>Not logged yet</Text>
                </View>
                <Text style={s.logTime}>---</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

type LogPickerMode = 'meal' | 'snack';

const MEAL_CHIP_DEF: { id: MealPickerCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'truck_stop', label: 'Truck Stop' },
  { id: 'restaurant', label: 'Restaurant' },
  { id: 'meal_prep', label: 'Meal Prep' },
  { id: 'packaged', label: 'Packaged' },
];

const SNACK_CHIP_DEF: { id: SnackPickerCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'high_protein', label: 'High Protein' },
  { id: 'hydrating', label: 'Hydrating' },
  { id: 'packaged', label: 'Packaged' },
];

function FuelLogPickerModal({
  visible,
  mode,
  foods,
  foodsCatalogError,
  busy,
  onClose,
  onQuickLog,
  onPickFood,
}: {
  visible: boolean;
  mode: LogPickerMode | null;
  foods: FoodOption[];
  foodsCatalogError: boolean;
  busy: boolean;
  onClose: () => void;
  onQuickLog: () => void;
  onPickFood: (foodId: string) => void;
}) {
  const open = visible && mode != null;
  const [searchQuery, setSearchQuery] = useState('');
  const [mealCategory, setMealCategory] = useState<MealPickerCategory>('all');
  const [snackCategory, setSnackCategory] = useState<SnackPickerCategory>('all');

  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setMealCategory('all');
      setSnackCategory('all');
    }
  }, [open, mode]);

  const baseList = useMemo(() => (mode ? foodsForLogType(foods, mode) : []), [foods, mode]);

  const filtered = useMemo(() => {
    if (!mode) return [];
    return filterFoodsForPicker(baseList, {
      logType: mode,
      search: searchQuery,
      mealCategory: mode === 'meal' ? mealCategory : undefined,
      snackCategory: mode === 'snack' ? snackCategory : undefined,
    });
  }, [baseList, mode, searchQuery, mealCategory, snackCategory]);

  const title = mode === 'meal' ? 'Choose Meal' : mode === 'snack' ? 'Choose Snack' : '';
  const quickTitle = mode === 'meal' ? 'Quick Log Meal' : mode === 'snack' ? 'Quick Log Snack' : 'Quick log';
  const quickSub =
    mode === 'meal'
      ? 'No food details — just count the meal'
      : mode === 'snack'
        ? 'No food details — just count the snack'
        : '';

  const emptyHint = foodsCatalogError
    ? 'Food list unavailable — quick log still works.'
    : baseList.length === 0
      ? 'No foods for this log type in the catalog.'
      : filtered.length === 0
        ? 'No road foods found'
        : null;

  return (
    <Modal visible={open} animationType="fade" transparent onRequestClose={onClose}>
      <View style={s.modalRoot}>
        <Pressable style={s.modalBackdropPress} onPress={onClose} accessibilityLabel="Dismiss" />
        <View style={s.modalSheet}>
          <Text style={s.modalTitle}>{title}</Text>
          <PrimaryCtaPressable
            testID="fuel-quick-log"
            style={s.modalQuickWrap}
            onPress={onQuickLog}
            disabled={busy}
            animatedWrapStyle={{ alignSelf: 'stretch' }}
          >
            <View style={s.modalQuickInner}>
              <Text style={s.modalQuickTitle}>{quickTitle}</Text>
              <Text style={s.modalQuickSub}>{quickSub}</Text>
            </View>
          </PrimaryCtaPressable>

          <Text style={s.modalSectionLabel}>Pick a food</Text>
          <TextInput
            style={s.modalSearch}
            placeholder="Search road foods…"
            placeholderTextColor={C.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            editable={!busy && !foodsCatalogError}
            autoCorrect={false}
            autoCapitalize="none"
            {...(Platform.OS === 'ios' ? { clearButtonMode: 'while-editing' as const } : {})}
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.modalChipScroll}
            contentContainerStyle={s.modalChipScrollInner}
          >
            {mode === 'meal'
              ? MEAL_CHIP_DEF.map((c) => {
                  const selected = mealCategory === c.id;
                  return (
                    <Pressable
                      key={c.id}
                      onPress={() => setMealCategory(c.id)}
                      disabled={busy || foodsCatalogError}
                      style={[s.modalChip, selected && s.modalChipSelected]}
                    >
                      <Text style={[s.modalChipText, selected && s.modalChipTextSelected]}>{c.label}</Text>
                    </Pressable>
                  );
                })
              : mode === 'snack'
                ? SNACK_CHIP_DEF.map((c) => {
                    const selected = snackCategory === c.id;
                    return (
                      <Pressable
                        key={c.id}
                        onPress={() => setSnackCategory(c.id)}
                        disabled={busy || foodsCatalogError}
                        style={[s.modalChip, selected && s.modalChipSelected]}
                      >
                        <Text style={[s.modalChipText, selected && s.modalChipTextSelected]}>{c.label}</Text>
                      </Pressable>
                    );
                  })
                : null}
          </ScrollView>

          {emptyHint ? <Text style={s.modalHint}>{emptyHint}</Text> : null}

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.id}
            style={s.modalList}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => {
              const chips = pickFoodRowTagChips(item.tags);
              const cat = categoryDisplayLabel(item.category);
              const macroBits: string[] = [];
              if (item.protein != null) macroBits.push(`${item.protein}g protein`);
              if (item.calories != null) macroBits.push(`${item.calories} cal`);
              const macroLine = macroBits.join(' · ');
              return (
                <Pressable
                  style={({ pressed }) => [s.modalFoodRow, pressed && s.modalFoodRowPressed]}
                  onPress={() => onPickFood(item.id)}
                  disabled={busy}
                >
                  <View style={s.modalFoodRowBody}>
                    <Text style={s.modalFoodName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={s.modalFoodMeta} numberOfLines={1}>
                      {cat}
                      {macroLine ? ` · ${macroLine}` : ''}
                    </Text>
                    {chips.length > 0 ? (
                      <View style={s.modalTagRow}>
                        {chips.map((t) => (
                          <View key={t} style={s.modalTagChip}>
                            <Text style={s.modalTagChipText}>{t}</Text>
                          </View>
                        ))}
                      </View>
                    ) : null}
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={C.textMuted} />
                </Pressable>
              );
            }}
          />
          <Pressable style={s.modalCancel} onPress={onClose} disabled={busy}>
            <Text style={s.modalCancelText}>Cancel</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function FuelScreen() {
  const { user, loading: authLoading } = useAuth();
  const [logs, setLogs] = useState<FuelLogRow[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logsError, setLogsError] = useState<string | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const [foodOptions, setFoodOptions] = useState<FoodOption[]>([]);
  const [foodsCatalogError, setFoodsCatalogError] = useState(false);
  const [logPicker, setLogPicker] = useState<LogPickerMode | null>(null);

  const loadFuelLogs = useCallback(
    async (opts?: { withSpinner?: boolean }) => {
      const withSpinner = opts?.withSpinner === true;
      if (!user?.id) {
        setLogs([]);
        setLogsLoading(false);
        setLogsError(null);
        return;
      }
      if (withSpinner) setLogsLoading(true);
      const { data, error } = await fetchTodayFuelLogs(user.id);
      if (withSpinner) setLogsLoading(false);
      if (error) {
        setLogsError('Could not load today’s fuel log. Try again in a moment.');
        return;
      }
      setLogs(data);
      setLogsError(null);
    },
    [user?.id]
  );

  useEffect(() => {
    if (authLoading) return;
    void loadFuelLogs({ withSpinner: true });
  }, [authLoading, user?.id, loadFuelLogs]);

  useEffect(() => {
    if (!user?.id) {
      setFoodOptions([]);
      setFoodsCatalogError(false);
      return;
    }
    let cancelled = false;
    void (async () => {
      const { data, error } = await fetchActiveFoods();
      if (cancelled) return;
      setFoodOptions(data);
      setFoodsCatalogError(Boolean(error));
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

  const foodNameMap = useMemo(() => new Map(foodOptions.map((f) => [f.id, f.name])), [foodOptions]);

  const { meals: mealsCompleted, snacks: snacksToday } = useMemo(() => countMealsAndSnacks(logs), [logs]);
  const fuelLevel = useMemo(
    () => computeFuelLevel(mealsCompleted, snacksToday),
    [mealsCompleted, snacksToday]
  );
  const displayRows = useMemo(
    () => buildFuelLogDisplayRows(logs, mealsCompleted, foodNameMap),
    [logs, mealsCompleted, foodNameMap]
  );

  const actionsDisabled = !user?.id || actionBusy || logPicker !== null;

  const closePicker = useCallback(() => setLogPicker(null), []);

  const submitLog = useCallback(
    async (logType: LogPickerMode, foodId: string | null) => {
      if (!user?.id || actionBusy) return;
      setActionBusy(true);
      const { error } = await insertFuelLog(user.id, logType, foodId);
      if (error) {
        console.error('[Fuel] log failed:', error);
        setLogsError(
          logType === 'meal' ? 'Could not log meal. Please try again.' : 'Could not log snack. Please try again.'
        );
      } else {
        setLogsError(null);
        setLogPicker(null);
        await loadFuelLogs({ withSpinner: false });
      }
      setActionBusy(false);
    },
    [user?.id, loadFuelLogs]
  );

  const handleOpenMealPicker = useCallback(() => setLogPicker('meal'), []);
  const handleOpenSnackPicker = useCallback(() => setLogPicker('snack'), []);

  const handleQuickFromPicker = useCallback(() => {
    if (!logPicker) return;
    void submitLog(logPicker, null);
  }, [logPicker, submitLog]);

  const handlePickFoodFromPicker = useCallback(
    (foodId: string) => {
      if (!logPicker) return;
      void submitLog(logPicker, foodId);
    },
    [logPicker, submitLog]
  );

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView testID="fuel-scroll" showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        <Header />
        {!user?.id && !authLoading ? (
          <Text style={s.authHint}>Sign in to log meals and snacks. Your gauge stays private to your account.</Text>
        ) : null}
        {logsError ? <Text style={s.errorBanner}>{logsError}</Text> : null}
        <FuelGaugeCard mealsCompleted={mealsCompleted} fuelLevel={fuelLevel} />
        <MealTargetCard mealsCompleted={mealsCompleted} />
        <QuickActions
          onAddMeal={handleOpenMealPicker}
          onAddSnack={handleOpenSnackPicker}
          actionsDisabled={actionsDisabled}
        />
        <TodaysLog displayRows={displayRows} loading={Boolean(user?.id && logsLoading)} />
        <View style={{ height: 20 }} />
      </ScrollView>
      <FuelLogPickerModal
        visible={logPicker !== null}
        mode={logPicker}
        foods={foodOptions}
        foodsCatalogError={foodsCatalogError}
        busy={actionBusy}
        onClose={closePicker}
        onQuickLog={handleQuickFromPicker}
        onPickFood={handlePickFoodFromPicker}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  scrollContent: { paddingBottom: 8 },
  authHint: {
    marginHorizontal: 20,
    marginBottom: 12,
    textAlign: 'center',
    color: C.textSec,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '600',
  },
  errorBanner: {
    marginHorizontal: 14,
    marginBottom: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.borderGold,
    backgroundColor: '#1A1410',
    color: C.goldDark,
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    fontWeight: '600',
  },

  header: {
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerInner: {
    alignItems: 'center',
    gap: 4,
    width: '100%',
  },
  headerTitle: {
    fontSize: 42,
    fontWeight: '900',
    color: C.gold,
    letterSpacing: 1,
    textAlign: 'center',
  },
  headerSub: {
    fontSize: 12,
    fontWeight: '700',
    color: C.textSec,
    letterSpacing: 1,
    textAlign: 'center',
  },

  gaugeCard: {
    marginHorizontal: 14,
    marginBottom: 18,
    backgroundColor: '#0E0D0A',
    borderWidth: 1,
    borderColor: C.borderGold,
    borderRadius: 12,
    padding: 14,
  },
  gaugeTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '800', color: C.gold, letterSpacing: 2.5 },
  sectionLabelLog: { marginBottom: 0 },
  whatsThis: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(184,155,95,0.25)',
    alignSelf: 'flex-end',
  },
  whatsThisPressed: { opacity: 0.85 },
  whatsThisText: { color: C.textSec, fontSize: 11, fontWeight: '700' },
  whatsThisExplainer: {
    alignSelf: 'flex-end',
    maxWidth: '92%',
    marginBottom: 10,
    marginTop: -2,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.borderGold,
    backgroundColor: '#12100C',
    color: C.textSec,
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'right',
  },

  gaugeWrap: {
    height: 206,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gaugeGlow: {
    width: 308,
    height: 170,
    borderTopLeftRadius: 180,
    borderTopRightRadius: 180,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: 'rgba(224,194,124,0.2)',
    position: 'absolute',
    top: 8,
  },
  gaugeArcBase: {
    width: 300,
    height: 160,
    borderTopLeftRadius: 170,
    borderTopRightRadius: 170,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 8,
    borderBottomWidth: 0,
    borderColor: '#262118',
    position: 'absolute',
    top: 14,
  },
  gaugeArcLeft: {
    width: 150,
    height: 160,
    borderTopLeftRadius: 170,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 8,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: '#2F2A22',
    position: 'absolute',
    left: 18,
    top: 14,
  },
  gaugeArcRight: {
    width: 150,
    height: 160,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 170,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 8,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderColor: C.ctaGreen,
    position: 'absolute',
    right: 18,
    top: 14,
  },
  gaugeInnerWell: {
    width: 240,
    height: 130,
    borderTopLeftRadius: 150,
    borderTopRightRadius: 150,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: '#242019',
    backgroundColor: '#100E0B',
    position: 'absolute',
    top: 30,
  },
  tickOverlay: {
    width: 300,
    height: 160,
    position: 'absolute',
    top: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tick: {
    position: 'absolute',
    width: 1.5,
    height: 9,
    backgroundColor: '#7D7562',
    top: 17,
  },
  needlePivot: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 22,
    height: 102,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  /** Tall arm; transform origin = bottom center = hub — shaft points upward at 0° (half tank). */
  needleArm: {
    position: 'absolute',
    bottom: 15,
    width: 6,
    height: 88,
    alignItems: 'center',
    justifyContent: 'flex-end',
    zIndex: 1,
  },
  needleShaftShadow: {
    position: 'absolute',
    bottom: 2,
    width: 5,
    height: 72,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.55)',
    transform: [{ translateX: 1.5 }, { translateY: 2 }],
  },
  needleShaft: {
    width: 3.5,
    height: 74,
    borderRadius: 2,
    backgroundColor: C.goldDark,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: 'rgba(255,248,220,0.25)',
    borderRightWidth: 1,
    borderRightColor: '#4A3E28',
    marginBottom: 0,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.35,
        shadowRadius: 2,
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  needleHubOuter: {
    position: 'absolute',
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#232017',
    borderWidth: 1.5,
    borderColor: '#4A3F2C',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    zIndex: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.35,
        shadowRadius: 2,
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  needleHubInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#14120F',
    borderWidth: 1,
    borderColor: '#5A4F3A',
  },
  gaugeCenterFuel: { position: 'absolute', top: 90, zIndex: 3 },
  eLabel: {
    position: 'absolute',
    left: 4,
    top: 132,
    color: C.textMuted,
    fontSize: 24,
    fontWeight: '800',
  },
  fLabel: {
    position: 'absolute',
    right: 4,
    top: 132,
    color: C.green,
    fontSize: 24,
    fontWeight: '800',
  },
  gaugeCount: {
    textAlign: 'center',
    color: C.offWhite,
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    marginTop: -6,
    letterSpacing: 0.2,
  },
  gaugeCountLeft: { color: C.gold, fontWeight: '900' },
  gaugeCountSlash: {
    color: 'rgba(240,234,221,0.42)',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 1,
  },
  gaugeCountRight: { color: 'rgba(240,234,221,0.62)', fontWeight: '700' },
  gaugeCountLabel: {
    textAlign: 'center',
    fontSize: 12,
    lineHeight: 15,
    fontWeight: '800',
    color: C.textSec,
    letterSpacing: 1.8,
    marginTop: 2,
    marginBottom: 6,
  },
  statusBlock: {
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 2,
    gap: 4,
  },
  statusLineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  statusTitle: {
    color: C.goldMid,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  statusTitleLow: { color: C.goldDark },
  statusTitleTrack: { color: C.gold },
  statusTitleStrong: { color: C.goldMid },
  statusTitleFull: { color: C.greenLight },
  statusSubtitle: {
    textAlign: 'center',
    color: C.textSec,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '600',
    paddingHorizontal: 12,
  },

  targetCard: {
    marginHorizontal: 14,
    marginBottom: 18,
    backgroundColor: '#0E0D0A',
    borderWidth: 1,
    borderColor: C.borderGold,
    borderRadius: 12,
    padding: 14,
  },
  targetTitle: {
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '800',
    color: C.gold,
    letterSpacing: 2.2,
    textAlign: 'center',
    marginBottom: 12,
  },
  targetPumpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingHorizontal: 2,
    gap: 14,
  },
  targetPumpWrap: { position: 'relative' },
  targetPumpBadge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    backgroundColor: C.surfaceEl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  targetPumpBadgeDone: {
    borderWidth: 1.5,
    borderColor: C.goldMid,
    backgroundColor: '#1A1712',
  },
  targetCheck: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 17,
    height: 17,
    borderRadius: 9,
    backgroundColor: C.ctaGreen,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(39,80,59,0.85)',
  },
  targetSub: { textAlign: 'center', color: C.textSec, fontSize: 13, lineHeight: 18 },

  actionRow: { marginHorizontal: 14, marginBottom: 18, flexDirection: 'row', gap: 10 },
  actionCardWrap: { flex: 1 },
  actionPrimaryOuter: {
    borderRadius: 8,
    borderWidth: 2.5,
    borderColor: C.goldDark,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 5,
      },
      android: { elevation: 6 },
      default: {},
    }),
  },
  actionPrimaryInner: {
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'rgba(184,155,95,0.12)',
    overflow: 'hidden',
  },
  actionPrimaryAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 2.5,
    backgroundColor: C.goldDim,
    opacity: 0.65,
  },
  actionPrimarySheen: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    width: '58%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  actionPrimaryContent: {
    margin: 2,
    borderWidth: 1,
    borderColor: 'rgba(184,155,95,0.08)',
    borderRadius: 4,
    minHeight: 66,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  snackButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    backgroundColor: '#0D0C0A',
    borderWidth: 1.5,
    borderColor: 'rgba(39,80,59,0.55)',
    minHeight: 72,
  },
  snackButtonDisabled: { opacity: 0.45 },
  actionSnackPressed: { opacity: 0.88 },
  actionPlus: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.2,
    borderColor: C.greenLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionPlusSnack: {
    borderColor: C.borderSubtle,
    backgroundColor: '#12100C',
  },
  actionPlusPrimary: { backgroundColor: C.greenLight, borderColor: C.greenLight },
  actionTitle: { color: C.greenLight, fontSize: 15, lineHeight: 18, fontWeight: '900', letterSpacing: 1.2 },
  actionTitlePrimary: { color: C.white, letterSpacing: 1.4 },
  actionTitleSnack: {
    color: C.textSec,
    fontSize: 14,
    letterSpacing: 1,
    fontWeight: '800',
  },
  actionSub: { color: C.textSec, fontSize: 12, lineHeight: 15, marginTop: 1 },
  actionSubSnack: { color: C.textMuted, fontSize: 11, lineHeight: 14, marginTop: 1 },

  section: { marginHorizontal: 14, marginTop: 20, marginBottom: 18 },
  logHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  logLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 28,
    marginHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.borderGold,
    backgroundColor: '#0F0E0A',
  },
  logLoadingText: { color: C.textSec, fontSize: 13, fontWeight: '600' },
  logViewAll: { color: C.textSec, fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
  logCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.borderGold,
    backgroundColor: '#0F0E0A',
    overflow: 'hidden',
  },
  logRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#201E18',
  },
  logRowLast: { borderBottomWidth: 0 },
  logIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
  },
  logIconDone: { backgroundColor: '#112117', borderColor: C.greenLight },
  logIconPending: { backgroundColor: '#1A1712', borderColor: C.goldDim },
  logIconSnack: { backgroundColor: '#1D190F', borderColor: C.goldDark },
  logInfo: { flex: 1 },
  logTitle: { color: C.offWhite, fontSize: 17, lineHeight: 20, fontWeight: '800' },
  logTitleLine: { color: C.offWhite, fontSize: 15, lineHeight: 20, fontWeight: '700', flex: 1 },
  logSubtitle: { color: C.textMuted, fontSize: 12, lineHeight: 15, marginTop: 2 },
  logTime: { color: C.textSec, fontSize: 14, lineHeight: 17, marginRight: 8 },
  logSnackSpacer: { width: 18 },

  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  modalBackdropPress: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 28 : 16,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: C.borderGold,
    maxHeight: '88%',
  },
  modalTitle: {
    color: C.gold,
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 12,
    textAlign: 'center',
  },
  modalQuickWrap: { alignSelf: 'stretch', marginBottom: 14 },
  modalQuickInner: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(39,80,59,0.55)',
    backgroundColor: C.ctaGreen,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  modalQuickTitle: { color: C.white, fontSize: 16, fontWeight: '800', textAlign: 'center' },
  modalQuickSub: { color: C.textSec, fontSize: 12, marginTop: 4, textAlign: 'center' },
  modalSectionLabel: {
    color: C.textSec,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  modalSearch: {
    borderWidth: 1,
    borderColor: C.borderSubtle,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    color: C.offWhite,
    fontSize: 14,
    marginBottom: 10,
    backgroundColor: C.surfaceEl,
  },
  modalChipScroll: { marginBottom: 10, maxHeight: 40 },
  modalChipScrollInner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 8 },
  modalChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.borderSubtle,
    backgroundColor: C.surfaceEl,
  },
  modalChipSelected: {
    borderColor: C.goldDim,
    backgroundColor: '#1A1712',
  },
  modalChipText: { color: C.textSec, fontSize: 12, fontWeight: '700' },
  modalChipTextSelected: { color: C.goldMid },
  modalHint: { color: C.textMuted, fontSize: 12, marginBottom: 8, lineHeight: 16 },
  modalList: { maxHeight: 320, marginBottom: 8 },
  modalFoodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#201E18',
  },
  modalFoodRowPressed: { opacity: 0.85 },
  modalFoodRowBody: { flex: 1, paddingRight: 8 },
  modalFoodName: { color: C.offWhite, fontSize: 15, fontWeight: '600' },
  modalFoodMeta: { color: C.textMuted, fontSize: 11, marginTop: 4, fontWeight: '600' },
  modalTagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  modalTagChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#1A1814',
    borderWidth: 1,
    borderColor: 'rgba(184,155,95,0.2)',
  },
  modalTagChipText: { color: C.textSec, fontSize: 10, fontWeight: '700' },
  modalCancel: { alignItems: 'center', paddingVertical: 12 },
  modalCancelText: { color: C.textSec, fontSize: 14, fontWeight: '700' },
});
