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
- **Header**: "IRON MILES" branding with menu/settings icons
- **Route Hero Section**: Current route display (Chicago → Denver) with highway background, mile shields (MILE 27, MILE 50), truck icon connector
- **Welcome Section**: "Welcome, Driver!" with current mile badge (placeholder for authenticated user name)
- **Generate Workout CTA**: Large central button — primary action on the page
- **Current Miles Card**: Progress bar, mile marker, "+27 Miles Earned"
- **Last Workout Card**: "Upper Body, +10 Miles"
- **Quick Stats Card**: 65 Workouts, 8,450 Steps, 720 Calories

#### 2. Generate Workout (Placeholder)
- Styled modal screen matching Iron Miles theme
- Workout type options: Upper Body, Lower Body, Full Body, Stretch & Recover
- "AI Workout Generation Coming Soon" badge
- Back navigation to Dashboard

#### 3. Progress Map (Placeholder)
- Coming Soon screen with map icon

#### 4. Workouts (Placeholder)
- Coming Soon screen with dumbbell icon

#### 5. Fuel (Placeholder)
- Coming Soon screen with gas station icon

### Navigation
- 4-tab bottom navigation: Dashboard, Progress Map, Workouts, Fuel
- Custom tab bar with gold oval icons matching Iron Miles design system
- Dashboard is the default active tab

### Design System
- **Theme**: Dark/graphite/black with gold (#D4AF37) accents
- **Vibe**: Rugged, masculine, disciplined, trucking-themed
- **Secondary accent**: Muted green (#8A9A5B)
- **Typography**: Bold, uppercase, tight letter spacing
- **Cards**: Dark surface (#121212) with subtle borders (#2A2A2A)

## Future Roadmap
- [ ] Supabase backend integration
- [ ] User authentication & onboarding
- [ ] AI workout generation (Generate Workout logic)
- [ ] Real mileage tracking
- [ ] Progress map functionality
- [ ] Nutrition/Fuel tracking
- [ ] Workout history & stats

## Tech Stack
- **Frontend**: React Native / Expo SDK 54 with expo-router
- **Backend**: FastAPI (scaffolded, not yet connected)
- **Database**: MongoDB (scaffolded, not yet connected)
- **Future**: Supabase for backend source of truth
