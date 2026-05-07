import { useMemo } from "react";
import { View, Text, Dimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { Smile, Meh, Frown } from "lucide-react-native";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRAPH_WIDTH = SCREEN_WIDTH - 32;
const CHART_WIDTH = GRAPH_WIDTH - 40;

function getMoodInsight(chartData) {
  const total = chartData.length;
  if (total === 0) return "Log more days to start seeing mood insights.";
  const goodDays = chartData.filter((d) => d.mood >= 4).length;
  const poorDays = chartData.filter((d) => d.mood <= 2 && d.mood > 0).length;
  const goodRatio = goodDays / total;
  const poorRatio = poorDays / total;
  if (goodRatio >= 0.7)
    return `Your mood has been mostly positive this month — a real strength. Emotional well-being directly supports physical resilience with SCD, so this is just as important as your other health metrics.`;
  if (poorRatio >= 0.3)
    return `You've had a number of difficult mood days this month. Living with SCD is genuinely challenging, and it's okay to ask for support. Consider sharing how you're feeling with your care team or a trusted person.`;
  return `Your mood has been variable this month, which is very common with SCD. On harder days, gentle movement, connection with others, and adequate rest can make a meaningful difference to how you feel.`;
}

export function MoodChart({ moodData, chartData }) {
  const t = useTheme();
  const giftedData = useMemo(() => moodData.map((d, i) => ({
    value: d.value,
    label: i % 7 === 0 ? new Date(d.date).getDate().toString() : "",
    labelTextStyle: { color: "#9CA3AF", fontSize: 9 },
  })), [moodData]);

  return (
    <View
      style={{
        backgroundColor: t.surface,
        borderRadius: 16,
        padding: 20,
        marginBottom: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      {/* Title row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 4,
        }}
      >
        <Text style={{ fontSize: 18, fontWeight: "700", color: t.text }}>
          Mood Patterns
        </Text>
        <View
          style={{
            backgroundColor: "#F8E9E7",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#781D11" }}>
            Last 30 days
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 13, color: t.textSecondary, marginBottom: 20 }}>
        Your emotional well-being over time
      </Text>

      {/* Chart */}
      <View style={{ marginLeft: -8 }}>
        <LineChart
          data={giftedData}
          width={CHART_WIDTH}
          height={160}
          color="#A9334D"
          thickness={2}
          curved
          dataPointsColor="#A9334D"
          dataPointsRadius={3}
          hideDataPoints={false}
          noOfSections={5}
          maxValue={5}
          yAxisColor="transparent"
          xAxisColor={t.border}
          rulesColor={t.divider}
          rulesType="solid"
          initialSpacing={8}
          spacing={Math.max(4, Math.floor(CHART_WIDTH / 32))}
          yAxisTextStyle={{ color: "#9CA3AF", fontSize: 9 }}
          xAxisLabelTextStyle={{ color: "#9CA3AF", fontSize: 9 }}
          backgroundColor="transparent"
          hideYAxisText={false}
          yAxisLabelWidth={24}
        />
      </View>

      {/* Stats row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          marginTop: 16,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: t.border,
        }}
      >
        <View style={{ alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
            <Smile size={13} color="#A9334D" strokeWidth={2} />
            <Text style={{ fontSize: 11, color: t.textSecondary }}>Excellent</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#A9334D" }}>
            {chartData.filter((d) => d.mood === 5).length}d
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
            <Meh size={13} color="#D09F9A" strokeWidth={2} />
            <Text style={{ fontSize: 11, color: t.textSecondary }}>Fair</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#D09F9A" }}>
            {chartData.filter((d) => d.mood === 3).length}d
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 2 }}>
            <Frown size={13} color="#781D11" strokeWidth={2} />
            <Text style={{ fontSize: 11, color: t.textSecondary }}>Poor</Text>
          </View>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#781D11" }}>
            {chartData.filter((d) => d.mood <= 2 && d.mood > 0).length}d
          </Text>
        </View>
      </View>

      {/* AI Insight */}
      <View
        style={{
          marginTop: 16,
          paddingTop: 14,
          borderTopWidth: 1,
          borderTopColor: t.border,
        }}
      >
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 13,
            color: t.textSecondary,
            lineHeight: 20,
          }}
        >
          {getMoodInsight(chartData)}
        </Text>
      </View>
    </View>
  );
}
