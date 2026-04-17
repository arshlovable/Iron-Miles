from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timezone

from supabase_client import get_supabase

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

app = FastAPI()
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# ─── Pydantic Models ────────────────────────────────────────────────────────

class ExerciseOut(BaseModel):
    id: str
    name: str
    category: str
    equipment_type: str
    workout_style: Optional[str] = None
    sets_default: Optional[int] = None
    reps_default: Optional[str] = None
    instruction_text: Optional[str] = None

class GenerateWorkoutRequest(BaseModel):
    user_id: Optional[str] = None
    target_area: str
    equipment_selected: List[str]
    duration_minutes: int
    workout_style: str

class GeneratedWorkoutOut(BaseModel):
    id: str
    title: str
    target_area: str
    equipment_selected: list
    duration_minutes: int
    workout_style: Optional[str] = None
    iron_miles_reward: int
    status: str
    exercises: list = []

class StartSessionRequest(BaseModel):
    generated_workout_id: str
    user_id: Optional[str] = None

class CompleteSessionRequest(BaseModel):
    session_id: str

class WorkoutSessionOut(BaseModel):
    id: str
    generated_workout_id: Optional[str] = None
    status: str
    iron_miles_earned: int
    started_at: Optional[str] = None
    completed_at: Optional[str] = None

# ─── Health Check ───────────────────────────────────────────────────────────

@api_router.get("/")
async def root():
    return {"message": "Iron Miles API", "status": "running"}

@api_router.get("/health")
async def health():
    try:
        sb = get_supabase()
        sb.table('exercises').select('id').limit(1).execute()
        return {"status": "healthy", "supabase": "connected"}
    except Exception as e:
        return {"status": "degraded", "supabase": str(e)[:100]}

# ─── Exercises ──────────────────────────────────────────────────────────────

@api_router.get("/exercises", response_model=List[ExerciseOut])
async def get_exercises(category: Optional[str] = None, equipment: Optional[str] = None):
    """Get exercises, optionally filtered by category and equipment type."""
    try:
        sb = get_supabase()
        query = sb.table('exercises').select('id, name, category, equipment_type, workout_style, sets_default, reps_default, instruction_text')
        if category:
            query = query.eq('category', category)
        if equipment:
            query = query.eq('equipment_type', equipment)
        result = query.order('name').execute()
        return result.data
    except Exception as e:
        logger.error(f"Error fetching exercises: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch exercises")

@api_router.get("/exercises/{exercise_id}", response_model=ExerciseOut)
async def get_exercise(exercise_id: str):
    """Get a single exercise by ID."""
    try:
        sb = get_supabase()
        result = sb.table('exercises').select('*').eq('id', exercise_id).single().execute()
        return result.data
    except Exception as e:
        raise HTTPException(status_code=404, detail="Exercise not found")

# ─── Generated Workouts ────────────────────────────────────────────────────

@api_router.post("/workouts/generate", response_model=GeneratedWorkoutOut)
async def generate_workout(req: GenerateWorkoutRequest):
    """Create a generated workout by selecting exercises matching criteria."""
    try:
        sb = get_supabase()

        # Build title from selections
        area_label = req.target_area.replace('_', ' ').title()
        style_label = req.workout_style.replace('_', ' ').title()
        title = f"Cab {area_label} {style_label}"

        # Calculate Iron Miles reward based on duration
        miles_map = {5: 5, 10: 10, 20: 20, 30: 30}
        iron_miles = miles_map.get(req.duration_minutes, req.duration_minutes)

        # Insert the generated workout
        workout_data = {
            "user_id": req.user_id,
            "title": title,
            "target_area": req.target_area,
            "equipment_selected": req.equipment_selected,
            "duration_minutes": req.duration_minutes,
            "workout_style": req.workout_style,
            "iron_miles_reward": iron_miles,
            "status": "ready",
        }
        workout_result = sb.table('generated_workouts').insert(workout_data).execute()
        workout = workout_result.data[0]
        workout_id = workout['id']

        # Find matching exercises
        query = sb.table('exercises').select('*')

        # Filter by category (target area)
        if req.target_area != 'full_body':
            query = query.eq('category', req.target_area)

        # Filter by equipment — get exercises matching any selected equipment
        if req.equipment_selected:
            query = query.in_('equipment_type', req.equipment_selected)

        exercises_result = query.execute()
        matched = exercises_result.data

        # If not enough exercises, also grab bodyweight ones
        if len(matched) < 5:
            bw_result = sb.table('exercises').select('*').eq('equipment_type', 'bodyweight').execute()
            existing_ids = {e['id'] for e in matched}
            for ex in bw_result.data:
                if ex['id'] not in existing_ids:
                    matched.append(ex)

        # Pick exercises for the workout (up to 5)
        selected = matched[:5]

        # Insert exercise assignments
        exercise_entries = []
        for i, ex in enumerate(selected):
            entry = {
                "generated_workout_id": workout_id,
                "exercise_id": ex['id'],
                "exercise_order": i + 1,
                "sets_assigned": ex.get('sets_default', 3),
                "reps_assigned": ex.get('reps_default', '10 reps'),
                "instruction_override": ex.get('instruction_text'),
            }
            exercise_entries.append(entry)

        if exercise_entries:
            sb.table('generated_workout_exercises').insert(exercise_entries).execute()

        # Build response with exercise details
        exercises_out = []
        for i, ex in enumerate(selected):
            exercises_out.append({
                "exercise_id": ex['id'],
                "name": ex['name'],
                "icon": "dumbbell",
                "sets": str(ex.get('sets_default', 3)),
                "reps": ex.get('reps_default', '10 reps'),
                "instruction": ex.get('instruction_text', ''),
                "order": i + 1,
            })

        return {
            "id": workout_id,
            "title": workout['title'],
            "target_area": workout['target_area'],
            "equipment_selected": workout['equipment_selected'],
            "duration_minutes": workout['duration_minutes'],
            "workout_style": workout.get('workout_style'),
            "iron_miles_reward": workout['iron_miles_reward'],
            "status": workout['status'],
            "exercises": exercises_out,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating workout: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate workout: {str(e)[:100]}")

# ─── Workout Sessions ──────────────────────────────────────────────────────

@api_router.post("/sessions/start", response_model=WorkoutSessionOut)
async def start_session(req: StartSessionRequest):
    """Start a workout session."""
    try:
        sb = get_supabase()

        # Update workout status
        sb.table('generated_workouts').update({"status": "in_progress"}).eq('id', req.generated_workout_id).execute()

        # Create session
        session_data = {
            "user_id": req.user_id,
            "generated_workout_id": req.generated_workout_id,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "status": "started",
            "iron_miles_earned": 0,
        }
        result = sb.table('workout_sessions').insert(session_data).execute()
        return result.data[0]
    except Exception as e:
        logger.error(f"Error starting session: {e}")
        raise HTTPException(status_code=500, detail="Failed to start session")

@api_router.post("/sessions/complete", response_model=WorkoutSessionOut)
async def complete_session(req: CompleteSessionRequest):
    """Complete a workout session and award Iron Miles."""
    try:
        sb = get_supabase()

        # Get session
        session_result = sb.table('workout_sessions').select('*, generated_workouts(iron_miles_reward)').eq('id', req.session_id).single().execute()
        session = session_result.data

        miles = 0
        if session.get('generated_workouts'):
            miles = session['generated_workouts'].get('iron_miles_reward', 0)

        # Update session
        update_data = {
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "status": "completed",
            "iron_miles_earned": miles,
        }
        updated = sb.table('workout_sessions').update(update_data).eq('id', req.session_id).execute()

        # Update workout status
        if session.get('generated_workout_id'):
            sb.table('generated_workouts').update({"status": "completed"}).eq('id', session['generated_workout_id']).execute()

        # Log Iron Miles
        if miles > 0:
            log_entry = {
                "user_id": session.get('user_id'),
                "source_type": "workout_completed",
                "source_id": req.session_id,
                "miles_amount": miles,
                "note": f"Completed workout session",
            }
            sb.table('iron_miles_log').insert(log_entry).execute()

        return updated.data[0]
    except Exception as e:
        logger.error(f"Error completing session: {e}")
        raise HTTPException(status_code=500, detail="Failed to complete session")

# ─── Iron Miles ─────────────────────────────────────────────────────────────

@api_router.get("/iron-miles/{user_id}")
async def get_iron_miles(user_id: str):
    """Get total Iron Miles for a user."""
    try:
        sb = get_supabase()
        result = sb.table('iron_miles_log').select('miles_amount').eq('user_id', user_id).execute()
        total = sum(entry['miles_amount'] for entry in result.data)
        return {"user_id": user_id, "total_iron_miles": total, "entries": len(result.data)}
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to fetch Iron Miles")

# ─── Dashboard Summary ──────────────────────────────────────────────────────

@api_router.get("/dashboard")
async def get_dashboard():
    """Get dashboard summary data: lifetime miles, last workout, stats."""
    try:
        sb = get_supabase()

        # Total Iron Miles from all completed sessions
        miles_result = sb.table('iron_miles_log').select('miles_amount').execute()
        lifetime_miles = sum(e['miles_amount'] for e in miles_result.data)

        # Total completed workouts
        completed_result = sb.table('workout_sessions').select('id', count='exact').eq('status', 'completed').execute()
        total_workouts = completed_result.count if completed_result.count is not None else len(completed_result.data)

        # Last completed workout
        last_workout = None
        try:
            last_result = sb.table('workout_sessions').select(
                'id, iron_miles_earned, completed_at, generated_workouts(title, target_area, duration_minutes)'
            ).eq('status', 'completed').order('completed_at', desc=True).limit(1).execute()
            if last_result.data:
                lw = last_result.data[0]
                gw = lw.get('generated_workouts') or {}
                last_workout = {
                    "title": gw.get('title', 'Workout'),
                    "target_area": gw.get('target_area', ''),
                    "duration_minutes": gw.get('duration_minutes', 0),
                    "iron_miles": lw.get('iron_miles_earned', 0),
                    "completed_at": lw.get('completed_at'),
                }
        except Exception:
            pass

        # This week's miles (last 7 days)
        from datetime import timedelta
        week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        week_result = sb.table('iron_miles_log').select('miles_amount').gte('created_at', week_ago).execute()
        week_miles = sum(e['miles_amount'] for e in week_result.data)

        # This week's workouts
        week_workouts_result = sb.table('workout_sessions').select('id', count='exact').eq('status', 'completed').gte('created_at', week_ago).execute()
        week_workouts = week_workouts_result.count if week_workouts_result.count is not None else len(week_workouts_result.data)

        return {
            "lifetime_miles": lifetime_miles,
            "total_workouts": total_workouts,
            "last_workout": last_workout,
            "week_miles": week_miles,
            "week_workouts": week_workouts,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Dashboard error: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch dashboard data")

# ─── App Setup ──────────────────────────────────────────────────────────────

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
