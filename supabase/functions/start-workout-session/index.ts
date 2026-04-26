import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type StartSessionRequest = {
  generated_workout_id: string;
  user_id?: string | null;
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

function validateBody(body: unknown): { valid: true; value: StartSessionRequest } | { valid: false; message: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, message: "Invalid JSON body." };
  }
  const b = body as Partial<StartSessionRequest>;
  if (!b.generated_workout_id || typeof b.generated_workout_id !== "string") {
    return { valid: false, message: "generated_workout_id is required." };
  }
  return {
    valid: true,
    value: {
      generated_workout_id: b.generated_workout_id.trim(),
      user_id: b.user_id ?? null,
    },
  };
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

    const parsed = validateBody(await req.json());
    if (!parsed.valid) {
      return jsonResponse(400, { error: parsed.message });
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const workoutRes = await supabase
      .from("generated_workouts")
      .select("id, user_id")
      .eq("id", parsed.value.generated_workout_id)
      .maybeSingle();

    if (workoutRes.error) {
      return jsonResponse(500, { error: "Failed to load generated workout.", details: workoutRes.error.message });
    }
    if (!workoutRes.data) {
      return jsonResponse(404, { error: "Generated workout not found." });
    }

    const effectiveUserId = parsed.value.user_id || workoutRes.data.user_id || null;

    const updateRes = await supabase
      .from("generated_workouts")
      .update({ status: "in_progress" })
      .eq("id", parsed.value.generated_workout_id);
    if (updateRes.error) {
      console.error("generated_workouts status update failed", updateRes.error);
    }

    const insertRes = await supabase
      .from("workout_sessions")
      .insert({
        user_id: effectiveUserId,
        generated_workout_id: parsed.value.generated_workout_id,
        started_at: new Date().toISOString(),
        status: "active",
        iron_miles_earned: 0,
      })
      .select("id, user_id, generated_workout_id, started_at, status, iron_miles_earned")
      .single();

    if (insertRes.error || !insertRes.data) {
      return jsonResponse(500, { error: "Failed to start workout session.", details: insertRes.error?.message });
    }

    return jsonResponse(200, insertRes.data);
  } catch (error) {
    console.error("start-workout-session function error", error);
    return jsonResponse(500, {
      error: "Unexpected error while starting workout session.",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

