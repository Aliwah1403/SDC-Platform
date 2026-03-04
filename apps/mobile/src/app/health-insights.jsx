import { View, Text, TouchableOpacity, ScrollView, Dimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { X, TrendingUp, TrendingDown } from "lucide-react-native";
import { BarChart } from "react-native-gifted-charts";
import { useAppStore } from "@/store/appStore";
import { fonts } from "@/utils/fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_PADDING = 20;
const CARD_WIDTH = SCREEN_WIDTH - 40;
const CHART_WIDTH = CARD_WIDTH - CARD_PADDING * 2 - 8;

// ─── data helpers ─────────────────────────────────────────────────────────────

function daysBetween(dateStr) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return Math.round((today - d) / 86400000);
}

function sliceWeek(healthData, startDaysAgo, endDaysAgo) {
  return healthData.filter((d) => {
    const n = daysBetween(d.date);
    return n >= startDaysAgo && n <= endDaysAgo;
  });
}

// Build 7 labelled bars for the current week (Mon → today order)
function weekBars(healthData, valueFn) {
  const today = new Date();
  const bars = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const entry = healthData.find((e) => e.date === dateStr);
    bars.push({
      value: entry ? valueFn(entry) : 0,
      label: d.toLocaleDateString("en-US", { weekday: "short" }).charAt(0),
      labelTextStyle: { color: "#9CA3AF", fontSize: 10 },
    });
  }
  return bars;
}

function dailyWellbeing(entry) {
  const pain = (10 - (entry.painLevel || 0)) / 10;
  const mood = (entry.mood || 0) / 5;
  const hydration = Math.min((entry.hydration || 0) / 8, 1);
  return parseFloat(((pain * 0.4 + mood * 0.3 + hydration * 0.3) * 10).toFixed(1));
}

// ─── insight definitions ──────────────────────────────────────────────────────

function buildInsights(healthData, firstName) {
  const thisWeek = sliceWeek(healthData, 0, 6);
  const lastWeek = sliceWeek(healthData, 7, 13);
  const hasHistory = lastWeek.length > 0;

  // 1. Pain-Free Days ─ days with painLevel ≤ 2
  const painFreeDaysThis = thisWeek.filter((d) => (d.painLevel || 0) <= 2).length;
  const painFreeDaysLast = lastWeek.filter((d) => (d.painLevel || 0) <= 2).length;
  const painFreePct =
    hasHistory && painFreeDaysLast > 0
      ? parseFloat((((painFreeDaysThis - painFreeDaysLast) / painFreeDaysLast) * 100).toFixed(1))
      : null;
  const painFreePositive = painFreePct !== null && painFreePct >= 0;

  // 2. Hydration Goal Days ─ days hitting ≥ 8 glasses
  const hydGoalThis = thisWeek.filter((d) => (d.hydration || 0) >= 8).length;
  const hydGoalLast = lastWeek.filter((d) => (d.hydration || 0) >= 8).length;
  const hydGoalPct =
    hasHistory && hydGoalLast > 0
      ? parseFloat((((hydGoalThis - hydGoalLast) / hydGoalLast) * 100).toFixed(1))
      : null;
  const hydGoalPositive = hydGoalPct !== null && hydGoalPct >= 0;

  // 3. Wellbeing Score ─ composite (pain 40% + mood 30% + hydration 30%)
  const wellThis =
    thisWeek.length > 0
      ? parseFloat(
          (thisWeek.reduce((s, d) => s + dailyWellbeing(d), 0) / thisWeek.length).toFixed(1),
        )
      : null;
  const wellLast =
    lastWeek.length > 0
      ? parseFloat(
          (lastWeek.reduce((s, d) => s + dailyWellbeing(d), 0) / lastWeek.length).toFixed(1),
        )
      : null;
  const wellPct =
    wellThis !== null && wellLast !== null && wellLast > 0
      ? parseFloat((((wellThis - wellLast) / wellLast) * 100).toFixed(1))
      : null;
  const wellPositive = wellPct !== null && wellPct >= 0;

  return [
    {
      id: "pain-free-days",
      title: painFreePositive ? "Pain Progress" : "Pain Check-In",
      color: "#059669",
      metricLabel: "PAIN-FREE DAYS",
      thisValue: String(painFreeDaysThis),
      lastValue: hasHistory ? String(painFreeDaysLast) : "—",
      pctChange: painFreePct,
      isPositive: painFreePositive,
      hasHistory,
      description: !hasHistory
        ? `${firstName}, you had ${painFreeDaysThis} pain-free days this week. Keep logging every day so we can start comparing your trends next week.`
        : painFreePositive
        ? `${firstName}, you had ${painFreeDaysThis} pain-free days this week, up from ${painFreeDaysLast} last week. That's real progress — your consistent logging is helping you spot what works.`
        : `${firstName}, you had ${painFreeDaysThis} pain-free days this week, down from ${painFreeDaysLast} last week. Consider checking for patterns — rest, hydration, and stress all play a role in SCD pain.`,
      bars: weekBars(healthData, (d) => Math.max(0, 10 - (d.painLevel || 0))), // inverted so taller = less pain
      maxValue: 10,
    },
    {
      id: "hydration-goal",
      title: hydGoalPositive ? "Hydration Momentum" : "Hydration Reminder",
      color: "#2563EB",
      metricLabel: "GOAL DAYS (8+ GLASSES)",
      thisValue: String(hydGoalThis),
      lastValue: hasHistory ? String(hydGoalLast) : "—",
      pctChange: hydGoalPct,
      isPositive: hydGoalPositive,
      hasHistory,
      description: !hasHistory
        ? `${firstName}, you hit your 8-glass hydration goal on ${hydGoalThis} day${hydGoalThis !== 1 ? "s" : ""} this week. Staying hydrated is one of the most effective ways to reduce SCD complications.`
        : hydGoalPositive
        ? `${firstName}, you hit your hydration goal on ${hydGoalThis} days this week, up from ${hydGoalLast} last week. Excellent — hydration directly impacts how your body manages SCD.`
        : `${firstName}, your hydration dropped this week — you hit the 8-glass goal on ${hydGoalThis} day${hydGoalThis !== 1 ? "s" : ""} vs ${hydGoalLast} last week. Remember to drink water throughout the day, especially in the morning.`,
      bars: weekBars(healthData, (d) => d.hydration || 0),
      maxValue: 10,
    },
    {
      id: "wellbeing-score",
      title: wellPositive ? "Wellbeing Rising" : "Wellbeing Snapshot",
      color: "#7C3AED",
      metricLabel: "WELLBEING SCORE",
      thisValue: wellThis !== null ? String(wellThis) : "—",
      lastValue: wellLast !== null ? String(wellLast) : "—",
      pctChange: wellPct,
      isPositive: wellPositive,
      hasHistory,
      description: !hasHistory
        ? `${firstName}, your composite wellbeing score this week is ${wellThis ?? "—"}/10. This is calculated from your pain levels, mood, and hydration combined. Keep logging to see your trend.`
        : wellPositive
        ? `${firstName}, your overall wellbeing score improved to ${wellThis}/10 this week (up from ${wellLast} last week). Pain management, mood, and hydration are all factored in — you're moving in the right direction.`
        : `${firstName}, your wellbeing score dipped to ${wellThis}/10 this week (from ${wellLast} last week). Small daily habits — logging consistently, drinking water, and managing stress — add up over time.`,
      bars: weekBars(healthData, dailyWellbeing),
      maxValue: 10,
    },
  ];
}

// ─── InsightCard ──────────────────────────────────────────────────────────────

function InsightCard({ insight }) {
  const { isPositive, pctChange, hasHistory } = insight;
  const showBadge = pctChange !== null;
  const trendColor = isPositive ? "#059669" : "#DC2626";
  const badgeBg = isPositive ? "#DCFCE7" : "#FEF2F2";
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  const barWidth = Math.max(18, Math.floor(CHART_WIDTH / 10));
  const spacing = Math.max(4, Math.floor((CHART_WIDTH - barWidth * 7) / 8));

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderRadius: 24,
        padding: CARD_PADDING,
        marginBottom: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
      }}
    >
      {/* Card title */}
      <Text
        style={{
          fontFamily: fonts.bold,
          fontSize: 22,
          color: "#111827",
          marginBottom: 10,
        }}
      >
        {insight.title}
      </Text>

      {/* Description — plain text, no bubble */}
      <Text
        style={{
          fontFamily: fonts.regular,
          fontSize: 15,
          color: "#4B5563",
          lineHeight: 23,
          marginBottom: 20,
        }}
      >
        {insight.description}
      </Text>

      {/* Metric label */}
      <Text
        style={{
          fontFamily: fonts.semibold,
          fontSize: 11,
          color: "#9CA3AF",
          textTransform: "uppercase",
          letterSpacing: 1,
          marginBottom: 10,
        }}
      >
        {insight.metricLabel}
      </Text>

      {/* This week / Last week numbers */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 14,
        }}
      >
        <View>
          <Text
            style={{
              fontFamily: fonts.extrabold,
              fontSize: 42,
              color: insight.color,
              lineHeight: 46,
            }}
          >
            {insight.thisValue}
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 13,
              color: "#9CA3AF",
              marginTop: 4,
            }}
          >
            This Week
          </Text>
        </View>

        <View style={{ alignItems: "flex-end" }}>
          <Text
            style={{
              fontFamily: fonts.extrabold,
              fontSize: 42,
              color: "#1F2937",
              lineHeight: 46,
              opacity: hasHistory ? 1 : 0.25,
            }}
          >
            {insight.lastValue}
          </Text>
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 13,
              color: "#9CA3AF",
              marginTop: 4,
            }}
          >
            Last Week
          </Text>
        </View>
      </View>

      {/* % change badge */}
      {showBadge && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: badgeBg,
            alignSelf: "flex-start",
            borderRadius: 100,
            paddingVertical: 6,
            paddingHorizontal: 12,
            marginBottom: 20,
            gap: 5,
          }}
        >
          <TrendIcon size={13} color={trendColor} strokeWidth={2.5} />
          <Text style={{ fontFamily: fonts.semibold, fontSize: 13, color: trendColor }}>
            {pctChange > 0 ? "+" : ""}{pctChange}% from last week
          </Text>
        </View>
      )}

      {/* Bar chart */}
      <View style={{ marginLeft: -4 }}>
        <BarChart
          data={insight.bars}
          width={CHART_WIDTH}
          height={130}
          barWidth={barWidth}
          spacing={spacing}
          roundedTop
          frontColor={insight.color + "CC"}
          noOfSections={4}
          maxValue={insight.maxValue}
          yAxisColor="transparent"
          xAxisColor="#F3F4F6"
          rulesColor="#F9FAFB"
          rulesType="solid"
          initialSpacing={spacing}
          yAxisTextStyle={{ color: "#9CA3AF", fontSize: 9 }}
          backgroundColor="transparent"
          yAxisLabelWidth={22}
          showXAxisIndices={false}
        />
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function HealthInsightsScreen() {
  const router = useRouter();
  const { healthData, currentUser } = useAppStore();
  const firstName = currentUser?.name?.split(" ")[0] || "there";

  const insights = buildInsights(healthData, firstName);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FAF7F5" }}>
      {/* Header */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 16,
        }}
      >
        <Text style={{ fontFamily: fonts.bold, fontSize: 30, color: "#111827" }}>
          Insights
        </Text>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: "#F3F4F6",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={18} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {insights.map((insight) => (
          <InsightCard key={insight.id} insight={insight} />
        ))}

        {/* Done button */}
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: 100,
            paddingVertical: 16,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 3,
            marginTop: 4,
            marginBottom: 16,
          }}
        >
          <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: "#111827" }}>
            Done
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
