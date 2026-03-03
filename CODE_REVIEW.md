# SickleCell Compass — Mobile App Code Review

> Reviewed against modern React Native / Expo standards (2025/2026).
> This is an honest critique intended to guide the path from prototype → production.

---

## Overall Assessment

The app is a **solid, well-thought-out prototype**. Navigation structure is clean, the UI is polished, and the feature scope is ambitious in the right way. That said, there are patterns throughout that will cause real pain once backend integration starts and user traffic grows. The issues below are ranked roughly by impact.

---

## 1. State Management

### Issues

**The Zustand store is doing too much.**
`appStore.js` holds user profile, health data, streak logic, emergency contacts, symptom form state, chat messages, and navigation state — all in one flat object. This works now, but when the store connects to real APIs, it'll be very difficult to manage loading states, errors, and cache invalidation for each domain independently.

**TanStack Query is installed but completely unused.**
The `QueryClient` is configured in `_layout.jsx`, but every screen reads directly from Zustand. This is the opposite of how these libraries are meant to work together. Zustand should own local UI state (selected date, form values, modal open/close). TanStack Query should own server state (health data, medications, appointments). Right now, all server data is in Zustand, which means once you add a real API, you'll need to rethink every screen.

**`activeTab` in the store is unnecessary.**
Expo Router already tracks the active route. Storing `activeTab` in Zustand means two sources of truth for navigation state. This can (and will) get out of sync.

**Mood is stored as a string but needs a number.**
In `submitSymptomLog()` there's a 5-level nested ternary converting `"excellent"` → `5`, `"good"` → `4`, etc. This conversion should not happen at submission time — it should either be stored as a number from the start, or the `MOODS` constant in `types.js` should include a numeric value field.

```js
// Current (fragile)
const moodValue =
  state.currentSymptomLog.mood === "excellent" ? 5
  : state.currentSymptomLog.mood === "good" ? 4
  : ...

// Better — add value to the constant
export const MOODS = [
  { id: "excellent", value: 5, label: "Excellent", emoji: "😄", color: "..." },
  ...
]
```

---

## 2. Data & Backend Readiness

### Issues

**All health data is ephemeral.**
When the app is closed, submitted symptom logs are gone unless the user was already holding mock data. There's no `AsyncStorage`, SQLite, or MMKV persistence for health data. For a health tracking app, this is critical — users lose their data on every restart.

**`getWeeklyAverage()` always takes the last 7 items, not the last 7 days.**
If a user logs twice in one day and skips the next, this average is wrong. It should filter by date range, not slice position.

```js
// Current (incorrect for sparse data)
getWeeklyAverage: (metric) => {
  const lastWeek = state.healthData.slice(-7);
  ...
}

// Should be
const sevenDaysAgo = subDays(new Date(), 7);
const lastWeek = state.healthData.filter(d => new Date(d.date) >= sevenDaysAgo);
```

**The streak repair creates a placeholder entry with all zeros.**
A repaired day gets `{ painLevel: 0, hydration: 0, mood: 0, isRepaired: true }`. This means it will drag down weekly averages and show up in charts as a "good day" (pain: 0, full hydration). The chart and average calculations need to know to skip `isRepaired` entries.

**`useChartData` fills missing days with `0` pain and `0` hydration.**
Zero pain and zero hydration are both valid (and opposite) readings. Missing data should be represented as `null` in the chart arrays so the line graph can render a gap instead of a misleading flat line.

---

## 3. Code Quality

### Issues

**Inline styles everywhere, no shared theme.**
Every file defines its own `StyleSheet.create({})` with hardcoded hex colors and spacing values repeated across dozens of files. When the design changes (and it will), every file has to be updated. A theme file should export colors, spacing, and typography as constants.

```js
// Repeated across ~15 files today
backgroundColor: '#09332C'
color: '#F7DFBA'
borderRadius: 12

// Should live once in src/theme.js
export const Colors = {
  teal: '#09332C',
  cream: '#F7DFBA',
  orange: '#F0531C',
  ...
}
export const Radius = { md: 12, lg: 20 }
```

**No error handling anywhere.**
`submitSymptomLog()`, `useStreakRepair()`, `detectMissedDay()`, and the auth `initiate()` function have no `try/catch`. If `SecureStore.getItemAsync()` throws (corrupted storage, permissions issue), the app silently crashes. For a medical app, silent failures are especially bad.

**`useEffect` with an empty body in `useAuth.js`.**
```js
useEffect(() => {}, []);  // line 27 in useAuth.js
```
This is dead code and should be removed.

**The AI chatbot picks a random hardcoded response.**
```js
const responses = [
  "For pain management...",
  "Staying hydrated...",
  ...
];
const response = responses[Math.floor(Math.random() * responses.length)];
```
This is fine as a placeholder, but there's no distinction between user questions and responses — any question gets any answer. Before integrating a real AI, add a `type: 'user' | 'assistant'` field consistently to every message, which it looks like the UI already assumes but the mock doesn't enforce.

**`lastLogDate` is initialized as a hardcoded past date.**
```js
lastLogDate: new Date("2024-11-26"),
```
This means `detectMissedDay()` will always find a missed day on first run (since "2024-11-26" is over a year ago). A new user will immediately see the repair streak sheet on their first open. `lastLogDate` should default to `null` and `detectMissedDay()` should handle the `null` case explicitly.

**Date handling is inconsistent.**
The codebase mixes `Date` objects, ISO strings (`"2024-11-26"`), and string comparisons via `.toDateString()`. This causes subtle bugs — for example, `isConsecutive` in `submitSymptomLog()` uses `.toDateString()` which is locale-sensitive and breaks in some regions. Use a library like `date-fns` (already installed) consistently throughout.

---

## 4. Performance

### Issues

**No `useCallback` or `useMemo` on expensive computations.**
`useChartData.js` recalculates 30 days of chart data, crisis-free periods, and averages on every render. Components that call this hook will re-run all that math whenever any parent re-renders. These should be wrapped in `useMemo`.

**Bottom sheets are not lazy-loaded.**
`StreaksBottomSheet` renders 33 milestone cards even when the sheet is closed. The `@gorhom/bottom-sheet` library supports rendering content only when the sheet is open — this should be used.

**`FlatList` is missing `keyExtractor` on several screens.**
Rewards and leaderboard lists use index-based keys. This causes unnecessary re-renders and can cause list flickering when data changes.

**The date picker renders 14 `TouchableOpacity` components inline.**
This is fine for 14 items, but it's rendered with no `ScrollView` optimisation. It should use a `FlatList` with `horizontal` and `getItemLayout` for consistent performance.

---

## 5. Accessibility

### Issues

**No `accessibilityLabel` on interactive elements.**
The Emergency SOS button, streak repair button, tab bar items, and chart elements have no screen reader labels. For a medical app, accessibility is not optional — users with visual impairments need to be able to use the emergency features.

**Pain level buttons (0-10) are not described.**
A screen reader would read "10" with no context that this is a pain level on a scale of 0-10, or what "10" means (Worst possible pain).

**Colour is the only differentiator for health states.**
Pain levels, mood states, and streak status are all communicated through colour alone. Users with colour blindness need a secondary indicator (pattern, icon, or label).

**Touch targets below 44×44pt on several buttons.**
The mood selector emoji buttons and some milestone grid items appear to be smaller than the recommended minimum touch target size for mobile.

---

## 6. Security

### Issues

**Auth token is stored as raw JSON in SecureStore.**
```js
auth: auth ? JSON.parse(auth) : null
```
SecureStore is the right place for tokens. But the token object structure is never validated after parsing — if the stored value is malformed, `JSON.parse()` will throw an unhandled exception and the app will crash on launch.

**`Linking.openURL()` is called directly with user-visible phone numbers.**
In `emergency.jsx`, phone numbers from mock contacts are passed straight to `tel:` links. When real contacts are added, this data should be sanitised — a malformed number or injected URL scheme could cause unexpected behaviour.

---

## 7. Testing

### Issues

**No tests exist.**
The Jest and `jest-expo` setup is there, and there's a `__tests__/README.md`, but zero test files. Given that this app tracks health data and has emergency call functionality, the streak calculation logic, `detectMissedDay`, `useStreakRepair`, and `getWeeklyAverage` should all have unit tests. These are the functions where a bug has the most user impact.

**The store is untestable in its current form.**
`appStore.js` imports `mockUser`, `mockHealthData`, and `mockEmergencyContacts` at the module level, meaning tests can't easily inject different initial states. The store should accept initial state as a parameter, or the mock data should be seeded separately.

---

## 8. Minor / Low Priority

- `apps/mobile/src/app/index.jsx` exists only to redirect to `(tabs)/`. Expo Router supports a `redirect` export that removes the need for this file entirely.
- `+not-found.tsx` is `.tsx` while every other file is `.jsx`. Pick one and be consistent.
- `isOnboardingComplete` is hardcoded to `true` in the store with a comment saying "skip onboarding for now". This should be a proper flag driven by SecureStore (same as auth), not a store constant.
- The `leaderboard` in the Rewards screen hardcodes the current user at rank 4. When real data comes in, the current user highlight logic needs to be based on user ID comparison, not position.
- Several screens use `Alert.alert("Coming Soon")` as a placeholder. These should at minimum be tracked so they're not forgotten before launch.

---

## Priority Order for Fixes

| Priority | Issue | Why |
|---|---|---|
| 🔴 Critical | Add local data persistence (MMKV or SQLite) | Users lose all health data on app restart |
| 🔴 Critical | Fix `getWeeklyAverage` date range logic | Medical data averages are currently wrong |
| 🔴 Critical | Fix `lastLogDate` default value | Every new user sees a false missed day |
| 🟠 High | Add error handling to store actions and auth | Silent failures in a medical app are dangerous |
| 🟠 High | Split Zustand store by domain | Required before backend integration |
| 🟠 High | Use TanStack Query for server data | Already installed, set up properly |
| 🟠 High | Replace inline styles with a theme file | Design changes will be painful otherwise |
| 🟡 Medium | Fix chart null vs 0 for missing data | Misleading charts undermine trust in the app |
| 🟡 Medium | Fix repaired streak entries affecting averages | Same — misleading health data |
| 🟡 Medium | Add `accessibilityLabel` to all interactive elements | Especially emergency features |
| 🟡 Medium | Add `useMemo` to chart data calculations | Performance on lower-end devices |
| 🟢 Low | Remove dead `useEffect` in `useAuth.js` | Code cleanliness |
| 🟢 Low | Standardise `.jsx` vs `.tsx` file extensions | Consistency |
| 🟢 Low | Replace `activeTab` Zustand state with router state | Two sources of truth for navigation |
