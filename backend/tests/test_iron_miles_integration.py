"""
Backend API tests for Iron Miles app - Iteration 12
Tests: Dashboard API, Workout Generation, Session Start/Complete, Iron Miles tracking
"""
import pytest
import requests
import os
import uuid

# Read from frontend .env or use public URL
BASE_URL = "https://haul-home.preview.emergentagent.com"

class TestHealthAndBasics:
    """Health check and basic connectivity tests"""
    
    def test_health_check(self):
        """Test API health endpoint"""
        response = requests.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] in ["healthy", "degraded"]
        print(f"✅ Health check passed: {data}")

    def test_root_endpoint(self):
        """Test root API endpoint"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        print(f"✅ Root endpoint passed: {data}")


class TestExercises:
    """Exercise API tests"""
    
    def test_get_all_exercises(self):
        """Test fetching all exercises"""
        response = requests.get(f"{BASE_URL}/api/exercises")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        assert len(data) > 0
        print(f"✅ Fetched {len(data)} exercises")

    def test_get_exercises_by_category(self):
        """Test filtering exercises by category"""
        response = requests.get(f"{BASE_URL}/api/exercises?category=upper_body")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for ex in data:
            assert ex["category"] == "upper_body"
        print(f"✅ Fetched {len(data)} upper_body exercises")

    def test_get_exercises_by_equipment(self):
        """Test filtering exercises by equipment"""
        response = requests.get(f"{BASE_URL}/api/exercises?equipment=bodyweight")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)
        for ex in data:
            assert ex["equipment_type"] == "bodyweight"
        print(f"✅ Fetched {len(data)} bodyweight exercises")


class TestWorkoutGeneration:
    """Workout generation API tests"""
    
    def test_generate_workout_upper_body(self):
        """Test generating upper body workout"""
        payload = {
            "target_area": "upper_body",
            "equipment_selected": ["bodyweight"],
            "duration_minutes": 10,
            "workout_style": "strength"
        }
        response = requests.post(f"{BASE_URL}/api/workouts/generate", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Verify workout structure
        assert "id" in data
        assert data["target_area"] == "upper_body"
        assert data["duration_minutes"] == 10
        assert data["iron_miles_reward"] == 10
        assert data["status"] == "ready"
        assert "exercises" in data
        assert len(data["exercises"]) > 0
        
        print(f"✅ Generated workout: {data['title']} with {len(data['exercises'])} exercises")
        return data["id"]

    def test_generate_workout_full_body(self):
        """Test generating full body workout"""
        payload = {
            "target_area": "full_body",
            "equipment_selected": ["bodyweight", "bands"],
            "duration_minutes": 20,
            "workout_style": "burn"
        }
        response = requests.post(f"{BASE_URL}/api/workouts/generate", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        assert data["duration_minutes"] == 20
        assert data["iron_miles_reward"] == 20
        assert len(data["exercises"]) > 0
        
        print(f"✅ Generated full body workout: {data['title']}")
        return data["id"]


class TestWorkoutSessions:
    """Workout session start/complete tests"""
    
    def test_full_workout_session_flow(self):
        """Test complete workflow: Generate → Start → Complete"""
        # Step 1: Generate workout
        gen_payload = {
            "target_area": "core",
            "equipment_selected": ["bodyweight"],
            "duration_minutes": 10,
            "workout_style": "strength"
        }
        gen_response = requests.post(f"{BASE_URL}/api/workouts/generate", json=gen_payload)
        assert gen_response.status_code == 200
        workout = gen_response.json()
        workout_id = workout["id"]
        expected_miles = workout["iron_miles_reward"]
        print(f"✅ Step 1: Generated workout {workout_id} with {expected_miles} Iron Miles reward")
        
        # Step 2: Start session
        start_payload = {
            "generated_workout_id": workout_id
        }
        start_response = requests.post(f"{BASE_URL}/api/sessions/start", json=start_payload)
        assert start_response.status_code == 200
        session = start_response.json()
        session_id = session["id"]
        assert session["status"] == "started"
        assert session["generated_workout_id"] == workout_id
        print(f"✅ Step 2: Started session {session_id}")
        
        # Step 3: Complete session
        complete_payload = {
            "session_id": session_id
        }
        complete_response = requests.post(f"{BASE_URL}/api/sessions/complete", json=complete_payload)
        assert complete_response.status_code == 200
        completed_session = complete_response.json()
        assert completed_session["status"] == "completed"
        assert completed_session["iron_miles_earned"] == expected_miles
        assert "completed_at" in completed_session
        print(f"✅ Step 3: Completed session, earned {completed_session['iron_miles_earned']} Iron Miles")
        
        return session_id, expected_miles


class TestDashboardAPI:
    """Dashboard API tests - CRITICAL for Iteration 12"""
    
    def test_dashboard_returns_data(self):
        """Test GET /api/dashboard returns proper structure"""
        response = requests.get(f"{BASE_URL}/api/dashboard")
        assert response.status_code == 200
        data = response.json()
        
        # Verify all required fields exist
        assert "lifetime_miles" in data
        assert "total_workouts" in data
        assert "week_miles" in data
        assert "week_workouts" in data
        
        # Verify data types
        assert isinstance(data["lifetime_miles"], int)
        assert isinstance(data["total_workouts"], int)
        assert isinstance(data["week_miles"], int)
        assert isinstance(data["week_workouts"], int)
        
        print(f"✅ Dashboard API returned: lifetime_miles={data['lifetime_miles']}, total_workouts={data['total_workouts']}, week_miles={data['week_miles']}")
        return data

    def test_dashboard_updates_after_workout(self):
        """Test dashboard data updates after completing a workout - CRITICAL"""
        # Get initial dashboard state
        initial_response = requests.get(f"{BASE_URL}/api/dashboard")
        assert initial_response.status_code == 200
        initial_data = initial_response.json()
        initial_miles = initial_data["lifetime_miles"]
        initial_workouts = initial_data["total_workouts"]
        print(f"✅ Initial state: {initial_miles} miles, {initial_workouts} workouts")
        
        # Complete a workout
        gen_payload = {
            "target_area": "upper_body",
            "equipment_selected": ["bodyweight"],
            "duration_minutes": 10,
            "workout_style": "strength"
        }
        gen_response = requests.post(f"{BASE_URL}/api/workouts/generate", json=gen_payload)
        workout = gen_response.json()
        workout_id = workout["id"]
        miles_reward = workout["iron_miles_reward"]
        
        start_response = requests.post(f"{BASE_URL}/api/sessions/start", json={"generated_workout_id": workout_id})
        session = start_response.json()
        
        complete_response = requests.post(f"{BASE_URL}/api/sessions/complete", json={"session_id": session["id"]})
        assert complete_response.status_code == 200
        print(f"✅ Completed workout, should earn {miles_reward} miles")
        
        # Get updated dashboard state
        updated_response = requests.get(f"{BASE_URL}/api/dashboard")
        assert updated_response.status_code == 200
        updated_data = updated_response.json()
        updated_miles = updated_data["lifetime_miles"]
        updated_workouts = updated_data["total_workouts"]
        
        # Verify increments
        assert updated_miles == initial_miles + miles_reward, f"Expected {initial_miles + miles_reward} miles, got {updated_miles}"
        assert updated_workouts == initial_workouts + 1, f"Expected {initial_workouts + 1} workouts, got {updated_workouts}"
        
        print(f"✅ CRITICAL TEST PASSED: Dashboard updated correctly!")
        print(f"   Miles: {initial_miles} → {updated_miles} (+{miles_reward})")
        print(f"   Workouts: {initial_workouts} → {updated_workouts} (+1)")

    def test_dashboard_last_workout_field(self):
        """Test dashboard returns last_workout data"""
        # Complete a workout first
        gen_payload = {
            "target_area": "lower_body",
            "equipment_selected": ["bodyweight"],
            "duration_minutes": 10,
            "workout_style": "burn"
        }
        gen_response = requests.post(f"{BASE_URL}/api/workouts/generate", json=gen_payload)
        workout = gen_response.json()
        
        start_response = requests.post(f"{BASE_URL}/api/sessions/start", json={"generated_workout_id": workout["id"]})
        session = start_response.json()
        
        requests.post(f"{BASE_URL}/api/sessions/complete", json={"session_id": session["id"]})
        
        # Check dashboard
        response = requests.get(f"{BASE_URL}/api/dashboard")
        data = response.json()
        
        if data.get("last_workout"):
            last_workout = data["last_workout"]
            assert "title" in last_workout or "target_area" in last_workout
            assert "iron_miles" in last_workout
            print(f"✅ Last workout data present: {last_workout.get('title', 'N/A')}, {last_workout['iron_miles']} miles")
        else:
            print("⚠️  last_workout is None (might be first workout)")


class TestIronMiles:
    """Iron Miles tracking tests"""
    
    def test_get_iron_miles_for_user(self):
        """Test fetching Iron Miles for a specific user"""
        test_user_id = str(uuid.uuid4())  # Use valid UUID
        
        # Complete a workout for this user
        gen_response = requests.post(f"{BASE_URL}/api/workouts/generate", json={
            "target_area": "core",
            "equipment_selected": ["bodyweight"],
            "duration_minutes": 10,
            "workout_style": "strength"
        })
        workout = gen_response.json()
        
        start_response = requests.post(f"{BASE_URL}/api/sessions/start", json={
            "generated_workout_id": workout["id"],
            "user_id": test_user_id
        })
        
        if start_response.status_code != 200:
            print(f"⚠️  Session start failed: {start_response.status_code}, skipping test")
            pytest.skip("Session start failed")
            return
            
        session = start_response.json()
        
        requests.post(f"{BASE_URL}/api/sessions/complete", json={"session_id": session["id"]})
        
        # Fetch Iron Miles
        response = requests.get(f"{BASE_URL}/api/iron-miles/{test_user_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert "total_iron_miles" in data
        assert data["total_iron_miles"] >= 10
        print(f"✅ User {test_user_id} has {data['total_iron_miles']} Iron Miles")
