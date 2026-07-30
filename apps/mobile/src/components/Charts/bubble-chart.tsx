import { useEffect, useState } from "react";
import { LayoutChangeEvent, View, ViewStyle, Text as RNText } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle, G, Line, Path, Text as SvgText } from "react-native-svg";
import { fonts } from "@/utils/fonts";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

export type BubbleDataPoint = {
  x: string | number;
  y: number;
  label?: string;
  tooltipLabel?: string;
  color?: string;
};

interface ChartConfig {
  width?: number;
  height?: number;
  padding?: number;
  size?: number;
  yMin?: number;
  yMax?: number;
  yLabels?: (string | number)[];
  showYLabels?: boolean;
  showXLabels?: boolean;
  showTrendLine?: boolean;
  trendLineColor?: string;
  animated?: boolean;
  duration?: number;
  renderTooltip?: (point: BubbleDataPoint, index: number) => React.ReactNode;
}

type Props = {
  data: BubbleDataPoint[];
  config?: ChartConfig;
  style?: ViewStyle;
};

export const BubbleChart = ({ data, config = {}, style }: Props) => {
  const [containerWidth, setContainerWidth] = useState(300);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const {
    height = 200,
    padding = 20,
    size = 12,
    yMin = 1,
    yMax = 5,
    yLabels,
    showYLabels = true,
    showXLabels = true,
    showTrendLine = true,
    trendLineColor = "rgba(26,26,26,0.12)",
    animated = true,
    duration = 600,
    renderTooltip,
  } = config;

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width: measuredWidth } = event.nativeEvent.layout;
    if (measuredWidth > 0) {
      setContainerWidth(measuredWidth);
    }
  };

  if (!data.length) return null;

  const chartWidth = containerWidth || config.width || 300;
  const yAxisWidth = showYLabels ? 20 : 0;
  const leftPadding = padding + yAxisWidth;
  const innerChartWidth = chartWidth - leftPadding - padding;
  const chartHeight = height - padding * 2;
  const range = yMax - yMin || 1;

  const scaleY = (v: number) => padding + ((yMax - v) / range) * chartHeight;

  const validPoints = data
    .map((d, index) => ({ ...d, index }))
    .filter((d) => d.y != null);

  const points = validPoints.map((point) => ({
    x: leftPadding + (point.index / Math.max(data.length - 1, 1)) * innerChartWidth,
    y: scaleY(point.y),
  }));

  const trendPath = points.length > 1
    ? `M${points.map((p) => `${p.x},${p.y}`).join(" L")}`
    : "";

  const levels = yLabels ?? Array.from({ length: yMax - yMin + 1 }, (_, i) => yMax - i);

  const activePoint = activeIndex !== null
    ? validPoints.find((p) => p.index === activeIndex)
    : null;
  const activeScreenPoint = activePoint
    ? points[validPoints.findIndex((p) => p.index === activeIndex)]
    : null;
  const tooltipWidth = 100;
  const tooltipLeft = activeScreenPoint
    ? Math.min(Math.max(activeScreenPoint.x - tooltipWidth / 2, 0), chartWidth - tooltipWidth)
    : 0;

  return (
    <View style={[{ width: "100%", height }, style]} onLayout={handleLayout}>
      <Svg width={chartWidth} height={height}>
        {/* Y-axis labels */}
        {showYLabels && (
          <G>
            {levels.map((label, i) => {
              const value = typeof label === "number" ? label : yMax - i;
              const y = scaleY(value);
              return (
                <SvgText
                  key={`y-${i}`}
                  x={leftPadding - 10}
                  y={y + 4}
                  textAnchor="end"
                  fontSize={10}
                  fill="rgba(107,107,107,0.7)"
                >
                  {label}
                </SvgText>
              );
            })}
          </G>
        )}

        {/* Trend line behind bubbles */}
        {showTrendLine && trendPath !== "" && (
          <Path d={trendPath} stroke={trendLineColor} strokeWidth={1.5} fill="none" />
        )}

        {/* Bubbles */}
        {validPoints.map((point, i) => (
          <BubbleDot
            key={`bubble-${point.index}`}
            cx={points[i].x}
            cy={points[i].y}
            r={size / 2}
            fill={point.color ?? "#7C3AED"}
            delay={i * 40}
            animated={animated}
            duration={duration}
            onPress={() => setActiveIndex(activeIndex === point.index ? null : point.index)}
          />
        ))}

        {/* X-axis labels */}
        {showXLabels && (
          <G>
            {data.map((point, index) => (
              <SvgText
                key={`x-label-${index}`}
                x={leftPadding + (index / Math.max(data.length - 1, 1)) * innerChartWidth}
                y={height - 5}
                textAnchor="middle"
                fontSize={10}
                fill="rgba(107,107,107,0.7)"
              >
                {point.label || ""}
              </SvgText>
            ))}
          </G>
        )}
      </Svg>

      {activePoint && activeScreenPoint && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: tooltipLeft,
            top: 4,
            width: tooltipWidth,
            backgroundColor: "#1F2937",
            borderRadius: 10,
            paddingHorizontal: 10,
            paddingVertical: 7,
            alignItems: "center",
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          {renderTooltip ? (
            renderTooltip(activePoint, activeIndex!)
          ) : (
            <RNText style={{ color: "#fff", fontSize: 12, fontFamily: fonts.bold }}>
              {activePoint.tooltipLabel || activePoint.label} · {activePoint.y}
            </RNText>
          )}
        </View>
      )}
    </View>
  );
};

function BubbleDot({
  cx,
  cy,
  r,
  fill,
  delay,
  animated,
  duration,
  onPress,
}: {
  cx: number;
  cy: number;
  r: number;
  fill: string;
  delay: number;
  animated: boolean;
  duration: number;
  onPress: () => void;
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
    r: r * progress.value,
    opacity: progress.value,
  }));

  return (
    <AnimatedCircle
      cx={cx}
      cy={cy}
      fill={fill}
      stroke="#FFFFFF"
      strokeWidth={1.5}
      animatedProps={animatedProps}
      onPress={onPress}
    />
  );
}
