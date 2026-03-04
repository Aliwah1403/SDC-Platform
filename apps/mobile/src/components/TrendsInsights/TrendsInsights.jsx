import React from "react";
import { View, Text, Dimensions } from "react-native";
import { PainLevelChart } from "./PainLevelChart";
import { HydrationChart } from "./HydrationChart";
import { MoodChart } from "./MoodChart";
import { CrisisFreePeriods } from "./CrisisFreePeriods";

const { width } = Dimensions.get("window");

export function TrendsInsights({
  painLevelData,
  hydrationData,
  moodData,
  chartData,
  avgPainLevel,
  avgHydration,
  crisisPeriods,
}) {
  const graphWidth = width - 80;

  return (
    <View style={{ paddingHorizontal: 20, marginTop: 32 }}>
      <Text
        style={{
          fontSize: 20,
          fontWeight: "700",
          color: "#5D1DD4",
          marginBottom: 16,
        }}
      >
        Trends & Insights
      </Text>

      <PainLevelChart
        painLevelData={painLevelData}
        graphWidth={graphWidth}
        avgPainLevel={avgPainLevel}
        chartData={chartData}
      />

      <HydrationChart
        hydrationData={hydrationData}
        graphWidth={graphWidth}
        avgHydration={avgHydration}
      />

      <MoodChart
        moodData={moodData}
        graphWidth={graphWidth}
        chartData={chartData}
      />

      <CrisisFreePeriods crisisPeriods={crisisPeriods} />
    </View>
  );
}
