import { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { LineChart, BarChart } from "react-native-gifted-charts";
import { MotiView } from "moti";
import {
  ChevronLeft,
  Zap,
  Droplets,
  Smile,
  Activity,
  Moon,
  Heart,
  Minus,
  Plus,
  TrendingUp,
  TrendingDown,
} from "lucide-react-native";
import { useAppStore } from "@/store/appStore";
import { fonts } from "@/utils/fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CHART_WIDTH = SCREEN_WIDTH - 72;
const DARK_TEXT = "#781D11";

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
    bgColor: "#FEE2E2",
    unit: "/10",
    unitSuffix: "",
    max: 10,
    chartType: "line",
    dataField: "painLevel",
    hasGoal: false,
    lowerIsBetter: true,
    about:
      "Pain management is central to living with sickle cell disease. Tracking your pain daily helps you and your care team identify triggers, monitor trends, and adjust your treatment plan. Consistent logging — even on pain-free days — gives the most accurate picture of your health over time.",
  },
  hydration: {
    label: "Hydration",
    icon: Droplets,
    color: "#3B82F6",
    bgColor: "#DBEAFE",
    unit: " glasses",
    unitSuffix: "glasses",
    max: 16,
    chartType: "bar",
    dataField: "hydration",
    hasGoal: true,
    defaultGoal: 8,
    lowerIsBetter: false,
    about:
      "Staying well hydrated is one of the most important things you can do to manage SCD. Dehydration is a major trigger for pain crises — it causes red blood cells to sickle more easily. Aim for at least 8 glasses of water per day, and increase this when it's hot or when you're physically active.",
  },
  mood: {
    label: "Mood",
    icon: Smile,
    color: "#7C3AED",
    bgColor: "#EDE9FE",
    unit: "",
    unitSuffix: "",
    max: 5,
    chartType: "line",
    dataField: "mood",
    hasGoal: false,
    lowerIsBetter: false,
    about:
      "Mental and emotional wellbeing is deeply connected to physical health in SCD. Chronic pain, fatigue, and treatment demands can significantly affect mood. Tracking how you feel emotionally helps identify patterns and informs conversations with your care team about mental health support.",
  },
  steps: {
    label: "Steps",
    icon: Activity,
    color: "#059669",
    bgColor: "#D1FAE5",
    unit: " steps",
    unitSuffix: "steps",
    max: 15000,
    chartType: "bar",
    dataField: "steps",
    hasGoal: true,
    defaultGoal: 10000,
    lowerIsBetter: false,
    about:
      "Light to moderate physical activity can help improve circulation and overall wellbeing with SCD. However, over-exertion is a known crisis trigger. Step counting from Apple Health gives you a passive measure of your daily activity level to help you find your safe, sustainable range.",
  },
  sleep: {
    label: "Sleep",
    icon: Moon,
    color: "#6366F1",
    bgColor: "#E0E7FF",
    unit: "h",
    unitSuffix: "hours",
    max: 12,
    chartType: "bar",
    dataField: "sleepHours",
    hasGoal: true,
    defaultGoal: 8,
    lowerIsBetter: false,
    about:
      "Quality sleep is essential for immune function and pain recovery in SCD. Poor sleep can amplify pain perception and increase the likelihood of a crisis. Apple Health tracks your nightly sleep duration automatically — aim for 7–9 hours, and flag consistently poor nights to your doctor.",
  },
  heartrate: {
    label: "Heart Rate",
    icon: Heart,
    color: "#EF4444",
    bgColor: "#FEE2E2",
    unit: " bpm",
    unitSuffix: "bpm",
    max: 120,
    chartType: "line",
    dataField: "heartRate",
    hasGoal: false,
    lowerIsBetter: false,
    about:
      "Heart rate data from Apple Health reflects your cardiovascular activity throughout the day. People with SCD often have a higher resting heart rate due to anaemia — the heart works harder to compensate for reduced oxygen-carrying capacity. Sudden spikes may correlate with pain episodes or illness.",
  },
};

function getLastNDays(healthData, field, n) {
  const today = new Date();
  const result = [];
  for (let i = n - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = dateToStr(date);
    const entry = healthData.find((d) => d.date === dateStr);
    result.push({ date, value: entry?.[field] ?? 0 });
  }
  return result;
}

function calcStats(data, goal, lowerIsBetter) {
  const logged = data.filter((d) => d.value > 0);
  if (logged.length === 0) return { avg: 0, entries: 0, trend: 0, atGoal: 0 };
  const avg = logged.reduce((s, d) => s + d.value, 0) / logged.length;
  const half = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, half).filter((d) => d.value > 0);
  const secondHalf = data.slice(half).filter((d) => d.value > 0);
  const firstAvg = firstHalf.length ? firstHalf.reduce((s, d) => s + d.value, 0) / firstHalf.length : avg;
  const secondAvg = secondHalf.length ? secondHalf.reduce((s, d) => s + d.value, 0) / secondHalf.length : avg;
  const rawTrend = firstAvg > 0 ? ((secondAvg - firstAvg) / firstAvg) * 100 : 0;
  const trend = lowerIsBetter ? -rawTrend : rawTrend;
  const atGoal = goal ? logged.filter((d) => (lowerIsBetter ? d.value <= goal : d.value >= goal)).length : 0;
  return { avg: avg.toFixed(1), entries: logged.length, trend: Math.round(trend), atGoal };
}

function toGiftedLine(data, n) {
  return data.map((d, i) => ({
    value: d.value,
    label: i % Math.ceil(n / 5) === 0 ? d.date.getDate().toString() : "",
    labelTextStyle: { color: "#9CA3AF", fontSize: 9 },
  }));
}

function toGiftedBar(data, n, color, goalValue) {
  return data.map((d, i) => ({
    value: d.value,
    label: i % Math.ceil(n / 5) === 0 ? d.date.getDate().toString() : "",
    labelTextStyle: { color: "#9CA3AF", fontSize: 9 },
    frontColor: goalValue && d.value >= goalValue ? color : color + "88",
  }));
}

// ─── Goal Stepper ─────────────────────────────────────────────────────────────

function GoalStepper({ label, value, onDecrement, onIncrement, unit, color }) {
  return (
    <View style={{
      backgroundColor: "#fff",
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: "#09332C",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    }}>
      <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: "#9CA3AF", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 16 }}>
        Daily Goal
      </Text>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <TouchableOpacity
          onPress={onDecrement}
          style={{
            width: 44, height: 44, borderRadius: 22,
            borderWidth: 2, borderColor: color + "44",
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Minus color={color} size={18} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 40, color, lineHeight: 44 }}>
            {value}
          </Text>
          <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: "#9CA3AF" }}>{unit}</Text>
        </View>
        <TouchableOpacity
          onPress={onIncrement}
          style={{
            width: 44, height: 44, borderRadius: 22,
            backgroundColor: color,
            alignItems: "center", justifyContent: "center",
          }}
        >
          <Plus color="#fff" size={18} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function MetricDetailScreen() {
  const router = useRouter();
  const { metric } = useLocalSearchParams();
  const { healthData } = useAppStore();

  const meta = METRIC_META[metric] ?? METRIC_META.pain;
  const [range, setRange] = useState(30);
  const [goal, setGoal] = useState(meta.defaultGoal ?? null);

  const data = useMemo(() => getLastNDays(healthData, meta.dataField, range), [healthData, meta.dataField, range]);
  const stats = useMemo(() => calcStats(data, goal, meta.lowerIsBetter), [data, goal, meta.lowerIsBetter]);

  const startDate = data[0]?.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const endDate = data[data.length - 1]?.date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const giftedData = meta.chartType === "line"
    ? toGiftedLine(data, range)
    : toGiftedBar(data, range, meta.color, goal);

  const isPositiveTrend = stats.trend > 0;
  const trending = stats.trend !== 0;

  const IconComp = meta.icon;

  // Current value — most recent logged entry
  const latestEntry = [...data].reverse().find((d) => d.value > 0);
  const currentValue = latestEntry?.value ?? null;
  const currentDisplay = currentValue != null
    ? (metric === "sleep" ? currentValue.toFixed(1) : String(currentValue))
    : "—";

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFF9F9" }} edges={["top", "bottom"]}>
      {/* Header */}
      <View style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: "#FFF9F9",
        borderBottomWidth: 1,
        borderBottomColor: "#F3F4F6",
      }}>
        <TouchableOpacity onPress={() => router.back()} style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
          <ChevronLeft color={DARK_TEXT} size={22} strokeWidth={2} />
        </TouchableOpacity>
        <View style={{ flex: 1, alignItems: "center" }}>
          <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: DARK_TEXT }}>{meta.label}</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#9CA3AF" }}>Last {range} days</Text>
        </View>
        {/* Range toggle */}
        <View style={{ flexDirection: "row", gap: 4, backgroundColor: "#F3F4F6", borderRadius: 10, padding: 3 }}>
          {[7, 30].map((r) => (
            <TouchableOpacity
              key={r}
              onPress={() => setRange(r)}
              style={{
                paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
                backgroundColor: range === r ? "#fff" : "transparent",
              }}
            >
              <Text style={{
                fontFamily: fonts.semibold, fontSize: 12,
                color: range === r ? DARK_TEXT : "#9CA3AF",
              }}>{r}d</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
      >
        {/* Summary Card */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: "timing", duration: 300 }}
          style={{
            backgroundColor: "#fff",
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
            shadowColor: "#09332C",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          {/* Icon + trend badge row */}
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <View style={{
              width: 48, height: 48, borderRadius: 14,
              backgroundColor: meta.bgColor,
              alignItems: "center", justifyContent: "center",
            }}>
              <IconComp color={meta.color} size={24} strokeWidth={2} />
            </View>
            {trending && (
              <View style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                backgroundColor: isPositiveTrend ? "#D1FAE5" : "#FEE2E2",
                borderRadius: 20,
                paddingHorizontal: 10,
                paddingVertical: 5,
              }}>
                {isPositiveTrend
                  ? <TrendingUp color="#059669" size={13} strokeWidth={2.5} />
                  : <TrendingDown color="#DC2626" size={13} strokeWidth={2.5} />}
                <Text style={{
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  color: isPositiveTrend ? "#059669" : "#DC2626",
                }}>
                  {Math.abs(stats.trend)}%
                </Text>
              </View>
            )}
          </View>

          {/* Current value */}
          <View style={{ flexDirection: "row", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
            <Text style={{ fontFamily: fonts.bold, fontSize: 48, color: meta.color, lineHeight: 52 }}>
              {currentDisplay}
            </Text>
            {currentValue != null && meta.unitSuffix && (
              <Text style={{ fontFamily: fonts.medium, fontSize: 18, color: "#9CA3AF" }}>{meta.unitSuffix}</Text>
            )}
          </View>
          <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: "#9CA3AF", marginBottom: 20 }}>
            Most recent entry
          </Text>

          {/* Stats row */}
          <View style={{
            flexDirection: "row",
            paddingTop: 16,
            borderTopWidth: 1,
            borderTopColor: "#F3F4F6",
          }}>
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#9CA3AF", marginBottom: 4 }}>Average</Text>
              <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: DARK_TEXT }}>{stats.avg}</Text>
            </View>
            <View style={{ width: 1, backgroundColor: "#F3F4F6" }} />
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#9CA3AF", marginBottom: 4 }}>
                {meta.hasGoal ? "Target" : "Entries"}
              </Text>
              <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: DARK_TEXT }}>
                {meta.hasGoal ? goal : stats.entries}
              </Text>
            </View>
            <View style={{ width: 1, backgroundColor: "#F3F4F6" }} />
            <View style={{ flex: 1, alignItems: "center" }}>
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#9CA3AF", marginBottom: 4 }}>
                {meta.hasGoal ? "Goal met" : "Logged days"}
              </Text>
              <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: DARK_TEXT }}>
                {meta.hasGoal ? stats.atGoal : stats.entries}
              </Text>
            </View>
          </View>
        </MotiView>

        {/* Trend Chart */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 80, type: "timing", duration: 300 }}
          style={{
            backgroundColor: "#fff",
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
            shadowColor: "#09332C",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: DARK_TEXT, marginBottom: 2 }}>Trend</Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#9CA3AF", marginBottom: 16 }}>
            {startDate} – {endDate}
          </Text>

          {meta.chartType === "line" ? (
            <LineChart
              data={giftedData}
              width={CHART_WIDTH}
              height={160}
              color={meta.color}
              thickness={2}
              curved
              dataPointsColor={meta.color}
              dataPointsRadius={3}
              noOfSections={5}
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
            />
          ) : (
            <BarChart
              data={giftedData}
              width={CHART_WIDTH}
              height={160}
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
              referenceLine1Config={{ color: meta.color, dashWidth: 4, dashGap: 4, thickness: 1.5, opacity: 0.7 }}
            />
          )}

          {goal && (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 8 }}>
              <View style={{ width: 20, height: 2, backgroundColor: meta.color, opacity: 0.6 }} />
              <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: "#9CA3AF" }}>Daily goal ({goal}{meta.unitSuffix ? " " + meta.unitSuffix : ""})</Text>
            </View>
          )}
        </MotiView>

        {/* Goal Setting */}
        {meta.hasGoal && (
          <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 160, type: "timing", duration: 300 }}
          >
            <GoalStepper
              label="Daily Goal"
              value={goal}
              unit={meta.unitSuffix || meta.unit.trim()}
              color={meta.color}
              onDecrement={() => setGoal((g) => Math.max(1, g - (meta.dataField === "steps" ? 500 : 1)))}
              onIncrement={() => setGoal((g) => Math.min(meta.max, g + (meta.dataField === "steps" ? 500 : 1)))}
            />
          </MotiView>
        )}

        {/* About */}
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 240, type: "timing", duration: 300 }}
          style={{
            backgroundColor: "#fff",
            borderRadius: 20,
            padding: 20,
            marginBottom: 16,
            shadowColor: "#09332C",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.07,
            shadowRadius: 8,
            elevation: 3,
          }}
        >
          <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: DARK_TEXT, marginBottom: 10 }}>
            About {meta.label}
          </Text>
          <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: "#4B5563", lineHeight: 22 }}>
            {meta.about}
          </Text>
        </MotiView>
      </ScrollView>
    </SafeAreaView>
  );
}
