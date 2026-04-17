# Iron Miles - Truck Driver Fitness App PRD

## Overview
Iron Miles is a mobile-first fitness app built specifically for truck drivers. The app uses a mileage-based discipline system where fitness progress is tracked as "Iron Miles."

## Core Philosophy
- Truck drivers live in mileage psychology — discipline should be framed as Iron Miles
- The app should feel like a driver command center, not a generic fitness app
- Trucking schedules are unpredictable — no rigid workout programs
- Instead of pre-assigned workouts, drivers tap "Generate Workout" based on current situation

## Current Status: UI Scaffolding (MVP v0.1)

### Screens Implemented

#### 1. Dashboard (Home Screen)
- **Header**: "IRON MILES" branding with menu/settings icons, decorative gold lines
- **Lifetime Hero Section**: "LIFETIME IRON MILES" with large 4,820 mileage focal number, integrated road/highway visual with lane dashes and asphalt surface, mile shields (MILE 27, MILE 50) with truck road connector
- **Welcome Section**: "Welcome, Driver!" with current mile badge (placeholder for authenticated user name)
- **Generate Workout CTA**: Large central button — primary action on the page
- **Current Miles Card**: Progress bar, mile marker, "+27 Miles Earned"
- **Last Workout Card**: "Upper Body, +10 Miles"
- **Quick Stats Card**: 65 Workouts, 8,450 Steps, 720 Calories

#### 2. Generate Workout Flow (6-Step Multi-Step UI)
- **Step 1 — Target Area**: Single select from 6 options (Full Body, Upper Body, Lower Body, Core, Mobility, Back Relief)
- **Step 2 — Equipment**: Multi-select from 3 options (Bodyweight, Resistance Bands, Dumbbells)
- **Step 3 — Time Available**: Single select from 4 options (5 min, 10 min, 20 min, 30+ min)
- **Step 4 — Workout Style**: Single select from 5 options (Strength, Burn, Mobility, Recovery, Quick Reset) with GENERATE button
- **Step 5 — Loading**: Animated progress bar with "Building Your Workout" text, auto-advances after ~2.8s
- **Step 6 — Workout Result**: Shows "CAB UPPER BODY STRENGTH" placeholder with 5 exercises, sets/reps, +10 Iron Miles, START WORKOUT CTA, GENERATE AGAIN secondary button
- Progress bar (1/4 through 4/4) visible on question steps only
- Back/Next navigation with selection state preservation
- Required selections block Next until valid

#### 2b. Workout In Progress (Exercise Execution)
- Exercise-by-exercise execution screen entered via "Start Workout" on the result screen
- Shows: workout title, exercise progress (X of 5), current exercise name/icon, sets/reps card, instruction text
- Controls: Previous (disabled on first), Pause (placeholder), Next/Finish
- Progress bar + exercise dots track position through the workout
- Top bar hidden for distraction-free focused workout experience
- After last exercise, FINISH navigates to Workout Complete

#### 2c. Workout Complete
- Success screen showing "WORKOUT COMPLETE" with green checkmark
- Displays +10 Iron Miles earned in shield badge
- Shows workout stats (time, exercise count)
- "BACK TO DASHBOARD" CTA returns to home screen
- **Full loop**: Generate → Ready → In Progress → Complete → Dashboard

#### 3. Progress Map (Tab Screen)
- **Header**: "PROGRESS MAP" with "Your Miles of Discipline journey" subtitle
- **Lifetime Iron Miles Card**: Large 4,820 mileage display with gold progress bar and "180 miles to Iron Driver"
- **Weekly Progress**: 3-card row showing Workouts (4), Miles (85), Day Streak (3)
- **THE ROAD**: Vertical highway-style progression with 6 milestones:
  - 100 — Left the Parking Lot (unlocked, green)
  - 500 — First Long Haul (unlocked, green)
  - 1,000 — Road Warrior (unlocked, green)
  - 2,500 — Highway Legend (unlocked, green)
  - 5,000 — Iron Driver (current target, gold)
  - 10,000 — Diesel Discipline (locked, gray)
- **Milestones Unlocked List**: Shows all 4 unlocked milestones with checkmarks
- **Note**: Placeholder data — ready for backend connection

#### 4. Workouts (Tab Screen — Workout Hub)
- **Header**: "WORKOUTS" with "Quick workouts built for truckers"
- **Filter Chips**: Scrollable row (All, Bodyweight, Bands, Dumbbells, 5 min, 10 min, 20 min)
- **CATEGORIES**: 6-card grid — Cab Workouts, Truck Stop Workouts, Core, Mobility, Full Body, Quick Reset — each with gradient and icon
- **QUICK PICKS**: Horizontal scroll cards (5 Min Quick Reset, 10 Min Upper Body, Back Relief Mobility, Full Body Stop Workout) with duration + Iron Miles chip
- **RECENT WORKOUTS**: 4 history items (Cab Upper Body Strength, Back Saver Reset, Truck Stop Full Body, Core Lockdown) with metadata
- **Note**: Placeholder data — ready for real workout history and category filtering

#### 5. Fuel (Placeholder)
- Coming Soon screen with gas station icon

### Navigation
- 4-tab bottom navigation: Dashboard, Progress Map, Workouts, Fuel
- Custom tab bar with gold oval icons matching Iron Miles design system
- Dashboard is the default active tab

### Design System (Refined v2)
- **Theme**: Dark/graphite/black with warm metallic gold (#E0C27C / #D4A843) accents
- **Vibe**: Rugged, masculine, disciplined, trucking-themed, premium industrial
- **Gold palette**: Primary #E0C27C, Bright #FFD700, Mid #D4A843, Dark #B89B5F, Dim #5C4A1A
- **Green accents**: Shield green #1F4037, CTA green #1A3329
- **Mile shields**: Highway-badge style with green gradient backgrounds and thick gold borders
- **CTA Button**: Deep green gradient with thick gold border, white uppercase text
- **Typography**: Bold, uppercase, tight letter spacing, warmer gold tones for titles
- **Cards**: Dark surface (#111110) with gold-tinted borders (#5C4A1A)
- **Bottom nav**: Medallion-style circular icons (54px) with gold active state, golden glow line
- **Decorative elements**: Double gold accent lines, diamond separators, highway dash motifs

## Data Flow
- **Generate Workout**: User selections → `POST /api/workouts/generate` → queries exercises table → builds structured workout → saves to `generated_workouts` + `generated_workout_exercises` → returns real exercise data to UI
- **Workout Execution**: Start Workout → In Progress (real exercises from DB) → Complete → Iron Miles logged
- **No placeholder data**: All workout content flows from Supabase database
- [ ] Supabase backend integration
- [ ] User authentication & onboarding
- [ ] AI workout generation (Generate Workout logic)
- [ ] Real mileage tracking
- [ ] Progress map functionality
- [ ] Nutrition/Fuel tracking
- [ ] Workout history & stats

## Tech Stack
- **Frontend**: React Native / Expo SDK 54 with expo-router, @supabase/supabase-js
- **Backend**: FastAPI with supabase-py (Python Supabase client)
- **Database**: Supabase (PostgreSQL) — 6 tables: profiles, exercises, generated_workouts, generated_workout_exercises, workout_sessions, iron_miles_log
- **Storage**: Supabase Storage — 2 buckets: exercise-videos, exercise-thumbnails
- **Seed Data**: 12 starter exercises across upper_body, lower_body, core, mobility categories
