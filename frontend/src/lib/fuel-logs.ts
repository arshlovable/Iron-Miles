import { supabase } from './supabase';

export const DAILY_MEAL_TARGET = 4;
export const SNACK_BONUS_PER = 0.1;

export type FuelLogType = 'meal' | 'snack';

export type FuelLogRow = {
  id: string;
  user_id: string;
  log_type: FuelLogType;
  created_at: string;
};

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
  | { kind: 'meal'; id: string; mealIndex: number; time: string }
  | { kind: 'snack'; id: string; time: string }
  | { kind: 'meal_empty'; mealIndex: number };

/**
 * Chronological meal/snack rows, then placeholder rows for remaining meal slots (1..4).
 */
export function buildFuelLogDisplayRows(logs: FuelLogRow[], mealsCompleted: number): FuelLogDisplayRow[] {
  const sorted = [...logs].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const rows: FuelLogDisplayRow[] = [];
  let mealOrdinal = 0;
  for (const log of sorted) {
    if (log.log_type === 'meal') {
      mealOrdinal += 1;
      rows.push({
        kind: 'meal',
        id: log.id,
        mealIndex: mealOrdinal,
        time: formatLogTime(log.created_at),
      });
    } else {
      rows.push({ kind: 'snack', id: log.id, time: formatLogTime(log.created_at) });
    }
  }
  for (let k = mealsCompleted + 1; k <= DAILY_MEAL_TARGET; k++) {
    rows.push({ kind: 'meal_empty', mealIndex: k });
  }
  return rows;
}

export async function fetchTodayFuelLogs(userId: string): Promise<{ data: FuelLogRow[]; error: Error | null }> {
  const { start, end } = getTodayLocalDayBounds();
  try {
    const { data, error } = await supabase
      .from('fuel_logs')
      .select('id, user_id, log_type, created_at')
      .eq('user_id', userId)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[fuel_logs] fetchTodayFuelLogs Supabase error:', error);
      return { data: [], error: new Error(error.message) };
    }
    return { data: (data ?? []) as FuelLogRow[], error: null };
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error('[fuel_logs] fetchTodayFuelLogs exception:', e);
    return { data: [], error: err };
  }
}

export async function insertFuelLog(
  userId: string,
  logType: FuelLogType
): Promise<{ data: FuelLogRow | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('fuel_logs')
      .insert({ user_id: userId, log_type: logType })
      .select('id, user_id, log_type, created_at')
      .single();

    if (error) {
      console.error('[fuel_logs] insertFuelLog Supabase error:', error);
      return { data: null, error: new Error(error.message) };
    }
    return { data: data as FuelLogRow, error: null };
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error('[fuel_logs] insertFuelLog exception:', e);
    return { data: null, error: err };
  }
}
