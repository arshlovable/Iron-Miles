import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type GenerateWorkoutRequest = {
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

function validateBody(body: unknown): { valid: true; value: GenerateWorkoutRequest } | { valid: false; message: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, message: "Invalid JSON body." };
  }

  const b = body as Partial<GenerateWorkoutRequest>;
  if (!b.target_area || typeof b.target_area !== "string") {
    return { valid: false, message: "target_area is required." };
  }
  if (!Array.isArray(b.equipment_selected)) {
    return { valid: false, message: "equipment_selected must be an array." };
  }
  if (b.equipment_selected.length === 0) {
    return { valid: false, message: "equipment_selected cannot be empty." };
  }
  if (typeof b.duration_minutes !== "number" || !Number.isFinite(b.duration_minutes) || b.duration_minutes <= 0) {
    return { valid: false, message: "duration_minutes must be a positive number." };
  }
  if (!b.workout_style || typeof b.workout_style !== "string") {
    return { valid: false, message: "workout_style is required." };
  }

  const cleanedEquipment = b.equipment_selected
    .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
    .map((v) => v.trim());

  if (cleanedEquipment.length === 0) {
    return { valid: false, message: "equipment_selected must include at least one valid value." };
  }

  return {
    valid: true,
    value: {
      target_area: b.target_area.trim(),
      equipment_selected: [...new Set(cleanedEquipment)],
      duration_minutes: Math.round(b.duration_minutes),
      workout_style: b.workout_style.trim(),
      user_id: b.user_id ?? null,
    },
  };
}

function desiredExerciseCount(durationMinutes: number): number {
  if (durationMinutes <= 10) return 4;
  if (durationMinutes <= 20) return 5;
  return 6;
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

async function queryExercisesVariant(
  supabase: ReturnType<typeof createClient>,
  params: {
    targetArea: string;
    equipment: string[];
    workoutStyle: string;
    useTarget: boolean;
    useEquipment: boolean;
    useStyle: boolean;
  },
): Promise<ExerciseRow[]> {
  const runQuery = async (targetField: "target_muscle" | "category") => {
    let query = supabase.from("exercises").select("*");

    if (params.useTarget && params.targetArea !== "full_body") {
      query = query.eq(targetField, params.targetArea);
    }
    if (params.useEquipment && params.equipment.length > 0) {
      query = query.in("equipment_type", params.equipment);
    }
    if (params.useStyle && params.workoutStyle) {
      query = query.eq("workout_style", params.workoutStyle);
    }

    const { data, error } = await query.order("name", { ascending: true }).limit(24);
    return { data, error };
  };

  // Prefer target_muscle; fallback to category if that column isn't available.
  const primary = await runQuery("target_muscle");
  if (!primary.error) return (primary.data ?? []) as ExerciseRow[];

  const errorMsg = String(primary.error.message || "");
  const missingTargetColumn = primary.error.code === "42703" || errorMsg.toLowerCase().includes("target_muscle");
  if (!missingTargetColumn) {
    throw primary.error;
  }

  const fallback = await runQuery("category");
  if (fallback.error) throw fallback.error;
  return (fallback.data ?? []) as ExerciseRow[];
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

    const variants = [
      { useTarget: true, useEquipment: true, useStyle: true },
      { useTarget: true, useEquipment: true, useStyle: false },
      { useTarget: true, useEquipment: false, useStyle: true },
      { useTarget: true, useEquipment: false, useStyle: false },
      { useTarget: false, useEquipment: true, useStyle: true },
      { useTarget: false, useEquipment: true, useStyle: false },
      { useTarget: false, useEquipment: false, useStyle: true },
      { useTarget: false, useEquipment: false, useStyle: false },
    ];

    const needed = desiredExerciseCount(payload.duration_minutes);
    const collected: ExerciseRow[] = [];

    for (const variant of variants) {
      const rows = await queryExercisesVariant(supabase, {
        targetArea: payload.target_area,
        equipment: payload.equipment_selected,
        workoutStyle: payload.workout_style,
        ...variant,
      });
      collected.push(...rows);
      if (dedupeById(collected).length >= needed) break;
    }

    const selectedExercises = dedupeById(collected).slice(0, needed);
    if (selectedExercises.length === 0) {
      return jsonResponse(404, {
        error: "No matching exercises found for the selected filters.",
      });
    }

    const areaLabel = payload.target_area.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const styleLabel = payload.workout_style.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
    const title = `${areaLabel} ${styleLabel}`;
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

    const assignmentRows = selectedExercises.map((exercise, index) => ({
      generated_workout_id: generatedWorkoutId,
      exercise_id: exercise.id,
      exercise_order: index + 1,
      sets_assigned: exercise.sets_default ?? 3,
      reps_assigned: exercise.reps_default ?? "10",
      instruction_override: null,
    }));

    const { error: assignmentInsertError } = await supabase
      .from("generated_workout_exercises")
      .insert(assignmentRows);

    if (assignmentInsertError) {
      console.error("generated_workout_exercises insert failed", assignmentInsertError);
      return jsonResponse(500, { error: "Failed to create generated workout exercise records." });
    }

    const { data: joinedRows, error: joinedError } = await supabase
      .from("generated_workout_exercises")
      .select(
        "exercise_order, sets_assigned, reps_assigned, instruction_override, exercises(id, name, equipment_type, workout_style, instruction_text, sets_default, reps_default, category)",
      )
      .eq("generated_workout_id", generatedWorkoutId)
      .order("exercise_order", { ascending: true });

    if (joinedError) {
      console.error("joined workout exercise read failed", joinedError);
      return jsonResponse(500, { error: "Workout was created but failed to load exercises." });
    }

    const exercises = (joinedRows ?? []).map((row: any) => {
      const ex = row.exercises ?? {};
      return {
        exercise_id: ex.id,
        name: ex.name,
        equipment_type: ex.equipment_type,
        workout_style: ex.workout_style,
        category: ex.category,
        sets: String(row.sets_assigned ?? ex.sets_default ?? 3),
        reps: String(row.reps_assigned ?? ex.reps_default ?? "10"),
        instruction: row.instruction_override ?? ex.instruction_text ?? "",
        order: row.exercise_order,
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

