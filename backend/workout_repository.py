import os
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional


def calc_iron_miles_reward(duration_minutes: int) -> int:
    """Simple deterministic reward: minutes == miles."""
    return max(1, int(duration_minutes))


def get_effective_user_id(sb: Any, requested_user_id: Optional[str]) -> Optional[str]:
    """
    Resolve user_id for generated workouts.
    Priority:
    1) explicit request user_id
    2) DEV_USER_ID from environment
    3) first profile id (dev fallback)
    """
    if requested_user_id:
        return requested_user_id

    env_user_id = os.environ.get("DEV_USER_ID")
    if env_user_id:
        return env_user_id

    try:
        profile_result = sb.table("profiles").select("id").order("created_at").limit(1).execute()
        if profile_result.data:
            return profile_result.data[0].get("id")
    except Exception:
        # Keep nullable user_id behavior if profiles are unavailable.
        pass

    return None


def pick_exercise_count(duration_minutes: int) -> int:
    """Deterministic 4-6 exercise count from duration."""
    if duration_minutes <= 10:
        return 4
    if duration_minutes <= 20:
        return 5
    return 6


def _dedupe_by_id(rows: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    seen: set[str] = set()
    out: List[Dict[str, Any]] = []
    for row in rows:
        row_id = row.get("id")
        if row_id and row_id not in seen:
            seen.add(row_id)
            out.append(row)
    return out


def _query_exercises(
    sb: Any,
    target_area: str,
    equipment_selected: List[str],
    use_target_muscle: bool,
    use_category: bool,
    use_equipment: bool,
) -> List[Dict[str, Any]]:
    """
    Run one deterministic query variant.
    Any column mismatch errors are handled by caller.
    """
    query = sb.table("exercises").select(
        "id, name, category, equipment_type, sets_default, reps_default, instruction_text"
    )

    if use_target_muscle and target_area != "full_body":
        query = query.eq("target_muscle", target_area)

    if use_category and target_area != "full_body":
        query = query.eq("category", target_area)

    if use_equipment and equipment_selected:
        query = query.in_("equipment_type", equipment_selected)

    result = query.order("name").execute()
    return result.data or []


def select_exercises_for_workout(
    sb: Any,
    target_area: str,
    equipment_selected: List[str],
    duration_minutes: int,
) -> List[Dict[str, Any]]:
    """
    Deterministic selection strategy with fallback:
    1) target_muscle + equipment (if column exists)
    2) category + equipment
    3) target_muscle only
    4) category only
    5) equipment only
    6) all exercises
    """
    desired = pick_exercise_count(duration_minutes)
    buckets: List[Dict[str, Any]] = []

    variants = [
        # target + equipment
        (True, False, True),
        (False, True, True),
        # target only
        (True, False, False),
        (False, True, False),
        # equipment only
        (False, False, True),
        # all
        (False, False, False),
    ]

    for use_target_muscle, use_category, use_equipment in variants:
        try:
            rows = _query_exercises(
                sb=sb,
                target_area=target_area,
                equipment_selected=equipment_selected,
                use_target_muscle=use_target_muscle,
                use_category=use_category,
                use_equipment=use_equipment,
            )
        except Exception:
            # Usually means column does not exist for this variant.
            continue
        buckets.extend(rows)
        deduped = _dedupe_by_id(buckets)
        if len(deduped) >= desired:
            return deduped[:desired]

    return _dedupe_by_id(buckets)[:desired]


def create_generated_workout(
    sb: Any,
    user_id: Optional[str],
    target_area: str,
    equipment_selected: List[str],
    duration_minutes: int,
    workout_style: str,
) -> Dict[str, Any]:
    area_label = target_area.replace("_", " ").title()
    title = f"{area_label} Route"

    payload = {
        "user_id": user_id,
        "title": title,
        "target_area": target_area,
        "equipment_selected": equipment_selected,
        "duration_minutes": duration_minutes,
        "workout_style": workout_style,
        "iron_miles_reward": calc_iron_miles_reward(duration_minutes),
        "status": "generated",
    }
    result = sb.table("generated_workouts").insert(payload).execute()
    return result.data[0]


def insert_generated_workout_exercises(
    sb: Any, workout_id: str, selected_exercises: List[Dict[str, Any]]
) -> None:
    entries: List[Dict[str, Any]] = []
    for idx, ex in enumerate(selected_exercises):
        entries.append(
            {
                "generated_workout_id": workout_id,
                "exercise_id": ex["id"],
                "exercise_order": idx + 1,
                "sets_assigned": ex.get("sets_default") or 3,
                "reps_assigned": ex.get("reps_default") or "10",
                "instruction_override": ex.get("instruction_text"),
            }
        )

    if entries:
        sb.table("generated_workout_exercises").insert(entries).execute()


def load_generated_workout_with_exercises(sb: Any, workout_id: str) -> Dict[str, Any]:
    workout_result = (
        sb.table("generated_workouts")
        .select(
            "id, title, target_area, equipment_selected, duration_minutes, workout_style, iron_miles_reward, status"
        )
        .eq("id", workout_id)
        .single()
        .execute()
    )
    workout = workout_result.data

    exercises_result = (
        sb.table("generated_workout_exercises")
        .select(
            "exercise_order, sets_assigned, reps_assigned, instruction_override, exercises(id, name, equipment_type, instruction_text)"
        )
        .eq("generated_workout_id", workout_id)
        .order("exercise_order")
        .execute()
    )

    exercises_out: List[Dict[str, Any]] = []
    for row in exercises_result.data or []:
        ex = row.get("exercises") or {}
        exercises_out.append(
            {
                "exercise_id": ex.get("id"),
                "name": ex.get("name"),
                "icon": "dumbbell",
                "sets": str(row.get("sets_assigned") or 3),
                "reps": str(row.get("reps_assigned") or "10"),
                "instruction": row.get("instruction_override") or ex.get("instruction_text") or "",
                "order": row.get("exercise_order"),
                "equipment_type": ex.get("equipment_type"),
            }
        )

    return {
        "id": workout["id"],
        "title": workout["title"],
        "target_area": workout["target_area"],
        "equipment_selected": workout.get("equipment_selected") or [],
        "duration_minutes": workout["duration_minutes"],
        "workout_style": workout.get("workout_style"),
        "iron_miles_reward": workout.get("iron_miles_reward") or 0,
        "status": workout.get("status") or "generated",
        "exercises": exercises_out,
    }


def start_workout_session(
    sb: Any, generated_workout_id: str, requested_user_id: Optional[str]
) -> Dict[str, Any]:
    """
    Start a workout session and mark generated workout in progress.
    Session status is 'active' per execution flow contract.
    """
    workout_result = (
        sb.table("generated_workouts")
        .select("id, user_id")
        .eq("id", generated_workout_id)
        .single()
        .execute()
    )
    workout = workout_result.data

    effective_user_id = requested_user_id or workout.get("user_id")

    sb.table("generated_workouts").update({"status": "in_progress"}).eq("id", generated_workout_id).execute()

    session_payload = {
        "user_id": effective_user_id,
        "generated_workout_id": generated_workout_id,
        "started_at": datetime.now(timezone.utc).isoformat(),
        "status": "active",
        "iron_miles_earned": 0,
    }
    result = sb.table("workout_sessions").insert(session_payload).execute()
    return result.data[0]


def complete_workout_session(sb: Any, session_id: str) -> Dict[str, Any]:
    """
    Complete a workout session:
    - mark session completed
    - set miles from generated workout reward
    - log iron miles transaction
    - increment profiles.lifetime_iron_miles cache
    """
    session_result = (
        sb.table("workout_sessions")
        .select("id, user_id, generated_workout_id, generated_workouts(iron_miles_reward)")
        .eq("id", session_id)
        .single()
        .execute()
    )
    session = session_result.data

    workout_rel = session.get("generated_workouts") or {}
    miles = int(workout_rel.get("iron_miles_reward") or 0)

    completed_payload = {
        "completed_at": datetime.now(timezone.utc).isoformat(),
        "status": "completed",
        "iron_miles_earned": miles,
    }
    updated_result = sb.table("workout_sessions").update(completed_payload).eq("id", session_id).execute()
    updated_session = updated_result.data[0]

    generated_workout_id = session.get("generated_workout_id")
    if generated_workout_id:
        sb.table("generated_workouts").update({"status": "completed"}).eq("id", generated_workout_id).execute()

    user_id = session.get("user_id")
    if miles > 0:
        log_payload = {
            "user_id": user_id,
            "source_type": "workout",
            "source_id": session_id,
            "miles_amount": miles,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "note": "Workout session completed",
        }
        sb.table("iron_miles_log").insert(log_payload).execute()

        if user_id:
            profile_result = (
                sb.table("profiles")
                .select("id, lifetime_iron_miles")
                .eq("id", user_id)
                .single()
                .execute()
            )
            profile = profile_result.data
            cached_lifetime = int(profile.get("lifetime_iron_miles") or 0)
            sb.table("profiles").update(
                {"lifetime_iron_miles": cached_lifetime + miles}
            ).eq("id", user_id).execute()

    return updated_session

