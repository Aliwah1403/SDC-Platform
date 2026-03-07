import { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LineChart, BarChart } from "react-native-gifted-charts";
import { MotiView } from "moti";
import {
  ChevronLeft,
  Settings,
  AlignLeft,
  TrendingUp,
  Zap,
  Droplets,
  Smile,
  Activity,
  Moon,
  Heart,
} from "lucide-react-native";
import { useAppStore } from "@/store/appStore";
import { fonts } from "@/utils/fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
// scrollview pad 20*2 + card pad 20*2 + yAxisLabelWidth 24 - marginLeft offset 8 = 96
const CHART_WIDTH = SCREEN_WIDTH - 96;

function dateToStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const METRIC_META = {
  pain: {
    label: "Pain Level",
    icon: Zap,
    color: "#DC2626",
    max: 10,
    rangeMin: 0,
    rangeMax: 10,
    chartType: "line",
    dataField: "painLevel",
    hasGoal: false,
    lowerIsBetter: true,
    aboutTitle: "Your body's daily distress signal",
    about: "Pain management is central to living with sickle cell disease. Tracking your pain daily helps you and your care team identify triggers, monitor trends, and adjust your treatment plan. Consistent logging — even on pain-free days — gives the most accurate picture of your health over time.",
  },
  hydration: {
    label: "Hydration",
    icon: Droplets,
    color: "#3B82F6",
    max: 16,
    rangeMin: 0,
    rangeMax: 16,
    chartType: "bar",
    dataField: "hydration",
    hasGoal: true,
    lowerIsBetter: false,
    aboutTitle: "The key to preventing a pain crisis",
    about: "Staying well hydrated is one of the most important things you can do to manage SCD. Dehydration is a major trigger for pain crises — it causes red blood cells to sickle more easily. Aim for at least 8 glasses of water per day, and increase this when it's hot or when you're physically active.",
    unit: "glasses",
  },
  mood: {
    label: "Mood",
    icon: Smile,
    color: "#7C3AED",
    max: 5,
    rangeMin: 1,
    rangeMax: 5,
    chartType: "line",
    dataField: "mood",
    hasGoal: false,
    lowerIsBetter: false,
    aboutTitle: "Your emotional wellbeing over time",
    about: "Mental and emotional wellbeing is deeply connected to physical health in SCD. Chronic pain, fatigue, and treatment demands can significantly affect mood. Tracking how you feel emotionally helps identify patterns and informs conversations with your care team about mental health support.",
  },
  steps: {
    label: "Steps",
    icon: Activity,
    color: "#059669",
    max: 15000,
    rangeMin: 0,
    rangeMax: 15000,
    chartType: "bar",
    dataField: "steps",
    hasGoal: true,
    lowerIsBetter: false,
    aboutTitle: "A passive measure of your daily activity",
    about: "Light to moderate physical activity can help improve circulation and overall wellbeing with SCD. However, over-exertion is a known crisis trigger. Step counting from Apple Health gives you a passive measure of your daily activity level to help you find your safe, sustainable range.",
    unit: "steps",
  },
  sleep: {
    label: "Sleep",
    icon: Moon,
    color: "#6366F1",
    max: 12,
    rangeMin: 0,
    rangeMax: 12,
    chartType: "bar",
    dataField: "sleepHours",
    hasGoal: true,
    lowerIsBetter: false,
    aboutTitle: "Recovery and repair while you rest",
    about: "Quality sleep is essential for immune function and pain recovery in SCD. Poor sleep can amplify pain perception and increase the likelihood of a crisis. Apple Health tracks your nightly sleep duration automatically — aim for 7–9 hours, and flag consistently poor nights to your doctor.",
    unit: "h",
  },
  heartrate: {
    label: "Heart Rate",
    icon: Heart,
    color: "#EF4444",
    max: 120,
    rangeMin: 40,
    rangeMax: 120,
    chartType: "line",
    dataField: "heartRate",
    hasGoal: false,
    lowerIsBetter: false,
    aboutTitle: "How hard your heart is working each day",
    about: "Heart rate data from Apple Health reflects your cardiovascular activity throughout the day. People with SCD often have a higher resting heart rate due to anaemia — the heart works harder to compensate for reduced oxygen-carrying capacity. Sudden spikes may correlate with pain episodes or illness.",
    unit: "bpm",
  },
};

function getLastNDays(healthData, field, n) {
  const today = new Date();
  const result = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const entry = healthData.find((d) => d.date === dateToStr(date));
    result.push({ date, value: entry?.[field] ?? 0 });
  }
  return result;
}

function calcTrendDelta(data) {
  const logged = data.filter((d) => d.value > 0);
  if (logged.length < 2) return null;
  const half = Math.floor(logged.length / 2);
  const firstAvg = logged.slice(0, half).reduce((s, d) => s + d.value, 0) / half;
  const secondAvg = logged.slice(half).reduce((s, d) => s + d.value, 0) / (logged.length - half);
  return secondAvg - firstAvg;
}

function getStatus(metricKey, value) {
  if (!value) return null;
  switch (metricKey) {
    case "pain":
      if (value <= 2) return { label: "Low", color: "#059669" };
      if (value <= 5) return { label: "Moderate", color: "#F59E0B" };
      return { label: "High", color: "#DC2626" };
    case "hydration":
      if (value >= 8) return { label: "On track", color: "#059669" };
      if (value >= 5) return { label: "Fair", color: "#F59E0B" };
      return { label: "Low", color: "#DC2626" };
    case "mood":
      if (value >= 4) return { label: "Great", color: "#059669" };
      if (value >= 3) return { label: "Good", color: "#059669" };
      if (value >= 2) return { label: "Okay", color: "#F59E0B" };
      return { label: "Low", color: "#DC2626" };
    case "steps":
      if (value >= 8000) return { label: "Active", color: "#059669" };
      if (value >= 5000) return { label: "Moderate", color: "#F59E0B" };
      return { label: "Low", color: "#EF4444" };
    case "sleep":
      if (value >= 8) return { label: "Great", color: "#059669" };
      if (value >= 7) return { label: "Good", color: "#059669" };
      if (value >= 6) return { label: "Fair", color: "#F59E0B" };
      return { label: "Low", color: "#DC2626" };
    case "heartrate":
      if (value >= 60 && value <= 100) return { label: "Normal", color: "#059669" };
      if (value > 100) return { label: "Elevated", color: "#DC2626" };
      return { label: "Low", color: "#F59E0B" };
    default:
      return null;
  }
}

// ─── Dot Range Indicator ─────────────────────────────────────────────────────

function DotRange({ value, rangeMin, rangeMax, color }) {
  const DOTS = 36;
  if (!value) return null;
  const clamped = Math.min(Math.max(value, rangeMin), rangeMax);
  const position = (clamped - rangeMin) / (rangeMax - rangeMin);
  const activeIndex = Math.round(position * (DOTS - 1));

  return (
    <View style={{ marginTop: 20 }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 3 }}>
        {Array.from({ length: DOTS }).map((_, i) => {
          const isFilled = i <= activeIndex;
          const isCurrent = i === activeIndex;
          const progress = isFilled ? i / Math.max(activeIndex, 1) : 0;
          return (
            <View
              key={i}
              style={{
                width: isCurrent ? 10 : 7,
                height: isCurrent ? 10 : 7,
                borderRadius: 999,
                backgroundColor: isFilled ? color : "#E5E7EB",
                opacity: isFilled ? (0.3 + progress * 0.7) : 1,
              }}
            />
          );
        })}
      </View>
      <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
        <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: "#9CA3AF" }}>{rangeMin}</Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: "#9CA3AF" }}>{rangeMax}</Text>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MetricDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { metric } = useLocalSearchParams();
  const { healthData, metricGoals } = useAppStore();

  const meta = METRIC_META[metric] ?? METRIC_META.pain;
  const [range, setRange] = useState(30);

  const goal = meta.hasGoal ? (metricGoals[metric] ?? null) : null;

  const data = useMemo(
    () => getLastNDays(healthData, meta.dataField, range),
    [healthData, meta.dataField, range]
  );

  const latestEntry = [...data].reverse().find((d) => d.value > 0);
  const currentValue = latestEntry?.value ?? null;

  const currentDisplay = currentValue != null
    ? (metric === "sleep"
        ? currentValue.toFixed(1)
        : metric === "steps" && currentValue >= 1000
          ? `${(currentValue / 1000).toFixed(1)}k`
          : String(currentValue))
    : "—";

  const status = currentValue != null ? getStatus(metric, currentValue) : null;
  const trendDelta = useMemo(() => calcTrendDelta(data), [data]);

  const startDate = data[0]?.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endDate = data[data.length - 1]?.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const giftedData = data.map((d, i) => ({
    value: d.value,
    label: i % Math.ceil(range / 6) === 0 ? d.date.getDate().toString() : "",
    tooltipLabel: d.date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    labelTextStyle: { color: "#9CA3AF", fontSize: 9 },
    ...(meta.chartType === "bar" && {
      frontColor: goal && d.value >= goal ? meta.color : meta.color + "88",
    }),
  }));

  const IconComp = meta.icon;

  return (
    <View style={{ flex: 1, backgroundColor: "#F9F9F7" }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + 8,
        paddingBottom: 12,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#F9F9F7",
      }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: "#EFEFED",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <ChevronLeft size={20} color="#1F2937" strokeWidth={2} />
        </TouchableOpacity>

        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: "#1F2937" }}>
            {meta.label}
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#9CA3AF" }}>
            Last {range} days
          </Text>
        </View>

        {meta.hasGoal ? (
          <TouchableOpacity
            onPress={() => router.push(`/metric-goal?metric=${metric}`)}
            style={{
              width: 36, height: 36, borderRadius: 18,
              backgroundColor: "#EFEFED",
              alignItems: "center", justifyContent: "center",
            }}
          >
            <Settings size={18} color="#1F2937" strokeWidth={2} />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 48 }}
      >
        {/* ── Value Section ──────────────────────────────── */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 280 }}
          style={{ marginBottom: 24 }}
        >
          {/* Range toggle */}
          <View style={{ flexDirection: "row", gap: 6, marginBottom: 20 }}>
            {[7, 30].map((r) => (
              <TouchableOpacity
                key={r}
                onPress={() => setRange(r)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                  borderRadius: 20,
                  backgroundColor: range === r ? "#1F2937" : "#EFEFED",
                }}
              >
                <Text style={{
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  color: range === r ? "#fff" : "#9CA3AF",
                }}>
                  {r}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Big value */}
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 6 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 64, color: "#1F2937", lineHeight: 70 }}>
              {currentDisplay}
            </Text>
            {currentValue != null && meta.unit && (
              <Text style={{ fontFamily: fonts.medium, fontSize: 22, color: "#9CA3AF", marginBottom: 6 }}>
                {meta.unit}
              </Text>
            )}
          </View>

          {/* Status badge */}
          {status && (
            <View style={{
              alignSelf: "flex-start",
              borderRadius: 20,
              borderWidth: 1.5,
              borderColor: status.color,
              paddingHorizontal: 14,
              paddingVertical: 5,
              marginTop: 8,
            }}>
              <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: status.color }}>
                {status.label}
              </Text>
            </View>
          )}

          {/* Dot range */}
          <DotRange
            value={currentValue}
            rangeMin={meta.rangeMin}
            rangeMax={meta.rangeMax}
            color={meta.color}
          />
        </MotiView>

        {/* ── About Section ──────────────────────────────── */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 80, type: "timing", duration: 280 }}
          style={{
            backgroundColor: "#fff",
            borderRadius: 20,
            padding: 20,
            marginBottom: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          {/* Section label */}
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <AlignLeft size={13} color="#9CA3AF" strokeWidth={2} />
            <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: "#9CA3AF", letterSpacing: 1, textTransform: "uppercase" }}>
              About
            </Text>
          </View>
          <Text style={{ fontFamily: fonts.bold, fontSize: 18, color: "#1F2937", lineHeight: 26, marginBottom: 10 }}>
            {meta.aboutTitle}
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: "#6B7280", lineHeight: 22 }}>
            {meta.about}
          </Text>
        </MotiView>

        {/* ── Trend Section ──────────────────────────────── */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 160, type: "timing", duration: 280 }}
          style={{
            backgroundColor: "#fff",
            borderRadius: 20,
            padding: 20,
            marginBottom: 14,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          {/* Section label row */}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <TrendingUp size={13} color="#9CA3AF" strokeWidth={2} />
              <Text style={{ fontFamily: fonts.semibold, fontSize: 11, color: "#9CA3AF", letterSpacing: 1, textTransform: "uppercase" }}>
                Trend
              </Text>
            </View>
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#9CA3AF" }}>
              {startDate} – {endDate}
            </Text>
          </View>

          {/* Trend delta */}
          {trendDelta !== null && (
            <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginBottom: 16 }}>
              <Text style={{
                fontFamily: fonts.bold,
                fontSize: 28,
                color: trendDelta > 0
                  ? (meta.lowerIsBetter ? "#DC2626" : "#059669")
                  : (meta.lowerIsBetter ? "#059669" : "#DC2626"),
              }}>
                {trendDelta > 0 ? "▲" : "▼"} {Math.abs(trendDelta).toFixed(1)}
              </Text>
              {meta.unit && (
                <Text style={{ fontFamily: fonts.medium, fontSize: 15, color: "#9CA3AF" }}>
                  {meta.unit}
                </Text>
              )}
            </View>
          )}

          {/* Chart */}
          <View style={{ marginLeft: -8 }}>
            {meta.chartType === "line" ? (
              <LineChart
                data={giftedData}
                width={CHART_WIDTH}
                height={180}
                color={meta.color}
                thickness={2}
                curved
                dataPointsColor={meta.color}
                dataPointsRadius={3}
                noOfSections={4}
                maxValue={meta.max}
                yAxisColor="transparent"
                xAxisColor="#E5E7EB"
                rulesColor="#F3F4F6"
                rulesType="solid"
                initialSpacing={8}
                spacing={Math.max(4, Math.floor(CHART_WIDTH / (range + 2)))}
                yAxisTextStyle={{ color: "#9CA3AF", fontSize: 9 }}
                backgroundColor="transparent"
                yAxisLabelWidth={24}
                pointerConfig={{
                  pointerStripHeight: 180,
                  pointerStripColor: meta.color + "28",
                  pointerStripWidth: 1.5,
                  pointerColor: meta.color,
                  radius: 5,
                  pointerLabelWidth: 90,
                  pointerLabelHeight: 46,
                  activatePointersInstantlyOnTouch: true,
                  autoAdjustPointerLabelPosition: true,
                  pointerLabelComponent: (items) => {
                    const item = items[0];
                    if (!item) return null;
                    const dv = metric === "sleep"
                      ? `${item.value}h`
                      : metric === "steps" && item.value >= 1000
                        ? `${(item.value / 1000).toFixed(1)}k`
                        : String(item.value);
                    return (
                      <View style={{
                        backgroundColor: "#1F2937", borderRadius: 10,
                        paddingHorizontal: 10, paddingVertical: 7,
                        alignItems: "center",
                        shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 4, elevation: 4,
                      }}>
                        <Text style={{ fontFamily: fonts.bold, fontSize: 15, color: "#fff" }}>
                          {dv}{meta.unit ? ` ${meta.unit}` : ""}
                        </Text>
                        <Text style={{ fontFamily: fonts.regular, fontSize: 10, color: "rgba(255,255,255,0.6)", marginTop: 1 }}>
                          {item.tooltipLabel}
                        </Text>
                      </View>
                    );
                  },
                }}
              />
            ) : (
              <BarChart
                data={giftedData}
                width={CHART_WIDTH}
                height={180}
                noOfSections={4}
                maxValue={meta.max}
                yAxisColor="transparent"
                xAxisColor="#E5E7EB"
                rulesColor="#F3F4F6"
                initialSpacing={8}
                barWidth={Math.max(4, Math.floor(CHART_WIDTH / (range * 1.6)))}
                spacing={Math.max(2, Math.floor(CHART_WIDTH / (range * 3)))}
                yAxisTextStyle={{ color: "#9CA3AF", fontSize: 9 }}
                backgroundColor="transparent"
                yAxisLabelWidth={24}
                roundedTop
                showReferenceLine1={!!goal}
                referenceLine1Position={goal ?? 0}
                referenceLine1Config={{ color: meta.color, dashWidth: 4, dashGap: 4, thickness: 1.5, opacity: 0.6 }}
                focusBarOnPress
                focusedBarConfig={{ color: meta.color, borderRadius: 6, borderTopLeftRadius: 6, borderTopRightRadius: 6 }}
                renderTooltip={(item) => {
                  if (!item?.value) return null;
                  const dv = metric === "steps" && item.value >= 1000
                    ? `${(item.value / 1000).toFixed(1)}k`
                    : String(item.value);
                  return (
                    <View style={{
                      backgroundColor: "#1F2937", borderRadius: 8,
                      paddingHorizontal: 8, paddingVertical: 5,
                      marginBottom: 4, alignItems: "center",
                    }}>
                      <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: "#fff" }}>
                        {dv}{meta.unit ? ` ${meta.unit}` : ""}
                      </Text>
                    </View>
                  );
                }}
              />
            )}
          </View>

          {goal && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10 }}>
              <View style={{ width: 18, height: 2, backgroundColor: meta.color, opacity: 0.6 }} />
              <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: "#9CA3AF" }}>
                Daily goal ({goal} {meta.unit ?? ""})
              </Text>
            </View>
          )}
        </MotiView>
      </ScrollView>
    </View>
  );
}
