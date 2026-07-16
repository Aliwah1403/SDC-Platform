import { useEffect, useState } from "react";
import { LayoutChangeEvent, View, ViewStyle, Text as RNText } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
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
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";
import { fonts } from "@/utils/fonts";

export interface Zone {
  min: number;
  max: number;
  color: string;
  opacity: number;
}

export interface Threshold {
  value: number;
  color: string;
  dash?: boolean;
  weight?: number;
  label?: string;
}

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
  primaryColor?: string;
  zones?: Zone[];
  thresholds?: Threshold[];
  getPointColor?: (value: number) => string;
  yMin?: number;
  yMax?: number;
  renderTooltip?: (point: ChartDataPoint, index: number) => React.ReactNode;
}

export type ChartDataPoint = {
  x: string | number;
  y: number;
  label?: string;
  tooltipLabel?: string;
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

// Animated SVG Components
const AnimatedPath = Animated.createAnimatedComponent(Path);

type Props = {
  data: ChartDataPoint[];
  config?: ChartConfig;
  style?: ViewStyle;
};

export const HomeLineChart = ({ data, config = {}, style }: Props) => {
  const [containerWidth, setContainerWidth] = useState(300);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

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
    primaryColor = "rgba(208,159,154,0.8)",
    zones = [],
    thresholds = [],
    getPointColor,
    yMin,
    yMax,
    renderTooltip,
  } = config;

  // Use measured width or fallback to config width or default
  const chartWidth = containerWidth || config.width || 300;

  const mutedColor = "rgba(208,159,154,0.8)";

  const animationProgress = useSharedValue(0);

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

  const dataMax = Math.max(...data.map((d) => d.y));
  const dataMin = Math.min(...data.map((d) => d.y));
  const effectiveMax = yMax ?? dataMax;
  const effectiveMin = yMin ?? dataMin;
  const effectiveRange = effectiveMax - effectiveMin || 1;

  // Adjust padding to account for y-axis labels
  const leftPadding = showYLabels ? padding + yAxisWidth : padding;
  const innerChartWidth = chartWidth - leftPadding - padding;
  const chartHeight = height - padding * 2;

  const scaleY = (v: number) =>
    padding + ((effectiveMax - v) / effectiveRange) * chartHeight;

  // Convert data to screen coordinates
  const points = data.map((point, index) => ({
    x: leftPadding + (index / Math.max(data.length - 1, 1)) * innerChartWidth,
    y: scaleY(point.y),
  }));

  const pathData = createPath(points);
  const areaPathData = gradient ? createAreaPath(points, height - padding) : "";

  // Generate y-axis labels
  const yAxisLabels: { value: number; y: number }[] = [];
  if (showYLabels) {
    for (let i = 0; i < yLabelCount; i++) {
      const ratio = i / (yLabelCount - 1);
      const value = effectiveMax - ratio * effectiveRange;
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

  const updateActiveIndex = (x: number) => {
    if (points.length === 0) return;
    let nearest = 0;
    let nearestDist = Infinity;
    for (let i = 0; i < points.length; i++) {
      const dist = Math.abs(points[i].x - x);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    }
    setActiveIndex(nearest);
  };

  const clearActiveIndex = () => setActiveIndex(null);

  const panGesture = Gesture.Pan()
    .onStart((event) => {
      if (interactive) {
        runOnJS(updateActiveIndex)(event.x);
      }
    })
    .onUpdate((event) => {
      if (interactive) {
        runOnJS(updateActiveIndex)(event.x);
      }
    })
    .onEnd(() => {
      if (interactive) {
        runOnJS(clearActiveIndex)();
      }
    });

  const activePoint = activeIndex !== null ? points[activeIndex] : null;
  const activeDataPoint = activeIndex !== null ? data[activeIndex] : null;

  const tooltipWidth = 100;
  const tooltipLeft = activePoint
    ? Math.min(Math.max(activePoint.x - tooltipWidth / 2, 0), chartWidth - tooltipWidth)
    : 0;

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

            {/* Zone shading (drawn first, behind everything) */}
            {zones.length > 0 && (
              <G>
                {zones.map((zone, index) => {
                  const zMax = Math.min(zone.max, effectiveMax);
                  const zMin = Math.max(zone.min, effectiveMin);
                  if (zMax <= zMin) return null;
                  const yTop = scaleY(zMax);
                  const yBottom = scaleY(zMin);
                  return (
                    <Rect
                      key={`zone-${index}`}
                      x={leftPadding}
                      y={yTop}
                      width={innerChartWidth}
                      height={yBottom - yTop}
                      fill={zone.color}
                      opacity={zone.opacity}
                    />
                  );
                })}
              </G>
            )}

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
                    {label.value.toFixed(0)}
                  </SvgText>
                ))}
              </G>
            )}

            {/* Grid lines */}
            {showGrid && (
              <G>
                {/* Horizontal grid lines — nearly invisible per spec */}
                {yAxisLabels.map((label, index) => (
                  <Line
                    key={`grid-h-${index}`}
                    x1={leftPadding}
                    y1={label.y}
                    x2={chartWidth - padding}
                    y2={label.y}
                    stroke={mutedColor}
                    strokeWidth={0.5}
                    opacity={0.08}
                  />
                ))}
              </G>
            )}

            {/* Threshold lines */}
            {thresholds.map((th, index) => {
              const y = scaleY(th.value);
              return (
                <G key={`threshold-${index}`}>
                  <Line
                    x1={leftPadding}
                    y1={y}
                    x2={chartWidth - padding}
                    y2={y}
                    stroke={th.color}
                    strokeWidth={th.weight ?? 1}
                    strokeDasharray={th.dash === false ? undefined : "4,4"}
                    opacity={0.85}
                  />
                  {th.label && (
                    <SvgText
                      x={chartWidth - padding}
                      y={y - 4}
                      textAnchor="end"
                      fontSize={9}
                      fill={th.color}
                    >
                      {th.label}
                    </SvgText>
                  )}
                </G>
              );
            })}

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
                  r={5}
                  fill={getPointColor ? getPointColor(data[index].y) : primaryColor}
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                />
              ))}

            {/* Scrub indicator */}
            {interactive && activePoint && (
              <G>
                <Line
                  x1={activePoint.x}
                  y1={padding}
                  x2={activePoint.x}
                  y2={height - padding}
                  stroke={mutedColor}
                  strokeWidth={1}
                  opacity={0.3}
                />
                <Circle
                  cx={activePoint.x}
                  cy={activePoint.y}
                  r={6}
                  fill={getPointColor ? getPointColor(activeDataPoint!.y) : primaryColor}
                  stroke="#FFFFFF"
                  strokeWidth={2}
                />
              </G>
            )}

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

          {/* Floating tooltip */}
          {interactive && activeDataPoint && (
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
                renderTooltip(activeDataPoint, activeIndex!)
              ) : (
                <RNText style={{ color: "#fff", fontSize: 12, fontFamily: fonts.bold }}>
                  {activeDataPoint.tooltipLabel || activeDataPoint.label} · {activeDataPoint.y}
                </RNText>
              )}
            </View>
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
};
