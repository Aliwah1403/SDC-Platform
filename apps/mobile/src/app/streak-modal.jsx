import React, { useMemo, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Image } from "expo-image";
import LottieView from "lottie-react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Sparkles,
  Trophy,
  Droplet,
  Heart,
  BookOpen,
  Target,
  X,
  Clock,
  Zap,
  Wrench,
} from "lucide-react-native";
import { usePostHog } from "posthog-react-native";
import { useAuthStore } from "@/utils/auth/store";
import { useProfileQuery } from "@/hooks/queries/useProfileQuery";
import { useHealthDataQuery } from "@/hooks/queries/useHealthDataQuery";
import { useStreakQuery } from "@/hooks/queries/useStreakQuery";
import { useMedicationsQuery } from "@/hooks/queries/useMedicationsQuery";
import { useMetricGoalsQuery } from "@/hooks/queries/useMetricGoalsQuery";
import { glassesFromMl } from "@/utils/hydrationUnits";
import { DEFAULT_SUGGESTED_ML } from "@/utils/hydrationGoal";
import { fonts } from "@/utils/fonts";
import { LinearGradient } from "expo-linear-gradient";
import MilestoneModal from "@/components/MilestoneModal";
import { StreakFireIcon } from "@/utils/streakFire";
import { useTheme } from "@/hooks/useTheme";
import { PressableScale } from "@/components/PressableScale";
import {
  getAchievementsWithProgress,
  normalizeAchievementId,
} from "@/utils/achievements";

const HEMO = {
  dark: "#781D11",
  wine: "#A9334D",
  rose: "#D09F9A",
  blush: "#F8E9E7",
};

export default function StreakModal() {
  const posthog = usePostHog();
  const router = useRouter();
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const { auth } = useAuthStore();
  const { data: profile } = useProfileQuery();
  const { data: healthData = [] } = useHealthDataQuery();
  const { data: streak } = useStreakQuery();
  const { data: medications = [] } = useMedicationsQuery();
  const { data: metricGoals } = useMetricGoalsQuery();
  const hydrationGoalMl = metricGoals?.hydration ?? DEFAULT_SUGGESTED_ML;

  const currentUser = {
    name: auth?.user?.user_metadata?.full_name ?? profile?.nickname ?? "You",
  };
  const healthStreak = streak?.currentStreak ?? 0;
  const repairsUsed = streak?.repairsUsed ?? 0;
  const badgeUnlockDates = streak?.badgeUnlockDates ?? {};
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [milestoneModalVisible, setMilestoneModalVisible] = useState(false);

  useEffect(() => {
    posthog?.capture("streak_modal_viewed", { current_streak: healthStreak });
  }, []);

  const getCurrentWeekData = () => {
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const hasData = healthData.some((d) => d.date === dateStr);

      days.push({
        date,
        day: date.toLocaleDateString("en-US", { weekday: "short" }).charAt(0),
        dayNumber: date.getDate(),
        hasData,
        isToday: date.toDateString() === today.toDateString(),
      });
    }

    return days;
  };

  const weekData = getCurrentWeekData();
  const completedDays = weekData.filter((d) => d.hasData).length;

  const avgHydration = useMemo(() => {
    if (!healthData.length) return 0;
    const last7 = healthData.slice(-7);
    const sum = last7.reduce((acc, d) => acc + (d.hydration ?? 0), 0);
    return parseFloat(glassesFromMl(sum / last7.length).toFixed(1));
  }, [healthData]);
  const totalEntries = healthData.length;
  const totalDaysLogged = new Set(
    healthData.map((d) => d.date?.split("T")[0]).filter(Boolean),
  ).size;
  const avgSteps = 8200;

  const stats = [
    { label: "Days", value: totalDaysLogged },
    { label: "Entries", value: totalEntries },
    {
      label: "Avg Steps",
      value: avgSteps >= 1000 ? `${(avgSteps / 1000).toFixed(1)}K` : avgSteps,
    },
    { label: "Hydration", value: avgHydration > 0 ? avgHydration : 0 },
  ];

  const currentStreak = healthStreak;
  const daysLogged = totalDaysLogged;
  const symptomsLogged = healthData.reduce(
    (sum, day) => sum + (day.symptoms?.length || 0),
    0,
  );
  const hydrationDays = healthData.filter((day) => day.hydration >= hydrationGoalMl).length;
  const careTasksCompleted = 0;
  const learningModulesCompleted = 0;

  const milestones = getAchievementsWithProgress({
    currentStreak,
    daysLogged,
    symptomsLogged,
    hydrationDays,
    careTasksCompleted,
    learningModulesCompleted,
    repairsUsed,
    completedDays,
    medicationsCount: medications.length,
  }).filter((achievement) => achievement.target != null);

  const milestonesWithDates = milestones.map((m) => {
    const raw =
      badgeUnlockDates[m.id] ??
      Object.entries(badgeUnlockDates).find(
        ([id]) => normalizeAchievementId(id) === m.id,
      )?.[1];
    if (!raw) return m;
    const unlockedDate = new Date(raw).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    // Badge was earned at some point — keep it unlocked permanently
    return { ...m, unlocked: true, unlockedDate };
  });

  const unlockedCount = milestonesWithDates.filter((m) => m.unlocked).length;

  const handleMilestonePress = (milestone) => {
    posthog?.capture("milestone_tapped", {
      milestone_id: milestone.id,
      type: milestone.type,
      unlocked: milestone.unlocked,
    });
    setSelectedMilestone({
      ...milestone,
      image: milestone.image,
    });
    setMilestoneModalVisible(true);
  };

  const renderMilestoneCard = (milestone) => {
    const isUnlocked = milestone.unlocked;
    const progress = Math.min(
      (milestone.current / milestone.target) * 100,
      100,
    );
    const badgeSource = milestone.image ?? null;

    const MilestoneIcon = {
      days: Trophy,
      streak: StreakFireIcon,
      symptoms: Target,
      hydration: Droplet,
      care: Heart,
      learning: BookOpen,
      repair: Wrench,
      restart: Zap,
      medications: Clock,
    }[milestone.type];

    const getUnitText = () => {
      if (["days", "streak", "hydration"].includes(milestone.type))
        return "days";
      if (milestone.type === "symptoms") return "logged";
      if (milestone.type === "care") return "tasks";
      if (milestone.type === "repair") return "repair";
      if (milestone.type === "restart") return "restart";
      if (milestone.type === "medications") return "check-ins";
      return "modules";
    };

    return (
      <TouchableOpacity
        key={milestone.id}
        onPress={() => isUnlocked && handleMilestonePress(milestone)}
        disabled={!isUnlocked}
        style={{
          width: "48%",
          backgroundColor: t.surface,
          borderRadius: 20,
          padding: 20,
          marginBottom: 16,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 3,
        }}
      >
        <View style={{ width: "100%", aspectRatio: 1, marginBottom: 16 }}>
          {!isUnlocked ? (
            <View
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 12,
                backgroundColor: t.isDark ? t.surfaceElevated : "#F0E4E1",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Image
                source={require("../../assets/images/lock.png")}
                style={{ width: 40, height: 48, opacity: t.isDark ? 0.3 : 0.2 }}
                contentFit="contain"
              />
            </View>
          ) : badgeSource ? (
            <Image
              source={badgeSource}
              style={{ width: "100%", height: "100%", borderRadius: 12 }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 12,
                backgroundColor: "#A9334D",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 10,
                  color: "#F8E9E7",
                  letterSpacing: 1,
                  textTransform: "uppercase",
                }}
              >
                No Image
              </Text>
              <Text
                style={{
                  fontFamily: fonts.regular,
                  fontSize: 9,
                  color: "rgba(248,233,231,0.6)",
                  marginTop: 2,
                }}
              >
                {milestone.id}
              </Text>
            </View>
          )}
        </View>

        <Text
          style={{
            fontFamily: fonts.bold,
            fontSize: 15,
            color: t.text,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {milestone.name}
        </Text>

        <Text
          style={{
            fontFamily: fonts.medium,
            fontSize: 13,
            color: t.textSecondary,
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          {Math.min(milestone.current, milestone.target)}/{milestone.target}{" "}
          {getUnitText()}
        </Text>

        <View
          style={{
            width: "100%",
            height: 8,
            backgroundColor: t.isDark ? t.surfaceElevated : "#FFF9F9",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={[HEMO.rose, HEMO.wine]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ width: `${progress}%`, height: "100%" }}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }} edges={["bottom", "left", "right"]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── GRADIENT HERO — extends to the very top; close button floats on top of it ── */}
        <LinearGradient
          colors={
            t.isDark
              ? ["#1A0F0F", "#2A1419", "#1F1F1F"]
              : ["#FFF9F8", "#F8E9E7", "#ECDAD4"]
          }
          style={{
            paddingTop: insets.top + 12,
            paddingBottom: 56,
            paddingHorizontal: 24,
            alignItems: "center",
          }}
        >
          <PressableScale
            onPress={() => router.back()}
            style={{
              position: "absolute",
              top: insets.top + 12,
              right: 20,
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: t.isDark ? "rgba(255,255,255,0.08)" : "rgba(26,26,26,0.06)",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={20} color={t.text} />
          </PressableScale>

          {/* Animated fire */}
          <LottieView
            source={require("../../assets/animations/streak-animation.json")}
            autoPlay
            loop
            style={{ width: 200, height: 220 }}
          />

          {/* Streak number */}
          <Text
            style={{
              fontFamily: fonts.extrabold,
              fontSize: 80,
              color: HEMO.wine,
              lineHeight: 82,
              marginTop: -8,
            }}
          >
            {healthStreak}
          </Text>

          {/* Label */}
          <Text
            style={{
              fontFamily: fonts.bold,
              fontSize: 22,
              color: t.isDark ? t.text : HEMO.dark,
              letterSpacing: -0.4,
              marginBottom: 8,
            }}
          >
            Day Streak
          </Text>

          {/* Motivational text */}
          <Text
            style={{
              fontFamily: fonts.regular,
              fontSize: 14,
              color: t.textSecondary,
              textAlign: "center",
              marginBottom: 36,
            }}
          >
            You are doing great, {currentUser?.name?.split(" ")[0] || "there"}!
          </Text>

          {/* Week calendar */}
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              width: "100%",
            }}
          >
            {weekData.map((day, index) => (
              <View key={index} style={{ alignItems: "center", flex: 1 }}>
                <Text
                  style={{
                    fontFamily: day.isToday ? fonts.bold : fonts.medium,
                    fontSize: 12,
                    color: day.isToday ? HEMO.wine : t.textSecondary,
                    marginBottom: 8,
                  }}
                >
                  {day.day}
                </Text>

                {day.hasData ? (
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: HEMO.wine,
                      alignItems: "center",
                      justifyContent: "center",
                      shadowColor: HEMO.wine,
                      shadowOffset: { width: 0, height: 3 },
                      shadowOpacity: 0.35,
                      shadowRadius: 6,
                      elevation: 4,
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: fonts.bold,
                        fontSize: 13,
                        color: "#FFFFFF",
                      }}
                    >
                      {day.dayNumber}
                    </Text>
                  </View>
                ) : (
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 18,
                      backgroundColor: day.isToday
                        ? "rgba(169,51,77,0.12)"
                        : t.isDark
                          ? t.surfaceElevated
                          : "rgba(0,0,0,0.06)",
                      alignItems: "center",
                      justifyContent: "center",
                      borderWidth: day.isToday ? 1.5 : 0,
                      borderColor: "rgba(169,51,77,0.3)",
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: day.isToday ? fonts.bold : fonts.regular,
                        fontSize: 13,
                        color: day.isToday ? HEMO.wine : t.textTertiary,
                      }}
                    >
                      {day.dayNumber}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </LinearGradient>

        {/* ── WHITE BODY ── */}
        <View
          style={{
            backgroundColor: t.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            marginTop: -28,
            paddingTop: 28,
            paddingHorizontal: 24,
            paddingBottom: 48,
          }}
        >
          {/* Streak Repairs */}
          <TouchableOpacity
            onPress={() => router.push("/streak-repairs")}
            style={{
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              backgroundColor: t.surface,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", flex: 1 }}
            >
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <Wrench size={24} color="#92400E" strokeWidth={2} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontFamily: fonts.bold,
                    fontSize: 16,
                    color: t.text,
                    marginBottom: 2,
                  }}
                >
                  Streak Repairs
                </Text>
                <Text
                  style={{
                    fontFamily: fonts.medium,
                    fontSize: 13,
                    color: "#92400E",
                  }}
                >
                  3 repairs available
                </Text>
              </View>
            </View>
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "rgba(146, 64, 14, 0.1)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 18, color: "#92400E" }}>→</Text>
            </View>
          </TouchableOpacity>

          {/* Milestones */}
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 20,
              }}
            >
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 22,
                  color: t.isDark ? t.text : HEMO.dark,
                }}
              >
                Your Milestones
              </Text>
              <Text
                style={{
                  fontFamily: fonts.bold,
                  fontSize: 13,
                  color: t.textSecondary,
                }}
              >
                {unlockedCount}/{milestonesWithDates.length}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
              }}
            >
              {milestonesWithDates.map((milestone) =>
                renderMilestoneCard(milestone),
              )}
            </View>
          </View>

          {/* Footer */}
          <View
            style={{
              backgroundColor: t.isDark ? "rgba(169,51,77,0.12)" : HEMO.blush,
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
            }}
          >
            <View
              style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            >
              <Zap
                size={16}
                color={t.isDark ? t.text : HEMO.wine}
                strokeWidth={2}
              />
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 14,
                  color: t.isDark ? t.text : HEMO.wine,
                  textAlign: "center",
                  lineHeight: 20,
                }}
              >
                More coming soon!
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <MilestoneModal
        visible={milestoneModalVisible}
        milestone={selectedMilestone}
        onClose={() => setMilestoneModalVisible(false)}
      />
    </SafeAreaView>
  );
}
