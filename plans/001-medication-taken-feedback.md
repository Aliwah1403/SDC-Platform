# 001 — Animate the medication taken toggle and adherence progress bar

- **Status**: DONE — executed against d6c2795, with two spec corrections recorded below
- **Commit**: d6c2795
- **Severity**: MEDIUM
- **Category**: 8 — Missed opportunities (with 4 — Interruptibility)
- **Estimated scope**: 1 file, ~40 lines changed

## Problem

`apps/mobile/src/app/(tabs)/care/medications.jsx` is the app's core daily loop — a
Sickle Cell patient ticks off each medication as they take it. Two things teleport at
exactly the moment the user is looking at them.

**1. The taken toggle** flips border, background and icon with zero transition:

```jsx
/* apps/mobile/src/app/(tabs)/care/medications.jsx:313 — current */
        <TouchableOpacity
          onPress={onToggle}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            borderWidth: medication.taken ? 0 : 1.5,
            borderColor: medication.taken ? "transparent" : t.border,
            backgroundColor: medication.taken ? C_BRAND.success : "transparent",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {medication.taken ? (
            <Check size={16} color="#fff" strokeWidth={2.5} />
          ) : (
            <Plus size={16} color={t.textSecondary} strokeWidth={2} />
          )}
        </TouchableOpacity>
```

There is no press feedback at all (a bare `TouchableOpacity` with no `activeOpacity`),
and the Check icon appears from nothing.

**2. The adherence bar** jumps to its new width on every tick:

```jsx
/* apps/mobile/src/app/(tabs)/care/medications.jsx:625 — current */
            <View
              style={{
                height: "100%",
                width: `${progressPct * 100}%`,
                backgroundColor:
                  progressPct === 1 ? C_BRAND.success : C_BRAND.accent,
                borderRadius: 3,
              }}
            />
```

`progressPct` is defined at `medications.jsx:450` as
`active.length > 0 ? takenCount / active.length : 0`. Ticking a medication changes it
instantly, so the one visual that represents "I am on top of my meds today" snaps
rather than fills. This is the single place in the app where the user earns feedback
every day, and right now the reward is a rectangle that jumps.

## Target

**Toggle** — press feedback, an animated fill, and a Check that springs in only when
the medication becomes taken:

```jsx
/* target — replaces medications.jsx:313-332 */
        <PressableScale
          onPress={onToggle}
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          style={{
            width: 32,
            height: 32,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <MotiView
            animate={{
              borderWidth: medication.taken ? 0 : 1.5,
              borderColor: medication.taken ? "transparent" : t.border,
              backgroundColor: medication.taken ? C_BRAND.success : "transparent",
            }}
            transition={{ type: "timing", duration: 180, easing: easeOutStrong }}
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <AnimatePresence exitBeforeEnter>
              {medication.taken ? (
                <MotiView
                  key="check"
                  from={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.4 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={reducedMotion ? enterTiming : celebrationSpring}
                  exitTransition={exitTiming}
                >
                  <Check size={16} color="#fff" strokeWidth={2.5} />
                </MotiView>
              ) : (
                <MotiView
                  key="plus"
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={enterTiming}
                  exitTransition={exitTiming}
                >
                  <Plus size={16} color={t.textSecondary} strokeWidth={2} />
                </MotiView>
              )}
            </AnimatePresence>
          </MotiView>
        </PressableScale>
```

`PressableScale` already applies `scale: 0.97` with `pressSpring`
(`{ type: "spring", damping: 20, stiffness: 300 }`) — that is the press feedback, so do
not add a separate scale.

**Progress bar** — animate the width fill:

```jsx
/* target — replaces medications.jsx:625-633 */
            <MotiView
              animate={{ width: `${progressPct * 100}%` }}
              transition={
                reducedMotion
                  ? { type: "timing", duration: 0 }
                  : { type: "timing", duration: 220, easing: easeOutStrong }
              }
              style={{
                height: "100%",
                backgroundColor:
                  progressPct === 1 ? C_BRAND.success : C_BRAND.accent,
                borderRadius: 3,
              }}
            />
```

`duration: 220` is the repo's `enterTiming` value; it is written out here because the
object also needs `easing`. Total motion stays under the 300ms UI budget.

### Why width and not scaleX here

Animating `width` drives layout, which AUDIT.md §5 normally rules out in favour of
transform. It is the right call **in this specific case** and must not be
"harmonized" with plan 002:

- This fill has its own `borderRadius: 3` and the bar is only 6px tall. Under
  `scaleX` the rounded right cap would flatten visibly as the bar grows.
- It is a single 6px-tall view animating once per tap, not a scroll-linked or
  per-frame gesture. The layout cost is negligible.

Plan 002 (`PollBlock`) uses `scaleX` because that fill has **no** border radius of its
own, so the objection does not apply there. The two are deliberately different.

## Repo conventions to follow

- Motion tokens live in `apps/mobile/src/utils/motion.js`. Import from `@/utils/motion`
  — do **not** hand-type spring or duration values that already exist there:
  ```js
  export const pressSpring = { type: "spring", damping: 20, stiffness: 300 };
  export const enterTiming = { type: "timing", duration: 220 };
  export const exitTiming = { type: "timing", duration: 150 };
  export const celebrationSpring = { type: "spring", damping: 14, stiffness: 120 };
  export const STAGGER_MS = 40;
  export const easeOutStrong = Easing.bezier(0.23, 1, 0.32, 1);
  export const easeInOutStrong = Easing.bezier(0.77, 0, 0.175, 1);
  ```
- `medications.jsx` **already imports** `MotiView` from `"moti"` (line 22) and already
  uses `STAGGER_MS` in `MedicationScheduleRow` at line 229. You are extending an
  existing pattern in this file, not introducing one.
- Reduced motion: `import { useReducedMotion } from "@/hooks/useReducedMotion";` then
  `const reducedMotion = useReducedMotion();`. Exemplar:
  `apps/mobile/src/app/(tabs)/care/index.jsx:49`.
- Press feedback exemplar: `apps/mobile/src/components/PressableScale.jsx` — the shared
  primitive. Use it rather than reimplementing scale-on-press.

## Steps

1. In `apps/mobile/src/app/(tabs)/care/medications.jsx`, extend the existing Moti
   import at line 22 to `import { MotiView, AnimatePresence } from "moti";`.
2. Add these imports alongside the other `@/` imports near the top of the file:
   ```js
   import { PressableScale } from "@/components/PressableScale";
   import { useReducedMotion } from "@/hooks/useReducedMotion";
   import {
     enterTiming,
     exitTiming,
     celebrationSpring,
     easeOutStrong,
   } from "@/utils/motion";
   ```
   Note: `STAGGER_MS` is referenced at line 229 — check whether it is already imported
   in this file and, if so, add to that existing import statement rather than creating
   a duplicate.
3. In `function MedicationScheduleRow` (starts line 222), add
   `const reducedMotion = useReducedMotion();` immediately after
   `const t = useTheme();` (line 223).
4. Replace lines 313–332 (the `{/* Taken toggle */}` `TouchableOpacity` block) with the
   toggle target markup above. Keep `onPress={onToggle}` and the `hitSlop` values
   exactly as they are.
5. Locate the adherence bar at line 625 (inside the header block, directly under the
   `View` with `height: 6` at line 617). Add
   `const reducedMotion = useReducedMotion();` to the component that renders it — this
   is the default-exported screen component; place it next to the other hooks near
   line 448.
6. Replace lines 625–633 with the progress bar target markup above.

## Boundaries

- Do NOT touch `MedicationGridCard` (starts line 338) — it is out of scope.
- Do NOT change the `MotiView` entrance already on `MedicationScheduleRow` at lines
  226–230. It is correct.
- Do NOT change any mutation logic (`useToggleMedicationTakenMutation`,
  `useMarkGroupTakenMutation`) or the optimistic-update behaviour.
- Do NOT add motion to the "Log all" / "All done ✓" `GroupHeader` button (line 159).
- Do NOT change the `progressPct` computation at line 450.
- Do NOT add new dependencies. `moti`, `react-native-reanimated`, `PressableScale` and
  `useReducedMotion` are all already present.
- If a step doesn't match the code you find (drift since commit d6c2795), STOP and
  report instead of improvising.

## Deviations from spec (recorded at execution)

Two defects in the original spec were caught while reviewing the diff. The shipped code
differs from the **Target** section above in these two ways, deliberately:

1. **Dropped `exitBeforeEnter`; both icons are now `position: "absolute"`.**
   With `exitBeforeEnter`, the Plus had to finish exiting (`exitTiming`, 150ms) before
   the Check could begin entering — so the confirmation of the app's core daily action
   arrived 150ms late, blowing the 100–160ms press-feedback budget. The icons now
   crossfade in place. Absolute positioning is required because both would otherwise
   briefly occupy the flow of the 32×32 container and shift layout; Yoga centres
   inset-less absolute children using the parent's existing
   `alignItems`/`justifyContent`.

2. **Stopped animating colours to the keyword `"transparent"`.**
   `"transparent"` is `rgba(0,0,0,0)`, so interpolating `#059669 → transparent` fades
   the green through dark grey. Added a module constant
   `C_SUCCESS_FADED = "rgba(5, 150, 105, 0)"` (same hue, zero alpha) and animate
   between that and `C_BRAND.success`. `borderColor` is no longer animated at all — it
   stays `t.border` in the static style, since `borderWidth → 0` already removes the
   border and animating the colour added nothing but the same artifact.

## Verification

- **Mechanical**: `npx jest` and `npx tsc --noEmit` are both **useless for this file**
  and should not be relied on:
  - The mobile app has **no test files at all** (`npx jest` → "No tests found",
    441 files checked, 0 matches), despite `CLAUDE.md` listing it as the test command.
  - `apps/mobile/tsconfig.json` `include` is only `**/*.ts` / `**/*.tsx`, so `.jsx`
    files are never typechecked. The repo's 12 existing `tsc` errors are all in
    unrelated `.ts`/`.tsx` files and are pre-existing.

  The real mechanical check is that the file still parses:
  ```bash
  cd apps/mobile && node -e "
  const babel=require('@babel/core'),fs=require('fs');
  const f='src/app/(tabs)/care/medications.jsx';
  babel.parseSync(fs.readFileSync(f,'utf8'),{filename:f,presets:['babel-preset-expo']});
  console.log('PARSE OK');"
  ```
  Everything else must be checked on a device.
- **Feel check**: run `npx expo start`, open the Care → Medications screen with at
  least 3 active medications, and confirm:
  - **Tapping the circle ticks the medication and does NOT navigate to the medication
    detail screen.** The toggle is nested inside the row's own `TouchableOpacity`
    (`onPress={onPress}`), and this plan changed the inner element from
    `TouchableOpacity` to `PressableScale` (a `Pressable`). Verify the inner press
    still wins the responder, including within its 14px `hitSlop`. This is the
    highest-risk regression in the change.
  - Tapping the circle scales it down to 0.97 and back — it feels pressed, not inert.
  - The Check mark springs in from small; it never appears from literally nothing and
    never pops at full size.
  - **The Check appears immediately on tap** — there is no perceptible pause between
    the finger landing and the tick showing. A delay means `exitBeforeEnter` crept back
    in (see Deviations).
  - The two icons crossfade **in place**: the circle's contents must not jump, shift,
    or momentarily show both icons stacked.
  - Un-ticking fades the green out cleanly. **Watch for the fill darkening or going
    grey/muddy mid-fade** — that means a colour is animating to the keyword
    `"transparent"` again (see Deviations).
  - The adherence bar **fills** toward its new value; it never jumps. Tick 3
    medications rapidly in a row — the bar should retarget smoothly from wherever it
    currently is, not restart from 0 each time.
  - The rounded right end of the bar stays rounded at every width. If it looks
    flattened or stretched, the executor used `scaleX` — revert to animating `width`.
  - Total settle time on the toggle is well under half a second.
- **Reduced motion**: enable Settings → Accessibility → Motion → Reduce Motion on the
  device/simulator, reload, and confirm the Check still fades in and the bar still
  updates, but neither springs or slides.
- **Done when**: no `TouchableOpacity` remains on the taken toggle, the bar is a
  `MotiView`, and all feel checks above pass on a real device or simulator.
