import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type CompleteSessionRequest = {
  session_id: string;
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

function validateBody(body: unknown): { valid: true; value: CompleteSessionRequest } | { valid: false; message: string } {
  if (!body || typeof body !== "object") {
    return { valid: false, message: "Invalid JSON body." };
  }
  const b = body as Partial<CompleteSessionRequest>;
  if (!b.session_id || typeof b.session_id !== "string") {
    return { valid: false, message: "session_id is required." };
  }
  return {
    valid: true,
    value: { session_id: b.session_id.trim() },
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

    const sessionRes = await supabase
      .from("workout_sessions")
      .select("id, user_id, generated_workout_id, generated_workouts(iron_miles_reward)")
      .eq("id", parsed.value.session_id)
      .maybeSingle();

    if (sessionRes.error) {
      return jsonResponse(500, { error: "Failed to load workout session.", details: sessionRes.error.message });
    }
    if (!sessionRes.data) {
      return jsonResponse(404, { error: "Workout session not found." });
    }

    const workoutRel = sessionRes.data.generated_workouts as { iron_miles_reward?: number } | null;
    const milesEarned = Math.max(0, Number(workoutRel?.iron_miles_reward ?? 0));
    const completedAt = new Date().toISOString();

    const updateSessionRes = await supabase
      .from("workout_sessions")
      .update({
        status: "completed",
        completed_at: completedAt,
        iron_miles_earned: milesEarned,
      })
      .eq("id", parsed.value.session_id)
      .select("id, user_id, generated_workout_id, started_at, completed_at, status, iron_miles_earned")
      .single();

    if (updateSessionRes.error || !updateSessionRes.data) {
      return jsonResponse(500, {
        error: "Failed to complete workout session.",
        details: updateSessionRes.error?.message,
      });
    }

    const generatedWorkoutId = sessionRes.data.generated_workout_id;
    if (generatedWorkoutId) {
      const workoutUpdateRes = await supabase
        .from("generated_workouts")
        .update({ status: "completed" })
        .eq("id", generatedWorkoutId);
      if (workoutUpdateRes.error) {
        console.error("generated_workouts status complete update failed", workoutUpdateRes.error);
      }
    }

    const userId = sessionRes.data.user_id;
    if (milesEarned > 0) {
      const logRes = await supabase.from("iron_miles_log").insert({
        user_id: userId,
        source_type: "workout",
        source_id: parsed.value.session_id,
        miles_amount: milesEarned,
        created_at: completedAt,
        note: "Workout session completed",
      });
      if (logRes.error) {
        console.error("iron_miles_log insert failed", logRes.error);
      }

      if (userId) {
        const profileRes = await supabase
          .from("profiles")
          .select("id, lifetime_iron_miles")
          .eq("id", userId)
          .maybeSingle();

        if (!profileRes.error && profileRes.data) {
          const cachedLifetime = Number(profileRes.data.lifetime_iron_miles ?? 0);
          const profileUpdateRes = await supabase
            .from("profiles")
            .update({ lifetime_iron_miles: cachedLifetime + milesEarned })
            .eq("id", userId);
          if (profileUpdateRes.error) {
            console.error("profiles lifetime update failed", profileUpdateRes.error);
          }
        }
      }
    }

    return jsonResponse(200, updateSessionRes.data);
  } catch (error) {
    console.error("complete-workout-session function error", error);
    return jsonResponse(500, {
      error: "Unexpected error while completing workout session.",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

