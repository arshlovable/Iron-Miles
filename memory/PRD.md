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
