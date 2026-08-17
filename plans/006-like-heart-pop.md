# 006 — Add a restrained pop to the community like heart

- **Status**: DONE — executed against d6c2795, no spec changes needed
- **Commit**: d6c2795
- **Severity**: LOW
- **Category**: 8 — Missed opportunities
- **Estimated scope**: 1 file, ~25 lines changed

## Problem

`apps/mobile/src/components/Community/PostCard.jsx` renders the like control with no
motion and no press feedback at all — the heart's fill and the count's colour swap
instantly:

```jsx
/* apps/mobile/src/components/Community/PostCard.jsx:390-415 — current */
          <TouchableOpacity
            onPress={onLike}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 5,
              marginRight: 16,
            }}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Heart
              size={18}
              color={isLiked ? "#A9334D" : "#9CA3AF"}
              fill={isLiked ? "#A9334D" : "transparent"}
              strokeWidth={2}
            />
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 13,
                color: isLiked ? "#A9334D" : "#6B7280",
              }}
            >
              {displayLikes}
            </Text>
          </TouchableOpacity>
```

Note there is no `activeOpacity` either, so the default `TouchableOpacity` fade is the
only acknowledgement the tap happened.

## Scope discipline — read this first

Liking is a **tens-of-times-per-day** interaction. AUDIT.md §1 says that tier gets
motion *removed or drastically reduced*, not added. This plan is therefore
deliberately minimal, and the constraints are as important as the animation:

- The pop fires **only** on the unliked → liked transition. Unliking is silent.
- No colour tween. The fill and text colour stay instant — a crossfading heart at this
  frequency reads as lag.
- No confetti, no burst, no particles, no floating hearts.
- Total duration ~160ms, inside AUDIT.md's 100–160ms press-feedback budget.

If the result is noticeable enough to describe as "fun", it is too much.

## Target

Because Moti's declarative `animate` cannot easily express "fire once on a specific
edge", drive this with Reanimated directly — the same library `PressableScale` already
uses.

```jsx
/* target — add near the top of the PostCard component that owns `isLiked` */
  const likeScale = useSharedValue(1);
  const prevLiked = useRef(isLiked);

  useEffect(() => {
    if (isLiked && !prevLiked.current && !reducedMotion) {
      likeScale.value = withSequence(
        withSpring(1.18, { damping: 12, stiffness: 400 }),
        withSpring(1, { damping: 18, stiffness: 400 }),
      );
    }
    prevLiked.current = isLiked;
  }, [isLiked, reducedMotion]);

  const likeHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: likeScale.value }],
  }));
```

```jsx
/* target — replaces the Heart element at PostCard.jsx:400-405 */
            <Animated.View style={likeHeartStyle}>
              <Heart
                size={18}
                color={isLiked ? "#A9334D" : "#9CA3AF"}
                fill={isLiked ? "#A9334D" : "transparent"}
                strokeWidth={2}
              />
            </Animated.View>
```

Guarding on `prevLiked` is what keeps the pop off the initial mount — without it every
already-liked post would pop as you scroll the feed, which would be far worse than no
animation at all.

`1.18` is the peak; the stiff `400` springs settle it in roughly 160ms. Only the heart
scales — **not** the count, and **not** the row.

Additionally, replace the bare `TouchableOpacity` at line 390 with the repo's shared
press primitive so the tap itself registers:

```jsx
            <PressableScale
              onPress={onLike}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 5,
                marginRight: 16,
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
```

`PressableScale` applies `scale: 0.97` with
`pressSpring = { type: "spring", damping: 20, stiffness: 300 }` — subtle, and within
the 0.95–0.98 range AUDIT.md §3 specifies.

## Repo conventions to follow

- Press feedback primitive: `apps/mobile/src/components/PressableScale.jsx`. It is the
  canonical way this repo does press scale — use it, don't reimplement it.
- Reanimated shared-value + `useAnimatedStyle` exemplar:
  `apps/mobile/src/components/PressableScale.jsx:8-14`
  ```jsx
  const scale = useSharedValue(1);
  const rStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  ```
- Motion tokens live in `apps/mobile/src/utils/motion.js`. The `{ damping: 12/18,
  stiffness: 400 }` springs above are intentionally *not* added there — they are
  one-off values local to this interaction, tighter than `pressSpring`. Do not add them
  to `motion.js`.
- Reduced motion: `import { useReducedMotion } from "@/hooks/useReducedMotion";`.
  Exemplar: `apps/mobile/src/app/(tabs)/care/index.jsx:49`.
- `PostCard.jsx` currently imports no motion library — all imports below are new.

## Steps

1. In `apps/mobile/src/components/Community/PostCard.jsx`, add imports:
   ```js
   import { useEffect, useRef } from "react";
   import Animated, {
     useAnimatedStyle,
     useSharedValue,
     withSequence,
     withSpring,
   } from "react-native-reanimated";
   import { PressableScale } from "@/components/PressableScale";
   import { useReducedMotion } from "@/hooks/useReducedMotion";
   ```
   Line 1 is currently `import React from "react";` — merge the hooks into it as
   `import React, { useEffect, useRef } from "react";` rather than adding a second
   react import.
2. Locate the component that receives `isLiked` and `onLike` as props and renders line
   390. Add `const reducedMotion = useReducedMotion();` alongside its existing hooks,
   then add the `likeScale` / `prevLiked` / `useEffect` / `likeHeartStyle` block from
   the target above.
3. Replace the `TouchableOpacity` opening tag at line 390 with the `PressableScale`
   opening tag above, and change its matching closing `</TouchableOpacity>` at line 415
   to `</PressableScale>`. Be careful: there are further `TouchableOpacity` elements
   immediately after (comment and share buttons) — close the correct one.
4. Wrap the `Heart` element at lines 400–405 in `<Animated.View style={likeHeartStyle}>`
   per the target above.

## Boundaries

- Do NOT animate the like **count** `Text` (lines 406–414) — no counter roll, no
  number transition, no colour tween.
- Do NOT animate the comment, share, or bookmark buttons in this file.
- Do NOT add a pop, shrink, or any motion on **unlike**.
- Do NOT add burst/particle/confetti effects.
- Do NOT change any colour value (`#A9334D`, `#9CA3AF`, `#6B7280`) or the `size={18}`.
- Do NOT change `onLike` or any optimistic-update / `displayLikes` logic.
- Do NOT touch `PollBlock.jsx` (see plan 002) even though it is rendered by this file.
- Do NOT add these spring configs to `apps/mobile/src/utils/motion.js`.
- Do NOT add new dependencies — `react-native-reanimated` 4.5.0 is already installed.
- If a step doesn't match the code you find (drift since commit d6c2795), STOP and
  report instead of improvising.

## Confirmed at execution

- `PressableScale` forwards `hitSlop` correctly — it destructures only
  `style, disabled, onPressIn, onPressOut, children` and spreads `...props` onto the
  animated `Pressable` (`PressableScale.jsx:7`). The 8px hit target is preserved.
- `PostCard` is **not** wrapped in `React.memo`, and does not need to be for this to
  work: `prevLiked` is a `useRef`, so it persists across re-renders of a mounted
  instance and only resets when the instance unmounts.
- Only the like control changed. `TouchableOpacity` occurrences went 15 → 13 (the
  removed open/close pair); comment, share and bookmark buttons are untouched.
- Two call sites render `PostCard` — `(tabs)/community/index.jsx:225` and
  `(tabs)/community/category/[id].jsx:102`. Neither adds its own like animation, so
  there is no double-animation risk.
- `Animated` is imported from `react-native-reanimated` only; the `react-native` import
  list in this file does not include `Animated`, so there is no shadowing.

## Verification

- **Mechanical**: `npx jest` and `npx tsc --noEmit` give **no signal on this file** —
  the mobile app has no test files at all, and `tsconfig.json` `include` covers only
  `**/*.ts` / `**/*.tsx`, so `.jsx` is never typechecked. Use the parse check instead:
  ```bash
  cd apps/mobile && node -e "
  const babel=require('@babel/core'),fs=require('fs');
  const f='src/components/Community/PostCard.jsx';
  babel.parseSync(fs.readFileSync(f,'utf8'),{filename:f,presets:['babel-preset-expo']});
  console.log('PARSE OK');"
  ```
- **Feel check**: run `npx expo start`, open the Community tab, and confirm:
  - Tapping an unliked post pops the heart once and settles. It should read as
    *confirmation*, not as an effect — if it draws the eye away from the feed, reduce
    the peak from `1.18` to `1.12`.
  - Tapping again to unlike does **nothing** but change the fill. No pop.
  - **Scroll the feed past several already-liked posts. Nothing pops.** If hearts pop
    on scroll, the `prevLiked` guard is wrong — this is the primary regression to
    watch for.
  - The whole row scales slightly on press-in and returns on release.
  - Only the heart scales — the count next to it stays perfectly still, with no
    horizontal shift as the heart grows.
  - Rapidly double-tap like/unlike/like: the spring retargets from wherever it is and
    never snaps to 1.18 and restarts.
  - The pop is over in well under a quarter second.
- **Reduced motion**: enable Reduce Motion and confirm liking still changes the fill
  and count instantly, with no scaling at all.
- **Done when**: the heart is wrapped in an `Animated.View`, the row uses
  `PressableScale`, the pop fires only on the false→true edge, and all feel checks pass
  — especially the scroll-past-liked-posts check.
