# 005 — Animate the shared AppEmptyState

- **Status**: DONE — executed against d6c2795, with one boundary deliberately broken (see below)
- **Commit**: d6c2795
- **Severity**: LOW
- **Category**: 8 — Missed opportunities (delight budget)
- **Estimated scope**: 1 file, ~20 lines changed — improves 7 screens

## Problem

`apps/mobile/src/components/AppEmptyState.jsx` is the shared empty state used by seven
screens:

- `apps/mobile/src/app/(tabs)/care/care-team.jsx`
- `apps/mobile/src/app/(tabs)/care/crisis-plan.jsx`
- `apps/mobile/src/app/(tabs)/care/appointments.jsx`
- `apps/mobile/src/app/(tabs)/care/medications.jsx`
- `apps/mobile/src/app/(tabs)/care/facilities.jsx`
- `apps/mobile/src/app/(tabs)/community/index.jsx`
- `apps/mobile/src/app/contact-detail.jsx`

It renders completely flat and instantly — the file imports no motion library at all
(lines 1–3 are `react-native`, `@/utils/fonts`, `@/hooks/useTheme`):

```jsx
/* apps/mobile/src/components/AppEmptyState.jsx:14-31 — current */
    <View
      style={[
        {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 40,
          paddingVertical: 60,
        },
        style,
      ]}
    >
      {Icon ? (
        <View style={{ marginBottom: 20 }}>
          <Icon size={56} color={t.textSecondary} strokeWidth={1.5} />
        </View>
      ) : null}
```

Empty states are rare by definition — a user sees "no medications yet" once, at the
start. Per AUDIT.md §1 this is precisely the frequency tier where delight is allowed,
and it currently gets none. This is the highest ratio of screens-improved to
lines-changed in the whole set: one file, seven surfaces.

## Target

Icon springs in; title and subtitle follow on a short stagger.

```jsx
/* target — replaces AppEmptyState.jsx:26-31 (the Icon block) */
      {Icon ? (
        <MotiView
          from={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={reducedMotion ? enterTiming : celebrationSpring}
          style={{ marginBottom: 20 }}
        >
          <Icon size={56} color={t.textSecondary} strokeWidth={1.5} />
        </MotiView>
      ) : null}
```

```jsx
/* target — wraps the title Text (currently AppEmptyState.jsx:32-43) */
      <MotiView
        from={reducedMotion ? { opacity: 0 } : { opacity: 0, translateY: 6 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ ...enterTiming, delay: reducedMotion ? 0 : STAGGER_MS }}
      >
        <Text
          style={{
            fontFamily: fonts.bold,
            fontSize: 18,
            color: t.text,
            marginBottom: 8,
            textAlign: "center",
          }}
        >
          {title}
        </Text>
      </MotiView>
```

```jsx
/* target — wraps the subtitle Text (currently AppEmptyState.jsx:44-57) */
      {subtitle ? (
        <MotiView
          from={reducedMotion ? { opacity: 0 } : { opacity: 0, translateY: 6 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ ...enterTiming, delay: reducedMotion ? 0 : STAGGER_MS * 2 }}
        >
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 14,
              color: t.textSecondary,
              textAlign: "center",
              lineHeight: 21,
            }}
          >
            {subtitle}
          </Text>
        </MotiView>
      ) : null}
```

`celebrationSpring` is `{ type: "spring", damping: 14, stiffness: 120 }`, `enterTiming`
is `{ type: "timing", duration: 220 }`, `STAGGER_MS` is 40. The full sequence
(`0 / 40 / 80ms` delays + 220ms) completes in ~300ms.

`scale: 0.8` is a deliberately larger initial offset than the 0.94 used in plan 004 —
this is a single focal icon on an otherwise empty screen, not one card in a grid. It is
still well clear of the `scale(0)` prohibition in AUDIT.md §3.

`{children}` (line 58) is **not** wrapped. Several call sites pass an action button
there; it should be immediately available and must not be gated behind a delay.

## Repo conventions to follow

- Motion tokens live in `apps/mobile/src/utils/motion.js`:
  ```js
  export const enterTiming = { type: "timing", duration: 220 };
  export const celebrationSpring = { type: "spring", damping: 14, stiffness: 120 };
  export const STAGGER_MS = 40;
  ```
- Sequenced-entrance exemplar — copy this shape:
  `apps/mobile/src/app/streak-repairs.jsx:206-223`
  ```jsx
  transition={enterTiming}
  ...
  transition={{ ...enterTiming, delay: STAGGER_MS }}
  ```
- Reduced motion: `import { useReducedMotion } from "@/hooks/useReducedMotion";`.
  Exemplar: `apps/mobile/src/app/(tabs)/care/index.jsx:49`.
- This component is `export default` — keep it that way; all seven call sites import it
  as a default.

## Steps

1. In `apps/mobile/src/components/AppEmptyState.jsx`, add to the imports at lines 1–3:
   ```js
   import { MotiView } from "moti";
   import { useReducedMotion } from "@/hooks/useReducedMotion";
   import { enterTiming, celebrationSpring, STAGGER_MS } from "@/utils/motion";
   ```
2. Add `const reducedMotion = useReducedMotion();` immediately after
   `const t = useTheme();` (line 12).
3. Replace the `Icon` block (lines 26–31) with the icon target above.
4. Wrap the title `Text` (lines 32–43) in the `MotiView` target above.
5. Wrap the subtitle `Text` inside its existing `{subtitle ? ... : null}` guard
   (lines 44–57) with the subtitle target above.
6. Leave `{children}` at line 58 exactly as it is.

## Boundaries

- Do NOT change the component's props, its default export, or the outer container
  `View` at lines 14–25 — the `flex: 1` centring and the `style` prop passthrough must
  keep working for all seven call sites.
- Do NOT wrap or delay `{children}`.
- Do NOT edit any of the seven consuming screens. The whole point of this plan is that
  one file change improves all of them.
- Do NOT add looping or attention-seeking motion (pulse, float, bounce-in-place). One
  shot on mount only.
- Do NOT change any text, font, colour or spacing value.
- Do NOT add new dependencies.
- If a step doesn't match the code you find (drift since commit d6c2795), STOP and
  report instead of improvising.

## Deviation from spec (recorded at execution)

**The "Do NOT edit any of the seven consuming screens" boundary was deliberately
broken, once.** The plan assumed all seven consumers are true rare-frequency empty
states. One is not.

`(tabs)/care/facilities.jsx:1035` uses `AppEmptyState` as a `ListEmptyComponent` that
alternates with a `searchLoading` spinner branch:

```jsx
ListEmptyComponent={
  searchLoading ? ( <ActivityIndicator … /> ) : ( <AppEmptyState … /> )
}
```

On a search that keeps returning nothing, **every keystroke** unmounts the empty state
(to the spinner) and remounts it — springing the icon from `scale: 0.8` each time. That
is precisely the failure the original sweep rejected for this screen ("re-filters on
every keystroke; any enter animation reads as input lag during a task users may be
performing under duress"). Plan 005 and that rejection contradicted each other; the
rejection wins.

Changes made:

1. `AppEmptyState` gained an `animate` prop (default `true`). When `false`, all three
   elements render at their settled values with `{ type: "timing", duration: 0 }` —
   fully instant, not merely reduced. The three motion variants (`still` /
   `reducedMotion` / full) are resolved once into a `motion` object above the return
   rather than branching inline three times.
2. `facilities.jsx:1035` passes `animate={false}`, with a comment explaining why.

`facilities.jsx:1079` (the *nearby* list's empty state) was **left animated** — it is
driven by filter-chip taps and location fetches, not per-keystroke input, so it does
not have the same problem.

Any future call site that mounts on high-frequency input must pass `animate={false}`.

## Verification

- **Mechanical**: `npx jest` and `npx tsc --noEmit` give **no signal on these files** —
  the mobile app has no test files at all, and `tsconfig.json` `include` covers only
  `**/*.ts` / `**/*.tsx`, so `.jsx` is never typechecked. Use the parse check instead:
  ```bash
  cd apps/mobile && node -e "
  const babel=require('@babel/core'),fs=require('fs');
  for (const f of ['src/components/AppEmptyState.jsx','src/app/(tabs)/care/facilities.jsx']) {
    babel.parseSync(fs.readFileSync(f,'utf8'),{filename:f,presets:['babel-preset-expo']});
    console.log('PARSE OK', f);
  }"
  ```
- **Feel check**: run `npx expo start` and reach at least two empty states — easiest
  are **Care → Care Team** (with no contacts saved) and **Care → Appointments** (with
  none booked). Confirm:
  - The icon scales up and settles with a soft spring; it does not appear from nothing
    and does not visibly wobble more than once.
  - Title arrives just after the icon, subtitle just after the title — a clear read
    order, not three things at once.
  - The whole sequence is done in roughly a third of a second.
  - On a screen whose empty state passes a button as `children`, **the button is
    tappable immediately** and does not fade in late. The two call sites that pass
    children are `(tabs)/care/appointments.jsx:267` and
    `(tabs)/community/index.jsx:141`.
  - **Care → Facilities, search box**: type a query that returns nothing, then keep
    typing. The "No results" icon must stay perfectly still — no spring, no fade, on
    any keystroke. If it bounces, `animate={false}` was dropped from
    `facilities.jsx:1035`.
  - Layout is unchanged: text stays centred, spacing identical to before. Compare
    against `git stash` if unsure.
  - Pull-to-refresh (where the screen has it) does not re-trigger the animation on
    every frame.
- **Reduced motion**: enable Reduce Motion and confirm all three elements simply fade
  in, with no scaling and no vertical movement.
- **Done when**: `AppEmptyState.jsx` renders icon/title/subtitle as `MotiView`s,
  `{children}` is untouched, no consuming screen was edited, and all feel checks pass.
