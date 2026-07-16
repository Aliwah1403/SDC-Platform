import { View, Text, Dimensions } from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { fonts } from "@/utils/fonts";
import { useTheme } from "@/hooks/useTheme";
import { useMetricGoalsQuery } from "@/hooks/queries/useMetricGoalsQuery";
import { useHydrationStore } from "@/store/hydrationStore";
import { hydrationValueInUnit, HYDRATION_UNIT_LABEL } from "@/utils/hydrationUnits";
import { DEFAULT_SUGGESTED_ML } from "@/utils/hydrationGoal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRAPH_WIDTH = SCREEN_WIDTH - 32;
const CHART_WIDTH = GRAPH_WIDTH - 40;

function getHydrationInsight(avg, daysAtGoal, total, goal, unitLabel) {
  const goalPhrase = `${goal} ${unitLabel}`;
  if (avg >= goal) {
    return `Outstanding hydration this month! Consistently hitting your ${goalPhrase} goal is one of the most effective ways to prevent SCD pain crises and keep your blood cells flowing well.`;
  }
  if (avg >= goal * 0.75) {
    if (daysAtGoal >= total / 2)
      return `You're meeting your hydration goal on more than half your logged days — solid progress. Try keeping a water bottle nearby so it's always within reach, especially in the mornings.`;
    return `You're close to your daily goal but not quite consistent yet. Spreading water intake evenly across the day tends to work better than trying to catch up in the evening.`;
  }
  return `Your hydration has been below the ${goalPhrase} target most days. In SCD, low hydration significantly increases the risk of pain crises. Consider setting a reminder every couple of hours as a prompt to drink.`;
}

export function HydrationChart({ hydrationData, avgHydration }) {
  const t = useTheme();
  const { data: metricGoals } = useMetricGoalsQuery();
  const { displayUnit } = useHydrationStore();
  const goalMl = metricGoals?.hydration ?? DEFAULT_SUGGESTED_ML;
  const unitLabel = HYDRATION_UNIT_LABEL[displayUnit] ?? "glasses";

  // hydrationData/avgHydration arrive as canonical ml; render everything in
  // the user's chosen display unit instead of a hardcoded glasses scale.
  const goalInUnit = Math.max(0.1, hydrationValueInUnit(goalMl, displayUnit));
  const unitData = hydrationData.map((d) => ({ ...d, value: hydrationValueInUnit(d.value, displayUnit) }));
  const avgInUnit = hydrationValueInUnit(avgHydration, displayUnit);
  const formatUnitNumber = (v) => (displayUnit === "L" ? v.toFixed(1) : String(Math.round(v)));

  const giftedData = unitData.map((d, i) => ({
    value: d.value,
    label: i % 7 === 0 ? new Date(d.date).getDate().toString() : "",
    labelTextStyle: { color: "#9CA3AF", fontSize: 9 },
    frontColor: d.value >= goalInUnit ? "#A9334D" : "#D09F9A",
  }));

  const barWidth = Math.max(3, Math.floor(CHART_WIDTH / 35));
  const spacing = Math.max(1, Math.floor(CHART_WIDTH / 50));
  const daysAtGoal = unitData.filter((d) => d.value >= goalInUnit).length;
  const chartMax = Math.max(...unitData.map((d) => d.value), goalInUnit, 0.1) * 1.15;
  const insightText = getHydrationInsight(avgInUnit, daysAtGoal, unitData.length, goalInUnit, unitLabel);

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
        <Text style={{ fontSize: 18, fontFamily: fonts.bold, color: t.text }}>
          Hydration Levels
        </Text>
        <View
          style={{
            backgroundColor: "#F8E9E7",
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
          }}
        >
          <Text style={{ fontSize: 12, fontFamily: fonts.semibold, color: "#A9334D" }}>
            Last 30 days
          </Text>
        </View>
      </View>
      <Text style={{ fontSize: 13, color: t.textSecondary, marginBottom: 20 }}>
        Monitor your daily water intake ({unitLabel})
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
            backgroundColor: "#A9334D",
            marginRight: 6,
            borderRadius: 1,
          }}
        />
        <Text style={{ fontSize: 11, color: t.textSecondary }}>Goal: {formatUnitNumber(goalInUnit)} {unitLabel}</Text>
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
          maxValue={chartMax}
          yAxisColor="transparent"
          xAxisColor={t.border}
          rulesColor={t.divider}
          rulesType="solid"
          initialSpacing={5}
          yAxisTextStyle={{ color: "#9CA3AF", fontSize: 9 }}
          xAxisLabelTextStyle={{ color: "#9CA3AF", fontSize: 9 }}
          backgroundColor="transparent"
          yAxisLabelWidth={24}
          referenceLine1Config={{
            color: "#A9334D",
            dashWidth: 4,
            dashGap: 4,
            thickness: 1,
          }}
          referenceLine1Position={goalInUnit}
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
          borderTopColor: t.border,
        }}
      >
        <View>
          <Text style={{ fontSize: 12, color: t.textSecondary, marginBottom: 4 }}>
            Daily Avg
          </Text>
          <Text style={{ fontSize: 20, fontFamily: fonts.bold, color: t.text }}>
            {formatUnitNumber(avgInUnit)}
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 12, color: t.textSecondary, marginBottom: 4 }}>
            Goal
          </Text>
          <Text style={{ fontSize: 20, fontFamily: fonts.bold, color: "#A9334D" }}>
            {formatUnitNumber(goalInUnit)}
          </Text>
        </View>
        <View>
          <Text style={{ fontSize: 12, color: t.textSecondary, marginBottom: 4 }}>
            Days at goal
          </Text>
          <Text style={{ fontSize: 20, fontFamily: fonts.bold, color: "#A9334D" }}>
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
          {insightText}
        </Text>
      </View>
    </View>
  );
}
