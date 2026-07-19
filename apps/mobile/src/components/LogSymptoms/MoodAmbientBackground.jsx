import { useWindowDimensions } from "react-native";
import { useEffect } from "react";
import { useDerivedValue, useSharedValue } from "react-native-reanimated";
import {
  Canvas,
  Rect,
  LinearGradient,
  Path,
  Group,
  Paint,
  Blur,
  vec,
  Skia,
  interpolateColors,
  useClock,
} from "@shopify/react-native-skia";

// On-brand mood ramps — index 0..4 = Very Unpleasant → Very Pleasant.
// Anchored to the Hemo palette: cool muted mauve (unpleasant) → dusty rose/cream
// (neutral) → warm coral/orange (pleasant). No blues/teals.
const LIGHT = {
  bgTop: ["#E7DEE6", "#F1DEE0", "#F8E9E7", "#FBE6DC", "#FCE4D5"],
  bgBottom: ["#B7A0AC", "#CE909A", "#D9A39C", "#ED9C7E", "#F2926B"],
  blob: ["#6E5560", "#9A4E63", "#C15F6C", "#E4744F", "#F0531C"],
  blobCore: ["#8A6C77", "#B85F73", "#D0727C", "#F08A63", "#F76A38"],
};
const DARK = {
  bgTop: ["#141013", "#17110F", "#161212", "#181210", "#1A120E"],
  bgBottom: ["#332830", "#3D2A30", "#402E2C", "#452A22", "#4A2A1C"],
  blob: ["#5A4550", "#7C4453", "#93505A", "#B15C42", "#C9451A"],
  blobCore: ["#6E5462", "#95566A", "#A9606A", "#C56E4E", "#D95A2A"],
};
const RANGE = [0, 0.25, 0.5, 0.75, 1];

// Build a smooth, closed organic blob path from N radial samples (Catmull-Rom
// → cubic beziers). Runs on the UI thread each frame.
function buildBlob(cx, cy, R, amp, phase, k1, k2) {
  "worklet";
  const N = 22;
  const px = [];
  const py = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2;
    const rr =
      R *
      (1 +
        amp * (0.6 * Math.sin(k1 * a + phase) + 0.4 * Math.sin(k2 * a - phase * 1.3)));
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
 * Full-bleed ambient background for the mood step. The whole surface washes
 * from cool → warm as `progress` (a reanimated SharedValue in [1..5]) changes,
 * with two blurred organic blobs that morph shape and colour over time.
 */
export function MoodAmbientBackground({ progress, isDark, reducedMotion = false }) {
  const { width, height } = useWindowDimensions();
  const clock = useClock();
  const C = isDark ? DARK : LIGHT;
  const motionScale = useSharedValue(reducedMotion ? 0 : 1);

  useEffect(() => {
    motionScale.value = reducedMotion ? 0 : 1;
  }, [reducedMotion]);

  // Normalised mood 0..1.
  const m = useDerivedValue(() => {
    const v = (progress.value - 1) / 4;
    return v < 0 ? 0 : v > 1 ? 1 : v;
  });

  const bgColors = useDerivedValue(() => [
    interpolateColors(m.value, RANGE, C.bgTop),
    interpolateColors(m.value, RANGE, C.bgBottom),
  ]);
  const blobColor = useDerivedValue(() => interpolateColors(m.value, RANGE, C.blob));
  const coreColor = useDerivedValue(() => interpolateColors(m.value, RANGE, C.blobCore));

  const cx = width / 2;
  const cy = height * 0.42;
  const R = Math.min(width, height) * 0.3;

  const blobPath = useDerivedValue(() => {
    const t = clock.value / 1000;
    const energy = (0.08 + m.value * 0.16) * motionScale.value; // livelier when pleasant
    const speed = (0.4 + m.value * 0.7) * motionScale.value;
    return buildBlob(cx, cy, R, energy, t * speed, 3, 5);
  });

  const corePath = useDerivedValue(() => {
    const t = clock.value / 1000;
    const energy = (0.06 + m.value * 0.12) * motionScale.value;
    const speed = (0.5 + m.value * 0.9) * motionScale.value;
    return buildBlob(cx, cy, R * 0.7, energy, -t * speed + 2, 4, 6);
  });

  return (
    <Canvas style={{ position: "absolute", top: 0, left: 0, width, height }}>
      <Rect x={0} y={0} width={width} height={height}>
        <LinearGradient start={vec(0, 0)} end={vec(0, height)} colors={bgColors} />
      </Rect>
      <Group layer={
        <Paint>
          <Blur blur={45} />
        </Paint>
      }>
        <Path path={blobPath} color={blobColor} opacity={0.9} />
        <Path path={corePath} color={coreColor} opacity={0.85} />
      </Group>
    </Canvas>
  );
}
