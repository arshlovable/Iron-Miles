import { supabase } from './supabase';

export const DAILY_MEAL_TARGET = 4;
export const SNACK_BONUS_PER = 0.1;

export type FuelLogType = 'meal' | 'snack';

export type FuelLogRow = {
  id: string;
  user_id: string;
  log_type: FuelLogType;
  food_id: string | null;
  created_at: string;
};

/**
 * Label shown in Today’s Log: linked food name, or Quick Logged, or fallback when catalog row is missing.
 */
export function labelForFuelLog(log: FuelLogRow, foodNames: Map<string, string>): string {
  if (!log.food_id) return 'Quick Logged';
  return foodNames.get(log.food_id) ?? 'Food item';
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

export type FuelLogDisplayRow =
  | { kind: 'meal'; id: string; mealIndex: number; time: string; detail: string }
  | { kind: 'snack'; id: string; time: string; detail: string }
  | { kind: 'meal_empty'; mealIndex: number };

/**
 * Chronological meal/snack rows, then placeholder rows for remaining meal slots (1..4).
 */
export function buildFuelLogDisplayRows(
  logs: FuelLogRow[],
  mealsCompleted: number,
  foodNames: Map<string, string>
): FuelLogDisplayRow[] {
  const sorted = [...logs].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const rows: FuelLogDisplayRow[] = [];
  let mealOrdinal = 0;
  for (const log of sorted) {
    const detail = labelForFuelLog(log, foodNames);
    if (log.log_type === 'meal') {
      mealOrdinal += 1;
      rows.push({
        kind: 'meal',
        id: log.id,
        mealIndex: mealOrdinal,
        time: formatLogTime(log.created_at),
        detail,
      });
    } else {
      rows.push({ kind: 'snack', id: log.id, time: formatLogTime(log.created_at), detail });
    }
  }
  for (let k = mealsCompleted + 1; k <= DAILY_MEAL_TARGET; k++) {
    rows.push({ kind: 'meal_empty', mealIndex: k });
  }
  return rows;
}

function normalizeFuelLogRow(row: Record<string, unknown>): FuelLogRow {
  return {
    id: String(row.id ?? ''),
    user_id: String(row.user_id ?? ''),
    log_type: row.log_type === 'snack' ? 'snack' : 'meal',
    food_id: row.food_id != null && row.food_id !== '' ? String(row.food_id) : null,
    created_at: String(row.created_at ?? ''),
  };
}

export async function fetchTodayFuelLogs(userId: string): Promise<{ data: FuelLogRow[]; error: Error | null }> {
  const { start, end } = getTodayLocalDayBounds();
  try {
    const { data, error } = await supabase
      .from('fuel_logs')
      .select('id, user_id, log_type, food_id, created_at')
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
    const payload: Record<string, unknown> = {
      user_id: userId,
      log_type: logType,
      food_id: foodId != null && foodId !== '' ? foodId : null,
    };

    const { data, error } = await supabase
      .from('fuel_logs')
      .insert(payload)
      .select('id, user_id, log_type, food_id, created_at')
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
