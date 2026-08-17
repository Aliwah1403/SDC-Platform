# 004 — Give the rewards badge grid a staggered entrance

- **Status**: DONE — executed against d6c2795, no spec changes; one pre-existing fragility found (see below)
- **Commit**: d6c2795
- **Severity**: LOW
- **Category**: 8 — Missed opportunities (delight budget)
- **Estimated scope**: 1 file, ~25 lines changed

## Problem

`apps/mobile/src/app/(tabs)/rewards.jsx` is the achievements screen — a hidden tab
(`(tabs)/_layout.jsx:73` sets `href: null`) that users reach deliberately and rarely,
to look at what they have earned. It contains **zero motion**: a grep for
`moti|Moti|withSpring|useSharedValue` in this 883-line file returns 0 matches.

Badges render completely flat, with locked state conveyed only by opacity:

```jsx
/* apps/mobile/src/app/(tabs)/rewards.jsx:257-272 — current */
  const BadgeCard = ({ badge, size = "normal" }) => {
    const cardWidth = size === "large" ? width * 0.4 : 120;
    const isUnlocked = badge.unlockedAt !== null;

    return (
      <View
        style={{
          backgroundColor: isUnlocked ? t.background : (t.isDark ? t.surfaceElevated : "#F9FAFB"),
          borderRadius: 12,
          padding: size === "large" ? 20 : 16,
          marginRight: 12,
          width: cardWidth,
          alignItems: "center",
          opacity: isUnlocked ? 1 : 0.6,
        }}
      >
```

It is rendered in two places, both all-at-once:

```jsx
/* rewards.jsx:698-702 — "Recently Unlocked" horizontal rail */
                {mockBadges
                  .filter((b) => b.unlockedAt)
                  .map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} size="large" />
                  ))}
```

```jsx
/* rewards.jsx:725-729 — "All Badges" grid */
              {mockBadges.map((badge) => (
                <View key={badge.id} style={{ width: "48%", marginBottom: 12 }}>
                  <BadgeCard badge={badge} />
                </View>
              ))}
```

Per AUDIT.md §1, rare/first-time surfaces are exactly where the delight budget is
allowed to be spent — and this one spends none of it. For an app helping people manage
a painful chronic condition, the screen that says "look what you've kept up with" is
worth the motion.

## Target

A staggered scale-and-fade entrance. Never `scale(0)` — start at `0.94` per
AUDIT.md §3.

```jsx
/* target — replaces the outer View at rewards.jsx:262-272 */
      <MotiView
        from={
          reducedMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: 0.94, translateY: 8 }
        }
        animate={{ opacity: isUnlocked ? 1 : 0.6, scale: 1, translateY: 0 }}
        transition={
          reducedMotion
            ? { type: "timing", duration: 220 }
            : { ...celebrationSpring, delay: Math.min(index, 7) * STAGGER_MS }
        }
        style={{
          backgroundColor: isUnlocked ? t.background : (t.isDark ? t.surfaceElevated : "#F9FAFB"),
          borderRadius: 12,
          padding: size === "large" ? 20 : 16,
          marginRight: 12,
          width: cardWidth,
          alignItems: "center",
        }}
      >
```

Note `opacity: isUnlocked ? 1 : 0.6` has moved from the static `style` into `animate`,
because Moti's `animate` opacity would otherwise override it and reveal locked badges
at full strength. **This is the single easiest thing to get wrong in this plan.**

`celebrationSpring` is `{ type: "spring", damping: 14, stiffness: 120 }` — the repo's
designated "rare moment" spring. `STAGGER_MS` is 40, capped at index 7 so the cascade
tops out at `7 × 40 = 280ms` of delay regardless of how many badges exist, keeping the
whole group under AUDIT.md's 300ms guidance for decorative stagger.

`BadgeCard` needs an `index` prop, defaulting to `0` so any call site that doesn't pass
one still works:

```jsx
const BadgeCard = ({ badge, size = "normal", index = 0 }) => {
```

## Repo conventions to follow

- Motion tokens live in `apps/mobile/src/utils/motion.js`:
  ```js
  export const celebrationSpring = { type: "spring", damping: 14, stiffness: 120 };
  export const enterTiming = { type: "timing", duration: 220 };
  export const STAGGER_MS = 40;
  ```
- Staggered-grid exemplar — copy this shape:
  `apps/mobile/src/app/metric-goal.jsx:781-808`, e.g.
  ```jsx
  <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ ...enterTiming, delay: STAGGER_MS * 2 }}>
  ```
- `celebrationSpring` usage exemplar: `apps/mobile/src/app/log-symptoms.jsx:673`.
- Reduced motion: `import { useReducedMotion } from "@/hooks/useReducedMotion";`.
  Exemplar: `apps/mobile/src/app/(tabs)/care/index.jsx:49`.
- Note `rewards.jsx` uses relative imports for some modules (`../../types`) and `@/`
  for others. Use `@/` for the new imports, matching lines 25–27.

## Steps

1. In `apps/mobile/src/app/(tabs)/rewards.jsx`, add to the imports:
   ```js
   import { MotiView } from "moti";
   import { useReducedMotion } from "@/hooks/useReducedMotion";
   import { celebrationSpring, STAGGER_MS } from "@/utils/motion";
   ```
2. Inside `export default function RewardsScreen()` (line 30), add
   `const reducedMotion = useReducedMotion();` next to `const t = useTheme();`.
   `BadgeCard` is defined inside this component, so it closes over the value.
3. Change the `BadgeCard` signature at line 257 to
   `const BadgeCard = ({ badge, size = "normal", index = 0 }) => {`.
4. Replace the outer `View` opening tag at lines 262–272 with the `MotiView` target
   above, and change its matching closing `</View>` at line 331 to `</MotiView>`.
   Confirm you are closing the correct tag — the component has nested `View`s.
5. At lines 698–702, pass the index:
   ```jsx
                {mockBadges
                  .filter((b) => b.unlockedAt)
                  .map((badge, i) => (
                    <BadgeCard key={badge.id} badge={badge} size="large" index={i} />
                  ))}
   ```
6. At lines 725–729, pass the index:
   ```jsx
              {mockBadges.map((badge, i) => (
                <View key={badge.id} style={{ width: "48%", marginBottom: 12 }}>
                  <BadgeCard badge={badge} index={i} />
                </View>
              ))}
   ```

## Boundaries

- Do NOT animate `ChallengeCard` (the block ending at line 255) or `LeaderboardItem`
  (line 335). Out of scope.
- Do NOT animate the challenge progress bar at `rewards.jsx:85`. Its value is fixed at
  mount and never changes on screen, so there is no state change to indicate —
  animating it would be decoration on a static number.
- Do NOT add a persistent looping pulse, glow, shimmer, or sparkle to unlocked badges.
  A one-shot entrance is the whole scope. Looping motion on a screen full of badges is
  the failure mode this plan is specifically avoiding.
- Do NOT change the locked/unlocked visual design (colours, the `0.35` image opacity,
  the "Locked" label).
- Do NOT change `mockBadges` or anything in `apps/mobile/src/types.js`.
- Do NOT make the stagger block scrolling or touch — it is decorative only.
- Do NOT add new dependencies.
- If a step doesn't match the code you find (drift since commit d6c2795), STOP and
  report instead of improvising.

## Pre-existing fragility found at execution (NOT fixed — deliberately)

`BadgeCard` is declared **inside** `RewardsScreen` (`rewards.jsx:261`), as are
`TabButton` (:45), `ProgressBar` (:72), `ChallengeCard` (:97) and `LeaderboardItem`
(:351). An inline component definition gets a **new function identity on every render
of the parent**, so React treats it as a different component type, unmounts the old
subtree and mounts a new one.

For this plan that means: **any re-render of `RewardsScreen` remounts every badge and
replays the entrance cascade.** Triggers include the `activeTab` state change and
`useStreakQuery` data arriving.

In practice this mostly works out — the default tab is `challenges`, so the query has
usually resolved before the user taps through to `badges`, and that tab tap is itself
the mount that plays the animation. The `useReducedMotion` hook added by this plan does
*not* add a render for the common case, because it initialises to `false` and calling
`setReducedMotion(false)` is a no-op bail-out in React.

**This was not fixed here.** Hoisting five components out of `RewardsScreen` and
threading `t`, `width` and `reducedMotion` through as props is a structural refactor
with real regression surface, well outside a motion plan's scope. It is a pre-existing
anti-pattern that this plan surfaces rather than causes. If the replay proves visible on
device, hoisting `BadgeCard` (only) to module scope is the targeted fix and should be
its own plan.

## Verification

- **Mechanical**: `npx jest` and `npx tsc --noEmit` give **no signal on this file** —
  the mobile app has no test files at all, and `tsconfig.json` `include` covers only
  `**/*.ts` / `**/*.tsx`, so `.jsx` is never typechecked. Use the parse check instead:
  ```bash
  cd apps/mobile && node -e "
  const babel=require('@babel/core'),fs=require('fs');
  const f='src/app/(tabs)/rewards.jsx';
  babel.parseSync(fs.readFileSync(f,'utf8'),{filename:f,presets:['babel-preset-expo']});
  console.log('PARSE OK');"
  ```
- **Feel check**: run `npx expo start`, go to Profile → Rewards (or however the hidden
  `rewards` route is reached in-app), open the Badges tab, and confirm:
  - Badges arrive in sequence, roughly 40ms apart, cascading from top-left.
  - **Locked badges settle at 60% opacity, not 100%.** If every badge ends up fully
    opaque, step 4 was done wrong — `opacity` must be in `animate`, not `style`.
  - Cards scale up from slightly small; none of them appear from nothing or overshoot
    so far they look rubbery.
  - The whole cascade is finished in well under a second even with all badges present.
  - You can scroll and tap **during** the entrance — the stagger must never block
    interaction.
  - Switching to the Challenges/Leaderboard tab and back replays the entrance. This is
    acceptable for a rare screen; note it but do not fix it here.
- **Reduced motion**: enable Reduce Motion and confirm badges fade in together with no
  scaling, no sliding and no stagger — and that locked badges are still dimmed.
- **Done when**: both badge call sites pass `index`, the card root is a `MotiView`,
  locked badges remain visibly dimmed, and all feel checks pass.
