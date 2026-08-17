# 003 — Animate collapse chevrons and add missing collapse exits

- **Status**: DONE — executed against d6c2795, no spec changes needed
- **Commit**: d6c2795
- **Severity**: MEDIUM
- **Category**: 4 — Interruptibility, 7 — Cohesion & tokens, 8 — Missed opportunities
- **Estimated scope**: 3 files, ~50 lines changed

## Problem

Four disclosure chevrons across the app rotate by **static style**, so they teleport
between 0° and 180° with no transition. Two collapse bodies also animate on the way in
but not on the way out, so collapsing is an instant disappearance.

There is already a fully correct implementation of this pattern in the repo
(`metric-detail.jsx:727-748`) — these four sites simply never got it.

**Site A — `apps/mobile/src/app/(tabs)/care/crisis-plan.jsx:158`** (worst: static
chevron *and* an entirely unanimated body):

```jsx
/* crisis-plan.jsx:158-168 — current */
        <View
          style={[
            styles.tierChevron,
            {
              backgroundColor: expanded ? tier.bg : t.surfaceElevated,
              transform: [{ rotate: expanded ? "180deg" : "0deg" }],
            },
          ]}
        >
          <ChevronDown size={16} color={tier.color} strokeWidth={2.5} />
        </View>
```

```jsx
/* crisis-plan.jsx:171 — current: no motion at all */
      {expanded && (
        <View style={styles.tierActions}>
```

**Site B — `apps/mobile/src/app/crisis-mode.jsx:539`** (static chevron; body enters but
never exits):

```jsx
/* crisis-mode.jsx:539-544 — current */
          <ChevronDown
            size={16}
            color="rgba(248,233,231,0.55)"
            strokeWidth={2}
            style={{ transform: [{ rotate: painSliderOpen ? "180deg" : "0deg" }] }}
          />
```

```jsx
/* crisis-mode.jsx:546-551 — current: no AnimatePresence, no exit */
        {painSliderOpen && (
          <MotiView
            from={{ opacity: 0, translateY: -8 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 200 }}
            style={styles.card}
          >
```

**Site C — `apps/mobile/src/app/crisis-mode.jsx:617`** — identical to Site B but driven
by `historyOpen` instead of `painSliderOpen` (chevron at 617–622, body at 624–629).

**Site D — `apps/mobile/src/app/metric-detail.jsx:701`** (chevron only — its body at
727–748 is already correct):

```jsx
/* metric-detail.jsx:701-706 — current */
            <ChevronDown
              size={13}
              color={t.textSecondary}
              strokeWidth={2}
              style={{ transform: [{ rotate: pickerOpen ? "180deg" : "0deg" }] }}
            />
```

The hardcoded `duration: 200` at sites B and C is also a token drift — the repo's
`enterTiming` is 220ms.

## Target

### Chevrons — all four sites

Wrap the `ChevronDown` in a `MotiView` that animates the rotation. Use
`easeInOutStrong` (`cubic-bezier(0.77, 0, 0.175, 1)`): per AUDIT.md §2, on-screen
morphing takes ease-in-out, not ease-out.

```jsx
/* target — chevron pattern, applied at all four sites */
<MotiView
  animate={{ rotate: <openStateVar> ? "180deg" : "0deg" }}
  transition={
    reducedMotion
      ? { type: "timing", duration: 0 }
      : { type: "timing", duration: 200, easing: easeInOutStrong }
  }
>
  <ChevronDown ... />
</MotiView>
```

Replace `<openStateVar>` with `expanded` (Site A), `painSliderOpen` (Site B),
`historyOpen` (Site C), `pickerOpen` (Site D). Move the `transform` off the
`ChevronDown`'s own `style` prop and delete it from there — keep every other prop
(`size`, `color`, `strokeWidth`) unchanged.

At **Site A** the rotation currently sits on a styled container that also animates
`backgroundColor`. Convert that container itself to a `MotiView` rather than adding a
wrapper:

```jsx
/* target — replaces crisis-plan.jsx:158-168 */
        <MotiView
          animate={{
            backgroundColor: expanded ? tier.bg : t.surfaceElevated,
            rotate: expanded ? "180deg" : "0deg",
          }}
          transition={
            reducedMotion
              ? { type: "timing", duration: 0 }
              : { type: "timing", duration: 200, easing: easeInOutStrong }
          }
          style={styles.tierChevron}
        >
          <ChevronDown size={16} color={tier.color} strokeWidth={2.5} />
        </MotiView>
```

### Collapse bodies — Sites A, B and C

Wrap in `AnimatePresence` and give each an `exit`, so collapsing animates instead of
vanishing:

```jsx
/* target — Site A, replaces crisis-plan.jsx:171-184 */
      <AnimatePresence>
        {expanded && (
          <MotiView
            from={{ opacity: 0, translateY: -6 }}
            animate={{ opacity: 1, translateY: 0 }}
            exit={{ opacity: 0, translateY: -4 }}
            transition={enterTiming}
            exitTransition={exitTiming}
            style={styles.tierActions}
          >
            {tier.actions.map((action, i) => (
              <View key={i} style={styles.tierActionRow}>
                <View style={[styles.tierActionNumber, { borderColor: tier.color }]}>
                  <Text style={[styles.tierActionNumberText, { color: tier.color }]}>
                    {i + 1}
                  </Text>
                </View>
                <Text style={styles.tierActionText}>{action}</Text>
              </View>
            ))}
          </MotiView>
        )}
      </AnimatePresence>
```

For Sites B and C, keep the existing `MotiView` and its `style={styles.card}` — just
wrap it in `<AnimatePresence>`, add `exit={{ opacity: 0, translateY: -8 }}`, and swap
the hardcoded `transition={{ type: "timing", duration: 200 }}` for
`transition={enterTiming}` plus `exitTransition={exitTiming}`.

`enterTiming` is 220ms and `exitTiming` is 150ms — exits are ~0.7× entrances by repo
convention, which is correct here.

### A note on crisis-mode.jsx

`crisis-mode.jsx` is the screen a user opens **during a pain crisis**. Motion there
must be fast and invisible — no bounce, no delight, no stagger. The values above are
already restrained; do not embellish them.

## Repo conventions to follow

- Motion tokens live in `apps/mobile/src/utils/motion.js`:
  ```js
  export const enterTiming = { type: "timing", duration: 220 };
  export const exitTiming = { type: "timing", duration: 150 };
  export const easeInOutStrong = Easing.bezier(0.77, 0, 0.175, 1);
  ```
- **The exemplar to imitate is `apps/mobile/src/app/metric-detail.jsx:727-748`** — this
  is the same pattern already done correctly in this codebase:
  ```jsx
  <AnimatePresence>
    {pickerOpen && (
      <MotiView
        from={{ opacity: 0, translateY: -8 }}
        animate={{ opacity: 1, translateY: 0 }}
        exit={{ opacity: 0, translateY: -8 }}
        transition={enterTiming}
        exitTransition={exitTiming}
        style={{ paddingBottom: 8 }}
      >
  ```
- Reduced motion: `import { useReducedMotion } from "@/hooks/useReducedMotion";`.
  Exemplar: `apps/mobile/src/app/(tabs)/care/index.jsx:49`.
- Existing imports: `crisis-mode.jsx` already imports `MotiView` (line 15);
  `metric-detail.jsx` already imports `MotiView, AnimatePresence` and
  `enterTiming, exitTiming` (lines 19–20). `crisis-plan.jsx` imports **neither** and
  needs both added.

## Steps

1. **`apps/mobile/src/app/(tabs)/care/crisis-plan.jsx`** — add imports:
   ```js
   import { MotiView, AnimatePresence } from "moti";
   import { useReducedMotion } from "@/hooks/useReducedMotion";
   import { enterTiming, exitTiming, easeInOutStrong } from "@/utils/motion";
   ```
2. In `function TierRow` (line 126), add `const reducedMotion = useReducedMotion();`
   after `const [expanded, setExpanded] = useState(false);` (line 129).
3. Replace lines 158–168 with the Site A chevron target above.
4. Replace lines 171–184 with the Site A collapse body target above.
5. **`apps/mobile/src/app/crisis-mode.jsx`** — extend the Moti import at line 15 to
   `import { MotiView, AnimatePresence } from "moti";` and add:
   ```js
   import { useReducedMotion } from "@/hooks/useReducedMotion";
   import { enterTiming, exitTiming, easeInOutStrong } from "@/utils/motion";
   ```
6. Add `const reducedMotion = useReducedMotion();` to the component that owns
   `painSliderOpen` and `historyOpen` (they are in the same component — place it with
   the other hooks).
7. Wrap the `ChevronDown` at lines 539–544 per the chevron target (`painSliderOpen`),
   removing its `style` prop.
8. Wrap the body at lines 546+ in `<AnimatePresence>`, add
   `exit={{ opacity: 0, translateY: -8 }}`, and replace
   `transition={{ type: "timing", duration: 200 }}` with `transition={enterTiming}`
   and `exitTransition={exitTiming}`. Add the matching `</AnimatePresence>` after the
   existing closing `)}`.
9. Repeat steps 7–8 for the `historyOpen` chevron at lines 617–622 and its body at
   lines 624+.
10. **`apps/mobile/src/app/metric-detail.jsx`** — add
    `easeInOutStrong` to the existing `@/utils/motion` import at line 19, add
    `import { useReducedMotion } from "@/hooks/useReducedMotion";`, add
    `const reducedMotion = useReducedMotion();` to the component owning `pickerOpen`,
    and wrap the `ChevronDown` at lines 701–706 per the chevron target, removing its
    `style` prop.

## Boundaries

- Do NOT change the collapse body at `metric-detail.jsx:727-748`. It is already
  correct and is the reference for this plan.
- Do NOT change any `styles.*` StyleSheet definitions (`tierChevron`, `card`,
  `collapseHeader`, `tierActions`) — only the JSX that consumes them.
- Do NOT add stagger to the `tier.actions` list inside the crisis-plan collapse. It is
  clinical step-by-step guidance read under duress; it must appear as one block.
- Do NOT add bounce, spring, or celebration motion anywhere in `crisis-mode.jsx`.
- Do NOT touch the `onExpand?.()` analytics callback in `crisis-plan.jsx:136`.
- Do NOT convert any other `TouchableOpacity`/`Pressable` in these files.
- Do NOT add new dependencies.
- If a step doesn't match the code you find (drift since commit d6c2795), STOP and
  report instead of improvising.

## Known characteristic inherited from the exemplar (observed at execution)

`AnimatePresence` animates `opacity`/`translateY` but **not height**. So on collapse the
row holds its full height while the content fades (150ms), then the height snaps shut.
On expand, the height opens instantly at t=0 and the content fades into the space.

This is not a defect introduced by this plan — it is exactly how the repo's existing
reference implementation at `metric-detail.jsx:727-748` already behaves, and matching it
was the point. Before this change the height snapped too; it just snapped immediately
instead of after a fade.

If the delayed snap turns out to bother on device, the fix is a Reanimated layout
transition on the parent, **not** reverting the exit. That would be a separate plan —
do not attempt it here.

## Verification

- **Mechanical**: `npx jest` and `npx tsc --noEmit` give **no signal on these files** —
  the mobile app has no test files at all, and `tsconfig.json` `include` covers only
  `**/*.ts` / `**/*.tsx`, so `.jsx` is never typechecked. Use the parse check instead:
  ```bash
  cd apps/mobile && node -e "
  const babel=require('@babel/core'),fs=require('fs');
  for (const f of ['src/app/(tabs)/care/crisis-plan.jsx','src/app/crisis-mode.jsx','src/app/metric-detail.jsx']) {
    babel.parseSync(fs.readFileSync(f,'utf8'),{filename:f,presets:['babel-preset-expo']});
    console.log('PARSE OK', f);
  }"
  ```
  Also confirm `<AnimatePresence` and `</AnimatePresence>` counts match per file
  (expect 1 / 2 / 1 respectively).
- **Feel check**: run `npx expo start` and visit each of the four sites:
  - **Care → Crisis Plan**: tap a Step tier. The chevron *rotates* through 180°; the
    action list slides down and fades in. Tap again — it fades and slides **up and
    out**, it does not vanish. The chevron pill's background colour crossfades rather
    than snapping.
  - **Crisis Mode → "Update pain level"** and **"Check-in history"**: same — open and
    close both, confirm the close is animated.
  - **Metric Detail → date picker**: the chevron rotates in step with the picker
    opening; both should feel like one gesture, not two events.
  - Spam-tap any of the four toggles rapidly. Because these are Moti/Reanimated
    transitions (not keyframes), the chevron should **retarget from its current
    angle** — it must never snap back to 0° and restart.
  - Nothing takes longer than ~a quarter second.
- **Reduced motion**: enable Reduce Motion and confirm chevrons flip instantly and
  bodies appear/disappear without sliding, but content is still fully usable.
- **Done when**: no `transform: [{ rotate: ... }]` static style remains at any of the
  four cited lines, both `crisis-mode.jsx` collapses are wrapped in `AnimatePresence`
  with an `exit`, and all feel checks pass.
