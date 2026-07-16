import React from "react";
import { View, Text, Dimensions } from "react-native";
import { PainLevelChart } from "./PainLevelChart";
import { HydrationChart } from "./HydrationChart";
import { MoodChart } from "./MoodChart";
import { CrisisFreePeriods } from "./CrisisFreePeriods";
import { fonts } from "@/utils/fonts";

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
          fontFamily: fonts.bold,
          color: "#781D11",
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
