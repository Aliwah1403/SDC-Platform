import React, { useRef } from "react";
import { View, ScrollView } from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import StreaksBottomSheet from "@/components/StreaksBottomSheet";
import RepairStreakBottomSheet from "@/components/RepairStreakBottomSheet";
import { HomeHeader } from "@/components/HomeHeader/HomeHeader";
import { DailyInsights } from "@/components/DailyInsights/DailyInsights";
import { HealthStats } from "@/components/HealthStats/HealthStats";
import { TrendsInsights } from "@/components/TrendsInsights/TrendsInsights";
import { useHomeData } from "@/hooks/useHomeData";
import { useDateNavigation } from "@/hooks/useDateNavigation";
import { useChartData } from "@/hooks/useChartData";
import {
  getDynamicMessage,
  getGradientColors,
  getInsightCards,
} from "@/utils/homeHelpers";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const bottomSheetRef = useRef(null);

  const {
    healthStreak,
    healthData,
    selectedDate,
    setSelectedDate,
    selectedDateData,
    hasLoggedData,
    repairVisible,
    setRepairVisible,
  } = useHomeData();

  const {
    dates,
    formatNavDate,
    formatDatePickerDay,
    formatDatePickerDate,
    isToday,
    isFuture,
    isSelected,
  } = useDateNavigation();

  const {
    painLevelData,
    hydrationData,
    moodData,
    chartData,
    crisisPeriods,
    avgPainLevel,
    avgHydration,
  } = useChartData(healthData);

  const message = getDynamicMessage(hasLoggedData, healthStreak, selectedDate);
  const gradientColors = getGradientColors(hasLoggedData);
  const insightCards = getInsightCards(healthStreak, selectedDate);

  return (
    <View style={{ flex: 1, backgroundColor: "#F5F5F5" }}>
      <StatusBar style="light" />

      <HomeHeader
        insets={insets}
        gradientColors={gradientColors}
        hasLoggedData={hasLoggedData}
        formatNavDate={formatNavDate}
        selectedDate={selectedDate}
        healthStreak={healthStreak}
        bottomSheetRef={bottomSheetRef}
        dates={dates}
        setSelectedDate={setSelectedDate}
        formatDatePickerDay={formatDatePickerDay}
        formatDatePickerDate={formatDatePickerDate}
        isToday={isToday}
        isFuture={isFuture}
        isSelected={isSelected}
        message={message}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <DailyInsights insightCards={insightCards} />

        <HealthStats
          hasLoggedData={hasLoggedData}
          selectedDateData={selectedDateData}
        />

        <TrendsInsights
          painLevelData={painLevelData}
          hydrationData={hydrationData}
          moodData={moodData}
          chartData={chartData}
          avgPainLevel={avgPainLevel}
          avgHydration={avgHydration}
          crisisPeriods={crisisPeriods}
        />
      </ScrollView>

      <StreaksBottomSheet bottomSheetRef={bottomSheetRef} />

      <RepairStreakBottomSheet
        isVisible={repairVisible}
        onClose={() => setRepairVisible(false)}
      />
    </View>
  );
}
