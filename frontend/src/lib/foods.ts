import { supabase } from './supabase';

export type FoodOption = {
  id: string;
  name: string;
  type: string;
  category: string;
  protein: number | null;
  calories: number | null;
  tags: string[];
};

export type MealPickerCategory = 'all' | 'truck_stop' | 'restaurant' | 'meal_prep' | 'packaged';
export type SnackPickerCategory = 'all' | 'high_protein' | 'hydrating' | 'packaged';

const MEAL_CATEGORY_DB: Record<Exclude<MealPickerCategory, 'all'>, string> = {
  truck_stop: 'truck_stop_foods',
  restaurant: 'restaurants',
  meal_prep: 'meal_prep',
  packaged: 'packaged_foods',
};

function normalizeTags(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((t) => String(t).toLowerCase());
  }
  return [];
}

function normalizeFoodRow(row: Record<string, unknown>): FoodOption {
  return {
    id: String(row.id ?? ''),
    name: String(row.name ?? ''),
    type: String(row.type ?? '').toLowerCase(),
    category: String(row.category ?? '').toLowerCase(),
    protein: row.protein == null || row.protein === '' ? null : Math.round(Number(row.protein)),
    calories: row.calories == null || row.calories === '' ? null : Math.round(Number(row.calories)),
    tags: normalizeTags(row.tags),
  };
}

/** Short label for Today’s Log / picker rows (matches Supabase `foods.category`). */
export function categoryDisplayLabel(category: string): string {
  const c = category.toLowerCase();
  switch (c) {
    case 'restaurants':
      return 'Restaurant';
    case 'truck_stop_foods':
      return 'Truck Stop';
    case 'packaged_foods':
      return 'Packaged';
    case 'meal_prep':
      return 'Meal Prep';
    case 'gas_station_options':
      return 'Gas Station';
    default:
      return category ? category.replace(/_/g, ' ') : 'Food';
  }
}

export function filterFoodsForPicker(
  base: FoodOption[],
  opts: {
    logType: 'meal' | 'snack';
    search: string;
    mealCategory?: MealPickerCategory;
    snackCategory?: SnackPickerCategory;
  }
): FoodOption[] {
  const q = opts.search.trim().toLowerCase();
  let out = base;

  if (q) {
    out = out.filter((f) => {
      if (f.name.toLowerCase().includes(q)) return true;
      return f.tags.some((t) => t.includes(q));
    });
  }

  if (opts.logType === 'meal' && opts.mealCategory && opts.mealCategory !== 'all') {
    const dbCat = MEAL_CATEGORY_DB[opts.mealCategory];
    out = out.filter((f) => f.category === dbCat);
  }

  if (opts.logType === 'snack' && opts.snackCategory && opts.snackCategory !== 'all') {
    if (opts.snackCategory === 'packaged') {
      out = out.filter((f) => f.category === 'packaged_foods');
    } else if (opts.snackCategory === 'high_protein') {
      out = out.filter(
        (f) => f.tags.includes('high_protein') || f.tags.includes('lean_protein') || f.tags.includes('protein_source')
      );
    } else if (opts.snackCategory === 'hydrating') {
      out = out.filter((f) => f.tags.includes('hydration') || f.tags.includes('hydrating'));
    }
  }

  return out;
}

/** Active foods for Fuel pickers; returns empty list on failure so quick-log still works. */
export async function fetchActiveFoods(): Promise<{ data: FoodOption[]; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from('foods')
      .select('id,name,type,category,protein,calories,tags')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('[foods] fetchActiveFoods Supabase error:', error);
      return { data: [], error: new Error(error.message) };
    }
    const rows = (data ?? []).map((r) => normalizeFoodRow(r as Record<string, unknown>));
    return { data: rows, error: null };
  } catch (e) {
    const err = e instanceof Error ? e : new Error(String(e));
    console.error('[foods] fetchActiveFoods exception:', e);
    return { data: [], error: err };
  }
}

export function foodsForLogType(foods: FoodOption[], logType: 'meal' | 'snack'): FoodOption[] {
  if (logType === 'meal') {
    return foods.filter((f) => f.type === 'meal');
  }
  return foods.filter((f) => f.type === 'snack' || f.type === 'drink');
}

/** Up to two short tag chips for list rows (readable, minimal). */
export function pickFoodRowTagChips(tags: string[]): string[] {
  if (!tags.length) return [];
  const priority = ['high_protein', 'lean_protein', 'low_calorie', 'hydration', 'hydrating', 'balanced', 'portable'];
  const used = new Set<string>();
  const picked: string[] = [];
  for (const p of priority) {
    if (picked.length >= 2) break;
    if (tags.includes(p)) {
      const label = p.replace(/_/g, ' ');
      used.add(p);
      picked.push(label);
    }
  }
  for (const t of tags) {
    if (picked.length >= 2) break;
    if (used.has(t)) continue;
    used.add(t);
    picked.push(t.replace(/_/g, ' '));
  }
  return picked.slice(0, 2);
}
