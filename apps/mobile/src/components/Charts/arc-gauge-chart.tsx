import { useEffect, useState } from "react";
import { LayoutChangeEvent, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, G, Path, RadialGradient, Stop } from "react-native-svg";

const AnimatedPath = Animated.createAnimatedComponent(Path);

interface ChartConfig {
  size?: number;
  totalNotches?: number;
  spacing?: number;
  notchLengthPercent?: number;
  notchCornerRadius?: number;
  uniformWidth?: boolean;
  startAngle?: number;
  endAngle?: number;
  radius?: number;
  mutedColor?: string;
  glow?: boolean;
  animated?: boolean;
  duration?: number;
  getTickColor?: (ratio: number) => string;
}

type Props = {
  value: number;
  min: number;
  max: number;
  color: string;
  config?: ChartConfig;
  style?: ViewStyle;
  children?: React.ReactNode;
};

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

function lerpColor(c1: string, c2: string, t: number): string {
  const a = hexToRgb(c1);
  const b = hexToRgb(c2);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r},${g},${bl})`;
}

// ─── Notch geometry (ported from a web/visx gauge — pure trig + SVG path,
// nothing DOM-specific, so it maps 1:1 onto react-native-svg) ────────────────

type NotchPoints = { x1: number; y1: number; x2: number; y2: number; x3: number; y3: number; x4: number; y4: number };

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function dist(ax: number, ay: number, bx: number, by: number) {
  return Math.hypot(bx - ax, by - ay);
}

// Builds a rounded-corner quad path for one notch. cornerRadiusPx = 0 gives
// sharp rectangular notches; larger values fillet toward a capsule/pill shape.
function createNotchPath(points: NotchPoints, cornerRadiusPx: number, verticalDepth: number): string {
  const { x1, y1, x2, y2, x3, y3, x4, y4 } = points;

  if (cornerRadiusPx <= 0) {
    return `M ${x1} ${y1} L ${x2} ${y2} L ${x3} ${y3} L ${x4} ${y4} Z`;
  }

  const d12 = dist(x1, y1, x2, y2);
  const d23 = dist(x2, y2, x3, y3);
  const d34 = dist(x3, y3, x4, y4);
  const d41 = dist(x4, y4, x1, y1);
  const minEdge = Math.min(d12, d23, d34, d41);

  const cr = Math.min(cornerRadiusPx, verticalDepth * 0.48, d12 * 0.49, d23 * 0.49, d34 * 0.49, d41 * 0.49, minEdge * 0.49);

  const r1 = Math.min(cr / d12, 0.49);
  const r2 = Math.min(cr / d23, 0.49);
  const r3 = Math.min(cr / d34, 0.49);
  const r4 = Math.min(cr / d41, 0.49);

  const p1a = { x: lerp(x1, x4, r4), y: lerp(y1, y4, r4) };
  const p1b = { x: lerp(x1, x2, r1), y: lerp(y1, y2, r1) };
  const p2a = { x: lerp(x2, x1, r1), y: lerp(y2, y1, r1) };
  const p2b = { x: lerp(x2, x3, r2), y: lerp(y2, y3, r2) };
  const p3a = { x: lerp(x3, x2, r2), y: lerp(y3, y2, r2) };
  const p3b = { x: lerp(x3, x4, r3), y: lerp(y3, y4, r3) };
  const p4a = { x: lerp(x4, x3, r3), y: lerp(y4, y3, r3) };
  const p4b = { x: lerp(x4, x1, r4), y: lerp(y4, y1, r4) };

  return `M ${p1a.x} ${p1a.y} Q ${x1} ${y1} ${p1b.x} ${p1b.y} L ${p2a.x} ${p2a.y} Q ${x2} ${y2} ${p2b.x} ${p2b.y} L ${p3a.x} ${p3a.y} Q ${x3} ${y3} ${p3b.x} ${p3b.y} L ${p4a.x} ${p4a.y} Q ${x4} ${y4} ${p4b.x} ${p4b.y} Z`;
}

export const ArcGaugeChart = ({ value, min, max, color, config = {}, style, children }: Props) => {
  const [containerWidth, setContainerWidth] = useState(320);

  const {
    totalNotches = 44,
    spacing = 22,
    notchLengthPercent = 100,
    notchCornerRadius = 5,
    uniformWidth = true,
    startAngle = 180,
    endAngle = 360,
    mutedColor = "#E5E1DF",
    glow = true,
    animated = true,
    duration = 900,
    getTickColor,
  } = config;

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setContainerWidth(w);
  };

  const size = config.size || containerWidth;
  const outerRadius = config.radius || size / 2 - 20;
  const depthFactor = Math.min(100, Math.max(5, notchLengthPercent)) / 100;
  const notchLength = outerRadius * 0.28 * depthFactor;
  const innerRadius = outerRadius - notchLength;

  const height = outerRadius + notchLength + 24;
  const centerX = size / 2;
  const centerY = outerRadius + 8;

  const clampedValue = Math.min(Math.max(value, min), max);
  const targetRatio = (clampedValue - min) / (max - min || 1);
  const activeNotches = Math.round(targetRatio * totalNotches);

  const totalAngle = endAngle - startAngle;
  const availableAngle = totalAngle * (1 - spacing / 100);
  const notchAngle = totalNotches > 0 ? availableAngle / totalNotches : 0;
  const gapDen = totalNotches - 1 > 0 ? totalNotches - 1 : 1;
  const gapAngle = (totalAngle * (spacing / 100)) / gapDen;

  const notches = Array.from({ length: totalNotches }, (_, i) => {
    const angleDeg = startAngle + i * (notchAngle + gapAngle) + notchAngle / 2;
    const radians = (angleDeg * Math.PI) / 180;
    const arcNotchWidth = notchAngle * 0.8;
    const halfWidth = (arcNotchWidth * Math.PI) / 180 / 2;

    const x1 = centerX + outerRadius * Math.cos(radians - halfWidth);
    const y1 = centerY + outerRadius * Math.sin(radians - halfWidth);
    const x2 = centerX + outerRadius * Math.cos(radians + halfWidth);
    const y2 = centerY + outerRadius * Math.sin(radians + halfWidth);

    let x3: number, y3: number, x4: number, y4: number;
    if (uniformWidth) {
      const perpX = Math.cos(radians);
      const perpY = Math.sin(radians);
      x3 = x2 - perpX * notchLength;
      y3 = y2 - perpY * notchLength;
      x4 = x1 - perpX * notchLength;
      y4 = y1 - perpY * notchLength;
    } else {
      x3 = centerX + innerRadius * Math.cos(radians + halfWidth);
      y3 = centerY + innerRadius * Math.sin(radians + halfWidth);
      x4 = centerX + innerRadius * Math.cos(radians - halfWidth);
      y4 = centerY + innerRadius * Math.sin(radians - halfWidth);
    }

    const ratio = i / (totalNotches - 1);
    const isActive = i < activeNotches;
    const fill = isActive ? (getTickColor ? getTickColor(ratio) : color) : mutedColor;
    const d = createNotchPath({ x1, y1, x2, y2, x3, y3, x4, y4 }, notchCornerRadius, notchLength);

    return { key: `notch-${i}`, d, fill, isActive, delay: i * 14 };
  });

  return (
    <View style={[{ width: "100%", alignItems: "center" }, style]} onLayout={handleLayout}>
      <View style={{ width: size, height, alignItems: "center", justifyContent: "flex-start" }}>
        <Svg width={size} height={height} style={{ position: "absolute", top: 0 }}>
          <Defs>
            {glow && (
              <RadialGradient id="gaugeGlow" cx="50%" cy="100%" r="65%">
                <Stop offset="0%" stopColor={color} stopOpacity={0.22} />
                <Stop offset="100%" stopColor={color} stopOpacity={0} />
              </RadialGradient>
            )}
          </Defs>

          {glow && (
            <Circle cx={centerX} cy={centerY} r={outerRadius + notchLength + 20} fill="url(#gaugeGlow)" />
          )}

          <G>
            {notches.map((n) => (
              <GaugeNotch
                key={n.key}
                d={n.d}
                fill={n.fill}
                opacity={n.isActive ? 1 : 0.5}
                delay={n.delay}
                animated={animated}
              />
            ))}
          </G>
        </Svg>

        <View
          style={{
            position: "absolute",
            top: centerY - outerRadius * 0.55,
            width: size,
            alignItems: "center",
          }}
        >
          {children}
        </View>
      </View>
    </View>
  );
};

function GaugeNotch({
  d,
  fill,
  opacity,
  delay,
  animated,
}: {
  d: string;
  fill: string;
  opacity: number;
  delay: number;
  animated: boolean;
}) {
  const progress = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    if (animated) {
      progress.value = withDelay(delay, withTiming(1, { duration: 260 }));
    } else {
      progress.value = 1;
    }
  }, [animated, delay]);

  const animatedProps = useAnimatedProps(() => ({
    opacity: opacity * progress.value,
  }));

  return <AnimatedPath d={d} fill={fill} animatedProps={animatedProps} />;
}
