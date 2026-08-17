# 002 — Animate the community poll result reveal

- **Status**: DONE — executed against d6c2795, no spec changes needed
- **Commit**: d6c2795
- **Severity**: MEDIUM
- **Category**: 8 — Missed opportunities
- **Estimated scope**: 1 file, ~30 lines changed

## Problem

`apps/mobile/src/components/Community/PollBlock.jsx` swaps its entire render branch the
instant a user votes. Before the vote each option is a `TouchableOpacity` with an empty
radio circle; after the vote it is a completely different `View` with a proportional
fill bar already at its final width.

```jsx
/* apps/mobile/src/components/Community/PollBlock.jsx:20-43 — current */
        if (hasVoted) {
          return (
            <View
              key={option.id}
              style={{
                borderRadius: 10,

                backgroundColor: isSelected ? (t.isDark ? t.surfaceElevated : "#FDF0F2") : (t.isDark ? t.surfaceElevated : "#F8F4F0"),
                overflow: "hidden",
              }}
            >
              {/* Proportional fill bar behind the text */}
              <View
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: `${percentage}%`,
                  backgroundColor: isSelected
                    ? "rgba(169,51,77,0.18)"
                    : t.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                }}
              />
```

Casting a vote is a rare, one-per-poll moment where the user is specifically waiting to
see the answer — and the answer materialises with no reveal at all. The whole file
currently imports no motion library (lines 1–4).

## Target

The bars grow from zero to their proportion, staggered, and the percentage labels fade
in behind them.

Use `scaleX` with `transformOrigin: "left"` — a pure transform, no layout. The fill
`View` has **no border radius of its own** (it is clipped by the parent's
`borderRadius: 10` + `overflow: "hidden"`), so scaling it horizontally produces no cap
distortion.

```jsx
/* target — replaces the fill bar View at PollBlock.jsx:32-43 */
              {/* Proportional fill bar behind the text */}
              <MotiView
                from={{ scaleX: 0 }}
                animate={{ scaleX: percentage / 100 }}
                transition={
                  reducedMotion
                    ? { type: "timing", duration: 0 }
                    : {
                        type: "timing",
                        duration: 220,
                        easing: easeOutStrong,
                        delay: index * STAGGER_MS,
                      }
                }
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  bottom: 0,
                  width: "100%",
                  transformOrigin: "left",
                  backgroundColor: isSelected
                    ? "rgba(169,51,77,0.18)"
                    : t.isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)",
                }}
              />
```

Note the fill is now `width: "100%"` and its proportion comes entirely from `scaleX`.

The percentage label fades in so the number doesn't beat the bar to the punch:

```jsx
/* target — wraps the percentage Text at PollBlock.jsx:63-73 */
                <MotiView
                  from={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    type: "timing",
                    duration: 150,
                    delay: index * STAGGER_MS + 60,
                  }}
                >
                  <Text
                    style={{
                      fontFamily: fonts.bold,
                      fontSize: 13,
                      color: isSelected ? "#A9334D" : t.textSecondary,
                      minWidth: 38,
                      textAlign: "right",
                    }}
                  >
                    {percentage}%
                  </Text>
                </MotiView>
```

`STAGGER_MS` is 40. A 4-option poll therefore finishes its cascade at
`3 × 40 + 220 = 340ms` — the stagger is decorative and must never gate interaction.
Polls in this app are typically 2–4 options; **cap the stagger at 4** so a long poll
cannot run away:

```js
delay: Math.min(index, 3) * STAGGER_MS
```

Apply the same `Math.min(index, 3)` cap to the label delay.

## Repo conventions to follow

- Motion tokens live in `apps/mobile/src/utils/motion.js`:
  ```js
  export const enterTiming = { type: "timing", duration: 220 };
  export const STAGGER_MS = 40;
  export const easeOutStrong = Easing.bezier(0.23, 1, 0.32, 1);
  ```
  `duration: 220` is written out inline above because the transition object also needs
  `easing` and `delay`.
- Staggered list entrance exemplar — copy this shape:
  `apps/mobile/src/app/(tabs)/care/medications.jsx:226-230`
  ```jsx
  <MotiView
    from={{ opacity: 0, translateY: 6 }}
    animate={{ opacity: 1, translateY: 0 }}
    transition={{ type: "timing", duration: 280, delay: Math.min(index, 6) * STAGGER_MS }}
  >
  ```
- Reduced motion: `import { useReducedMotion } from "@/hooks/useReducedMotion";`.
  Exemplar: `apps/mobile/src/app/(tabs)/care/index.jsx:49`.
- `transformOrigin` as a style property is supported in React Native 0.74+; this repo
  is on `react-native 0.86.0` (see `apps/mobile/package.json`).

## Steps

1. In `apps/mobile/src/components/Community/PollBlock.jsx`, add to the imports at the
   top of the file (lines 1–4):
   ```js
   import { MotiView } from "moti";
   import { useReducedMotion } from "@/hooks/useReducedMotion";
   import { STAGGER_MS, easeOutStrong } from "@/utils/motion";
   ```
2. Inside `export function PollBlock`, add `const reducedMotion = useReducedMotion();`
   immediately after `const t = useTheme();` (line 7).
3. Change the map callback at line 13 from
   `{poll.options.map((option) => {` to
   `{poll.options.map((option, index) => {` so the stagger has an index.
4. Replace the fill bar `View` at lines 32–43 with the `MotiView` target above, using
   `delay: Math.min(index, 3) * STAGGER_MS`.
5. Wrap the percentage `Text` at lines 63–73 in the `MotiView` target above, using
   `delay: Math.min(index, 3) * STAGGER_MS + 60`.

## Boundaries

- Do NOT animate the pre-vote `TouchableOpacity` branch (lines 79–118). Tapping an
  option should feel instant; the reveal is the moment, not the tap.
- Do NOT animate the total-votes `Text` at lines 121–132.
- Do NOT restructure the `hasVoted` / not-voted branching. The branch swap stays; only
  the fill and label gain motion.
- Do NOT change any colours, the `borderRadius: 10`, or `overflow: "hidden"` on the
  parent — the clipping is what makes `scaleX` safe here.
- Do NOT change `PostCard.jsx`, which renders this component.
- Do NOT switch this bar to animating `width` to match plan 001. The two are
  deliberately different: this fill has no radius of its own, so transform is correct
  here; plan 001's does, so width is correct there.
- Do NOT add new dependencies.
- If a step doesn't match the code you find (drift since commit d6c2795), STOP and
  report instead of improvising.

## Confirmed at execution

- **The technique has direct precedent in this repo.**
  `apps/mobile/src/app/(onboarding)/complete.jsx:197` + `:315-319` already animates a
  progress fill with exactly this approach — `transform: [{ scaleX: fill }]` on a view
  styled `transformOrigin: 'left'`, inside an `overflow: 'hidden'` rounded track:
  ```jsx
  <Animated.View style={[styles.progressBar, { transform: [{ scaleX: fill }] }]} />
  // progressBar: { flex: 1, backgroundColor: HEMO_RED, transformOrigin: 'left' }
  ```
  `transformOrigin` is also in React Native 0.86's own style types
  (`StyleSheetTypes.d.ts:296`). No risk here.

- **Replay-on-remount is real but limited.** `(tabs)/community/index.jsx:186` renders
  the feed in a `FlatList` that sets none of `removeClippedSubviews`, `windowSize`,
  `initialNumToRender` or `maxToRenderPerBatch` — so RN defaults apply (`windowSize` 21,
  ≈10 screens retained either side). An already-voted poll therefore only re-runs its
  reveal after scrolling well past that window, not during ordinary scrolling.

  If it still proves distracting, the remedy is to gate `from` on a "did the user just
  vote" ref rather than on mount — the same shape as the `prevLiked` guard specified in
  plan 006. **Do not** reach for that pre-emptively; confirm on device first.

## Verification

- **Mechanical**: `npx jest` and `npx tsc --noEmit` give **no signal on this file** —
  the mobile app has no test files at all, and `tsconfig.json` `include` covers only
  `**/*.ts` / `**/*.tsx`, so `.jsx` is never typechecked. Use the parse check instead:
  ```bash
  cd apps/mobile && node -e "
  const babel=require('@babel/core'),fs=require('fs');
  const f='src/components/Community/PollBlock.jsx';
  babel.parseSync(fs.readFileSync(f,'utf8'),{filename:f,presets:['babel-preset-expo']});
  console.log('PARSE OK');"
  ```
- **Feel check**: run `npx expo start`, go to the Community tab, find a post
  containing a poll, and vote. Confirm:
  - Each bar **grows from the left edge**, not from the centre and not from the right.
  - The bars arrive in sequence, ~40ms apart, and the whole cascade is over in well
    under half a second.
  - The percentage numbers arrive just behind their bars, never before.
  - No bar overflows the rounded container corners at any point in the animation.
  - Scrolling the feed during the reveal is not blocked or janky.
  - Re-entering the screen on an already-voted poll replays the reveal from zero. This
    is acceptable (it is rare and the poll is a fresh mount) — but if it feels wrong on
    a fast scroll through many voted polls, report it rather than fixing it here.
- **Reduced motion**: enable Reduce Motion in device accessibility settings and confirm
  results appear immediately at full width with no growth and no stagger.
- **Done when**: the fill bar is a `MotiView` driven by `scaleX` with
  `transformOrigin: "left"`, and all feel checks pass.
