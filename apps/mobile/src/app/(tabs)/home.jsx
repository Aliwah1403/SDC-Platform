import React, { useState, useEffect, useMemo } from "react";
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
  useAcknowledgeStreakLossMutation,
} from "@/hooks/queries/useStreakQuery";
import { useMedicationsQuery } from "@/hooks/queries/useMedicationsQuery";
import { useAppointmentsQuery } from "@/hooks/queries/useAppointmentsQuery";
import { useMetricGoalsQuery } from "@/hooks/queries/useMetricGoalsQuery";
import { DEFAULT_SUGGESTED_ML } from "@/utils/hydrationGoal";
import { HomeHeader } from "@/components/HomeHeader/HomeHeader";
import { CompactNavbar } from "@/components/HomeHeader/CompactNavbar";
import { TodayContextCard } from "@/components/HomeScreen/TodayContextCard";
import { QuickActions } from "@/components/HomeScreen/QuickActions";
import { PainStatusTile } from "@/components/HomeScreen/PainStatusTile";
import { MetricGrid } from "@/components/HomeScreen/MetricGrid";
import { AppointmentSection } from "@/components/HomeScreen/AppointmentSection";
import { ContextualCardsSkeleton } from "@/components/HomeScreen/ContextualCardsSkeleton";
import { HealthRecaps } from "@/components/HomeScreen/HealthRecaps";
import { HealthSignalSection } from "@/components/HomeScreen/HealthSignalSection";
import { useHomeData } from "@/hooks/useHomeData";
import { useDateNavigation } from "@/hooks/useDateNavigation";
import { getDynamicMessage, getGradientColors } from "@/utils/homeHelpers";
import { useHydrationStore } from "@/store/hydrationStore";
import { useTheme } from "@/hooks/useTheme";
import { toLocalDateStr } from "@/utils/dateUtils";
import {
  getEarnedAchievements,
  normalizeAchievementId,
  toAchievementMilestone,
} from "@/utils/achievements";

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
    repairReceipt,
    lostStreakVisible,
    setLostStreakVisible,
    streakLost,
    weather,
    isWeatherLoading,
  } = useHomeData();

  const pendingMilestone = useAppStore((s) => s.pendingMilestone);
  const setPendingMilestone = useAppStore((s) => s.setPendingMilestone);
  const clearPendingMilestone = useAppStore((s) => s.clearPendingMilestone);

  const { data: streak, isSuccess: streakLoaded } = useStreakQuery();
  const { data: metricGoals } = useMetricGoalsQuery();
  const hydrationGoalMl = metricGoals?.hydration ?? DEFAULT_SUGGESTED_ML;
  const claimedBadges = (streak?.claimedBadges ?? []).map((b) =>
    normalizeAchievementId(b != null && typeof b === "object" ? b.id : b),
  );
  const { mutate: saveClaimedBadges } = useClaimBadgeMutation();
  const { mutateAsync: acknowledgeStreakLoss } = useAcknowledgeStreakLossMutation();

  const { data: medications = [], isLoading: medsLoading } = useMedicationsQuery();
  const { data: appointments = [], isLoading: apptLoading } = useAppointmentsQuery();

  const totalEntries = healthData.length;
  const symptomsLogged = useMemo(
    () => healthData.reduce((sum, d) => sum + (d.symptoms?.length || 0), 0),
    [healthData],
  );
  const hydrationDays = useMemo(
    () => healthData.filter((d) => d.hydration >= hydrationGoalMl).length,
    [healthData, hydrationGoalMl],
  );
  const completedDays = useMemo(() => {
    const loggedDates = new Set(healthData.map((d) => d.date));
    const today = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(today.getDate() - (6 - i));
      return toLocalDateStr(date);
    }).filter((date) => loggedDates.has(date)).length;
  }, [healthData]);

  const hasLoggedToday = (() => {
    const todayStr = toLocalDateStr(new Date());
    const todayData = healthData.find((d) => d.date === todayStr);
    return !!(
      todayData &&
      (todayData.painLevel > 0 || todayData.mood > 0 || todayData.hydration > 0)
    );
  })();

  // Milestone detection — only runs on days the user actually logged
  useEffect(() => {
    if (!streakLoaded) return;
    if (!hasLoggedToday) return;
    if (pendingMilestone) return;

    const earned = getEarnedAchievements({
      currentStreak: healthStreak,
      daysLogged: totalEntries,
      symptomsLogged,
      hydrationDays,
      completedDays,
      medicationsCount: medications.length,
      careTasksCompleted: 0,
      learningModulesCompleted: 0,
      repairsUsed: streak?.repairsUsed ?? 0,
    });

    const newBadge = earned.find((m) => !claimedBadges.includes(m.id));
    if (newBadge) {
      setPendingMilestone(toAchievementMilestone(newBadge));
    }
  }, [
    streakLoaded,
    hasLoggedToday,
    healthData,
    healthStreak,
    pendingMilestone,
    claimedBadges,
    totalEntries,
    symptomsLogged,
    hydrationDays,
    completedDays,
    medications.length,
    streak?.repairsUsed,
  ]);

  const alertState = useAppStore((s) => s.computedAlertState);

  const { formatNavDate, isToday, isFuture, isSelected } = useDateNavigation();
  const { displayUnit: hydrationDisplayUnit } = useHydrationStore();

  const message = getDynamicMessage({
    hasLoggedData,
    healthStreak,
    selectedDate,
    currentUser,
    selectedDateData,
    healthData,
    alertState,
    weather,
    hydrationGoalMl,
    hydrationDisplayUnit,
  });
  const t = useTheme();
  const gradientColors = getGradientColors(hasLoggedData, t.isDark);

  const compactBarHeight = insets.top + 56;
  const [headerHeight, setHeaderHeight] = useState(350);

  const scrollY = useSharedValue(0);
  const collapsibleHeightSV = useSharedValue(350 - compactBarHeight);

  useEffect(() => {
    collapsibleHeightSV.value = Math.max(0, headerHeight - compactBarHeight);
  }, [headerHeight, compactBarHeight]);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerAnimStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      scrollY.value,
      [0, collapsibleHeightSV.value],
      [0, -collapsibleHeightSV.value],
      "clamp",
    );
    return { transform: [{ translateY }] };
  });

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
    <View style={{ flex: 1, backgroundColor: t.background }}>
      <StatusBar style={t.isDark ? "light" : "dark"} />

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
          isMessageLoading={isWeatherLoading}
        />
      </Animated.View>

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
        {/* <TodayContextCard
          healthData={healthData}
          healthStreak={healthStreak}
          currentUser={currentUser}
        /> */}

        <QuickActions medications={medications} />

        <HealthSignalSection alertState={alertState} healthData={healthData} />

        <PainStatusTile
          selectedDateData={selectedDateData}
          healthData={healthData}
        />

        <MetricGrid selectedDateData={selectedDateData} />

        <HealthRecaps healthData={healthData} />

        {apptLoading ? (
          <ContextualCardsSkeleton />
        ) : appointments.length > 0 ? (
          <View style={{ paddingHorizontal: 16, marginTop: 16, marginBottom: 16 }}>
            <AppointmentSection appointments={appointments} />
          </View>
        ) : null}
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
          receipt={repairReceipt}
          onClose={() => setRepairVisible(false)}
        />

        <LostStreakModal
          visible={lostStreakVisible}
          lostStreak={streakLost?.lostStreak ?? 0}
          missedDays={streakLost?.missedDays ?? 0}
          repairsAvailable={streakLost?.repairsAvailable ?? 0}
          onStartFresh={async () => {
            try {
              await acknowledgeStreakLoss();
              setLostStreakVisible(false);
            } catch {
              // keep modal open on failure
            }
          }}
          onClose={() => setLostStreakVisible(false)}
        />
      </View>

      <StreakAchievementModal
        visible={!!pendingMilestone}
        milestone={pendingMilestone}
        healthData={healthData}
        onClaim={() => {
          if (pendingMilestone) {
            posthog?.capture("milestone_claimed", {
              milestone_id: pendingMilestone.milestoneId,
              milestone_type: pendingMilestone.type,
              streak_days: pendingMilestone.streakCount ?? null,
            });
            const existing = streak?.claimedBadges ?? [];
            const alreadyIds = existing.map((b) =>
              normalizeAchievementId(b != null && typeof b === "object" ? b.id : b),
            );
            const updated = alreadyIds.includes(pendingMilestone.milestoneId)
              ? existing
              : [
                  ...existing,
                  {
                    id: pendingMilestone.milestoneId,
                    unlockedAt: new Date().toISOString(),
                  },
                ];
            saveClaimedBadges(updated);
          }
          clearPendingMilestone();
        }}
      />
    </View>
  );
}
