import { useEffect, useState } from "react";
import { LayoutChangeEvent, View, ViewStyle, Text as RNText } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Svg, { G, Line, Rect, Text as SvgText } from "react-native-svg";

// Animated SVG Components
const AnimatedRect = Animated.createAnimatedComponent(Rect);

interface GoalBand {
  min: number;
  max: number;
}

interface ChartConfig {
  width?: number;
  height?: number;
  padding?: number;
  showGrid?: boolean;
  showLabels?: boolean;
  animated?: boolean;
  duration?: number;
  getBarColor?: (value: number, index: number) => string;
  referenceValue?: number;
  referenceColor?: string;
  goalBand?: GoalBand;
  goalBandColor?: string;
  yMin?: number;
  yMax?: number;
  renderTooltip?: (item: ChartDataPoint, index: number) => React.ReactNode;
}

export type ChartDataPoint = {
  label: string;
  value: number;
  color?: string;
  tooltipLabel?: string;
};

type Props = {
  data: ChartDataPoint[];
  config?: ChartConfig;
  style?: ViewStyle;
};

export const BarChart = ({ data, config = {}, style }: Props) => {
  const [containerWidth, setContainerWidth] = useState(300);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const {
    height = 200,
    padding = 20,
    showLabels = true,
    animated = true,
    duration = 800,
    getBarColor,
    referenceValue,
    referenceColor = "#A9334D",
    goalBand,
    goalBandColor = "#6366F1",
    yMin,
    yMax,
    renderTooltip,
  } = config;

  // Use measured width or fallback to config width or default
  const chartWidth = containerWidth || config.width || 300;

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

  const dataMax = Math.max(...data.map((d) => d.value));
  const effectiveMax = yMax ?? (dataMax || 1);
  const effectiveMin = yMin ?? 0;
  const effectiveRange = effectiveMax - effectiveMin || 1;

  const innerChartWidth = chartWidth - padding * 2;
  const chartHeight = height - padding * 2;
  const barWidth = (innerChartWidth / data.length) * 0.8;
  const barSpacing = (innerChartWidth / data.length) * 0.2;

  const scaleY = (v: number) =>
    padding + chartHeight - ((v - effectiveMin) / effectiveRange) * chartHeight;

  const baselineY = scaleY(effectiveMin);

  const activeItem = activeIndex !== null ? data[activeIndex] : null;
  const tooltipWidth = 100;
  const activeX = activeIndex !== null
    ? padding + activeIndex * (barWidth + barSpacing) + barSpacing / 2 + barWidth / 2
    : 0;
  const tooltipLeft = Math.min(Math.max(activeX - tooltipWidth / 2, 0), chartWidth - tooltipWidth);

  return (
    <View style={[{ width: "100%", height }, style]} onLayout={handleLayout}>
      <Svg width={chartWidth} height={height}>
        {/* Goal band shading (drawn behind bars) */}
        {goalBand && (() => {
          const bMax = Math.min(goalBand.max, effectiveMax);
          const bMin = Math.max(goalBand.min, effectiveMin);
          if (bMax <= bMin) return null;
          const yTop = scaleY(bMax);
          const yBottom = scaleY(bMin);
          return (
            <Rect
              x={padding}
              y={yTop}
              width={innerChartWidth}
              height={yBottom - yTop}
              fill={goalBandColor}
              opacity={0.1}
            />
          );
        })()}

        {data.map((item, index) => {
          const barHeight = ((item.value - effectiveMin) / effectiveRange) * chartHeight;
          const x = padding + index * (barWidth + barSpacing) + barSpacing / 2;
          const y = baselineY - barHeight;
          const color = getBarColor ? getBarColor(item.value, index) : item.color;

          const barAnimatedProps = useAnimatedProps(() => ({
            height: animationProgress.value * barHeight,
            y: baselineY - animationProgress.value * barHeight,
          }));

          return (
            <G key={`bar-${index}`}>
              <AnimatedRect
                x={x}
                width={barWidth}
                fill={color}
                rx={4}
                animatedProps={barAnimatedProps}
                onPress={() => setActiveIndex(activeIndex === index ? null : index)}
              />

              {showLabels && (
                <SvgText
                  x={x + barWidth / 2}
                  y={height - 5}
                  textAnchor="middle"
                  fontSize={10}
                  fill="rgba(107,107,107,0.7)"
                >
                  {item.label}
                </SvgText>
              )}
            </G>
          );
        })}

        {/* Reference line (goal) */}
        {referenceValue != null && (
          <Line
            x1={padding}
            y1={scaleY(referenceValue)}
            x2={chartWidth - padding}
            y2={scaleY(referenceValue)}
            stroke={referenceColor}
            strokeWidth={1.5}
            strokeDasharray="4,4"
            opacity={0.7}
          />
        )}
      </Svg>

      {/* Tap tooltip */}
      {activeItem && (
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
            renderTooltip(activeItem, activeIndex!)
          ) : (
            <RNText style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
              {activeItem.tooltipLabel || activeItem.label} · {activeItem.value}
            </RNText>
          )}
        </View>
      )}
    </View>
  );
};
