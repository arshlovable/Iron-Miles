from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime, timezone

from supabase_client import get_supabase
from workout_repository import (
    complete_workout_session,
    create_generated_workout,
    get_effective_user_id,
    insert_generated_workout_exercises,
    load_generated_workout_with_exercises,
    select_exercises_for_workout,
    start_workout_session,
)

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
        user_id = get_effective_user_id(sb, req.user_id)
        workout = create_generated_workout(
            sb=sb,
            user_id=user_id,
            target_area=req.target_area,
            equipment_selected=req.equipment_selected,
            duration_minutes=req.duration_minutes,
            workout_style=req.workout_style,
        )

        selected_exercises = select_exercises_for_workout(
            sb=sb,
            target_area=req.target_area,
            equipment_selected=req.equipment_selected,
            duration_minutes=req.duration_minutes,
        )

        if not selected_exercises:
            raise HTTPException(status_code=400, detail="No exercises available for selected filters")

        insert_generated_workout_exercises(
            sb=sb,
            workout_id=workout["id"],
            selected_exercises=selected_exercises,
        )

        # Return canonical DB-read payload for Workout Ready screen.
        return load_generated_workout_with_exercises(sb, workout["id"])

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating workout: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to generate workout: {str(e)[:100]}")


@api_router.get("/workouts/{workout_id}", response_model=GeneratedWorkoutOut)
async def get_generated_workout(workout_id: str):
    """Load generated workout + assigned exercises from Supabase."""
    try:
        sb = get_supabase()
        return load_generated_workout_with_exercises(sb, workout_id)
    except Exception as e:
        logger.error(f"Error loading generated workout {workout_id}: {e}")
        raise HTTPException(status_code=404, detail="Generated workout not found")

# ─── Workout Sessions ──────────────────────────────────────────────────────

@api_router.post("/sessions/start", response_model=WorkoutSessionOut)
async def start_session(req: StartSessionRequest):
    """Start a workout session."""
    try:
        sb = get_supabase()
        return start_workout_session(
            sb=sb,
            generated_workout_id=req.generated_workout_id,
            requested_user_id=req.user_id,
        )
    except Exception as e:
        logger.error(f"Error starting session: {e}")
        raise HTTPException(status_code=500, detail="Failed to start session")

@api_router.post("/sessions/complete", response_model=WorkoutSessionOut)
async def complete_session(req: CompleteSessionRequest):
    """Complete a workout session and award Iron Miles."""
    try:
        sb = get_supabase()
        return complete_workout_session(sb=sb, session_id=req.session_id)
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
