import { useEffect, useState } from "react";
import { LayoutChangeEvent, View, ViewStyle, Text as RNText } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export type SleepStage = "awake" | "core" | "deep" | "rem";

export type SleepSegment = {
  start: string | Date;
  end: string | Date;
  stage: SleepStage;
};

// Top-to-bottom row order, matching the reference hypnogram layout
const STAGE_ORDER: SleepStage[] = ["awake", "rem", "core", "deep"];
const STAGE_LEVEL: Record<SleepStage, number> = { awake: 3, rem: 2, core: 1, deep: 0 };
const STAGE_LABELS: Record<SleepStage, string> = { awake: "Awake", rem: "REM", core: "Core", deep: "Deep" };
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
  showRowLabels?: boolean;
  showHourGrid?: boolean;
  rowLabelWidth?: number;
  barHeightRatio?: number;
}

type Props = {
  segments: SleepSegment[];
  config?: ChartConfig;
  style?: ViewStyle;
};

export const SleepHypnogramChart = ({ segments, config = {}, style }: Props) => {
  const [containerWidth, setContainerWidth] = useState(300);

  const {
    height = 260,
    padding = 16,
    stageColors = {},
    animated = true,
    duration = 700,
    showTimeLabels = true,
    showRowLabels = true,
    showHourGrid = true,
    rowLabelWidth = 44,
    barHeightRatio = 0.45,
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
  const leftGutter = showRowLabels ? rowLabelWidth : 0;
  const chartHeight = height - padding * 2 - timeLabelHeight;
  const innerWidth = chartWidth - padding - leftGutter;

  const startMs = new Date(sorted[0].start).getTime();
  const endMs = new Date(sorted[sorted.length - 1].end).getTime();
  const totalMs = endMs - startMs || 1;

  const levels = 4;
  const rowHeight = chartHeight / levels;
  const thickness = rowHeight * barHeightRatio;

  const timeToX = (t: string | number | Date) =>
    padding + leftGutter + ((new Date(t).getTime() - startMs) / totalMs) * innerWidth;

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

  // Vertical hour gridlines, on the hour, between start and end
  const hourLines: { x: number; label: string }[] = [];
  if (showHourGrid) {
    const firstHour = new Date(startMs);
    firstHour.setMinutes(0, 0, 0);
    firstHour.setHours(firstHour.getHours() + 1);
    for (let t = firstHour.getTime(); t < endMs; t += 2 * 3600000) {
      hourLines.push({
        x: timeToX(t),
        label: new Date(t).toLocaleTimeString("en-US", { hour: "numeric", hour12: true }).replace(" ", ""),
      });
    }
  }

  const startLabel = new Date(startMs).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  const endLabel = new Date(endMs).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

  return (
    <View style={[{ width: "100%", height }, style]} onLayout={handleLayout}>
      <Svg width={chartWidth} height={height - timeLabelHeight}>
        {showRowLabels && (
          <G>
            {STAGE_ORDER.map((stage) => (
              <SvgText
                key={`row-${stage}`}
                x={leftGutter - 10}
                y={levelToY(stage) + 4}
                textAnchor="end"
                fontSize={11}
                fill="rgba(107,107,107,0.8)"
              >
                {STAGE_LABELS[stage]}
              </SvgText>
            ))}
          </G>
        )}

        {showHourGrid && (
          <G>
            {hourLines.map((h, i) => (
              <Line
                key={`hour-${i}`}
                x1={h.x}
                y1={padding}
                x2={h.x}
                y2={height - timeLabelHeight - padding}
                stroke="rgba(107,107,107,0.6)"
                strokeWidth={1}
                strokeDasharray="2,4"
                opacity={0.4}
              />
            ))}
          </G>
        )}

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
            paddingLeft: leftGutter + padding,
            paddingRight: padding,
            marginTop: 6,
          }}
        >
          <RNText style={{ fontSize: 11, color: "rgba(107,107,107,0.8)" }}>{startLabel}</RNText>
          {showHourGrid && hourLines.map((h, i) => (
            <RNText key={`hour-label-${i}`} style={{ fontSize: 11, color: "rgba(107,107,107,0.8)" }}>
              {h.label}
            </RNText>
          ))}
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
