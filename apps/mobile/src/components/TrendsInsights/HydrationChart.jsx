import { View, Text, Dimensions } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { fonts } from "@/utils/fonts";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRAPH_WIDTH = SCREEN_WIDTH - 32;
const CHART_WIDTH = GRAPH_WIDTH - 40;

function getHydrationInsight(avg, daysAtGoal, total) {
  const a = parseFloat(avg);
  if (a >= 8) {
    return `Outstanding hydration this month! Consistently hitting your 8-glass goal is one of the most effective ways to prevent SCD pain crises and keep your blood cells flowing well.`;
  }
  if (a >= 6) {
    if (daysAtGoal >= total / 2)
      return `You're meeting your hydration goal on more than half your logged days — solid progress. Try keeping a water bottle nearby so it's always within reach, especially in the mornings.`;
    return `You're close to your daily goal but not quite consistent yet. Spreading water intake evenly across the day tends to work better than trying to catch up in the evening.`;
  }
  return `Your hydration has been below the 8-glass target most days. In SCD, low hydration significantly increases the risk of pain crises. Consider setting a reminder every couple of hours as a prompt to drink.`;
}

export function HydrationChart({ hydrationData, avgHydration }) {
  const giftedData = hydrationData.map((d, i) => ({
    value: d.value,
    label: i % 7 === 0 ? new Date(d.date).getDate().toString() : "",
    labelTextStyle: { color: "#9CA3AF", fontSize: 9 },
    frontColor: d.value >= 8 ? "#2563EB" : "#93C5FD",
  }));

  const barWidth = Math.max(3, Math.floor(CHART_WIDTH / 35));
  const spacing = Math.max(1, Math.floor(CHART_WIDTH / 50));
  const daysAtGoal = hydrationData.filter((d) => d.value >= 8).length;
  const insightText = getHydrationInsight(avgHydration, daysAtGoal, hydrationData.length);

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
          Hydration Levels
        </Text>
        <View
          style={{
            backgroundColor: "#DBEAFE",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text style={{ fontSize: 12, fontWeight: "600", color: "#2563EB" }}>
            Last 30 days
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 13, color: "#6B7280", marginBottom: 20 }}>
        Monitor your daily water intake (glasses)
      </Text>

      {/* Goal line label */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <View
          style={{
            width: 20,
            height: 2,
            backgroundColor: "#2563EB",
            marginRight: 6,
            borderRadius: 1,
          }}
        />
        <Text style={{ fontSize: 11, color: "#6B7280" }}>Goal: 8 glasses</Text>
      </View>

      {/* Chart */}
      <View style={{ marginLeft: -8 }}>
        <BarChart
          data={giftedData}
          width={CHART_WIDTH}
          height={160}
          barWidth={barWidth}
          roundedTop
          spacing={spacing}
          noOfSections={4}
          maxValue={10}
          yAxisColor="transparent"
          xAxisColor="#E5E7EB"
          rulesColor="#F3F4F6"
          rulesType="solid"
          initialSpacing={5}
          yAxisTextStyle={{ color: "#9CA3AF", fontSize: 9 }}
          xAxisLabelTextStyle={{ color: "#9CA3AF", fontSize: 9 }}
          backgroundColor="transparent"
          yAxisLabelWidth={24}
          referenceLine1Config={{
            color: "#2563EB",
            dashWidth: 4,
            dashGap: 4,
            thickness: 1,
          }}
          referenceLine1Position={8}
          showReferenceLine1
        />
      </View>

      {/* Stats row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          marginTop: 16,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: "#F3F4F6",
        }}
      >
        <View>
          <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
            Daily Avg
          </Text>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#1F2937" }}>
            {avgHydration}
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
            Goal
          </Text>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#2563EB" }}>
            8
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 12, color: "#6B7280", marginBottom: 4 }}>
            Days at goal
          </Text>
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#10B981" }}>
            {daysAtGoal}
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
          {insightText}
        </Text>
      </View>
    </View>
  );
}
