import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Difficulty = "easy" | "medium" | "hard";
type LocationType = "in_cab" | "outside_truck" | "truck_stop";
type GoalType =
  | "build_muscle"
  | "burn_calories"
  | "mobility"
  | "back_pain_relief"
  | "wake_up_energy"
  | "stress_relief";
type EquipmentType = "bodyweight" | "bands" | "dumbbells" | "full";
type TimeBucket = "5" | "10" | "20" | "30+";
type TargetAreaNormalized = "full_body" | "upper_body" | "lower_body" | "core_back_relief";

type GenerateWorkoutRequest = {
  location_type: LocationType;
  equipment_type: EquipmentType;
  goal: GoalType;
  time: TimeBucket;
  difficulty: Difficulty;
  target_area: string;
  equipment_selected: string[];
  duration_minutes: number;
  workout_style: string;
  user_id?: string | null;
};

type ExerciseRow = {
  id: string;
  name: string;
  category?: string | null;
  target_muscle?: string | null;
  equipment_type?: string | null;
  workout_style?: string | null;
  sets_default?: number | null;
  reps_default?: string | null;
  instruction_text?: string | null;
  video_url?: string | null;
  thumbnail_url?: string | null;
  location_type?: string | null;
  movement_type?: string | null;
  movement_pattern?: string | null;
  duration_seconds?: number | null;
  is_active?: boolean | null;
  goal_tags?: unknown;
  difficulty_level?: string | null;
  difficulty?: string | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(status: number, payload: Record<string, unknown>) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function normalizeDifficulty(raw: unknown): Difficulty {
  if (typeof raw !== "string") return "medium";
  const s = raw.trim().toLowerCase();
  if (s === "easy" || s === "light") return "easy";
  if (s === "hard" || s === "intense") return "hard";
  if (s === "medium" || s === "moderate") return "medium";
  return "medium";
}

function normalizeLocationType(raw: unknown): LocationType {
  if (typeof raw !== "string") return "truck_stop";
  const s = raw.trim().toLowerCase();
  if (s === "in_cab" || s === "in-cab" || s === "cab") return "in_cab";
  if (s === "outside_truck" || s === "outside-truck") return "outside_truck";
  return "truck_stop";
}

function normalizeEquipmentType(raw: unknown): EquipmentType {
  if (typeof raw !== "string") return "bodyweight";
  const s = raw.trim().toLowerCase();
  if (s === "bands" || s === "band" || s === "resistance_bands") return "bands";
  if (s === "dumbbells" || s === "dumbbell") return "dumbbells";
  if (s === "full" || s === "all") return "full";
  return "bodyweight";
}

function normalizeGoal(raw: unknown): GoalType {
  if (typeof raw !== "string") return "build_muscle";
  const s = raw.trim().toLowerCase();
  if (s === "burn" || s === "cardio" || s === "cardio_burn") return "burn_calories";
  if (s === "back_relief" || s === "back-pain-relief") return "back_pain_relief";
  if (s === "wake_up" || s === "wake-up-energy") return "wake_up_energy";
  if (s === "stress" || s === "stress-relief") return "stress_relief";
  if (
    s === "build_muscle" ||
    s === "burn_calories" ||
    s === "mobility" ||
    s === "back_pain_relief" ||
    s === "wake_up_energy" ||
    s === "stress_relief"
  ) {
    return s as GoalType;
  }
  return "build_muscle";
}

function normalizeTime(raw: unknown): TimeBucket {
  const numeric = typeof raw === "number" ? raw : Number(String(raw ?? "").replace(/[^\d]/g, ""));
  if (numeric === 5) return "5";
  if (numeric === 10) return "10";
  if (numeric === 20) return "20";
  if (numeric >= 30) return "30+";
  const s = String(raw ?? "").trim();
  if (s === "30+" || s === "30 +") return "30+";
  return "10";
}

function durationFromTime(time: TimeBucket): number {
  if (time === "5") return 5;
  if (time === "10") return 10;
  if (time === "20") return 20;
  return 30;
}

function targetAreaFromGoal(goal: GoalType): string {
  if (goal === "back_pain_relief") return "back_relief";
  if (goal === "mobility" || goal === "stress_relief") return "mobility";
  return "full_body";
}

function normalizeTargetArea(raw: unknown): TargetAreaNormalized {
  const s = String(raw ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/-/g, "_");
  if (!s) return "full_body";
  if (s.includes("lower")) return "lower_body";
  if (s.includes("upper")) return "upper_body";
  if (s.includes("core") || s.includes("back_relief") || s.includes("back_pain") || s.includes("mobility")) {
    return "core_back_relief";
  }
  if (s.includes("full")) return "full_body";
  return "full_body";
}

function workoutStyleFromGoal(goal: GoalType): string {
  if (goal === "build_muscle") return "strength";
  if (goal === "burn_calories" || goal === "wake_up_energy") return "burn";
  return "mobility";
}

function equipmentListFromEquipmentType(eq: EquipmentType): string[] {
  if (eq === "full") return ["bodyweight", "bands", "dumbbells"];
  return [eq];
}

function equipmentFromLegacy(bodyObj: Record<string, unknown>): EquipmentType {
  const eqRaw = bodyObj.equipment_selected;
  if (!Array.isArray(eqRaw) || eqRaw.length === 0) return "bodyweight";
  const items = eqRaw
    .map((v) => String(v ?? "").trim().toLowerCase())
    .filter((v) => Boolean(v));
  const hasBodyweight = items.includes("bodyweight");
  const hasBands = items.includes("bands");
  const hasDumbbells = items.includes("dumbbells");
  if (hasBodyweight && hasBands && hasDumbbells) return "full";
  if (hasDumbbells) return "dumbbells";
  if (hasBands) return "bands";
  return "bodyweight";
}

function goalFromLegacy(bodyObj: Record<string, unknown>): GoalType {
  const rawGoal = bodyObj.goal;
  if (typeof rawGoal === "string" && rawGoal.trim()) {
    return normalizeGoal(rawGoal);
  }

  const workoutStyle = String(bodyObj.workout_style ?? "").trim().toLowerCase();
  if (workoutStyle === "burn") return "burn_calories";
  if (workoutStyle === "mobility") return "mobility";

  const targetArea = String(bodyObj.target_area ?? "").trim().toLowerCase();
  if (targetArea === "back_relief" || targetArea === "back_pain_relief") return "back_pain_relief";
  if (targetArea === "core_back_relief") return "back_pain_relief";
  if (targetArea === "mobility") return "mobility";
  return "build_muscle";
}

function locationFromLegacy(bodyObj: Record<string, unknown>): LocationType {
  if (typeof bodyObj.location_type === "string") return normalizeLocationType(bodyObj.location_type);
  return "truck_stop";
}

function validateBody(body: unknown): { valid: true; value: GenerateWorkoutRequest } | { valid: false; message: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, message: "Invalid JSON body." };
  }

  const bodyObj = body as Record<string, unknown>;
  const hasNewInputShape =
    typeof bodyObj.location_type === "string" ||
    typeof bodyObj.equipment_type === "string" ||
    typeof bodyObj.goal === "string" ||
    bodyObj.time !== undefined;
  const hasLegacyShape =
    typeof bodyObj.target_area === "string" ||
    Array.isArray(bodyObj.equipment_selected) ||
    bodyObj.duration_minutes !== undefined ||
    typeof bodyObj.workout_style === "string";

  if (!hasNewInputShape && !hasLegacyShape) {
    return {
      valid: false,
      message:
        "Request must include either new inputs (location_type, equipment_type, goal, time) or legacy inputs (target_area, equipment_selected, duration_minutes, workout_style).",
    };
  }

  const locationType = hasNewInputShape ? normalizeLocationType(bodyObj.location_type) : locationFromLegacy(bodyObj);
  const equipmentType = hasNewInputShape
    ? normalizeEquipmentType(bodyObj.equipment_type)
    : equipmentFromLegacy(bodyObj);
  const goal = hasNewInputShape ? normalizeGoal(bodyObj.goal) : goalFromLegacy(bodyObj);
  const time = hasNewInputShape ? normalizeTime(bodyObj.time) : normalizeTime(bodyObj.duration_minutes);
  const difficulty = normalizeDifficulty(bodyObj.difficulty);
  const durationMinutes = durationFromTime(time);
  const targetAreaInput = typeof bodyObj.target_area === "string" ? bodyObj.target_area : targetAreaFromGoal(goal);
  const targetArea = normalizeTargetArea(targetAreaInput);
  const workoutStyle = workoutStyleFromGoal(goal);
  // Preserve the full multi-equipment array the user selected.
  // equipmentFromLegacy collapses ['bodyweight','bands'] → 'bands' (loses bodyweight).
  // We capture the raw array here so downstream filtering can match ANY selected type.
  const rawEqList = Array.isArray(bodyObj.equipment_selected)
    ? (bodyObj.equipment_selected as unknown[])
        .map((v) => String(v ?? "").trim().toLowerCase())
        .filter((v) => ["bodyweight", "bands", "dumbbells"].includes(v))
    : [];
  const equipmentSelected = rawEqList.length > 0
    ? rawEqList
    : equipmentListFromEquipmentType(equipmentType);

  return {
    valid: true,
    value: {
      location_type: locationType,
      equipment_type: equipmentType,
      goal,
      time,
      difficulty,
      target_area: targetArea,
      equipment_selected: equipmentSelected,
      duration_minutes: durationMinutes,
      workout_style: workoutStyle,
      user_id: typeof bodyObj.user_id === "string" ? bodyObj.user_id : null,
    },
  };
}

function desiredExerciseCount(time: TimeBucket, difficulty: Difficulty): number {
  if (time === "5") return 3;
  if (time === "10") return 4;
  if (time === "20") {
    if (difficulty === "hard") return 6;
    return 5;
  }
  if (difficulty === "easy") return 6;
  if (difficulty === "hard") return 8;
  return 7;
}

function dedupeById(items: ExerciseRow[]): ExerciseRow[] {
  const seen = new Set<string>();
  const out: ExerciseRow[] = [];
  for (const item of items) {
    if (!item.id || seen.has(item.id)) continue;
    seen.add(item.id);
    out.push(item);
  }
  return out;
}

function normalizeTags(raw: unknown): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.map((v) => String(v ?? "").toLowerCase().trim()).filter(Boolean);
  }
  const s = String(raw ?? "").trim().toLowerCase();
  if (!s) return [];
  if (s.startsWith("[") && s.endsWith("]")) {
    try {
      const parsed = JSON.parse(s);
      if (Array.isArray(parsed)) {
        return parsed.map((v) => String(v ?? "").toLowerCase().trim()).filter(Boolean);
      }
    } catch {
      // ignore and fallback to comma split
    }
  }
  return s.split(",").map((v) => v.trim()).filter(Boolean);
}

const GOAL_SYNONYMS: Record<GoalType, string[]> = {
  build_muscle: ["build_muscle", "strength", "muscle", "hypertrophy", "power"],
  burn_calories: ["burn_calories", "burn", "cardio", "conditioning", "fat_loss", "metcon"],
  mobility: ["mobility", "flexibility", "reset", "recovery"],
  back_pain_relief: ["back_pain_relief", "back_relief", "spine", "lumbar", "posture"],
  wake_up_energy: ["wake_up_energy", "energy", "activation", "morning"],
  stress_relief: ["stress_relief", "decompress", "breathing", "relax"],
};

function goalTagsForExercise(exercise: ExerciseRow): string[] {
  const directTags = normalizeTags(exercise.goal_tags);
  const categoryTags = normalizeTags(exercise.category);
  const styleTags = normalizeTags(exercise.workout_style);
  return [...new Set([...directTags, ...categoryTags, ...styleTags])];
}

function goalMatch(exercise: ExerciseRow, goal: GoalType): boolean {
  const tags = goalTagsForExercise(exercise);
  const wanted = GOAL_SYNONYMS[goal];
  return wanted.some((w) => tags.some((t) => t.includes(w)));
}

function difficultyAffinity(exercise: ExerciseRow): Difficulty {
  const byColumn = String(exercise.difficulty_level ?? exercise.difficulty ?? "").toLowerCase();
  if (byColumn.includes("easy")) return "easy";
  if (byColumn.includes("hard")) return "hard";

  const name = String(exercise.name ?? "").toLowerCase();
  if (
    /(pistol|single[\s-]leg|one[\s-]arm|jump|burpee|plyo|explosive|handstand|loaded|weighted|tempo)/i.test(
      name,
    )
  ) {
    return "hard";
  }
  if (/(wall|knee|assisted|seated|supported|modified|cat|cow|child)/i.test(name)) return "easy";
  return "medium";
}

function normalizedMovementType(exercise: ExerciseRow): "reps" | "hold" | "carry" {
  const columnType = String(exercise.movement_type ?? "").toLowerCase().trim();
  if (columnType === "hold") return "hold";
  if (columnType === "carry") return "carry";
  if (columnType === "reps" || columnType === "time") return columnType === "time" ? "hold" : "reps";

  const name = String(exercise.name ?? "").toLowerCase();
  if (/(carry|farmer|suitcase)/i.test(name)) return "carry";
  if (/(hold|plank|wall sit|isometric|dead hang)/i.test(name)) return "hold";
  return "reps";
}

type GoalSlot =
  | "squat_or_push"
  | "hinge_or_pull"
  | "core"
  | "accessory_or_carry"
  | "lower_body"
  | "push_or_pull"
  | "conditioning"
  | "mobility_reset"
  | "hinge_drill"
  | "glute_bridge"
  | "core_stability"
  | "thoracic_mobility";

function slotMatches(exercise: ExerciseRow, slot: GoalSlot): boolean {
  const name = String(exercise.name ?? "").toLowerCase();
  const category = String(exercise.category ?? "").toLowerCase();
  const target = String(exercise.target_muscle ?? "").toLowerCase();

  switch (slot) {
    case "squat_or_push":
      return /(squat|lunge|push|press)/i.test(name) || /(legs|quads|chest|shoulder)/i.test(category + target);
    case "hinge_or_pull":
      return /(hinge|deadlift|good morning|row|pull)/i.test(name) || /(back|hamstring|glute)/i.test(category + target);
    case "core":
      return /(core|plank|dead bug|hollow|ab|oblique|sit[\s-]?up|crunch)/i.test(name + " " + category + " " + target);
    case "accessory_or_carry":
      return /(carry|raise|curl|extension|calf|accessory|stability)/i.test(name + " " + category);
    case "lower_body":
      return /(squat|lunge|step[\s-]?up|hinge|deadlift|glute|calf)/i.test(name + " " + category + " " + target);
    case "push_or_pull":
      return /(push|press|pull|row)/i.test(name + " " + category);
    case "conditioning":
      return /(climber|carry|burpee|jump|sprint|skater|conditioning|cardio)/i.test(name + " " + category);
    case "mobility_reset":
      return /(mobility|stretch|flow|reset|breathing|thoracic|rotation|cat|cow|child)/i.test(name + " " + category);
    case "hinge_drill":
      return /(hinge|good morning|hip hinge|rdl|deadlift)/i.test(name + " " + category);
    case "glute_bridge":
      return /(glute bridge|bridge|hip thrust)/i.test(name + " " + category);
    case "core_stability":
      return /(bird dog|dead bug|plank|core stability|anti[-\s]?rotation|pallof)/i.test(name + " " + category);
    case "thoracic_mobility":
      return /(thoracic|t-spine|rotation|open book|mobility|cat|cow)/i.test(name + " " + category);
    default:
      return true;
  }
}

function templateSlots(goal: GoalType, targetCount: number): GoalSlot[] {
  if (goal === "build_muscle") {
    const base: GoalSlot[] = ["squat_or_push", "hinge_or_pull", "core", "accessory_or_carry"];
    while (base.length < targetCount) base.push("push_or_pull");
    return base.slice(0, targetCount);
  }
  if (goal === "burn_calories" || goal === "wake_up_energy") {
    const base: GoalSlot[] = ["lower_body", "push_or_pull", "core", "conditioning"];
    while (base.length < targetCount) base.push("conditioning");
    return base.slice(0, targetCount);
  }
  if (goal === "mobility" || goal === "stress_relief") {
    const base = Array.from({ length: Math.max(3, Math.min(4, targetCount)) }).map(() => "mobility_reset" as GoalSlot);
    while (base.length < targetCount) base.push("mobility_reset");
    return base.slice(0, targetCount);
  }
  const base: GoalSlot[] = ["hinge_drill", "glute_bridge", "core_stability", "thoracic_mobility"];
  while (base.length < targetCount) base.push("mobility_reset");
  return base.slice(0, targetCount);
}

type Scored = { ex: ExerciseRow; baseScore: number; phase: number };

function scoreExercise(exercise: ExerciseRow, payload: GenerateWorkoutRequest): number {
  let score = 0;
  const rowLocation = String(exercise.location_type ?? "").toLowerCase();
  if (rowLocation && rowLocation === payload.location_type) score += 3;

  // Multi-equipment: award bonus when exercise matches any of the user's selected types.
  if (equipmentMatchMulti(exercise, payload.equipment_selected)) score += 3;

  if (goalMatch(exercise, payload.goal)) score += 2;
  if (difficultyAffinity(exercise) === payload.difficulty) score += 1;

  // Trucker-relevance bonus: posture, hips, lower back, shoulder health are high-value
  // for long-haul drivers and should be prioritised when available.
  const text = lowerText(exercise);
  if (hasAny(text, [
    /posture/, /face pull/, /pull.apart/, /band pull/,
    /bird dog/, /dead bug/,
    /hip flexor/, /hip thrust/, /thoracic/, /thoracic_mobility/,
    /lower.back/, /decompression/, /spine_decompression/,
    /glute bridge/, /shoulder circle/, /cat.cow/,
  ])) {
    score += 1;
  }
  return score;
}

// Returns inter-set rest in seconds based on workout style and difficulty.
// Returns 0 for mobility — frontend uses this to skip the timer entirely.
function restSecondsForStyle(workoutStyle: string, difficulty: Difficulty): number {
  const style = workoutStyle.toLowerCase().trim();
  if (style === "burn" || style === "burn_calories") {
    return difficulty === "easy" ? 15 : difficulty === "hard" ? 30 : 20;
  }
  if (style === "mobility") return 0;
  // Default: strength / build_muscle
  return difficulty === "hard" ? 45 : 60;
}

function assignByDifficultyAndMovement(
  movementType: "reps" | "hold" | "carry",
  difficulty: Difficulty,
): { sets: number; repsAssigned: string; durationSeconds: number | null } {
  const sets = difficulty === "easy" ? 2 : difficulty === "hard" ? 4 : 3;

  if (movementType === "hold" || movementType === "carry") {
    const durationSeconds = difficulty === "easy" ? 20 : difficulty === "hard" ? 45 : 30;
    return {
      sets,
      repsAssigned: `${durationSeconds} sec`,
      durationSeconds,
    };
  }

  const repsAssigned = difficulty === "easy" ? "8-10" : difficulty === "hard" ? "12-20" : "10-15";
  return {
    sets,
    repsAssigned,
    durationSeconds: null,
  };
}

async function fetchRowsWithStrictLocation(
  supabase: ReturnType<typeof createClient>,
  payload: GenerateWorkoutRequest,
): Promise<{ rows: ExerciseRow[]; supportsLocation: boolean; supportsEquipment: boolean }> {
  const withLocation = await supabase
    .from("exercises")
    .select("*")
    .eq("is_active", true)
    .or(`location_type.eq.${payload.location_type},location_type.is.null`)
    .order("name", { ascending: true })
    .limit(800);

  const locationErr = withLocation.error;
  if (!locationErr) {
    const rows = (withLocation.data ?? []) as ExerciseRow[];
    // Only trust the location-scoped result when it actually contains rows.
    // An empty result likely means exercises lack the location_type column value
    // (e.g. all rows are NULL / a different value), so fall through to fetch all.
    if (rows.length > 0) {
      return { rows, supportsLocation: true, supportsEquipment: rows.some((r) => Boolean(r.equipment_type)) };
    }
    console.warn("[generate-workout] location-scoped query returned 0 rows; falling back to full library fetch");
  } else {
    const locationMissing =
      locationErr.code === "42703" || String(locationErr.message ?? "").toLowerCase().includes("location_type");
    if (!locationMissing) {
      throw locationErr;
    }
    console.warn("[generate-workout] location_type column missing in DB; falling back to full library fetch");
  }

  const fallbackAll = await supabase.from("exercises").select("*").eq("is_active", true).order("name", { ascending: true }).limit(800);
  if (fallbackAll.error) throw fallbackAll.error;
  const rows = (fallbackAll.data ?? []) as ExerciseRow[];
  return { rows, supportsLocation: false, supportsEquipment: rows.some((r) => Boolean(r.equipment_type)) };
}

function filterByEquipment(rows: ExerciseRow[], equipmentType: EquipmentType): ExerciseRow[] {
  if (equipmentType === "full") {
    return rows.filter((r) => ["bodyweight", "bands", "dumbbells"].includes(String(r.equipment_type ?? "").toLowerCase()));
  }
  return rows.filter((r) => String(r.equipment_type ?? "").toLowerCase() === equipmentType);
}

function filterByGoal(rows: ExerciseRow[], goal: GoalType): ExerciseRow[] {
  return rows.filter((r) => goalMatch(r, goal));
}

const CORE_BACK_RELIEF_PATTERN_ORDER: Record<string, number> = {
  spine_decompression: 1,
  spine_mobility: 2,
  activation: 3,
  core_stability: 4,
};

function normalizeCoreBackReliefDuration(raw: unknown): 5 | 10 | 15 {
  const n = typeof raw === "number" ? raw : Number(String(raw ?? "").replace(/[^\d]/g, ""));
  if (n <= 7) return 5;
  if (n <= 12) return 10;
  return 15;
}

function desiredCoreBackReliefCount(durationMinutes: number, difficulty: Difficulty): number {
  if (durationMinutes <= 5) return 3;
  if (durationMinutes <= 10) return difficulty === "easy" ? 4 : 5;
  return difficulty === "easy" ? 5 : 6;
}

function isCoreCategory(exercise: ExerciseRow): boolean {
  return String(exercise.category ?? "").toLowerCase() === "core";
}

function isBackStretchExercise(exercise: ExerciseRow): boolean {
  const category = String(exercise.category ?? "").toLowerCase();
  const pattern = String(exercise.movement_pattern ?? "").toLowerCase();
  const tags = normalizeTags(exercise.goal_tags);
  const name = String(exercise.name ?? "").toLowerCase();
  return (
    category === "mobility" ||
    pattern.startsWith("spine_") ||
    tags.some((t) => t.includes("back") || t.includes("mobility")) ||
    /(cat|cow|child|twist|stretch|decompression|mobility|pelvic tilt|forward fold|knee-to-chest)/i.test(name)
  );
}

function isCoreBackReliefCandidate(exercise: ExerciseRow): boolean {
  const category = String(exercise.category ?? "").toLowerCase();
  const tags = normalizeTags(exercise.goal_tags);
  return category === "core" || category === "mobility" || tags.some((t) => t.includes("back") || t.includes("mobility"));
}

function movementPatternRank(exercise: ExerciseRow): number {
  const key = String(exercise.movement_pattern ?? "").toLowerCase();
  return CORE_BACK_RELIEF_PATTERN_ORDER[key] ?? 999;
}

function scoreCoreBackReliefExercise(exercise: ExerciseRow, difficulty: Difficulty): number {
  const patternRank = movementPatternRank(exercise);
  const isCore = isCoreCategory(exercise);
  const isStretch = isBackStretchExercise(exercise);
  const name = String(exercise.name ?? "").toLowerCase();
  const hasCoreStabilitySignal =
    String(exercise.movement_pattern ?? "").toLowerCase() === "core_stability" ||
    /(plank|dead bug|bird dog|hollow|anti[-\s]?rotation|core stability)/i.test(name);

  let score = 0;
  if (patternRank < 999) score += 2;

  if (difficulty === "easy") {
    if (isStretch) score += 5;
    if (isCore) score += 2;
    if (hasCoreStabilitySignal) score += 1;
  } else if (difficulty === "medium") {
    if (isStretch) score += 4;
    if (isCore) score += 4;
    if (hasCoreStabilitySignal) score += 2;
  } else {
    if (isCore) score += 5;
    if (hasCoreStabilitySignal) score += 4;
    if (isStretch) score += 2;
  }

  if (difficultyAffinity(exercise) === difficulty) score += 1;
  return score;
}

function pickCoreBackReliefExercises(
  rows: ExerciseRow[],
  needed: number,
  difficulty: Difficulty,
): ExerciseRow[] {
  const deduped = dedupeById(rows);
  const scored = [...deduped].sort((a, b) => {
    const diff = scoreCoreBackReliefExercise(b, difficulty) - scoreCoreBackReliefExercise(a, difficulty);
    if (diff !== 0) return diff;
    return String(a.name ?? "").localeCompare(String(b.name ?? ""));
  });

  const stretch = scored.filter((r) => isBackStretchExercise(r));
  const core = scored.filter((r) => isCoreCategory(r));

  let stretchTarget = 0;
  let coreTarget = 0;
  if (difficulty === "easy") {
    stretchTarget = Math.max(1, Math.ceil(needed * 0.6));
    coreTarget = needed - stretchTarget;
  } else if (difficulty === "hard") {
    coreTarget = Math.max(1, Math.ceil(needed * 0.6));
    stretchTarget = needed - coreTarget;
  } else {
    stretchTarget = Math.ceil(needed / 2);
    coreTarget = needed - stretchTarget;
  }

  const picked: ExerciseRow[] = [];
  const used = new Set<string>();

  const takeFrom = (arr: ExerciseRow[], limit: number) => {
    for (const ex of arr) {
      if (picked.length >= needed) return;
      if (limit <= 0) return;
      if (!ex.id || used.has(ex.id)) continue;
      picked.push(ex);
      used.add(ex.id);
      limit -= 1;
    }
  };

  takeFrom(stretch, stretchTarget);
  takeFrom(core, coreTarget);

  for (const ex of scored) {
    if (picked.length >= needed) break;
    if (!ex.id || used.has(ex.id)) continue;
    picked.push(ex);
    used.add(ex.id);
  }

  picked.sort((a, b) => {
    const rankDiff = movementPatternRank(a) - movementPatternRank(b);
    if (rankDiff !== 0) return rankDiff;
    return String(a.name ?? "").localeCompare(String(b.name ?? ""));
  });

  return picked.slice(0, needed);
}

async function generateCoreBackReliefWorkout(
  supabase: ReturnType<typeof createClient>,
  bodyObj: Record<string, unknown>,
): Promise<Response> {
  const difficulty = normalizeDifficulty(bodyObj.difficulty);
  const durationMinutes = normalizeCoreBackReliefDuration(bodyObj.duration_minutes ?? bodyObj.time);
  const userId = typeof bodyObj.user_id === "string" ? bodyObj.user_id : null;
  const workoutStyle =
    typeof bodyObj.workout_style === "string" && bodyObj.workout_style.trim()
      ? bodyObj.workout_style.trim()
      : "mobility";
  const equipmentSelected = Array.isArray(bodyObj.equipment_selected)
    ? bodyObj.equipment_selected.map((v) => String(v ?? "").toLowerCase().trim()).filter(Boolean)
    : ["bodyweight"];

  const { data, error } = await supabase
    .from("exercises")
    .select("*")
    .eq("is_active", true)
    .order("name", { ascending: true })
    .limit(1200);
  if (error) {
    console.error("core_back_relief exercise fetch failed", error);
    return jsonResponse(500, { error: "Failed to load exercise library." });
  }

  const allRows = (data ?? []) as ExerciseRow[];
  const activeRows = allRows.filter((r) => r.is_active !== false);

  const filtered = activeRows.filter((r) => isCoreBackReliefCandidate(r));
  const stretchRows = filtered.filter((r) => isBackStretchExercise(r));

  let pool = filtered;
  if (stretchRows.length === 0) {
    console.warn("No back stretch exercises found in library");
    pool = activeRows.filter((r) => isCoreCategory(r));
  }

  if (pool.length === 0) {
    return jsonResponse(404, { error: "No matching core/back relief exercises found in library." });
  }

  const needed = desiredCoreBackReliefCount(durationMinutes, difficulty);
  const selectedExercises = pickCoreBackReliefExercises(pool, needed, difficulty);
  if (selectedExercises.length === 0) {
    return jsonResponse(404, { error: "No matching core/back relief exercises found in library." });
  }

  const { data: workoutRows, error: workoutInsertError } = await supabase
    .from("generated_workouts")
    .insert({
      user_id: userId,
      title: `Core / Back Relief - ${durationMinutes} min`,
      target_area: "core_back_relief",
      equipment_selected: equipmentSelected.length > 0 ? equipmentSelected : ["bodyweight"],
      duration_minutes: durationMinutes,
      workout_style: workoutStyle,
      iron_miles_reward: durationMinutes,
      status: "generated",
    })
    .select("*")
    .limit(1);

  if (workoutInsertError || !workoutRows || workoutRows.length === 0) {
    console.error("core_back_relief generated_workouts insert failed", workoutInsertError);
    return jsonResponse(500, { error: "Failed to create generated workout record." });
  }

  const generatedWorkout = workoutRows[0];
  const generatedWorkoutId = generatedWorkout.id;

  const assignmentRows = selectedExercises.map((exercise, index) => {
    const movementType = normalizedMovementType(exercise);
    const assignment = assignByDifficultyAndMovement(movementType, difficulty);
    return {
      generated_workout_id: generatedWorkoutId,
      exercise_id: exercise.id,
      exercise_order: index + 1,
      sets_assigned: assignment.sets,
      reps_assigned: assignment.repsAssigned,
      instruction_override: null,
    };
  });

  const { error: assignmentInsertError } = await supabase.from("generated_workout_exercises").insert(assignmentRows);
  if (assignmentInsertError) {
    console.error("core_back_relief generated_workout_exercises insert failed", assignmentInsertError);
    return jsonResponse(500, { error: "Failed to create generated workout exercise records." });
  }

  const exercises = selectedExercises.map((ex, index) => {
    const movementType = normalizedMovementType(ex);
    const assignment = assignByDifficultyAndMovement(movementType, difficulty);
    return {
      exercise_id: ex.id,
      name: ex.name,
      equipment_type: ex.equipment_type,
      workout_style: ex.workout_style ?? workoutStyle,
      category: ex.category,
      movement_type: movementType,
      movement_pattern: ex.movement_pattern ?? null,
      sets_assigned: assignment.sets,
      reps_assigned: assignment.repsAssigned,
      duration_seconds: assignment.durationSeconds,
      rest_seconds: restSecondsForStyle(workoutStyle, difficulty),
      exercise_order: index + 1,
      sets: String(assignment.sets),
      reps: String(assignment.repsAssigned),
      instruction: ex.instruction_text ?? "",
      order: index + 1,
    };
  });

  return jsonResponse(200, {
    generated_workout: generatedWorkout,
    exercises,
  });
}

function movementPattern(exercise: ExerciseRow): string {
  return String(exercise.movement_pattern ?? "").toLowerCase().trim();
}

function lowerText(exercise: ExerciseRow): string {
  const tags = normalizeTags(exercise.goal_tags).join(" ");
  return [
    String(exercise.name ?? ""),
    String(exercise.category ?? ""),
    String(exercise.target_muscle ?? ""),
    String(exercise.workout_style ?? ""),
    movementPattern(exercise),
    tags,
  ]
    .join(" ")
    .toLowerCase();
}

function hasAny(text: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(text));
}

function isLowerBodyExercise(exercise: ExerciseRow): boolean {
  // Primary: trust explicit category value before falling through to text matching.
  const cat = String(exercise.category ?? "").toLowerCase().trim();
  const lowerCats = ["lower_body", "legs", "glutes", "hamstrings", "quads", "calves"];
  const upperCats = ["upper_body", "chest", "back", "shoulders", "arms", "biceps", "triceps"];
  if (lowerCats.includes(cat)) return true;
  if (upperCats.includes(cat) || cat === "core" || cat === "mobility") return false;

  // Secondary: text-pattern matching for exercises with generic categories.
  const text = lowerText(exercise);
  const allowed = hasAny(text, [
    /squat/,
    /lunge/,
    /step[\s-]?up/,
    /hinge/,
    /deadlift/,
    /rdl/,
    /romanian/,
    /posterior/,
    /single[\s-]?leg/,
    /glute/,
    /hamstring/,
    /quad/,
    /calf/,
    /wall sit/,
    /good morning/,
    /hip thrust/,
    /bridge/,
    /split squat/,
    /carry/,
    /squat_pattern/,
    /posterior_chain/,
  ]);
  const disallowed = hasAny(text, [
    /arnold press/,
    /shoulder press/,
    /floor press/,
    /chest press/,
    /face pull/,
    /lat pulldown/,
    /one[\s-]?arm row/,
    /push[\s-]?up/,
    /\brow\b/,
    /\bpress\b/,
    /\bchest\b/,
    /\bshoulder\b/,
    /\bupper_body\b/,
  ]);
  return allowed && !disallowed;
}

function isUpperBodyExercise(exercise: ExerciseRow): boolean {
  // Primary: trust explicit category value before falling through to text matching.
  const cat = String(exercise.category ?? "").toLowerCase().trim();
  const upperCats = ["upper_body", "chest", "back", "shoulders", "arms", "biceps", "triceps"];
  const lowerCats = ["lower_body", "legs", "glutes", "hamstrings", "quads", "calves"];
  if (upperCats.includes(cat)) return true;
  if (lowerCats.includes(cat) || cat === "core" || cat === "mobility") return false;

  // Secondary: text-pattern matching for exercises with generic categories.
  const text = lowerText(exercise);
  const allowed = hasAny(text, [
    /push[\s-]?up/,
    /\bpush\b/,
    /\bpress\b/,
    /\bpull\b/,
    /\brow\b/,
    /lat pulldown/,
    /face pull/,
    /shoulder/,
    /chest/,
    /\bback\b/,
    /\barm\b/,
    /upper_body/,
    /shrug/,
    /rear delt/,
    /arnold/,
  ]);
  const disallowed = hasAny(text, [
    /squat/,
    /lunge/,
    /step[\s-]?up/,
    /hinge/,
    /deadlift/,
    /rdl/,
    /glute/,
    /hamstring/,
    /quad/,
    /calf/,
    /single[\s-]?leg/,
  ]);
  return allowed && !disallowed;
}

function isCoreBackReliefExercise(exercise: ExerciseRow): boolean {
  const text = lowerText(exercise);
  const allowed = hasAny(text, [
    /\bcore\b/,
    /core_stability/,
    /back_pain_relief/,
    /mobility/,
    /spine_decompression/,
    /spine_mobility/,
    /activation/,
    /lower_back/,
    /upper_back/,
    /dead bug/,
    /plank/,
    /bird dog/,
    /pallof/,
    /cat[\s-]?cow/,
    /spinal twist/,
    /forward fold/,
    /knee[\s-]?to[\s-]?chest/,
    /pelvic tilt/,
    /child/,
    /cobra/,
  ]);
  const disallowed = hasAny(text, [
    /arnold press/,
    /shoulder press/,
    /floor press/,
    /one[\s-]?arm row/,
    /\bchest press\b/,
    /split squat/,
    /goblet squat/,
    /romanian deadlift/,
  ]);
  return allowed && !disallowed;
}

function matchesTargetArea(exercise: ExerciseRow, targetArea: TargetAreaNormalized): boolean {
  if (targetArea === "lower_body") return isLowerBodyExercise(exercise);
  if (targetArea === "upper_body") return isUpperBodyExercise(exercise);
  if (targetArea === "core_back_relief") return isCoreBackReliefExercise(exercise);
  return true;
}

function styleOrGoalMatch(exercise: ExerciseRow, payload: GenerateWorkoutRequest): boolean {
  const rowStyle = String(exercise.workout_style ?? "").toLowerCase().trim();
  const desiredStyle = String(payload.workout_style ?? "").toLowerCase().trim();
  if (rowStyle && desiredStyle && rowStyle === desiredStyle) return true;
  return goalMatch(exercise, payload.goal);
}

function equipmentMatch(exercise: ExerciseRow, equipmentType: EquipmentType): boolean {
  const rowEquipment = String(exercise.equipment_type ?? "").toLowerCase().trim();
  if (equipmentType === "full") return ["bodyweight", "bands", "dumbbells"].includes(rowEquipment);
  return rowEquipment === equipmentType;
}

// Matches ANY equipment type from the user's multi-select array.
// Falls back to true (include everything) when the list is empty.
function equipmentMatchMulti(exercise: ExerciseRow, list: string[]): boolean {
  if (list.length === 0) return true;
  const rowEq = String(exercise.equipment_type ?? "").toLowerCase().trim();
  return list.includes(rowEq) || list.includes("full");
}

function locationMatch(exercise: ExerciseRow, locationType: LocationType): boolean {
  const rowLocation = String(exercise.location_type ?? "").toLowerCase().trim();
  return !rowLocation || rowLocation === locationType;
}

function baseTargetScore(exercise: ExerciseRow, payload: GenerateWorkoutRequest, targetArea: TargetAreaNormalized): number {
  let score = 0;
  if (matchesTargetArea(exercise, targetArea)) score += 5;
  if (equipmentMatch(exercise, payload.equipment_type)) score += 3;
  if (locationMatch(exercise, payload.location_type)) score += 2;
  if (styleOrGoalMatch(exercise, payload)) score += 2;
  if (difficultyAffinity(exercise) === payload.difficulty) score += 1;
  return score;
}

function pickBalancedFullBody(
  pool: ExerciseRow[],
  needed: number,
  payload: GenerateWorkoutRequest,
): ExerciseRow[] {
  const ranked = [...pool].sort((a, b) => {
    const diff = baseTargetScore(b, payload, "full_body") - baseTargetScore(a, payload, "full_body");
    if (diff !== 0) return diff;
    return String(a.name ?? "").localeCompare(String(b.name ?? ""));
  });

  const buckets: Array<(e: ExerciseRow) => boolean> = [
    (e) => isLowerBodyExercise(e),
    (e) => isUpperBodyExercise(e),
    (e) => hasAny(lowerText(e), [/hinge/, /deadlift/, /posterior/, /rdl/, /good morning/]),
    (e) => hasAny(lowerText(e), [/core/, /carry/, /stability/, /plank/, /dead bug/]),
  ];

  const selected: ExerciseRow[] = [];
  const used = new Set<string>();
  for (const bucketMatch of buckets) {
    const found = ranked.find((e) => !used.has(e.id) && bucketMatch(e));
    if (found) {
      selected.push(found);
      used.add(found.id);
    }
  }

  for (const ex of ranked) {
    if (selected.length >= needed) break;
    if (!ex.id || used.has(ex.id)) continue;
    selected.push(ex);
    used.add(ex.id);
  }
  return selected.slice(0, needed);
}

function pickDiverseByPattern(
  pool: ExerciseRow[],
  needed: number,
  payload: GenerateWorkoutRequest,
  targetArea: TargetAreaNormalized,
): ExerciseRow[] {
  const selected: ExerciseRow[] = [];
  const used = new Set<string>();
  const usedPatterns = new Set<string>();
  for (let i = 0; i < needed; i += 1) {
    const choices = pool.filter((e) => e.id && !used.has(e.id));
    if (choices.length === 0) break;
    choices.sort((a, b) => {
      const aPattern = movementPattern(a);
      const bPattern = movementPattern(b);
      const aDiversity = aPattern && !usedPatterns.has(aPattern) ? 1 : 0;
      const bDiversity = bPattern && !usedPatterns.has(bPattern) ? 1 : 0;
      const aScore = baseTargetScore(a, payload, targetArea) + aDiversity;
      const bScore = baseTargetScore(b, payload, targetArea) + bDiversity;
      if (aScore !== bScore) return bScore - aScore;
      return String(a.name ?? "").localeCompare(String(b.name ?? ""));
    });
    const pick = choices[0];
    selected.push(pick);
    used.add(pick.id);
    const pattern = movementPattern(pick);
    if (pattern) usedPatterns.add(pattern);
  }
  return selected;
}

function targetLabel(targetArea: TargetAreaNormalized): string {
  if (targetArea === "lower_body") return "Lower Body";
  if (targetArea === "upper_body") return "Upper Body";
  if (targetArea === "core_back_relief") return "Core / Back Relief";
  return "Full Body";
}

// ─── Target-area-aware slot templates ────────────────────────────────────────
// Ensures upper body workouts always get push + pull, lower body workouts get
// squat + hinge + bridge, full body gets a cross-area mix.
// core_back_relief never reaches this path (handled by fast lane).
function targetAreaSlots(
  targetArea: TargetAreaNormalized,
  needed: number,
  goal: GoalType,
): GoalSlot[] {
  if (targetArea === "upper_body") {
    // pull first (posture/trucker-relevant), then push primary, pull secondary,
    // shoulder/accessory, additional push_or_pull fill
    const base: GoalSlot[] = ["hinge_or_pull", "squat_or_push", "hinge_or_pull", "accessory_or_carry"];
    while (base.length < needed) base.push("push_or_pull");
    return base.slice(0, needed);
  }
  if (targetArea === "lower_body") {
    // glute activation → squat → hinge/lunge → glute_bridge → accessory/calf → finisher
    const base: GoalSlot[] = ["glute_bridge", "squat_or_push", "hinge_or_pull", "lower_body", "accessory_or_carry"];
    while (base.length < needed) base.push("lower_body");
    return base.slice(0, needed);
  }
  if (targetArea === "full_body") {
    // lower primary → upper push → upper pull → core → conditioning
    const base: GoalSlot[] = ["lower_body", "squat_or_push", "hinge_or_pull", "core", "conditioning"];
    while (base.length < needed) base.push("push_or_pull");
    return base.slice(0, needed);
  }
  // fallback to goal-based for any other target (should not be reached for non-fast-lane paths)
  return templateSlots(goal, needed);
}

// ─── Slot-based exercise picker ───────────────────────────────────────────────
// Phase 1: fill each slot in order, picking the highest-scoring exercise that
// matches the slot and has not already been used.
// Phase 2: fill remaining gaps preferring unused movement patterns (diversity).
// Phase 3: fill any remaining slots with any unused exercise.
function pickByTargetSlots(
  pool: ExerciseRow[],
  needed: number,
  payload: GenerateWorkoutRequest,
  targetArea: TargetAreaNormalized,
): ExerciseRow[] {
  const slots = targetAreaSlots(targetArea, needed, payload.goal);
  const used = new Set<string>();
  const selected: ExerciseRow[] = [];

  // Rank the full pool once by scoreExercise descending
  const ranked = [...pool].sort((a, b) => {
    const diff = scoreExercise(b, payload) - scoreExercise(a, payload);
    if (diff !== 0) return diff;
    return String(a.name ?? "").localeCompare(String(b.name ?? ""));
  });

  // Phase 1: fill slots
  for (const slot of slots) {
    if (selected.length >= needed) break;
    const pick = ranked.find((e) => e.id && !used.has(e.id) && slotMatches(e, slot));
    if (pick) {
      selected.push(pick);
      used.add(pick.id);
      console.log(`[generate-workout] slot "${slot}" filled by: ${pick.name} (pattern: ${movementPattern(pick) || "none"})`);
    } else {
      console.warn(`[generate-workout] slot "${slot}" — no matching exercise found in pool`);
    }
  }

  // Phase 2: fill remaining with diversity (avoid repeating movement pattern)
  const usedPatterns = new Set(selected.map((e) => movementPattern(e)).filter(Boolean));
  for (const ex of ranked) {
    if (selected.length >= needed) break;
    if (!ex.id || used.has(ex.id)) continue;
    const pat = movementPattern(ex);
    if (pat && usedPatterns.has(pat)) continue;
    selected.push(ex);
    used.add(ex.id);
    if (pat) usedPatterns.add(pat);
  }

  // Phase 3: fill any remaining with any unused exercise
  for (const ex of ranked) {
    if (selected.length >= needed) break;
    if (!ex.id || used.has(ex.id)) continue;
    selected.push(ex);
    used.add(ex.id);
  }

  return selected.slice(0, needed);
}

// ─── On-brand workout title generator ────────────────────────────────────────
function generateWorkoutTitle(
  targetArea: TargetAreaNormalized,
  goal: GoalType,
): string {
  const titleMap: Record<TargetAreaNormalized, string[]> = {
    upper_body: [
      "Upper Body Road Strength",
      "Cab Upper Strength",
      "Upper Body Iron Pull",
      "Upper Body Builder",
    ],
    lower_body: [
      "Lower Body Long Haul Builder",
      "Leg Drive Session",
      "Lower Body Foundation",
      "Lower Body Iron Set",
    ],
    full_body: [
      "Full Body Iron Stop",
      "Road-Ready Full Body",
      "Iron Stop Full Session",
      "Full Body Grind",
    ],
    core_back_relief: [
      "Core / Back Relief Reset",
      "Spine Relief Session",
      "Back Relief Reset",
    ],
  };
  const options = titleMap[targetArea] ?? ["Iron Miles Workout"];
  // Deterministic index based on goal so the same combination always gets the same title.
  const goalIndex: Record<GoalType, number> = {
    build_muscle: 0,
    burn_calories: 1,
    mobility: 2,
    back_pain_relief: 2,
    wake_up_energy: 1,
    stress_relief: 3,
  };
  const idx = (goalIndex[goal] ?? 0) % options.length;
  return options[idx];
}

async function generateTargetFocusedWorkout(
  supabase: ReturnType<typeof createClient>,
  payload: GenerateWorkoutRequest,
): Promise<Response> {
  const normalizedTargetArea = normalizeTargetArea(payload.target_area);
  console.log("[generate-workout] selected target_area:", payload.target_area);
  console.log("[generate-workout] normalized target_area:", normalizedTargetArea);

  const needed = desiredExerciseCount(payload.time, payload.difficulty);
  console.log("[generate-workout] needed exercise count:", needed, "| equipment_type:", payload.equipment_type, "| goal:", payload.goal, "| difficulty:", payload.difficulty);

  const { rows: locationRows } = await fetchRowsWithStrictLocation(supabase, payload);
  // is_active filter already applied in fetchRowsWithStrictLocation queries;
  // secondary filter here guards against any rows that slipped through.
  const activeRows = locationRows.filter((r) => r.is_active === true);
  console.log("[generate-workout] v1 active candidate pool:", activeRows.length);

  const targetRows = activeRows.filter((r) => matchesTargetArea(r, normalizedTargetArea));
  console.log("[generate-workout] candidate count after target filter:", targetRows.length);

  // Soft fallback: if no exercises match the specific target area, widen the pool
  // while still excluding exercises that clearly belong to the *opposing* area.
  // This prevents squats appearing in an upper body workout or presses in a lower body one.
  let resolvedTargetRows: ExerciseRow[];
  if (targetRows.length > 0) {
    resolvedTargetRows = targetRows;
  } else {
    if (activeRows.length === 0) {
      return jsonResponse(404, { error: "No exercises found in library." });
    }
    if (normalizedTargetArea === "upper_body") {
      const safe = activeRows.filter((r) => !isLowerBodyExercise(r));
      resolvedTargetRows = safe.length >= needed ? safe : activeRows;
      console.warn("[generate-workout] no upper_body exercises found; fallback pool size:", resolvedTargetRows.length,
        safe.length < needed ? "(widened to full — safe pool too small)" : "(excluded lower body)");
    } else if (normalizedTargetArea === "lower_body") {
      const safe = activeRows.filter((r) => !isUpperBodyExercise(r));
      resolvedTargetRows = safe.length >= needed ? safe : activeRows;
      console.warn("[generate-workout] no lower_body exercises found; fallback pool size:", resolvedTargetRows.length,
        safe.length < needed ? "(widened to full — safe pool too small)" : "(excluded upper body)");
    } else {
      resolvedTargetRows = activeRows;
      console.warn("[generate-workout] no exercises matched target area; widening pool to all", activeRows.length, "active rows");
    }
  }

  const locationRowsFiltered = resolvedTargetRows.filter((r) => locationMatch(r, payload.location_type));
  const locationPool = locationRowsFiltered.length > 0 ? locationRowsFiltered : resolvedTargetRows;

  // Use multi-equipment filter so exercises matching ANY selected type are included.
  const equipmentExact = locationPool.filter((r) => equipmentMatchMulti(r, payload.equipment_selected));
  console.log("[generate-workout] candidate count after equipment filter:", equipmentExact.length, "| equipment_selected:", payload.equipment_selected);
  const equipmentPool = equipmentExact.length > 0 ? equipmentExact : locationPool;

  const goalStyleRows = equipmentPool.filter((r) => styleOrGoalMatch(r, payload));
  console.log("[generate-workout] candidate count after goal/style filter:", goalStyleRows.length);
  const goalStylePool = goalStyleRows.length > 0 ? goalStyleRows : equipmentPool;

  const difficultyRows = goalStylePool.filter((r) => difficultyAffinity(r) === payload.difficulty);
  console.log("[generate-workout] candidate count after difficulty filter:", difficultyRows.length);
  const difficultyPool = difficultyRows.length > 0 ? difficultyRows : goalStylePool;

  const fallbackBodyweight =
    !payload.equipment_selected.includes("bodyweight")
      ? locationPool.filter((r) => equipmentMatch(r, "bodyweight"))
      : [];

  let selectionPool = difficultyPool;
  let fallbackUsed = "none";
  if (selectionPool.length < needed) {
    selectionPool = goalStylePool;
    fallbackUsed = "relaxed_difficulty";
  }
  if (selectionPool.length < needed) {
    selectionPool = equipmentPool;
    fallbackUsed = "relaxed_goal_style";
  }
  if (selectionPool.length < needed && fallbackBodyweight.length > 0) {
    selectionPool = fallbackBodyweight;
    fallbackUsed = "relaxed_equipment_to_bodyweight";
  }
  if (selectionPool.length < needed) {
    selectionPool = locationPool;
    fallbackUsed = "relaxed_to_target_location_only";
  }
  console.log("[generate-workout] selectionPool size:", selectionPool.length, "| fallbackUsed:", fallbackUsed);
  if (fallbackUsed !== "none") {
    console.warn("[generate-workout] fallback used:", fallbackUsed);
  }

  // Use the slot-based picker for all target areas — it handles full_body via its
  // own slot template and falls through to diversity-by-pattern for any gaps.
  const selected = pickByTargetSlots(selectionPool, needed, payload, normalizedTargetArea);

  console.log("[generate-workout] picked exercise count:", selected.length);

  const replacementPool = locationPool.filter((r) => matchesTargetArea(r, normalizedTargetArea));
  const selectedIds = new Set(selected.map((e) => e.id));
  const validSelected: ExerciseRow[] = [];
  for (const ex of selected) {
    if (matchesTargetArea(ex, normalizedTargetArea)) {
      validSelected.push(ex);
      continue;
    }
    console.warn("[generate-workout] removed invalid exercise", ex.name, "reason: target_area mismatch");
    const replacement = replacementPool.find((r) => !selectedIds.has(r.id));
    if (replacement) {
      validSelected.push(replacement);
      selectedIds.add(replacement.id);
      console.warn("[generate-workout] replaced with", replacement.name);
    }
  }

  // If post-pick validation stripped everything but raw selected is non-empty,
  // use selected directly rather than returning 404.
  const finalExercises = validSelected.length > 0 ? validSelected : selected;
  if (finalExercises.length === 0) {
    return jsonResponse(404, { error: "No exercises available for this combination. Try different settings." });
  }
  if (validSelected.length === 0 && selected.length > 0) {
    console.warn("[generate-workout] validSelected was empty; using raw selected as final exercises");
  }

  console.log("[generate-workout] final selected exercise names:", finalExercises.map((e) => e.name));
  console.log("[generate-workout] final selected movement_patterns:", finalExercises.map((e) => movementPattern(e) || "none"));

  const title = generateWorkoutTitle(normalizedTargetArea, payload.goal);
  console.log("[generate-workout] generated title:", title);
  const milesReward = payload.duration_minutes;

  const { data: workoutRows, error: workoutInsertError } = await supabase
    .from("generated_workouts")
    .insert({
      user_id: payload.user_id ?? null,
      title,
      target_area: normalizedTargetArea,
      equipment_selected: payload.equipment_selected,
      duration_minutes: payload.duration_minutes,
      workout_style: payload.workout_style,
      iron_miles_reward: milesReward,
      status: "generated",
    })
    .select("*")
    .limit(1);

  if (workoutInsertError || !workoutRows || workoutRows.length === 0) {
    console.error("generated_workouts insert failed", workoutInsertError);
    return jsonResponse(500, { error: "Failed to create generated workout record." });
  }

  const generatedWorkout = workoutRows[0];
  const assignmentRows = finalExercises.map((exercise, index) => {
    const movementType = normalizedMovementType(exercise);
    const assignment = assignByDifficultyAndMovement(movementType, payload.difficulty);
    return {
      generated_workout_id: generatedWorkout.id,
      exercise_id: exercise.id,
      exercise_order: index + 1,
      sets_assigned: assignment.sets,
      reps_assigned: assignment.repsAssigned,
      instruction_override: null,
    };
  });

  const { error: assignmentInsertError } = await supabase.from("generated_workout_exercises").insert(assignmentRows);
  if (assignmentInsertError) {
    console.error("generated_workout_exercises insert failed", assignmentInsertError);
    return jsonResponse(500, { error: "Failed to create generated workout exercise records." });
  }

  const exercises = finalExercises.map((ex, index) => {
    const movementType = normalizedMovementType(ex);
    const assignment = assignByDifficultyAndMovement(movementType, payload.difficulty);
    return {
      exercise_id: ex.id,
      name: ex.name,
      equipment_type: ex.equipment_type,
      workout_style: ex.workout_style ?? payload.workout_style,
      category: ex.category,
      target_muscle: ex.target_muscle,
      movement_type: movementType,
      movement_pattern: ex.movement_pattern ?? null,
      sets_assigned: assignment.sets,
      reps_assigned: assignment.repsAssigned,
      duration_seconds: assignment.durationSeconds,
      rest_seconds: restSecondsForStyle(payload.workout_style, payload.difficulty),
      exercise_order: index + 1,
      sets: String(assignment.sets),
      reps: String(assignment.repsAssigned),
      instruction: ex.instruction_text ?? "",
      order: index + 1,
    };
  });

  return jsonResponse(200, {
    generated_workout: generatedWorkout,
    exercises,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse(405, { error: "Method not allowed. Use POST." });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return jsonResponse(500, { error: "Supabase function secrets are not configured." });
    }

    const body = await req.json();
    const bodyObj = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const fastLane = String(bodyObj.fast_lane ?? "").trim().toLowerCase();
    if (fastLane === "core_back_relief") {
      return await generateCoreBackReliefWorkout(supabase, bodyObj);
    }

    const validated = validateBody(body);
    if (!validated.valid) {
      return jsonResponse(400, { error: validated.message });
    }
    const payload = validated.value;
    return await generateTargetFocusedWorkout(supabase, payload);
  } catch (error) {
    console.error("generate-workout function error", error);
    return jsonResponse(500, {
      error: "Unexpected error while generating workout.",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

