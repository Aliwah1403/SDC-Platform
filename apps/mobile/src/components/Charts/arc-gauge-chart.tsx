import { useEffect, useState } from "react";
import { LayoutChangeEvent, View, ViewStyle } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, Defs, G, Line, RadialGradient, Stop } from "react-native-svg";

const AnimatedG = Animated.createAnimatedComponent(G);

interface ChartConfig {
  size?: number;
  tickCount?: number;
  tickLength?: number;
  tickWidth?: number;
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

export const ArcGaugeChart = ({ value, min, max, color, config = {}, style, children }: Props) => {
  const [containerWidth, setContainerWidth] = useState(320);

  const {
    tickCount = 40,
    tickLength = 12,
    tickWidth = 3,
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
  const radius = config.radius || size / 2 - tickLength - 8;
  const height = radius + tickLength + 24;
  const centerX = size / 2;
  const centerY = radius + tickLength + 8;

  const progress = useSharedValue(animated ? 0 : 1);
  const clampedValue = Math.min(Math.max(value, min), max);
  const targetRatio = (clampedValue - min) / (max - min || 1);

  useEffect(() => {
    if (animated) {
      progress.value = withTiming(targetRatio, { duration });
    } else {
      progress.value = targetRatio;
    }
  }, [animated, duration, targetRatio]);

  const groupAnimatedProps = useAnimatedProps(() => ({
    opacity: Math.min(progress.value / Math.max(targetRatio, 0.001), 1) * 0.3 + 0.7,
  }));

  const ticks = Array.from({ length: tickCount }, (_, i) => {
    const ratio = i / (tickCount - 1);
    const angle = Math.PI - ratio * Math.PI;
    const isActive = ratio <= targetRatio;
    const tickColor = isActive
      ? (getTickColor ? getTickColor(ratio) : color)
      : mutedColor;

    const outerX = centerX + radius * Math.cos(angle);
    const outerY = centerY - radius * Math.sin(angle);
    const innerX = centerX + (radius - tickLength) * Math.cos(angle);
    const innerY = centerY - (radius - tickLength) * Math.sin(angle);

    return { key: `tick-${i}`, x1: innerX, y1: innerY, x2: outerX, y2: outerY, color: tickColor, isActive };
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
            <Circle cx={centerX} cy={centerY} r={radius + tickLength + 20} fill="url(#gaugeGlow)" />
          )}

          <AnimatedG animatedProps={groupAnimatedProps}>
            {ticks.map((t) => (
              <Line
                key={t.key}
                x1={t.x1}
                y1={t.y1}
                x2={t.x2}
                y2={t.y2}
                stroke={t.color}
                strokeWidth={tickWidth}
                strokeLinecap="round"
                opacity={t.isActive ? 1 : 0.5}
              />
            ))}
          </AnimatedG>
        </Svg>

        <View
          style={{
            position: "absolute",
            top: centerY - radius * 0.55,
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
