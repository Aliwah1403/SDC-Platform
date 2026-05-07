import React, { useMemo, useState, useEffect } from "react";
import { View, Text, TouchableOpacity, ScrollView } from "react-native";
import { Image } from "expo-image";
import LottieView from "lottie-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  Sparkles,
  Trophy,
  Droplet,
  Heart,
  BookOpen,
  Target,
  Lock,
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
import { fonts } from "@/utils/fonts";
import { LinearGradient } from "expo-linear-gradient";
import MilestoneModal from "@/components/MilestoneModal";
import { StreakFireIcon } from "@/utils/streakFire";
import { useTheme } from "@/hooks/useTheme";

const HEMO = {
  dark: "#781D11",
  wine: "#A9334D",
  rose: "#D09F9A",
  blush: "#F8E9E7",
};

const MILESTONE_BADGE = {
  "onboarding-done": require("../../assets/images/badges/getting-started.svg"),
  "streak-1": require("../../assets/images/badges/first-streak.svg"),
  "streak-3": require("../../assets/images/badges/on-track.svg"),
  "streak-7": require("../../assets/images/badges/habit-builder.png"),
  "streak-14": require("../../assets/images/badges/fortnight-fighter.svg"),
  "streak-30": require("../../assets/images/badges/monthly-monster.svg"),
  "streak-60": require("../../assets/images/badges/pattern-seeker.svg"),
  "hydration-7": require("../../assets/images/badges/hydration-junkie.png"),
  "care-10": require("../../assets/images/badges/self-care.svg"),
  "learning-5": require("../../assets/images/badges/knowledge-seeker.svg"),
  "repair-1": require("../../assets/images/badges/back-on-track.svg"),
  "restart-1": require("../../assets/images/badges/resilient-restart.svg"),
  "meds-streak-7": require("../../assets/images/badges/on-time.svg"),
  "meds-first": require("../../assets/images/badges/dose-one.svg"),
  "week-perfect": require("../../assets/images/badges/perfect-week.svg"),
  "days-1": require("../../assets/images/badges/first-streak.svg"),
  "days-5": require("../../assets/images/badges/getting-started.svg"),
  // TODO: add images for days-10, days-25, days-50, days-100, symptoms-25
};

export default function StreakModal() {
  const posthog = usePostHog();
  const router = useRouter();
  const t = useTheme();
  const { auth } = useAuthStore();
  const { data: profile } = useProfileQuery();
  const { data: healthData = [] } = useHealthDataQuery();
  const { data: streak } = useStreakQuery();
  const { data: medications = [] } = useMedicationsQuery();

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
    return parseFloat((sum / last7.length).toFixed(1));
  }, [healthData]);
  const totalEntries = healthData.length;
  const daysLogged = healthStreak;
  const avgSteps = 8200;

  const stats = [
    { label: "Days", value: daysLogged },
    { label: "Entries", value: totalEntries },
    {
      label: "Avg Steps",
      value: avgSteps >= 1000 ? `${(avgSteps / 1000).toFixed(1)}K` : avgSteps,
    },
    { label: "Hydration", value: avgHydration > 0 ? avgHydration : 0 },
  ];

  const currentStreak = healthStreak;
  const symptomsLogged = healthData.reduce(
    (sum, day) => sum + (day.symptoms?.length || 0),
    0,
  );
  const hydrationDays = healthData.filter((day) => day.hydration >= 8).length;
  const careTasksCompleted = 0;
  const learningModulesCompleted = 0;

  const milestones = [
    {
      id: "days-1",
      name: "First Step",
      type: "days",
      value: 1,
      target: 1,
      requirement: "Log your first day",
      description:
        "Welcome to your health journey! Every great journey begins with a single step.",
      rarity: "Common",
      unlocked: daysLogged >= 1,
      current: daysLogged,
    },
    {
      id: "days-5",
      name: "Getting Started",
      type: "days",
      value: 5,
      target: 5,
      requirement: "Log 5 days",
      description:
        "You're building a habit! Consistency is the key to understanding your health patterns.",
      rarity: "Common",
      unlocked: daysLogged >= 5,
      current: daysLogged,
    },
    {
      id: "days-10",
      name: "Double Digits",
      type: "days",
      value: 10,
      target: 10,
      requirement: "Log 10 days",
      description:
        "Double digits! You're developing a strong tracking habit that will serve you well.",
      rarity: "Uncommon",
      unlocked: daysLogged >= 10,
      current: daysLogged,
    },
    {
      id: "days-25",
      name: "Quarter Century",
      type: "days",
      value: 25,
      target: 25,
      requirement: "Log 25 days",
      description:
        "Your commitment is impressive! You're gathering valuable insights about your health.",
      rarity: "Rare",
      unlocked: daysLogged >= 25,
      current: daysLogged,
    },
    {
      id: "days-50",
      name: "Health Champion",
      type: "days",
      value: 50,
      target: 50,
      requirement: "Log 50 days",
      description:
        "Incredible dedication! You're a true health champion with a wealth of data to guide you.",
      rarity: "Epic",
      unlocked: daysLogged >= 50,
      current: daysLogged,
    },
    {
      id: "days-100",
      name: "Century Master",
      type: "days",
      value: 100,
      target: 100,
      requirement: "Log 100 days",
      description:
        "A hundred days of commitment! You've built an unshakeable health tracking foundation.",
      rarity: "Legendary",
      unlocked: daysLogged >= 100,
      current: daysLogged,
    },
    {
      id: "streak-3",
      name: "On Track",
      type: "streak",
      value: 3,
      target: 3,
      requirement: "Maintain a 3-day streak",
      description: "Three days in a row! You're building momentum.",
      rarity: "Common",
      unlocked: currentStreak >= 3,
      current: currentStreak,
    },
    {
      id: "streak-7",
      name: "Habit Builder",
      type: "streak",
      value: 7,
      target: 7,
      requirement: "Maintain a 7-day streak",
      description: "A full week of consistency! Your dedication is showing.",
      rarity: "Uncommon",
      unlocked: currentStreak >= 7,
      current: currentStreak,
    },
    {
      id: "streak-14",
      name: "Fortnight Fighter",
      type: "streak",
      value: 14,
      target: 14,
      requirement: "Maintain a 14-day streak",
      description:
        "Two weeks strong! You're proving that consistency pays off.",
      rarity: "Rare",
      unlocked: currentStreak >= 14,
      current: currentStreak,
    },
    {
      id: "streak-30",
      name: "Monthly Monster",
      type: "streak",
      value: 30,
      target: 30,
      requirement: "Maintain a 30-day streak",
      description: "A full month! Your habit is now deeply ingrained.",
      rarity: "Epic",
      unlocked: currentStreak >= 30,
      current: currentStreak,
    },
    {
      id: "symptoms-10",
      name: "Pattern Seeker",
      type: "symptoms",
      value: 10,
      target: 10,
      requirement: "Log 10 symptoms",
      description: "You're starting to identify patterns in your symptoms.",
      rarity: "Common",
      unlocked: symptomsLogged >= 10,
      current: symptomsLogged,
    },
    {
      id: "symptoms-25",
      name: "Symptom Tracker",
      type: "symptoms",
      value: 25,
      target: 25,
      requirement: "Log 25 symptoms",
      description:
        "Your symptom data is becoming more valuable with each entry.",
      rarity: "Uncommon",
      unlocked: symptomsLogged >= 25,
      current: symptomsLogged,
    },
    {
      id: "hydration-7",
      name: "Hydration Junkie",
      type: "hydration",
      value: 7,
      target: 7,
      requirement: "Meet hydration goals for 7 days",
      description: "A week of staying hydrated! Your body thanks you.",
      rarity: "Uncommon",
      unlocked: hydrationDays >= 7,
      current: hydrationDays,
    },
    {
      id: "care-10",
      name: "Self-Care",
      type: "care",
      value: 10,
      target: 10,
      requirement: "Complete 10 care tasks",
      description: "You're prioritizing self-care and it shows!",
      rarity: "Common",
      unlocked: careTasksCompleted >= 10,
      current: careTasksCompleted,
    },
    {
      id: "learning-5",
      name: "Knowledge Seeker",
      type: "learning",
      value: 5,
      target: 5,
      requirement: "Complete 5 learning modules",
      description: "You're expanding your health knowledge with every module.",
      rarity: "Uncommon",
      unlocked: learningModulesCompleted >= 5,
      current: learningModulesCompleted,
    },
    {
      id: "repair-1",
      name: "Back on Track",
      type: "repair",
      value: 1,
      target: 1,
      requirement: "Use your first streak repair",
      description:
        "Life happens. Using a repair shows you're committed to bouncing back.",
      rarity: "Common",
      unlocked: repairsUsed >= 1,
      current: repairsUsed,
    },
    {
      id: "restart-1",
      name: "Resilient Restart",
      type: "restart",
      value: 1,
      target: 1,
      requirement: "Log again after missing 3+ days",
      description:
        "Every restart is a win. Coming back after a gap takes real courage.",
      rarity: "Uncommon",
      unlocked: repairsUsed > 0,
      current: repairsUsed > 0 ? 1 : 0,
    },
    {
      id: "meds-first",
      name: "Dose One",
      type: "medications",
      value: 1,
      target: 1,
      requirement: "Log your first medication",
      description:
        "Your first logged medication. Knowledge of your treatment is a superpower.",
      rarity: "Common",
      unlocked: (medications.length ?? 0) > 0,
      current: (medications.length ?? 0) > 0 ? 1 : 0,
    },
    {
      id: "meds-streak-7",
      name: "On-Time Hero",
      type: "medications",
      value: 7,
      target: 7,
      requirement: "Complete 7 medication check-ins",
      description:
        "Seven days of staying on top of your treatment. Your future self will thank you.",
      rarity: "Rare",
      unlocked: careTasksCompleted >= 7,
      current: careTasksCompleted,
    },
    {
      id: "week-perfect",
      name: "Perfect Week",
      type: "streak",
      value: 7,
      target: 7,
      requirement: "Log every day for a full week",
      description:
        "Seven days, zero gaps. A truly perfect week of health tracking.",
      rarity: "Epic",
      unlocked: completedDays >= 7,
      current: completedDays,
    },
  ];

  const milestonesWithDates = milestones.map((m) => {
    const raw = badgeUnlockDates[m.id];
    if (!raw) return m;
    const unlockedDate = new Date(raw).toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    });
    return { ...m, unlockedDate };
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
      image: MILESTONE_BADGE[milestone.id],
    });
    setMilestoneModalVisible(true);
  };

  const renderMilestoneCard = (milestone) => {
    const isUnlocked = milestone.unlocked;
    const progress = Math.min(
      (milestone.current / milestone.target) * 100,
      100,
    );
    const badgeSource = MILESTONE_BADGE[milestone.id] ?? null;

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
          {badgeSource ? (
            <Image
              source={badgeSource}
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 12,
                opacity: isUnlocked ? 1 : 0.4,
              }}
              contentFit="cover"
            />
          ) : (
            <View
              style={{
                width: "100%",
                height: "100%",
                borderRadius: 12,
                backgroundColor: "#A9334D",
                opacity: isUnlocked ? 1 : 0.4,
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

          {!isUnlocked && (
            <View
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Lock size={32} color="#FFFFFF" strokeWidth={2} />
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
    <SafeAreaView style={{ flex: 1, backgroundColor: t.background }}>
      {/* Close button */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 4,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: t.surfaceElevated,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={20} color={t.text} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── GRADIENT HERO ── */}
        <LinearGradient
          colors={
            t.isDark
              ? ["#1A0F0F", "#2A1419", "#1F1F1F"]
              : ["#FFF9F8", "#F8E9E7", "#ECDAD4"]
          }
          style={{
            paddingTop: 8,
            paddingBottom: 56,
            paddingHorizontal: 24,
            alignItems: "center",
          }}
        >
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
          {/* Stats Card */}
          <View
            style={{
              backgroundColor: t.isDark ? t.surfaceElevated : "#F8F4F0",
              borderRadius: 20,
              padding: 20,
              marginBottom: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.04,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text
              style={{
                fontFamily: fonts.medium,
                fontSize: 16,
                color: t.textSecondary,
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              Your Stats
            </Text>

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              {stats.map((stat, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <View
                      style={{
                        width: 1,
                        height: 36,
                        backgroundColor: t.border,
                        alignSelf: "center",
                      }}
                    />
                  )}
                  <View style={{ alignItems: "center", flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: fonts.medium,
                        fontSize: 13,
                        color: t.textSecondary,
                        marginBottom: 8,
                      }}
                    >
                      {stat.label}
                    </Text>
                    <Text
                      style={{
                        fontFamily: fonts.bold,
                        fontSize: 20,
                        color: t.text,
                      }}
                    >
                      {stat.value}
                    </Text>
                  </View>
                </React.Fragment>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => router.push("/health-insights")}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: t.surface,
                borderRadius: 100,
                paddingVertical: 8,
                paddingHorizontal: 14,
                alignSelf: "flex-start",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 3,
                elevation: 2,
                gap: 6,
              }}
            >
              <Sparkles size={14} color={t.isDark ? t.text : HEMO.wine} />
              <Text
                style={{
                  fontFamily: fonts.semibold,
                  fontSize: 12,
                  color: t.isDark ? t.text : HEMO.wine,
                }}
              >
                2 Insights Available
              </Text>
            </TouchableOpacity>
          </View>

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
