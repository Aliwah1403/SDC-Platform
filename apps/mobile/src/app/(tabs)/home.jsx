import React, { useState, useEffect, useMemo, useRef } from "react";
import { usePostHog } from "posthog-react-native";
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
import LostStreakModal from "@/components/LostStreakModal";
import StreakAchievementModal from "@/components/StreakAchievementModal";
import { useAppStore } from "@/store/appStore";
import {
  useStreakQuery,
  useClaimBadgeMutation,
} from "@/hooks/queries/useStreakQuery";
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

const ALL_MILESTONES = [
  {
    id: "streak-1",
    type: "streak",
    count: 1,
    name: "First Streak",
    description: "Your first logged day — the journey starts here.",
  },
  {
    id: "streak-3",
    type: "streak",
    count: 3,
    name: "On Track",
    description: "Three days in a row — momentum is building!",
  },
  {
    id: "streak-7",
    type: "streak",
    count: 7,
    name: "Habit Builder",
    description: "A full week of consistency. Your dedication is showing.",
  },
  {
    id: "streak-14",
    type: "streak",
    count: 14,
    name: "Fortnight Fighter",
    description: "Two weeks strong. Consistency is paying off.",
  },
  {
    id: "streak-30",
    type: "streak",
    count: 30,
    name: "Monthly Monster",
    description: "A full month! Your habit is now deeply ingrained.",
  },
  {
    id: "streak-60",
    type: "streak",
    count: 60,
    name: "Dedicated Tracker",
    description: "Two months of relentless tracking. Incredible.",
  },
  {
    id: "days-1",
    type: "days",
    count: 1,
    name: "First Step",
    description: "Welcome to your health journey!",
  },
  {
    id: "days-5",
    type: "days",
    count: 5,
    name: "Getting Started",
    description: "You're building a habit. Consistency is key.",
  },
  {
    id: "days-10",
    type: "days",
    count: 10,
    name: "Double Digits",
    description: "Ten days logged. You're developing a strong tracking habit.",
  },
  {
    id: "days-25",
    type: "days",
    count: 25,
    name: "Quarter Century",
    description: "25 days logged. Your commitment is impressive!",
  },
  {
    id: "days-50",
    type: "days",
    count: 50,
    name: "Health Champion",
    description: "Incredible dedication. You're a true health champion.",
  },
  {
    id: "days-100",
    type: "days",
    count: 100,
    name: "Century Master",
    description: "A hundred days of commitment. You're unstoppable.",
  },
  {
    id: "symptoms-10",
    type: "symptoms",
    count: 10,
    name: "Pattern Seeker",
    description: "You're starting to identify patterns in your symptoms.",
  },
  {
    id: "symptoms-25",
    type: "symptoms",
    count: 25,
    name: "Symptom Tracker",
    description: "Your symptom data is becoming more valuable with each entry.",
  },
  {
    id: "hydration-7",
    type: "hydration",
    count: 7,
    name: "Hydration Junkie",
    description: "7 days of great hydration! Your body thanks you.",
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const posthog = usePostHog();

  const {
    currentUser,
    healthStreak,
    healthData,
    selectedDate,
    setSelectedDate,
    selectedDateData,
    hasLoggedData,
    repairVisible,
    setRepairVisible,
    lostStreakVisible,
    setLostStreakVisible,
    streakLost,
  } = useHomeData();

  const pendingMilestone = useAppStore((s) => s.pendingMilestone);
  const setPendingMilestone = useAppStore((s) => s.setPendingMilestone);
  const clearPendingMilestone = useAppStore((s) => s.clearPendingMilestone);

  const { data: streak, isSuccess: streakLoaded } = useStreakQuery();
  const claimedBadges = streak?.claimedBadges ?? [];
  const { mutate: saveClaimedBadges } = useClaimBadgeMutation();

  const totalEntries = healthData.length;
  const symptomsLogged = useMemo(
    () => healthData.reduce((sum, d) => sum + (d.symptoms?.length || 0), 0),
    [healthData],
  );
  const hydrationDays = useMemo(
    () => healthData.filter((d) => d.hydration >= 8).length,
    [healthData],
  );

  useEffect(() => {
    if (!streakLoaded) return;
    if (!healthData.length && !healthStreak) return;
    if (pendingMilestone) return;

    const earned = ALL_MILESTONES.filter((m) => {
      if (m.type === "streak") return healthStreak >= m.count;
      if (m.type === "days") return totalEntries >= m.count;
      if (m.type === "symptoms") return symptomsLogged >= m.count;
      if (m.type === "hydration") return hydrationDays >= m.count;
      return false;
    });

    const newBadge = earned.find((m) => !claimedBadges.includes(m.id));
    if (newBadge) {
      setPendingMilestone({
        milestoneId: newBadge.id,
        type: newBadge.type,
        title:
          newBadge.type === "streak"
            ? `${healthStreak} Day Streak!`
            : newBadge.name,
        subtitle: newBadge.description,
        streakCount: newBadge.type === "streak" ? healthStreak : null,
      });
    }
  }, [streakLoaded, healthData, healthStreak, pendingMilestone, claimedBadges, totalEntries, symptomsLogged, hydrationDays]);

  // Track home screen view on mount
  useEffect(() => {
    posthog?.capture('home_viewed', {
      logged_today: hasLoggedData,
      streak_days: healthStreak ?? 0,
    });
  }, []);

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

  const message = getDynamicMessage(
    hasLoggedData,
    healthStreak,
    selectedDate,
    currentUser,
  );
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

      <View
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
        }}
        pointerEvents="box-none"
      >
        <RepairStreakBottomSheet
          isVisible={repairVisible}
          onClose={() => setRepairVisible(false)}
        />

      <LostStreakModal
        visible={lostStreakVisible}
        lostStreak={streakLost?.lostStreak ?? 0}
        onClose={() => setLostStreakVisible(false)}
      />
      </View>

      <StreakAchievementModal
        visible={!!pendingMilestone}
        milestone={pendingMilestone}
        healthData={healthData}
        onClaim={() => {
          if (pendingMilestone) {
            posthog?.capture('milestone_claimed', {
              milestone_id: pendingMilestone.milestoneId,
              milestone_type: pendingMilestone.type,
              streak_days: pendingMilestone.streakCount ?? null,
            });
            const updated = [
              ...new Set([...claimedBadges, pendingMilestone.milestoneId]),
            ];
            saveClaimedBadges(updated);
          }
          clearPendingMilestone();
        }}
      />
    </View>
  );
}
