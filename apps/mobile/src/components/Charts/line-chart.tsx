// import { useColor } from "@/hooks/useColor";
import { useEffect, useState } from "react";
import { LayoutChangeEvent, View, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient,
  Path,
  Stop,
  Text as SvgText,
} from "react-native-svg";

interface ChartConfig {
  width?: number;
  height?: number;
  padding?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  animated?: boolean;
  duration?: number;
  gradient?: boolean;
  interactive?: boolean;
  showYLabels?: boolean;
  showXLabels?: boolean;
  showDataPoints?: boolean;
  yLabelCount?: number;
  yAxisWidth?: number;
}

export type ChartDataPoint = {
  x: string | number;
  y: number;
  label?: string;
};

// Utility functions
const createPath = (points: { x: number; y: number }[], tension = 0.35): string => {
  if (points.length === 0) return "";
  if (points.length === 1) return `M${points[0].x},${points[0].y}`;

  let path = `M${points[0].x},${points[0].y}`;

  for (let i = 1; i < points.length; i++) {
    const prev  = points[i - 2] ?? points[i - 1];
    const cur   = points[i - 1];
    const next  = points[i];
    const after = points[i + 1] ?? next;

    // Catmull-Rom → cubic bezier control points
    const cp1x = cur.x  + (next.x - prev.x)  * tension;
    const cp1y = cur.y  + (next.y - prev.y)   * tension;
    const cp2x = next.x - (after.x - cur.x)   * tension;
    const cp2y = next.y - (after.y - cur.y)   * tension;

    path += ` C${cp1x},${cp1y} ${cp2x},${cp2y} ${next.x},${next.y}`;
  }

  return path;
};

const createAreaPath = (
  points: { x: number; y: number }[],
  height: number,
): string => {
  if (points.length === 0) return "";

  let path = createPath(points);
  const lastPoint = points[points.length - 1];
  const firstPoint = points[0];

  path += ` L${lastPoint.x},${height} L${firstPoint.x},${height} Z`;

  return path;
};

// Helper function to format numbers for display
const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + "M";
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + "K";
  }
  return num.toFixed(0);
};

// Animated SVG Components
const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = {
  data: ChartDataPoint[];
  config?: ChartConfig;
  style?: ViewStyle;
};

export const HomeLineChart = ({ data, config = {}, style }: Props) => {
  const [containerWidth, setContainerWidth] = useState(300);

  const {
    height = 200,
    padding = 20,
    showGrid = true,
    animated = true,
    duration = 1000,
    gradient = false,
    interactive = false,
    showYLabels = true,
    showXLabels = true,
    showDataPoints = false,
    yLabelCount = 5,
    yAxisWidth = 20,
  } = config;

  // Use measured width or fallback to config width or default
  const chartWidth = containerWidth || config.width || 300;

  const primaryColor = "rgba(208,159,154,0.8)";
  const mutedColor = "rgba(208,159,154,0.8)";

  const animationProgress = useSharedValue(0);
  const touchX = useSharedValue(0);
  const showTooltip = useSharedValue(false);

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width: measuredWidth } = event.nativeEvent.layout;
    if (measuredWidth > 0) {
      setContainerWidth(measuredWidth);
    }
  };

  useEffect(() => {
    if (animated) {
      animationProgress.value = withTiming(1, { duration });
    } else {
      animationProgress.value = 1;
    }
  }, [data, animated, duration]);

  if (!data.length) return null;

  const maxValue = Math.max(...data.map((d) => d.y));
  const minValue = Math.min(...data.map((d) => d.y));
  const valueRange = maxValue - minValue || 1;

  // Adjust padding to account for y-axis labels
  const leftPadding = showYLabels ? padding + yAxisWidth : padding;
  const innerChartWidth = chartWidth - leftPadding - padding;
  const chartHeight = height - padding * 2;

  // Convert data to screen coordinates
  const points = data.map((point, index) => ({
    x: leftPadding + (index / (data.length - 1)) * innerChartWidth,
    y: padding + ((maxValue - point.y) / valueRange) * chartHeight,
  }));

  const pathData = createPath(points);
  const areaPathData = gradient ? createAreaPath(points, height - padding) : "";

  // Generate y-axis labels
  const yAxisLabels = [];
  if (showYLabels) {
    for (let i = 0; i < yLabelCount; i++) {
      const ratio = i / (yLabelCount - 1);
      const value = maxValue - ratio * valueRange;
      const y = padding + ratio * chartHeight;
      yAxisLabels.push({ value, y });
    }
  }

  // Fixed animated props for SVG components
  const areaAnimatedProps = useAnimatedProps(() => ({
    strokeDasharray: animated
      ? `${animationProgress.value * 1000} 1000`
      : undefined,
  }));

  const lineAnimatedProps = useAnimatedProps(() => ({
    strokeDasharray: animated
      ? `${animationProgress.value * 1000} 1000`
      : undefined,
  }));

  // Pan gesture using new Gesture API
  const panGesture = Gesture.Pan()
    .onStart((event) => {
      if (interactive) {
        touchX.value = event.x;
        showTooltip.value = true;
      }
    })
    .onUpdate((event) => {
      if (interactive) {
        touchX.value = event.x;
      }
    })
    .onEnd(() => {
      if (interactive) {
        showTooltip.value = false;
      }
    });

  return (
    <View style={[{ width: "100%", height }, style]} onLayout={handleLayout}>
      <GestureDetector gesture={panGesture}>
        <Animated.View>
          <Svg width={chartWidth} height={height}>
            <Defs>
              {gradient && (
                <LinearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <Stop
                    offset="0%"
                    stopColor={primaryColor}
                    stopOpacity="0.3"
                  />
                  <Stop
                    offset="100%"
                    stopColor={primaryColor}
                    stopOpacity="0.05"
                  />
                </LinearGradient>
              )}
            </Defs>

            {/* Y-axis labels */}
            {showYLabels && (
              <G>
                {yAxisLabels.map((label, index) => (
                  <SvgText
                    key={`y-label-${index}`}
                    x={leftPadding - 10}
                    y={label.y + 4}
                    textAnchor="end"
                    fontSize={10}
                    fill={mutedColor}
                  >
                    {formatNumber(label.value)}
                  </SvgText>
                ))}
              </G>
            )}

            {/* Grid lines */}
            {showGrid && (
              <G>
                {/* Horizontal grid lines */}
                {yAxisLabels.map((label, index) => (
                  <Line
                    key={`grid-h-${index}`}
                    x1={leftPadding}
                    y1={label.y}
                    x2={chartWidth - padding}
                    y2={label.y}
                    stroke={mutedColor}
                    strokeWidth={0.5}
                    opacity={0.3}
                  />
                ))}

                {/* Vertical grid lines */}
                {points.map((point, index) => (
                  <Line
                    key={`grid-v-${index}`}
                    x1={point.x}
                    y1={padding}
                    x2={point.x}
                    y2={height - padding}
                    stroke={mutedColor}
                    strokeWidth={0.5}
                    opacity={0.2}
                  />
                ))}
              </G>
            )}

            {/* Area fill */}
            {gradient && (
              <AnimatedPath
                d={areaPathData}
                fill="url(#gradient)"
                animatedProps={areaAnimatedProps}
              />
            )}

            {/* Line path */}
            <AnimatedPath
              d={pathData}
              stroke={primaryColor}
              strokeWidth={2}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
              animatedProps={lineAnimatedProps}
            />

            {/* Data points */}
            {showDataPoints &&
              points.map((point, index) => (
                <Circle
                  key={`point-${index}`}
                  cx={point.x}
                  cy={point.y}
                  r={4}
                  fill={primaryColor}
                />
              ))}

            {/* X-axis labels */}
            {showXLabels && (
              <G>
                {data.map((point, index) => (
                  <SvgText
                    key={`x-label-${index}`}
                    x={points[index].x}
                    y={height - 5}
                    textAnchor="middle"
                    fontSize={10}
                    fill={mutedColor}
                  >
                    {point.label || point.x.toString()}
                  </SvgText>
                ))}
              </G>
            )}
          </Svg>
        </Animated.View>
      </GestureDetector>
    </View>
  );
};
