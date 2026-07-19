import { View, Text } from "react-native";
import { useEffect } from "react";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";
import {
  Canvas,
  Circle,
  RadialGradient,
  Path,
  Group,
  Paint,
  Blur,
  vec,
  Skia,
  interpolateColors,
  useClock,
} from "@shopify/react-native-skia";

const SIZE = 300; // canvas is fixed + centered — glow stays contained, never floods
const CENTER = SIZE / 2;
const BASE_R = 78;

// Clinical pain ramp (green → red), matching getPainColor's intent.
const PAIN_STOPS = [0, 0.3, 0.55, 0.8, 1];
const PAIN_COLORS = ["#10B981", "#FDE047", "#F59E0B", "#EF4444", "#7F1D1D"];

// Smooth closed organic blob from N radial samples. Higher `amp`/frequency =
// more turbulent (jagged) edge. Runs on the UI thread each frame.
function buildPainBlob(cx, cy, R, amp, phase, k1, k2) {
  "worklet";
  const N = 24;
  const px = [];
  const py = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const rr =
      R *
      (1 +
        amp * (0.55 * Math.sin(k1 * a + phase) + 0.45 * Math.sin(k2 * a - phase * 1.4)));
    px.push(cx + Math.cos(a) * rr);
    py.push(cy + Math.sin(a) * rr);
  }
  const path = Skia.Path.Make();
  path.moveTo(px[0], py[0]);
  for (let i = 0; i < N; i++) {
    const p0 = (i - 1 + N) % N;
    const p1 = i;
    const p2 = (i + 1) % N;
    const p3 = (i + 2) % N;
    const c1x = px[p1] + (px[p2] - px[p0]) / 6;
    const c1y = py[p1] + (py[p2] - py[p0]) / 6;
    const c2x = px[p2] - (px[p3] - px[p1]) / 6;
    const c2y = py[p2] - (py[p3] - py[p1]) / 6;
    path.cubicTo(c1x, c1y, c2x, c2y, px[p2], py[p2]);
  }
  path.close();
  return path;
}

/**
 * Contained, breathing pain orb. `progress` is a reanimated SharedValue in
 * [0..10] (springs between integer pain scores). The orb pulses like a slow
 * breath — calmer/rounder at low pain, faster/throbbing and more turbulent at
 * high pain — while a radial glow grows but fades before the canvas edges.
 */
export function PainOrb({ progress, value, isDark, reducedMotion = false }) {
  const clock = useClock();
  const motionScale = useSharedValue(reducedMotion ? 0 : 1);

  useEffect(() => {
    motionScale.value = reducedMotion ? 0 : 1;
  }, [reducedMotion]);

  const p = useDerivedValue(() => {
    const v = progress.value / 10;
    return v < 0 ? 0 : v > 1 ? 1 : v;
  });

  const orbColor = useDerivedValue(() => interpolateColors(p.value, PAIN_STOPS, PAIN_COLORS));

  // Breathing scale — rate and depth grow with pain.
  const breath = useDerivedValue(() => {
    const t = clock.value / 1000;
    const rate = 1.1 + p.value * 2.6;
    const depth = (0.02 + p.value * 0.05) * motionScale.value;
    return 1 + Math.sin(t * rate) * depth;
  });

  const orbPath = useDerivedValue(() => {
    const t = clock.value / 1000;
    const turb = (0.02 + p.value * 0.15) * motionScale.value; // smooth (low) → jagged (high)
    const speed = (0.5 + p.value * 1.2) * motionScale.value;
    const R = BASE_R * breath.value;
    return buildPainBlob(CENTER, CENTER, R, turb, t * speed, 3, 6);
  });

  // Contained glow: radius + opacity grow with pain, but always fade before the
  // canvas edge (max ≈ 78*1.75 ≈ 137 < SIZE/2 = 150) so it never floods.
  const glowR = useDerivedValue(() => BASE_R * (1.1 + p.value * 0.65));
  const glowColors = useDerivedValue(() => {
    // Fade to the same hue at alpha 0 (not a separate "transparent" color) —
    // keeps both gradient stops the same [r,g,b,a] shape for the native side.
    const c = interpolateColors(p.value, PAIN_STOPS, PAIN_COLORS);
    return [c, [c[0], c[1], c[2], 0]];
  });
  const glowOpacity = useDerivedValue(() => 0.18 + p.value * 0.32);

  return (
    <View style={{ width: SIZE, height: SIZE, alignItems: "center", justifyContent: "center" }}>
      <Canvas style={{ position: "absolute", width: SIZE, height: SIZE }}>
        {/* Contained radial glow (fades to transparent before the edges) */}
        <Circle cx={CENTER} cy={CENTER} r={SIZE / 2} opacity={glowOpacity}>
          <RadialGradient c={vec(CENTER, CENTER)} r={glowR} colors={glowColors} />
        </Circle>
        {/* Breathing, turbulent orb */}
        <Group layer={
          <Paint>
            <Blur blur={isDark ? 3 : 2} />
          </Paint>
        }>
          <Path path={orbPath} color={orbColor} />
        </Group>
      </Canvas>
    </View>
  );
}
