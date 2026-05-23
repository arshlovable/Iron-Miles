import { supabase } from './supabase';

export const DAILY_MEAL_TARGET = 4;
/** Snack contribution to gauge needle (fraction of full scale). */
export const SNACK_BONUS_PER = 0.1;
/** Snack contribution to numeric meal-equivalent count (e.g. 1.5 / 4). */
export const SNACK_MEAL_EQUIVALENT = 0.5;

export type FuelLogType = 'meal' | 'snack';

/** One fuel log row with optional joined `foods` fields (name, calories). */
export type FuelLogRow = {
  id: string;
  user_id: string;
  log_type: FuelLogType;
  food_id: string | null;
  created_at: string;
  /** From `foods.name` when `food_id` joins; null for quick logs or missing food row. */
  food_name: string | null;
  /** From `foods.calories` when `food_id` joins; null when unknown. */
  food_calories: number | null;
};

function parseFoodJoin(raw: unknown): { name: string | null; calories: number | null } {
  if (raw == null) return { name: null, calories: null };
  const row = (Array.isArray(raw) ? raw[0] : raw) as Record<string, unknown> | null | undefined;
  if (!row || typeof row !== 'object') return { name: null, calories: null };
  const nameRaw = row.name;
  const name =
    nameRaw != null && String(nameRaw).trim() !== '' ? String(nameRaw).trim() : null;
  const calRaw = row.calories;
  let calories: number | null = null;
  if (calRaw != null && calRaw !== '') {
    const n = Number(calRaw);
    if (Number.isFinite(n) && n >= 0) calories = Math.round(n);
  }
  return { name, calories };
}

/**
 * Label shown in Today’s Log: joined food name, client catalog name, Quick Logged, or fallback.
 */
export function labelForFuelLog(log: FuelLogRow, foodNames: Map<string, string>): string {
  if (!log.food_id) return 'Quick Logged';
  if (log.food_name != null && log.food_name.trim() !== '') return log.food_name.trim();
  return foodNames.get(log.food_id) ?? 'Food item';
}

/** True when this log is a one-tap quick log (no catalog food linked). */
export function isQuickFuelLog(log: FuelLogRow): boolean {
  return log.food_id == null || log.food_id === '';
}

/**
 * Calories for Today’s Log: joined `foods.calories` first, then client catalog map (e.g. insert response edge cases).
 * Never returns a value for quick logs.
 */
export function resolveFuelLogCalories(
  log: FuelLogRow,
  foodCaloriesById: Map<string, number | null>
): number | null {
  if (isQuickFuelLog(log)) return null;
  if (log.food_calories != null && Number.isFinite(log.food_calories) && log.food_calories >= 0) {
    return Math.round(log.food_calories);
  }
  const fromCatalog = foodCaloriesById.get(log.food_id!);
  if (fromCatalog != null && Number.isFinite(fromCatalog) && fromCatalog >= 0) {
    return Math.round(fromCatalog);
  }
  return null;
}

/**
 * "Today" in the device local calendar: [local midnight, local end of day].
 * Uses JS local timezone; values sent to Supabase as ISO strings (instant in time).
 */
export function getTodayLocalDayBounds(): { start: Date; end: Date; label: 'local' } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  return { start, end, label: 'local' };
}

/** Fallback / tests: UTC calendar day [00:00:00Z, 23:59:59.999Z]. */
export function getTodayUtcDayBounds(): { start: Date; end: Date; label: 'utc' } {
  const now = new Date();
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 23, 59, 59, 999));
  return { start, end, label: 'utc' };
}

export function formatLogTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  } catch {
    return '--:--';
  }
}

export function countMealsAndSnacks(logs: FuelLogRow[]) {
  let meals = 0;
  let snacks = 0;
  for (const row of logs) {
    if (row.log_type === 'meal') meals += 1;
    else snacks += 1;
  }
  return { meals, snacks };
}

/** meal_score = meals / 4 (can exceed 1 before min); snack_bonus = snacks * 0.1; result capped at 1. */
export function computeFuelLevel(mealsCompleted: number, snacksToday: number): number {
  const mealScore = mealsCompleted / DAILY_MEAL_TARGET;
  const snackBonus = snacksToday * SNACK_BONUS_PER;
  return Math.min(1, mealScore + snackBonus);
}

/** Meal + snack count for labels: meal = 1, snack = 0.5 (e.g. 2 meals + 1 snack → 2.5). */
export function computeMealEquivalentTotal(meals: number, snacks: number): number {
  const m = Math.max(0, meals);
  const s = Math.max(0, snacks);
  return m + s * SNACK_MEAL_EQUIVALENT;
}

/**
 * Format numerator for "X / 4": whole numbers without decimals, halves as "n.5".
 * Integer meal/snack counts always yield 0.5 steps.
 */
export function formatMealEquivalentForGauge(meals: number, snacks: number): string {
  const halfUnits = meals * 2 + snacks;
  if (halfUnits % 2 === 0) return String(halfUnits / 2);
  return `${(halfUnits - 1) / 2}.5`;
}

export type FuelLogDisplayRow =
  | {
      kind: 'meal';
      id: string;
      mealIndex: number;
      time: string;
      /** Food name, Quick Logged, or Food item fallback. */
      detail: string;
      quickLogged: boolean;
      /** From joined `foods` (or client catalog fallback); null for quick logs / unknown. */
      calories: number | null;
    }
  | {
      kind: 'snack';
      id: string;
      time: string;
      detail: string;
      quickLogged: boolean;
      calories: number | null;
    }
  | { kind: 'meal_empty'; mealIndex: number };

/**
 * Chronological meal/snack rows, then placeholder rows for remaining meal slots (1..4).
 */
export function buildFuelLogDisplayRows(
  logs: FuelLogRow[],
  mealsCompleted: number,
  foodNames: Map<string, string>,
  foodCaloriesById: Map<string, number | null>
): FuelLogDisplayRow[] {
  const sorted = [...logs].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const rows: FuelLogDisplayRow[] = [];
  let mealOrdinal = 0;
  for (const log of sorted) {
    const detail = labelForFuelLog(log, foodNames);
    const quickLogged = isQuickFuelLog(log);
    const calories = resolveFuelLogCalories(log, foodCaloriesById);
    if (log.log_type === 'meal') {
      mealOrdinal += 1;
      rows.push({
        kind: 'meal',
        id: log.id,
        mealIndex: mealOrdinal,
        time: formatLogTime(log.created_at),
        detail,
        quickLogged,
        calories,
      });
    } else {
      rows.push({
        kind: 'snack',
        id: log.id,
        time: formatLogTime(log.created_at),
        detail,
        quickLogged,
        calories,
      });
    }
  }
  for (let k = mealsCompleted + 1; k <= DAILY_MEAL_TARGET; k++) {
    rows.push({ kind: 'meal_empty', mealIndex: k });
  }
  return rows;
}

const FUEL_LOG_SELECT = `
  id,
  user_id,
  log_type,
  food_id,
  created_at,
  foods (
    name,
    calories
  )
`;

function normalizeFuelLogRow(row: Record<string, unknown>): FuelLogRow {
  const { name: food_name, calories: food_calories } = parseFoodJoin(row.foods);
  return {
    id: String(row.id ?? ''),
    user_id: String(row.user_id ?? ''),
    log_type: row.log_type === 'snack' ? 'snack' : 'meal',
    food_id: row.food_id != null && row.food_id !== '' ? String(row.food_id) : null,
    created_at: String(row.created_at ?? ''),
    food_name,
    food_calories,
  };
}

export async function fetchTodayFuelLogs(userId: string): Promise<{ data: FuelLogRow[]; error: Error | null }> {
  const { start, end } = getTodayLocalDayBounds();
  try {
    const { data, error } = await supabase
      .from('fuel_logs')
      .select(FUEL_LOG_SELECT)
      .eq('user_id', userId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[fuel_logs] fetchTodayFuelLogs Supabase error:', error);
      return { data: [], error: new Error(error.message) };
    }
    const rows = (data ?? []).map((r) => normalizeFuelLogRow(r as Record<string, unknown>));
    return { data: rows, error: null };
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error('[fuel_logs] fetchTodayFuelLogs exception:', e);
    return { data: [], error: err };
  }
}

export async function insertFuelLog(
  userId: string,
  logType: FuelLogType,
  foodId?: string | null
): Promise<{ data: FuelLogRow | null; error: Error | null }> {
  try {
    const fid = foodId != null && foodId !== '' ? foodId : null;
    const payload: Record<string, unknown> = {
      user_id: userId,
      log_type: logType,
      food_id: fid,
    };

    const { data, error } = await supabase
      .from('fuel_logs')
      .insert(payload)
      .select(FUEL_LOG_SELECT)
      .single();

    if (error) {
      console.error('[fuel_logs] insertFuelLog Supabase error:', error);
      return { data: null, error: new Error(error.message) };
    }
    return { data: normalizeFuelLogRow(data as Record<string, unknown>), error: null };
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error('[fuel_logs] insertFuelLog exception:', e);
    return { data: null, error: err };
  }
}
