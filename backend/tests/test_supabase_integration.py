"""
Backend API tests for Iron Miles Supabase integration.
Tests: health check, exercises CRUD, workout generation, sessions, Iron Miles logging.
"""
import pytest
import requests
import os
import uuid
from datetime import datetime

# Read BASE_URL from frontend .env file
def get_base_url():
    try:
        with open('/app/frontend/.env', 'r') as f:
            for line in f:
                if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception:
        pass
    return os.environ.get('EXPO_PUBLIC_BACKEND_URL', '').rstrip('/')

BASE_URL = get_base_url()

@pytest.fixture
def api_client():
    """Shared requests session"""
    session = requests.Session()
    session.headers.update({"Content-Type": "application/json"})
    return session


class TestHealthCheck:
    """Health check endpoint tests"""

    def test_health_endpoint_returns_healthy(self, api_client):
        """Test GET /api/health returns status 'healthy' and supabase 'connected'"""
        response = api_client.get(f"{BASE_URL}/api/health")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert "status" in data, "Response missing 'status' field"
        assert data["status"] == "healthy", f"Expected status 'healthy', got '{data['status']}'"
        assert "supabase" in data, "Response missing 'supabase' field"
        assert data["supabase"] == "connected", f"Expected supabase 'connected', got '{data['supabase']}'"


class TestExercises:
    """Exercise endpoint tests"""

    def test_get_all_exercises_returns_12(self, api_client):
        """Test GET /api/exercises returns 12 seeded exercises"""
        response = api_client.get(f"{BASE_URL}/api/exercises")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) == 12, f"Expected 12 exercises, got {len(data)}"
        
        # Verify exercise structure
        first_exercise = data[0]
        required_fields = ['id', 'name', 'category', 'equipment_type']
        for field in required_fields:
            assert field in first_exercise, f"Exercise missing required field: {field}"

    def test_get_exercises_filter_by_category_upper_body(self, api_client):
        """Test GET /api/exercises?category=upper_body returns 5 upper body exercises"""
        response = api_client.get(f"{BASE_URL}/api/exercises?category=upper_body")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) == 5, f"Expected 5 upper body exercises, got {len(data)}"
        
        # Verify all exercises are upper_body category
        for exercise in data:
            assert exercise['category'] == 'upper_body', f"Expected category 'upper_body', got '{exercise['category']}'"

    def test_get_exercises_filter_by_equipment_bodyweight(self, api_client):
        """Test GET /api/exercises?equipment=bodyweight returns bodyweight exercises"""
        response = api_client.get(f"{BASE_URL}/api/exercises?equipment=bodyweight")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) > 0, "Expected at least 1 bodyweight exercise"
        
        # Verify all exercises are bodyweight equipment
        for exercise in data:
            assert exercise['equipment_type'] == 'bodyweight', f"Expected equipment_type 'bodyweight', got '{exercise['equipment_type']}'"

    def test_get_exercises_filter_by_category_lower_body(self, api_client):
        """Test GET /api/exercises?category=lower_body returns lower body exercises"""
        response = api_client.get(f"{BASE_URL}/api/exercises?category=lower_body")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert isinstance(data, list), "Response should be a list"
        assert len(data) >= 2, f"Expected at least 2 lower body exercises, got {len(data)}"
        
        for exercise in data:
            assert exercise['category'] == 'lower_body', f"Expected category 'lower_body', got '{exercise['category']}'"


class TestWorkoutGeneration:
    """Workout generation endpoint tests"""

    def test_generate_workout_creates_workout_with_exercises(self, api_client):
        """Test POST /api/workouts/generate creates a workout with exercises"""
        payload = {
            "target_area": "upper_body",
            "equipment_selected": ["bodyweight", "bands"],
            "duration_minutes": 10,
            "workout_style": "strength"
        }
        
        response = api_client.post(f"{BASE_URL}/api/workouts/generate", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify required fields in response
        required_fields = ['id', 'title', 'target_area', 'duration_minutes', 'iron_miles_reward', 'status', 'exercises']
        for field in required_fields:
            assert field in data, f"Response missing required field: {field}"
        
        # Verify field values
        assert data['target_area'] == 'upper_body', f"Expected target_area 'upper_body', got '{data['target_area']}'"
        assert data['duration_minutes'] == 10, f"Expected duration_minutes 10, got {data['duration_minutes']}"
        assert data['iron_miles_reward'] == 10, f"Expected iron_miles_reward 10, got {data['iron_miles_reward']}"
        assert data['status'] == 'ready', f"Expected status 'ready', got '{data['status']}'"
        
        # Verify exercises array
        assert isinstance(data['exercises'], list), "exercises should be a list"
        assert len(data['exercises']) > 0, "Expected at least 1 exercise in workout"
        assert len(data['exercises']) <= 5, f"Expected max 5 exercises, got {len(data['exercises'])}"
        
        # Verify exercise structure
        first_exercise = data['exercises'][0]
        exercise_fields = ['exercise_id', 'name', 'sets', 'reps', 'order']
        for field in exercise_fields:
            assert field in first_exercise, f"Exercise missing required field: {field}"
        
        # Store workout_id for session tests
        return data['id']

    def test_generate_workout_with_different_duration(self, api_client):
        """Test workout generation with 20 minute duration"""
        payload = {
            "target_area": "lower_body",
            "equipment_selected": ["bodyweight"],
            "duration_minutes": 20,
            "workout_style": "burn"
        }
        
        response = api_client.post(f"{BASE_URL}/api/workouts/generate", json=payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data['duration_minutes'] == 20, f"Expected duration_minutes 20, got {data['duration_minutes']}"
        assert data['iron_miles_reward'] == 20, f"Expected iron_miles_reward 20 for 20 min workout, got {data['iron_miles_reward']}"


class TestWorkoutSessions:
    """Workout session endpoint tests"""

    def test_start_session_creates_session(self, api_client):
        """Test POST /api/sessions/start creates a workout session"""
        # First generate a workout
        workout_payload = {
            "target_area": "upper_body",
            "equipment_selected": ["bodyweight"],
            "duration_minutes": 10,
            "workout_style": "strength"
        }
        workout_response = api_client.post(f"{BASE_URL}/api/workouts/generate", json=workout_payload)
        assert workout_response.status_code == 200, "Failed to generate workout for session test"
        workout_id = workout_response.json()['id']
        
        # Start session
        session_payload = {
            "generated_workout_id": workout_id
        }
        response = api_client.post(f"{BASE_URL}/api/sessions/start", json=session_payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify session fields
        required_fields = ['id', 'generated_workout_id', 'status', 'iron_miles_earned', 'started_at']
        for field in required_fields:
            assert field in data, f"Session response missing required field: {field}"
        
        assert data['generated_workout_id'] == workout_id, "Session workout_id doesn't match"
        assert data['status'] == 'started', f"Expected status 'started', got '{data['status']}'"
        assert data['iron_miles_earned'] == 0, f"Expected iron_miles_earned 0 at start, got {data['iron_miles_earned']}"
        assert data['started_at'] is not None, "started_at should not be null"
        
        return data['id']

    def test_complete_session_awards_iron_miles(self, api_client):
        """Test POST /api/sessions/complete completes session and logs Iron Miles"""
        # Generate workout
        workout_payload = {
            "target_area": "core",
            "equipment_selected": ["bodyweight"],
            "duration_minutes": 10,
            "workout_style": "strength"
        }
        workout_response = api_client.post(f"{BASE_URL}/api/workouts/generate", json=workout_payload)
        workout_id = workout_response.json()['id']
        expected_miles = workout_response.json()['iron_miles_reward']
        
        # Start session
        session_payload = {"generated_workout_id": workout_id}
        session_response = api_client.post(f"{BASE_URL}/api/sessions/start", json=session_payload)
        session_id = session_response.json()['id']
        
        # Complete session
        complete_payload = {"session_id": session_id}
        response = api_client.post(f"{BASE_URL}/api/sessions/complete", json=complete_payload)
        assert response.status_code == 200, f"Expected 200, got {response.status_code}: {response.text}"
        
        data = response.json()
        
        # Verify completion
        assert data['status'] == 'completed', f"Expected status 'completed', got '{data['status']}'"
        assert data['iron_miles_earned'] == expected_miles, f"Expected {expected_miles} miles, got {data['iron_miles_earned']}"
        assert data['completed_at'] is not None, "completed_at should not be null"


class TestIronMiles:
    """Iron Miles tracking endpoint tests"""

    def test_get_iron_miles_for_user(self, api_client):
        """Test GET /api/iron-miles/{user_id} returns total Iron Miles"""
        # Create a unique user for this test
        test_user_id = str(uuid.uuid4())
        
        # Generate and complete a workout to earn miles
        workout_payload = {
            "target_area": "upper_body",
            "equipment_selected": ["bodyweight"],
            "duration_minutes": 10,
            "workout_style": "strength"
        }
        workout_response = api_client.post(f"{BASE_URL}/api/workouts/generate", json=workout_payload)
        workout_id = workout_response.json()['id']
        
        session_payload = {"generated_workout_id": workout_id}
        session_response = api_client.post(f"{BASE_URL}/api/sessions/start", json=session_payload)
        session_id = session_response.json()['id']
        
        complete_payload = {"session_id": session_id}
        complete_response = api_client.post(f"{BASE_URL}/api/sessions/complete", json=complete_payload)
        
        # Get user_id from completed session
        completed_session = complete_response.json()
        actual_user_id = completed_session.get('user_id')
        
        if actual_user_id:
            # Get Iron Miles
            response = api_client.get(f"{BASE_URL}/api/iron-miles/{actual_user_id}")
            assert response.status_code == 200, f"Expected 200, got {response.status_code}"
            
            data = response.json()
            
            # Verify response structure
            required_fields = ['user_id', 'total_iron_miles', 'entries']
            for field in required_fields:
                assert field in data, f"Response missing required field: {field}"
            
            assert data['total_iron_miles'] >= 10, f"Expected at least 10 total miles, got {data['total_iron_miles']}"
            assert data['entries'] >= 1, f"Expected at least 1 entry, got {data['entries']}"
        else:
            # If no user_id, skip this test (user auth not implemented yet)
            pytest.skip("User ID not available - user authentication not implemented yet")

    def test_get_iron_miles_for_new_user_returns_zero(self, api_client):
        """Test GET /api/iron-miles/{user_id} returns 0 for new user"""
        new_user_id = str(uuid.uuid4())
        
        response = api_client.get(f"{BASE_URL}/api/iron-miles/{new_user_id}")
        assert response.status_code == 200, f"Expected 200, got {response.status_code}"
        
        data = response.json()
        assert data['total_iron_miles'] == 0, f"Expected 0 miles for new user, got {data['total_iron_miles']}"
        assert data['entries'] == 0, f"Expected 0 entries for new user, got {data['entries']}"
