import { View, Text, Dimensions } from "react-native";
import { LineChart } from "react-native-gifted-charts";
import { fonts } from "@/utils/fonts";

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
  const giftedData = moodData.map((d, i) => ({
    value: d.value,
    label: i % 7 === 0 ? new Date(d.date).getDate().toString() : "",
    labelTextStyle: { color: "#9CA3AF", fontSize: 9 },
  }));

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
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
        <Text style={{ fontSize: 18, fontWeight: "700", color: "#1F2937" }}>
          Mood Patterns
        </Text>
        <View
          style={{
            backgroundColor: "#FEF3C7",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#D97706" }}>
            Last 30 days
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
        Your emotional well-being over time
      </Text>

      {/* Chart */}
      <View style={{ marginLeft: -8 }}>
        <LineChart
          data={giftedData}
          width={CHART_WIDTH}
          height={160}
          color="#10B981"
          thickness={2}
          curved
          dataPointsColor="#10B981"
          dataPointsRadius={3}
          hideDataPoints={false}
          noOfSections={5}
          maxValue={5}
          yAxisColor="transparent"
          xAxisColor="#E5E7EB"
          rulesColor="#F3F4F6"
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
          borderTopColor: "#F3F4F6",
        }}
      >
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>
            😊 Excellent
          </Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#10B981" }}>
            {chartData.filter((d) => d.mood === 5).length}d
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>
            😐 Fair
          </Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#F59E0B" }}>
            {chartData.filter((d) => d.mood === 3).length}d
          </Text>
        </View>
        <View style={{ alignItems: "center" }}>
          <Text style={{ fontSize: 11, color: "#6B7280", marginBottom: 2 }}>
            😔 Poor
          </Text>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#DC2626" }}>
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
          borderTopColor: "#F3F4F6",
        }}
      >
        <Text
          style={{
            fontFamily: fonts.regular,
            fontSize: 13,
            color: "#4B5563",
            lineHeight: 20,
          }}
        >
          {getMoodInsight(chartData)}
        </Text>
      </View>
    </View>
  );
}
