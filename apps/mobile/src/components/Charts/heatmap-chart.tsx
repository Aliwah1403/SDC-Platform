import { useEffect, useState } from "react";
import { LayoutChangeEvent, View, ViewStyle, Text as RNText } from "react-native";
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, { G, Rect, Text as SvgText } from "react-native-svg";

const AnimatedRect = Animated.createAnimatedComponent(Rect);

export type HeatmapDataPoint = {
  date: Date;
  value: number | null;
};

interface ChartConfig {
  width?: number;
  height?: number;
  cellGap?: number;
  colorScale?: string[];
  minValue?: number;
  maxValue?: number;
  emptyColor?: string;
  animated?: boolean;
  duration?: number;
  showDayLabels?: boolean;
  showWeekLabels?: boolean;
  renderTooltip?: (point: HeatmapDataPoint, index: number) => React.ReactNode;
}

type Props = {
  data: HeatmapDataPoint[];
  config?: ChartConfig;
  style?: ViewStyle;
};

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function dateKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return {
    r: (bigint >> 16) & 255,
    g: (bigint >> 8) & 255,
    b: bigint & 255,
  };
}

function lerpColor(c1: string, c2: string, t: number): string {
  const a = hexToRgb(c1);
  const b = hexToRgb(c2);
  const r = Math.round(a.r + (b.r - a.r) * t);
  const g = Math.round(a.g + (b.g - a.g) * t);
  const bl = Math.round(a.b + (b.b - a.b) * t);
  return `rgb(${r},${g},${bl})`;
}

function colorForValue(
  value: number,
  colorScale: string[],
  minValue: number,
  maxValue: number,
): string {
  const range = maxValue - minValue || 1;
  const ratio = Math.min(Math.max((value - minValue) / range, 0), 1);
  const scaled = ratio * (colorScale.length - 1);
  const i = Math.floor(scaled);
  const frac = scaled - i;
  const c1 = colorScale[Math.min(i, colorScale.length - 1)];
  const c2 = colorScale[Math.min(i + 1, colorScale.length - 1)];
  return lerpColor(c1, c2, frac);
}

export const HeatmapChart = ({ data, config = {}, style }: Props) => {
  const [containerWidth, setContainerWidth] = useState(300);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const {
    height = 220,
    cellGap = 4,
    colorScale = ["#10B981", "#A7F3D0", "#FDE047", "#F59E0B", "#EF4444", "#7F1D1D"],
    minValue = 0,
    maxValue = 10,
    emptyColor = "#F0E4E1",
    animated = true,
    duration = 300,
    showDayLabels = true,
    showWeekLabels = true,
    renderTooltip,
  } = config;

  const handleLayout = (event: LayoutChangeEvent) => {
    const { width: measuredWidth } = event.nativeEvent.layout;
    if (measuredWidth > 0) {
      setContainerWidth(measuredWidth);
    }
  };

  if (!data.length) return null;

  const gridStart = startOfWeekMonday(data[0].date);
  const lastDate = data[data.length - 1].date;
  const daysSinceStart = Math.ceil(
    (lastDate.getTime() - gridStart.getTime()) / (1000 * 60 * 60 * 24),
  ) + 1;
  const rows = Math.ceil(daysSinceStart / 7);

  const valueByDate = new Map<string, number | null>();
  data.forEach((d) => valueByDate.set(dateKey(d.date), d.value));

  const weekLabelWidth = showWeekLabels ? 24 : 0;
  const dayLabelHeight = showDayLabels ? 18 : 0;
  const gridWidth = containerWidth - weekLabelWidth;
  const gridHeight = height - dayLabelHeight;
  const cellSize = Math.min(
    (gridWidth - cellGap * 6) / 7,
    (gridHeight - cellGap * (rows - 1)) / rows,
  );

  const cells: { row: number; col: number; date: Date; value: number | null }[] = [];
  for (let i = 0; i < rows * 7; i++) {
    const cellDate = new Date(gridStart);
    cellDate.setDate(cellDate.getDate() + i);
    const inRange = cellDate >= data[0].date && cellDate <= lastDate;
    const value = inRange ? valueByDate.get(dateKey(cellDate)) ?? null : null;
    cells.push({
      row: Math.floor(i / 7),
      col: i % 7,
      date: cellDate,
      value: inRange ? value : null,
    });
  }

  const activeCell = activeIndex !== null ? cells[activeIndex] : null;
  const tooltipWidth = 100;
  const tooltipLeft = activeCell
    ? Math.min(
        Math.max(
          weekLabelWidth + activeCell.col * (cellSize + cellGap) + cellSize / 2 - tooltipWidth / 2,
          0,
        ),
        containerWidth - tooltipWidth,
      )
    : 0;
  const tooltipTop = activeCell ? activeCell.row * (cellSize + cellGap) : 0;

  return (
    <View style={[{ width: "100%", height }, style]} onLayout={handleLayout}>
      <Svg width={containerWidth} height={gridHeight}>
        {showWeekLabels && (
          <G>
            {Array.from({ length: rows }).map((_, row) => (
              <SvgText
                key={`week-${row}`}
                x={12}
                y={row * (cellSize + cellGap) + cellSize / 2 + 4}
                textAnchor="middle"
                fontSize={9}
                fill="rgba(107,107,107,0.7)"
              >
                {`W${row + 1}`}
              </SvgText>
            ))}
          </G>
        )}

        {cells.map((cell, index) => {
          const x = weekLabelWidth + cell.col * (cellSize + cellGap);
          const y = cell.row * (cellSize + cellGap);
          const fill = cell.value == null
            ? emptyColor
            : colorForValue(cell.value, colorScale, minValue, maxValue);
          const delay = (cell.row * 7 + cell.col) * 30;

          return (
            <HeatmapCell
              key={`cell-${index}`}
              x={x}
              y={y}
              size={cellSize}
              fill={fill}
              delay={delay}
              animated={animated}
              duration={duration}
              onPress={() => setActiveIndex(activeIndex === index ? null : index)}
            />
          );
        })}
      </Svg>

      {showDayLabels && (
        <Svg width={containerWidth} height={dayLabelHeight}>
          {DAY_LABELS.map((label, col) => (
            <SvgText
              key={`day-${col}`}
              x={weekLabelWidth + col * (cellSize + cellGap) + cellSize / 2}
              y={dayLabelHeight - 4}
              textAnchor="middle"
              fontSize={9}
              fill="rgba(107,107,107,0.7)"
            >
              {label}
            </SvgText>
          ))}
        </Svg>
      )}

      {activeCell && (
        <View
          pointerEvents="none"
          style={{
            position: "absolute",
            left: tooltipLeft,
            top: tooltipTop,
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
            renderTooltip(activeCell as HeatmapDataPoint, activeIndex!)
          ) : (
            <RNText style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
              {activeCell.date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
              {activeCell.value != null ? ` · ${activeCell.value}` : ""}
            </RNText>
          )}
        </View>
      )}
    </View>
  );
};

function HeatmapCell({
  x,
  y,
  size,
  fill,
  delay,
  animated,
  duration,
  onPress,
}: {
  x: number;
  y: number;
  size: number;
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

  const cx = x + size / 2;
  const cy = y + size / 2;

  const animatedProps = useAnimatedProps(() => {
    const scale = 0.6 + progress.value * 0.4;
    const scaledSize = size * scale;
    return {
      x: cx - scaledSize / 2,
      y: cy - scaledSize / 2,
      width: scaledSize,
      height: scaledSize,
      opacity: progress.value,
    };
  });

  return (
    <AnimatedRect
      rx={Math.min(6, size / 4)}
      fill={fill}
      animatedProps={animatedProps}
      onPress={onPress}
    />
  );
}
