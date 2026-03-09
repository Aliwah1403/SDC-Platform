import React, { useState, useEffect } from "react";
import { View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
} from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import RepairStreakBottomSheet from "@/components/RepairStreakBottomSheet";
import { HomeHeader } from "@/components/HomeHeader/HomeHeader";
import { CompactNavbar } from "@/components/HomeHeader/CompactNavbar";
import { DailyInsights } from "@/components/DailyInsights/DailyInsights";
import { HealthStats } from "@/components/HealthStats/HealthStats";
import { TodayHealthCard } from "@/components/HealthStats/TodayHealthCard";
import { TrendsInsights } from "@/components/TrendsInsights/TrendsInsights";
import { LearnSection } from "@/components/LearnSection/LearnSection";
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

  const { formatNavDate, isToday, isFuture, isSelected } = useDateNavigation();

  const {
    painLevelData,
    hydrationData,
    moodData,
    chartData,
    crisisPeriods,
    avgPainLevel,
    avgHydration,
  } = useChartData(healthData);

  const message = getDynamicMessage(hasLoggedData, healthStreak, selectedDate, 'currentUser');
  // const message = getDynamicMessage(hasLoggedData, healthStreak, selectedDate, currentUser);
  const gradientColors = getGradientColors(hasLoggedData);
  const insightCards = getInsightCards(
    healthStreak,
    selectedDate,
    selectedDateData,
    avgPainLevel,
    avgHydration,
  );

  // Compact bar height = safe area + content row
  const compactBarHeight = insets.top + 56;

  // Measured full header height (defaults to 350 to avoid flash before onLayout fires)
  const [headerHeight, setHeaderHeight] = useState(350);

  // Shared values for animation
  const scrollY = useSharedValue(0);
  const collapsibleHeightSV = useSharedValue(350 - compactBarHeight);

  // Keep collapsibleHeightSV in sync when headerHeight is measured
  useEffect(() => {
    collapsibleHeightSV.value = Math.max(0, headerHeight - compactBarHeight);
  }, [headerHeight, compactBarHeight]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  // Full header slides up as user scrolls
  const headerAnimStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, collapsibleHeightSV.value],
      [0, -collapsibleHeightSV.value],
      "clamp",
    );
    return { transform: [{ translateY }] };
  });

  // Compact navbar fades + slides down into view
  const compactNavAnimStyle = useAnimatedStyle(() => {
    const start = collapsibleHeightSV.value * 0.5;
    const end = collapsibleHeightSV.value;
    const opacity = interpolate(scrollY.value, [start, end], [0, 1], "clamp");
    const translateY = interpolate(
      scrollY.value,
      [start, end],
      [-8, 0],
      "clamp",
    );
    return { opacity, transform: [{ translateY }] };
  });

  return (
    <View style={{ flex: 1, backgroundColor: "#FFF9F9" }}>
      <StatusBar style="light" />

      {/* Full header — absolutely positioned, slides up on scroll */}
      <Animated.View
        style={[
          { position: "absolute", top: 0, left: 0, right: 0, zIndex: 10 },
          headerAnimStyle,
        ]}
        onLayout={(e) => setHeaderHeight(e.nativeEvent.layout.height)}
      >
        <HomeHeader
          insets={insets}
          gradientColors={gradientColors}
          hasLoggedData={hasLoggedData}
          formatNavDate={formatNavDate}
          selectedDate={selectedDate}
          healthStreak={healthStreak}
          setSelectedDate={setSelectedDate}
          isToday={isToday}
          isFuture={isFuture}
          isSelected={isSelected}
          message={message}
        />
      </Animated.View>

      {/* Compact glassmorphism navbar — fades in as header collapses */}
      <Animated.View
        pointerEvents="box-none"
        style={[
          { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20 },
          compactNavAnimStyle,
        ]}
      >
        <CompactNavbar
          date={formatNavDate(selectedDate)}
          healthStreak={healthStreak}
          insets={insets}
        />
      </Animated.View>

      {/* Scrollable content — paddingTop reserves space for the full header */}
      <Animated.ScrollView
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: headerHeight,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <DailyInsights insightCards={insightCards} />

        <TodayHealthCard />

        <HealthStats
          hasLoggedData={hasLoggedData}
          selectedDateData={selectedDateData}
        />

        <LearnSection />

        <TrendsInsights
          painLevelData={painLevelData}
          hydrationData={hydrationData}
          moodData={moodData}
          chartData={chartData}
          avgPainLevel={avgPainLevel}
          avgHydration={avgHydration}
          crisisPeriods={crisisPeriods}
        />
      </Animated.ScrollView>

      <RepairStreakBottomSheet
        isVisible={repairVisible}
        onClose={() => setRepairVisible(false)}
      />
    </View>
  );
}
