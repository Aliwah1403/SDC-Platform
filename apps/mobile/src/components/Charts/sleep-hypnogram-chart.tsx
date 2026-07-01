import { useEffect, useState } from "react";
import { LayoutChangeEvent, View, ViewStyle, Text as RNText } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, { G, Line, Rect } from "react-native-svg";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export type SleepStage = "awake" | "core" | "deep" | "rem";

export type SleepSegment = {
  start: string | Date;
  end: string | Date;
  stage: SleepStage;
};

const STAGE_LEVEL: Record<SleepStage, number> = { awake: 3, rem: 2, core: 1, deep: 0 };
const DEFAULT_COLORS: Record<SleepStage, string> = {
  awake: "#F59E0B",
  core: "#818CF8",
  deep: "#4F46E5",
  rem: "#A78BFA",
};

interface ChartConfig {
  width?: number;
  height?: number;
  padding?: number;
  stageColors?: Partial<Record<SleepStage, string>>;
  animated?: boolean;
  duration?: number;
  showTimeLabels?: boolean;
}

type Props = {
  segments: SleepSegment[];
  config?: ChartConfig;
  style?: ViewStyle;
};

export const SleepHypnogramChart = ({ segments, config = {}, style }: Props) => {
  const [containerWidth, setContainerWidth] = useState(300);

  const {
    height = 140,
    padding = 16,
    stageColors = {},
    animated = true,
    duration = 700,
    showTimeLabels = true,
  } = config;

  const colors = { ...DEFAULT_COLORS, ...stageColors };

  const handleLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0) setContainerWidth(w);
  };

  if (!segments.length) return null;

  const sorted = [...segments].sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime(),
  );

  const chartWidth = containerWidth || config.width || 300;
  const timeLabelHeight = showTimeLabels ? 20 : 0;
  const chartHeight = height - padding * 2 - timeLabelHeight;
  const innerWidth = chartWidth - padding * 2;

  const startMs = new Date(sorted[0].start).getTime();
  const endMs = new Date(sorted[sorted.length - 1].end).getTime();
  const totalMs = endMs - startMs || 1;

  const levels = 4;
  const rowHeight = chartHeight / levels;
  const thickness = Math.min(16, rowHeight * 0.55);

  const timeToX = (t: string | Date) =>
    padding + ((new Date(t).getTime() - startMs) / totalMs) * innerWidth;

  const levelToY = (stage: SleepStage) =>
    padding + (levels - 1 - STAGE_LEVEL[stage]) * rowHeight + rowHeight / 2;

  const bars = sorted.map((seg) => ({
    x: timeToX(seg.start),
    width: Math.max(2, timeToX(seg.end) - timeToX(seg.start)),
    y: levelToY(seg.stage) - thickness / 2,
    color: colors[seg.stage],
    stage: seg.stage,
  }));

  const connectors = [];
  for (let i = 0; i < sorted.length - 1; i++) {
    const cur = sorted[i];
    const next = sorted[i + 1];
    connectors.push({
      key: `connector-${i}`,
      x1: timeToX(cur.end),
      y1: levelToY(cur.stage),
      x2: timeToX(next.start),
      y2: levelToY(next.stage),
      color: colors[cur.stage],
    });
  }

  const startLabel = new Date(startMs).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const endLabel = new Date(endMs).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return (
    <View style={[{ width: "100%", height }, style]} onLayout={handleLayout}>
      <Svg width={chartWidth} height={height - timeLabelHeight}>
        <G>
          {connectors.map((c) => (
            <Line
              key={c.key}
              x1={c.x1}
              y1={c.y1}
              x2={c.x2}
              y2={c.y2}
              stroke={c.color}
              strokeWidth={2}
              opacity={0.4}
            />
          ))}
        </G>

        {bars.map((bar, i) => (
          <HypnogramBar
            key={`bar-${i}`}
            x={bar.x}
            y={bar.y}
            width={bar.width}
            height={thickness}
            color={bar.color}
            delay={i * 25}
            animated={animated}
            duration={duration}
          />
        ))}
      </Svg>

      {showTimeLabels && (
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            paddingHorizontal: padding,
            marginTop: 4,
          }}
        >
          <RNText style={{ fontSize: 11, color: "rgba(107,107,107,0.8)" }}>{startLabel}</RNText>
          <RNText style={{ fontSize: 11, color: "rgba(107,107,107,0.8)" }}>{endLabel}</RNText>
        </View>
      )}
    </View>
  );
};

function HypnogramBar({
  x,
  y,
  width,
  height,
  color,
  delay,
  animated,
  duration,
}: {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  delay: number;
  animated: boolean;
  duration: number;
}) {
  const progress = useSharedValue(animated ? 0 : 1);

  useEffect(() => {
    if (animated) {
      progress.value = withDelay(delay, withTiming(1, { duration }));
    } else {
      progress.value = 1;
    }
  }, [animated, delay, duration]);

  const animatedProps = useAnimatedProps(() => ({
    opacity: progress.value,
    width: width * progress.value,
  }));

  return (
    <AnimatedRect
      x={x}
      y={y}
      height={height}
      rx={height / 2}
      fill={color}
      animatedProps={animatedProps}
    />
  );
}
