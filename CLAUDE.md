# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SickleCell Compass** — a health management app for individuals with Sickle Cell Disease (SCD). This is a monorepo with two apps:

- `apps/mobile/` — React Native (Expo) mobile app (primary app)
- `apps/web/` — React Router v7 web app (auth backend + web interface)

## Commands

### Mobile App (`apps/mobile/`)

```bash
# Start development server
npx expo start

# Run on specific platform
npx expo run:ios
npx expo run:android

# Run with tunnel (for physical devices)
npx expo start --tunnel

# Install dependencies
npm install

# Run tests
npx jest
npx jest --testPathPattern="<test-file-name>"
```

### Web App (`apps/web/`)

```bash
# Start dev server
npm run dev

# Type checking
npm run typecheck
```

## Architecture

### Mobile App

**Routing:** Expo Router (file-based, like Next.js). Entry is `src/app/index.jsx` which redirects to `(tabs)/`. All main screens live in `src/app/(tabs)/`. The `care/` subdirectory uses a nested stack navigator.

**State:** Single Zustand store at `src/store/appStore.js`. All app state lives here — user profile, health streak, symptom logs, emergency contacts, chat history. Currently initialized with mock data from `src/types.js`. The store includes computed helpers (`getWeeklyAverage`, `getTodaysHealthData`, etc.).

**Auth flow:** `src/utils/auth/` contains a self-contained auth system. On app start, `_layout.jsx` calls `useAuth().initiate()` which reads a token from Expo SecureStore. The `useRequireAuth` hook opens an auth modal WebView pointing to the web app's `/account/signin` route. Auth state is also stored in a separate Zustand store (`useAuthStore`) within the auth utility.

**Component organization:** Components in `src/components/` are grouped by screen feature (e.g., `DailyInsights/`, `HealthStats/`, `TrendsInsights/`). Hooks in `src/hooks/` are data-transformation hooks that read from the store and shape data for charts/display.

**Query client:** Configured in `_layout.jsx` with 5-minute stale time, 30-minute cache, 1 retry, no refetch on window focus.

### Web App

**Routing:** React Router v7 file-based routes in `src/app/`. Backend runs via `react-router-hono-server` (Hono).

**Auth:** NextAuth.js (`@auth/core`) handles session management. Routes at `src/app/api/auth/` include a token endpoint and an Expo web auth callback (`expo-web-success`) used by the mobile app's WebView auth flow.

**Database:** PostgreSQL via `@neondatabase/serverless`. Currently only auth tables are configured.

### Design System

Colors used throughout both apps:
- Cream: `#F7DFBA`
- Dark Teal: `#09332C`
- Orange: `#F0531C`
- Red: `#DC2626`
- Green: `#059669`
- Purple: `#7C3AED`

### Mock Data

All non-auth features use static mock data. The mock data source is `apps/mobile/src/types.js` (mockUser, mockHealthData, mockEmergencyContacts). No real API calls are made by the mobile app except for authentication.

## Key Patterns

- **Path alias:** `@/` maps to `apps/mobile/src/` (configured in `tsconfig.json`)
- **Streak repair system:** Users can fill in missed tracking days using limited "repairs" — see `useStreakRepair` and `detectMissedDay` in appStore.js
- **Emergency SOS:** Floating button rendered in the tab layout, triggers a countdown modal with animations and haptic feedback before calling emergency contacts or 911
- **Bottom sheets:** `@gorhom/bottom-sheet` v5 used for streak-related modals
- **Icons:** `lucide-react-native` (mobile) and `lucide-react` (web)
- **Animations:** Moti + React Native Reanimated for mobile; Motion (Framer) for web
