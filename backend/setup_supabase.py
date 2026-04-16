"""
Iron Miles — Supabase Setup Script
Creates storage buckets and seeds starter exercise data.
Run AFTER executing supabase_schema.sql in the Supabase Dashboard.

Usage: python setup_supabase.py
"""
import sys
import os
sys.path.insert(0, os.path.dirname(__file__))

from supabase_client import get_supabase

# ─── Starter exercise seed data ────────────────────────────────────────────
SEED_EXERCISES = [
    {
        "name": "Seated Band Rows",
        "category": "upper_body",
        "equipment_type": "bands",
        "workout_style": "strength",
        "sets_default": 3,
        "reps_default": "12 reps",
        "instruction_text": "Keep your back straight and pull the band toward your torso. Squeeze shoulder blades together at the top.",
    },
    {
        "name": "Incline Push-Ups",
        "category": "upper_body",
        "equipment_type": "bodyweight",
        "workout_style": "strength",
        "sets_default": 3,
        "reps_default": "10 reps",
        "instruction_text": "Hands shoulder-width apart on an elevated surface. Lower chest toward the surface, push back up.",
    },
    {
        "name": "Seated Shoulder Press",
        "category": "upper_body",
        "equipment_type": "dumbbells",
        "workout_style": "strength",
        "sets_default": 3,
        "reps_default": "10 reps",
        "instruction_text": "Press the weight overhead from shoulder level. Keep core tight and control the descent.",
    },
    {
        "name": "Band Pull-Aparts",
        "category": "upper_body",
        "equipment_type": "bands",
        "workout_style": "strength",
        "sets_default": 3,
        "reps_default": "15 reps",
        "instruction_text": "Hold the band at chest height. Pull apart until arms are fully extended. Squeeze shoulder blades.",
    },
    {
        "name": "Steering Wheel Holds",
        "category": "upper_body",
        "equipment_type": "bodyweight",
        "workout_style": "strength",
        "sets_default": 3,
        "reps_default": "20 sec",
        "instruction_text": "Grip firmly at 10 and 2 position. Hold steady, engage your forearms and shoulders.",
    },
    {
        "name": "Bodyweight Squats",
        "category": "lower_body",
        "equipment_type": "bodyweight",
        "workout_style": "strength",
        "sets_default": 3,
        "reps_default": "15 reps",
        "instruction_text": "Stand with feet shoulder-width apart. Sit back and down, keeping chest up. Drive through heels to stand.",
    },
    {
        "name": "Dead Bugs",
        "category": "core",
        "equipment_type": "bodyweight",
        "workout_style": "strength",
        "sets_default": 3,
        "reps_default": "10 per side",
        "instruction_text": "Lie face up, arms extended. Lower opposite arm and leg while keeping lower back pressed to floor.",
    },
    {
        "name": "Glute Bridges",
        "category": "lower_body",
        "equipment_type": "bodyweight",
        "workout_style": "strength",
        "sets_default": 3,
        "reps_default": "15 reps",
        "instruction_text": "Lie on back, feet flat. Drive hips upward, squeezing glutes at the top. Lower slowly.",
    },
    {
        "name": "Standing Hip Flexor Stretch",
        "category": "mobility",
        "equipment_type": "bodyweight",
        "workout_style": "mobility",
        "sets_default": 2,
        "reps_default": "30 sec per side",
        "instruction_text": "Step into a lunge position. Push hips forward gently. Hold and breathe. Switch sides.",
    },
    {
        "name": "Thoracic Rotation",
        "category": "mobility",
        "equipment_type": "bodyweight",
        "workout_style": "mobility",
        "sets_default": 2,
        "reps_default": "10 per side",
        "instruction_text": "On all fours, place one hand behind your head. Rotate your upper back toward the ceiling, then down.",
    },
    {
        "name": "Banded Lateral Walks",
        "category": "lower_body",
        "equipment_type": "bands",
        "workout_style": "burn",
        "sets_default": 3,
        "reps_default": "12 per side",
        "instruction_text": "Place band above knees. Take controlled side steps maintaining tension. Stay low in a quarter squat.",
    },
    {
        "name": "Cat-Cow Stretch",
        "category": "mobility",
        "equipment_type": "bodyweight",
        "workout_style": "recovery",
        "sets_default": 2,
        "reps_default": "10 reps",
        "instruction_text": "On all fours, arch your back up (cat), then drop belly down (cow). Move slowly with breath.",
    },
]


def create_storage_buckets():
    """Create storage buckets for exercise media."""
    client = get_supabase()
    buckets_to_create = ['exercise-videos', 'exercise-thumbnails']

    existing = [b.name for b in client.storage.list_buckets()]
    for bucket_name in buckets_to_create:
        if bucket_name in existing:
            print(f"  ✓ Bucket '{bucket_name}' already exists")
        else:
            try:
                client.storage.create_bucket(bucket_name, options={"public": False})
                print(f"  ✓ Created bucket '{bucket_name}'")
            except Exception as e:
                print(f"  ✗ Failed to create '{bucket_name}': {e}")


def seed_exercises():
    """Seed starter exercise data."""
    client = get_supabase()

    # Check if exercises already exist
    try:
        result = client.table('exercises').select('id', count='exact').execute()
        count = result.count if result.count is not None else len(result.data)
        if count > 0:
            print(f"  ✓ Exercises table already has {count} rows — skipping seed")
            return
    except Exception as e:
        print(f"  ✗ Cannot query exercises table: {e}")
        print("  → Make sure you've run supabase_schema.sql in the Supabase Dashboard first!")
        return

    # Insert seed data
    try:
        result = client.table('exercises').insert(SEED_EXERCISES).execute()
        print(f"  ✓ Seeded {len(result.data)} starter exercises")
    except Exception as e:
        print(f"  ✗ Failed to seed exercises: {e}")


def verify_tables():
    """Check which tables exist."""
    client = get_supabase()
    tables = ['profiles', 'exercises', 'generated_workouts', 'generated_workout_exercises', 'workout_sessions', 'iron_miles_log']
    ok = 0
    for t in tables:
        try:
            client.table(t).select('id').limit(1).execute()
            print(f"  ✓ {t}")
            ok += 1
        except Exception:
            print(f"  ✗ {t} — not found")
    return ok == len(tables)


if __name__ == '__main__':
    print("\n═══ Iron Miles — Supabase Setup ═══\n")

    print("1. Creating storage buckets...")
    create_storage_buckets()

    print("\n2. Verifying database tables...")
    tables_ok = verify_tables()

    if tables_ok:
        print("\n3. Seeding starter exercises...")
        seed_exercises()
        print("\n✅ Setup complete!")
    else:
        print("\n⚠  Some tables are missing.")
        print("   Please run supabase_schema.sql in your Supabase Dashboard → SQL Editor")
        print("   Then re-run this script: python setup_supabase.py")
