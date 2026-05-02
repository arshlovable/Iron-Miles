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
  const targetArea = targetAreaFromGoal(goal);
  const workoutStyle = workoutStyleFromGoal(goal);
  const equipmentSelected = equipmentListFromEquipmentType(equipmentType);

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

  const rowEquipment = String(exercise.equipment_type ?? "").toLowerCase();
  if (payload.equipment_type === "full") {
    if (["bodyweight", "bands", "dumbbells"].includes(rowEquipment)) score += 3;
  } else if (rowEquipment && rowEquipment === payload.equipment_type) {
    score += 3;
  }

  if (goalMatch(exercise, payload.goal)) score += 2;
  if (difficultyAffinity(exercise) === payload.difficulty) score += 1;
  return score;
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
  const base = supabase.from("exercises").select("*");
  const withLocation = await base.eq("location_type", payload.location_type).order("name", { ascending: true }).limit(800);

  const locationErr = withLocation.error;
  if (!locationErr) {
    const rows = (withLocation.data ?? []) as ExerciseRow[];
    return { rows, supportsLocation: true, supportsEquipment: rows.some((r) => Boolean(r.equipment_type)) };
  }

  const locationMissing =
    locationErr.code === "42703" || String(locationErr.message ?? "").toLowerCase().includes("location_type");
  if (!locationMissing) {
    throw locationErr;
  }

  const fallbackAll = await supabase.from("exercises").select("*").order("name", { ascending: true }).limit(800);
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
    const validated = validateBody(body);
    if (!validated.valid) {
      return jsonResponse(400, { error: validated.message });
    }
    const payload = validated.value;

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const needed = desiredExerciseCount(payload.time, payload.difficulty);
    const { rows: locationRows, supportsLocation, supportsEquipment } = await fetchRowsWithStrictLocation(
      supabase,
      payload,
    );

    // Fallback chain (without breaking location when location_type exists):
    // 1) location + equipment + goal
    // 2) location + equipment
    // 3) location + bodyweight
    const poolPhase1 = supportsEquipment ? filterByGoal(filterByEquipment(locationRows, payload.equipment_type), payload.goal) : filterByGoal(locationRows, payload.goal);
    const poolPhase2 = supportsEquipment ? filterByEquipment(locationRows, payload.equipment_type) : locationRows;
    const poolPhase3 = supportsEquipment
      ? filterByEquipment(locationRows, payload.equipment_type === "bodyweight" ? "bodyweight" : "bodyweight")
      : locationRows;

    const mergedPool = dedupeById([...poolPhase1, ...poolPhase2, ...poolPhase3]);
    if (mergedPool.length === 0) {
      return jsonResponse(404, {
        error: supportsLocation
          ? "No matching exercises found for this location and filters."
          : "No matching exercises found for the selected filters.",
      });
    }

    const scored: Scored[] = mergedPool.map((ex) => {
      const idx1 = poolPhase1.findIndex((x) => x.id === ex.id);
      const idx2 = poolPhase2.findIndex((x) => x.id === ex.id);
      const phase = idx1 >= 0 ? 1 : idx2 >= 0 ? 2 : 3;
      return { ex, baseScore: scoreExercise(ex, payload), phase };
    });

    const slots = templateSlots(payload.goal, needed);
    const picked: Scored[] = [];
    const used = new Set<string>();
    const usedCategories = new Set<string>();

    const pickForSlot = (slot: GoalSlot): Scored | null => {
      const choices = scored.filter((s) => !used.has(s.ex.id) && slotMatches(s.ex, slot));
      if (choices.length === 0) return null;
      choices.sort((a, b) => {
        const aCat = String(a.ex.category ?? "").toLowerCase();
        const bCat = String(b.ex.category ?? "").toLowerCase();
        const aDiversity = aCat && !usedCategories.has(aCat) ? 1 : 0;
        const bDiversity = bCat && !usedCategories.has(bCat) ? 1 : 0;
        const aTotal = a.baseScore + aDiversity;
        const bTotal = b.baseScore + bDiversity;
        if (aTotal !== bTotal) return bTotal - aTotal;
        if (a.phase !== b.phase) return a.phase - b.phase;
        return String(a.ex.name ?? "").localeCompare(String(b.ex.name ?? ""));
      });
      return choices[0];
    };

    for (const slot of slots) {
      const chosen = pickForSlot(slot);
      if (!chosen) continue;
      picked.push(chosen);
      used.add(chosen.ex.id);
      const cat = String(chosen.ex.category ?? "").toLowerCase();
      if (cat) usedCategories.add(cat);
      if (picked.length >= needed) break;
    }

    if (picked.length < needed) {
      const fill = scored
        .filter((s) => !used.has(s.ex.id))
        .sort((a, b) => {
          const aCat = String(a.ex.category ?? "").toLowerCase();
          const bCat = String(b.ex.category ?? "").toLowerCase();
          const aDiversity = aCat && !usedCategories.has(aCat) ? 1 : 0;
          const bDiversity = bCat && !usedCategories.has(bCat) ? 1 : 0;
          const aTotal = a.baseScore + aDiversity;
          const bTotal = b.baseScore + bDiversity;
          if (aTotal !== bTotal) return bTotal - aTotal;
          if (a.phase !== b.phase) return a.phase - b.phase;
          return String(a.ex.name ?? "").localeCompare(String(b.ex.name ?? ""));
        });

      for (const extra of fill) {
        if (picked.length >= needed) break;
        picked.push(extra);
        used.add(extra.ex.id);
        const cat = String(extra.ex.category ?? "").toLowerCase();
        if (cat) usedCategories.add(cat);
      }
    }

    const selectedExercises = picked.slice(0, needed).map((p) => p.ex);
    if (selectedExercises.length === 0) {
      return jsonResponse(404, { error: "No matching exercises found for the selected filters." });
    }

    const goalLabel = payload.goal.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const locationLabel = payload.location_type.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const title = `${goalLabel} - ${locationLabel}`;
    const milesReward = payload.duration_minutes;

    const { data: workoutRows, error: workoutInsertError } = await supabase
      .from("generated_workouts")
      .insert({
        user_id: payload.user_id ?? null,
        title,
        target_area: payload.target_area,
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
    const generatedWorkoutId = generatedWorkout.id;

    const assignmentRows = selectedExercises.map((exercise, index) => {
      const movementType = normalizedMovementType(exercise);
      const assignment = assignByDifficultyAndMovement(movementType, payload.difficulty);
      return {
        generated_workout_id: generatedWorkoutId,
        exercise_id: exercise.id,
        exercise_order: index + 1,
        sets_assigned: assignment.sets,
        reps_assigned: assignment.repsAssigned,
        instruction_override: null,
      };
    });

    const { error: assignmentInsertError } = await supabase
      .from("generated_workout_exercises")
      .insert(assignmentRows);

    if (assignmentInsertError) {
      console.error("generated_workout_exercises insert failed", assignmentInsertError);
      return jsonResponse(500, { error: "Failed to create generated workout exercise records." });
    }

    const exercises = selectedExercises.map((ex, index) => {
      const movementType = normalizedMovementType(ex);
      const assignment = assignByDifficultyAndMovement(movementType, payload.difficulty);
      return {
        exercise_id: ex.id,
        name: ex.name,
        equipment_type: ex.equipment_type,
        workout_style: ex.workout_style ?? payload.workout_style,
        category: ex.category,
        movement_type: movementType,
        sets_assigned: assignment.sets,
        reps_assigned: assignment.repsAssigned,
        duration_seconds: assignment.durationSeconds,
        exercise_order: index + 1,
        // Legacy keys expected by existing UI
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
  } catch (error) {
    console.error("generate-workout function error", error);
    return jsonResponse(500, {
      error: "Unexpected error while generating workout.",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

