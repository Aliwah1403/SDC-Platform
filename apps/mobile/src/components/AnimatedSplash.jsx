import { useEffect } from "react";
import { StyleSheet } from "react-native";
import Animated, {
  Easing,
  cancelAnimation,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

/**
 * Single source of truth for the launch composition.
 *
 * The native splash (expo-splash-screen in app.json) and this component render
 * the same mark at the same size, so hiding the native layer and mounting this
 * one produces no visible change.
 *
 * `backgroundColor` in app.json only accepts a solid colour, so the native
 * frame uses `nativeBackground` — the gradient's midpoint — and the gradient
 * itself fades in here. Keep the two in sync with the exported PNG.
 */
export const SPLASH = {
  // Main Hemo gradient, matching the home and care-hub headers.
  gradient: ["#D09F9A", "#A9334D", "#781D11"],
  nativeBackground: "#A9334D",
  /**
   * Fixed, not responsive: `imageWidth` in app.json is a single pt value for
   * every device, so the JS mark has to be the same number or the handoff
   * jumps. The glyph sits dead-centre in a square canvas and occupies ~62% of
   * it, so 260 draws it about 160pt wide — comfortable from a 320pt phone up.
   */
  markSize: 260,
};

/**
 * Deliberately *not* `easeOutStrong` from utils/motion. That curve front-loads
 * ~90% of its travel into the first quarter of the duration, which is right for
 * a control answering a tap and wrong for an atmospheric fade — it makes any
 * duration read as instant. These two are the softest useful pair:
 *
 *   BLOOM — gentle symmetric in-out, no sudden onset, no hard arrival.
 *   Easing.linear on the exits — a cross-dissolve has no acceleration in the
 *   real world, and easing opacity is what makes a fade look like it snaps.
 */
const EASE_BLOOM = Easing.bezier(0.4, 0, 0.2, 1);

/**
 * Timing presets, in ms.
 *
 * `quick` is the default and follows Apple's posture: the launch frame is a
 * doorway, not a destination. It buys its smoothness from overlap rather than
 * from duration — `exitAt` lands before the bloom has finished, so every phase
 * is still in motion when the next begins and nothing has to snap to catch up.
 *
 * `smooth` is the longer, fully-sequenced version, kept for comparison.
 *
 * settle    hold the flat native colour so the handoff can't be seen
 * bloom     gradient rises out of that flat colour
 * exitAt    when the mark begins to clear
 * markLead  how far ahead of the gradient the mark clears, for depth
 */
export const PACING = {
  quick: {
    settle: 75,
    bloom: 420,
    exitAt: 445,
    markFade: 245,
    markLead: 60,
    layerFade: 295,
  },
  smooth: {
    settle: 120,
    bloom: 600,
    exitAt: 960,
    markFade: 400,
    markLead: 120,
    layerFade: 520,
  },
};

// Reduced motion: same fades, compressed, no stagger.
const REDUCED = {
  settle: 0,
  bloom: 120,
  exitAt: 160,
  markFade: 0,
  markLead: 0,
  layerFade: 200,
};

/**
 * The launch screen. Mounts over the app the instant the native splash hides,
 * settles its gradient, then dissolves into whatever is underneath.
 *
 * The mark itself never moves — the only motion is the arrival of the gradient
 * and the dissolve out.
 *
 * `onDone` fires when the dissolve completes. It never gates readiness: the
 * caller is expected to have the app mounted and ready behind this layer.
 */
export default function AnimatedSplash({ onDone, pacing = "quick" }) {
  const reduced = useReducedMotion();

  const gradientOpacity = useSharedValue(0);
  const markOpacity = useSharedValue(1);
  const layerOpacity = useSharedValue(1);

  useEffect(() => {
    const p = reduced ? REDUCED : (PACING[pacing] ?? PACING.quick);

    gradientOpacity.set(
      withDelay(p.settle, withTiming(1, { duration: p.bloom, easing: EASE_BLOOM })),
    );

    if (p.markFade > 0) {
      markOpacity.set(
        withDelay(p.exitAt, withTiming(0, { duration: p.markFade, easing: Easing.linear })),
      );
    }

    layerOpacity.set(
      withDelay(
        p.exitAt + p.markLead,
        withTiming(0, { duration: p.layerFade, easing: Easing.linear }, (finished) => {
          "worklet";
          if (finished && onDone) scheduleOnRN(onDone);
        }),
      ),
    );

    return () => {
      cancelAnimation(gradientOpacity);
      cancelAnimation(markOpacity);
      cancelAnimation(layerOpacity);
    };
  }, [reduced, pacing, onDone, gradientOpacity, markOpacity, layerOpacity]);

  const layerStyle = useAnimatedStyle(() => ({
    opacity: layerOpacity.get(),
  }));

  const gradientStyle = useAnimatedStyle(() => ({
    opacity: gradientOpacity.get(),
  }));

  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.get(),
  }));

  return (
    <Animated.View
      pointerEvents="none"
      accessible
      accessibilityRole="image"
      accessibilityLabel="Hemo"
      style={[
        StyleSheet.absoluteFill,
        styles.layer,
        { backgroundColor: SPLASH.nativeBackground },
        layerStyle,
      ]}
    >
      <Animated.View style={[StyleSheet.absoluteFill, gradientStyle]}>
        <LinearGradient
          colors={SPLASH.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>

      <Animated.View style={[styles.markWrap, markStyle]}>
        <Image
          source={require("../../assets/images/splash-mark.png")}
          style={{ width: SPLASH.markSize, height: SPLASH.markSize }}
          contentFit="contain"
          transition={0}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  layer: {
    alignItems: "center",
    justifyContent: "center",
  },
  markWrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
