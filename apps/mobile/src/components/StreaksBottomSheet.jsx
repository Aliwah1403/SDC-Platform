import React, { useMemo, useState, useRef } from "react";
import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import BottomSheet, {
  BottomSheetView,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import {
  Flame,
  Check,
  Sparkles,
  Trophy,
  Droplet,
  Heart,
  BookOpen,
  Target,
  Lock,
} from "lucide-react-native";
import { useAppStore } from "../store/appStore";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Circle } from "react-native-svg";
import MilestoneModal from "./MilestoneModal";
import StreakRepairsBottomSheet from "./StreakRepairsBottomSheet";

const { width } = Dimensions.get("window");

export default function StreaksBottomSheet({ bottomSheetRef }) {
  const { currentUser, healthStreak, healthData, getWeeklyAverage } =
    useAppStore();
  const snapPoints = useMemo(() => ["90%"], []);
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [milestoneModalVisible, setMilestoneModalVisible] = useState(false);
  const repairsBottomSheetRef = useRef(null);

  // Get current week data (last 7 days)
  const getCurrentWeekData = () => {
    const days = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(today.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];

      // Check if there's health data for this day
      const hasData = healthData.some((d) => d.date === dateStr);

      days.push({
        date,
        day: date.toLocaleDateString("en-US", { weekday: "short" }).charAt(0),
        dayNumber: date.getDate(),
        fullDay: date.toLocaleDateString("en-US", { weekday: "short" }),
        hasData,
        isToday: date.toDateString() === today.toDateString(),
      });
    }

    return days;
  };

  const weekData = getCurrentWeekData();
  const completedDays = weekData.filter((d) => d.hasData).length;

  // Calculate stats - matching the Duolingo design
  const avgHydration = getWeeklyAverage("hydration");
  const totalEntries = healthData.length;
  const daysLogged = healthStreak; // Days with at least one entry
  const avgSteps = 8200; // Mock data - will be replaced with real data from Apple/Google Health

  const stats = [
    { label: "Days", value: daysLogged },
    { label: "Entries", value: totalEntries },
    {
      label: "Avg Steps",
      value: avgSteps >= 1000 ? `${(avgSteps / 1000).toFixed(1)}K` : avgSteps,
    },
    { label: "Hydration", value: avgHydration > 0 ? avgHydration : 0 },
  ];

  // Define all milestone types with real data
  const currentStreak = healthStreak; // Current streak
  const longestStreak = healthStreak; // Mock - should track longest streak
  const symptomsLogged = healthData.reduce(
    (sum, day) => sum + (day.symptoms?.length || 0),
    0,
  );
  const hydrationDays = healthData.filter((day) => day.hydration >= 8).length;
  const careTasksCompleted = 0; // Mock - will be tracked in future
  const learningModulesCompleted = 0; // Mock - will be tracked in future

  const milestones = [
    // Days Logged Milestones
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
      emoji: "🎯",
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
      emoji: "📝",
      unlocked: daysLogged >= 5,
      current: daysLogged,
    },
    {
      id: "days-10",
      name: "Habit Builder",
      type: "days",
      value: 10,
      target: 10,
      requirement: "Log 10 days",
      description:
        "Double digits! You're developing a strong tracking habit that will serve you well.",
      rarity: "Uncommon",
      emoji: "💪",
      unlocked: daysLogged >= 10,
      current: daysLogged,
    },
    {
      id: "days-25",
      name: "Dedicated Tracker",
      type: "days",
      value: 25,
      target: 25,
      requirement: "Log 25 days",
      description:
        "Your commitment is impressive! You're gathering valuable insights about your health.",
      rarity: "Rare",
      emoji: "⭐",
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
      emoji: "👑",
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
      emoji: "💯",
      unlocked: daysLogged >= 100,
      current: daysLogged,
    },

    // Streak Milestones
    {
      id: "streak-3",
      name: "Streak Starter",
      type: "streak",
      value: 3,
      target: 3,
      requirement: "Maintain a 3-day streak",
      description: "Three days in a row! You're building momentum.",
      rarity: "Common",
      emoji: "🔥",
      unlocked: currentStreak >= 3,
      current: currentStreak,
    },
    {
      id: "streak-7",
      name: "Week Warrior",
      type: "streak",
      value: 7,
      target: 7,
      requirement: "Maintain a 7-day streak",
      description: "A full week of consistency! Your dedication is showing.",
      rarity: "Uncommon",
      emoji: "🔥",
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
      emoji: "🔥",
      unlocked: currentStreak >= 14,
      current: currentStreak,
    },
    {
      id: "streak-30",
      name: "Monthly Master",
      type: "streak",
      value: 30,
      target: 30,
      requirement: "Maintain a 30-day streak",
      description: "A full month! Your habit is now deeply ingrained.",
      rarity: "Epic",
      emoji: "🔥",
      unlocked: currentStreak >= 30,
      current: currentStreak,
    },

    // Symptom Tracking Milestones
    {
      id: "symptoms-10",
      name: "Pattern Seeker",
      type: "symptoms",
      value: 10,
      target: 10,
      requirement: "Log 10 symptoms",
      description: "You're starting to identify patterns in your symptoms.",
      rarity: "Common",
      emoji: "🎯",
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
      emoji: "📊",
      unlocked: symptomsLogged >= 25,
      current: symptomsLogged,
    },

    // Hydration Milestones
    {
      id: "hydration-7",
      name: "Hydration Hero",
      type: "hydration",
      value: 7,
      target: 7,
      requirement: "Meet hydration goals for 7 days",
      description: "A week of staying hydrated! Your body thanks you.",
      rarity: "Uncommon",
      emoji: "💧",
      unlocked: hydrationDays >= 7,
      current: hydrationDays,
    },

    // Care Tasks Milestones
    {
      id: "care-10",
      name: "Self-Care Starter",
      type: "care",
      value: 10,
      target: 10,
      requirement: "Complete 10 care tasks",
      description: "You're prioritizing self-care and it shows!",
      rarity: "Common",
      emoji: "💝",
      unlocked: careTasksCompleted >= 10,
      current: careTasksCompleted,
    },

    // Learning Milestones
    {
      id: "learning-5",
      name: "Knowledge Seeker",
      type: "learning",
      value: 5,
      target: 5,
      requirement: "Complete 5 learning modules",
      description: "You're expanding your health knowledge with every module.",
      rarity: "Uncommon",
      emoji: "📚",
      unlocked: learningModulesCompleted >= 5,
      current: learningModulesCompleted,
    },
  ];

  const unlockedCount = milestones.filter((m) => m.unlocked).length;

  const handleMilestonePress = (milestone) => {
    setSelectedMilestone(milestone);
    setMilestoneModalVisible(true);
  };

  const renderMilestoneCard = (milestone) => {
    const isUnlocked = milestone.unlocked;
    const progress = Math.min(
      (milestone.current / milestone.target) * 100,
      100,
    );

    const MILESTONE_COLORS = {
      days: { primary: "#FF6B6B", secondary: "#FF8E8E" },
      streak: { primary: "#FF6B35", secondary: "#FF8F5C" },
      symptoms: { primary: "#9B59B6", secondary: "#B77DD4" },
      hydration: { primary: "#3498DB", secondary: "#5DADE2" },
      care: { primary: "#E91E63", secondary: "#F06292" },
      learning: { primary: "#2ECC71", secondary: "#58D68D" },
    };

    const colors = MILESTONE_COLORS[milestone.type];
    const MilestoneIcon = {
      days: Trophy,
      streak: Flame,
      symptoms: Target,
      hydration: Droplet,
      care: Heart,
      learning: BookOpen,
    }[milestone.type];

    // Get the appropriate unit text
    const getUnitText = () => {
      if (
        milestone.type === "days" ||
        milestone.type === "streak" ||
        milestone.type === "hydration"
      ) {
        return "days";
      } else if (milestone.type === "symptoms") {
        return "logged";
      } else if (milestone.type === "care") {
        return "tasks";
      } else {
        return "modules";
      }
    };

    return (
      <TouchableOpacity
        key={milestone.id}
        onPress={() => handleMilestonePress(milestone)}
        style={{
          width: "48%",
          backgroundColor: "white",
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
        {/* Icon Section */}
        <View
          style={{
            width: "100%",
            aspectRatio: 1,
            backgroundColor: isUnlocked ? colors.primary + "15" : "#F5F5F0",
            borderRadius: 16,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 16,
          }}
        >
          {isUnlocked ? (
            <MilestoneIcon size={56} color={colors.primary} strokeWidth={2} />
          ) : (
            <Lock size={56} color="#D0D0CC" strokeWidth={2} />
          )}
        </View>

        {/* Title */}
        <Text
          style={{
            fontSize: 15,
            fontWeight: "700",
            color: "#1a1a1a",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {milestone.name}
        </Text>

        {/* Progress Text */}
        <Text
          style={{
            fontSize: 13,
            fontWeight: "500",
            color: "#999",
            textAlign: "center",
            marginBottom: 12,
          }}
        >
          {Math.min(milestone.current, milestone.target)}/{milestone.target}{" "}
          {getUnitText()}
        </Text>

        {/* Progress Bar */}
        <View
          style={{
            width: "100%",
            height: 8,
            backgroundColor: "#F0F0ED",
            borderRadius: 4,
            overflow: "hidden",
          }}
        >
          <LinearGradient
            colors={["#FB923C", "#FBBF24"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{
              width: `${progress}%`,
              height: "100%",
            }}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <BottomSheet
        ref={bottomSheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backgroundStyle={{
          backgroundColor: "#FFFFFF",
        }}
        handleIndicatorStyle={{
          backgroundColor: "#D0D0D0",
          width: 40,
        }}
      >
        <BottomSheetScrollView
          contentContainerStyle={{
            paddingHorizontal: 24,
            paddingBottom: 40,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Section */}
          <View
            style={{ alignItems: "center", marginTop: 20, marginBottom: 32 }}
          >
            {/* Flame Icon */}
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: "#FFF5F0",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <Flame size={60} color="#F0531C" fill="#F0531C" />
            </View>

            {/* Streak Number */}
            <Text
              style={{
                fontSize: 56,
                fontWeight: "800",
                color: "#09332C",
                marginBottom: 8,
              }}
            >
              {healthStreak}
            </Text>

            {/* Title */}
            <Text
              style={{
                fontSize: 24,
                fontWeight: "700",
                color: "#09332C",
                marginBottom: 12,
              }}
            >
              Day Streak
            </Text>

            {/* Encouraging Message */}
            <Text
              style={{
                fontSize: 14,
                fontWeight: "500",
                color: "#666",
                textAlign: "center",
                lineHeight: 22,
              }}
            >
              You are doing really great,{" "}
              {currentUser?.name?.split(" ")[0] || "there"}!
            </Text>
          </View>

          {/* Week Progress - Duolingo Style */}
          <View style={{ marginBottom: 24 }}>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "700",
                  color: "#09332C",
                }}
              >
                This Week
              </Text>
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "600",
                  color: "#666",
                }}
              >
                {completedDays}/7 days
              </Text>
            </View>

            {/* Days Grid - Duolingo Style */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                paddingHorizontal: 4,
              }}
            >
              {weekData.map((day, index) => (
                <View
                  key={index}
                  style={{
                    alignItems: "center",
                    width: 48,
                  }}
                >
                  {/* Day Letter */}
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: day.isToday ? "700" : "500",
                      color: day.isToday ? "#09332C" : "#999",
                      marginBottom: 12,
                    }}
                  >
                    {day.day}
                  </Text>

                  {/* Large Circle with Checkmark OR Day Number */}
                  {day.hasData ? (
                    <LinearGradient
                      colors={["#FB923C", "#F97316"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        width: 35,
                        height: 35,
                        borderRadius: 20,
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: "#F97316",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                      }}
                    >
                      <Check size={17} color="#FFFFFF" strokeWidth={3} />
                    </LinearGradient>
                  ) : (
                    <View
                      style={{
                        width: 35,
                        height: 35,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          fontSize: 20,
                          fontWeight: day.isToday ? "700" : "400",
                          color: day.isToday ? "#09332C" : "#D1D5DB",
                        }}
                      >
                        {day.dayNumber}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Your Stats Card - Duolingo Style */}
          <View
            style={{
              backgroundColor: "#F9FAFB",
              borderRadius: 20,
              padding: 24,
              marginBottom: 24,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text
              style={{
                fontSize: 16,
                fontWeight: "500",
                color: "#9CA3AF",
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              Your Stats
            </Text>

            {/* Stats Grid - 4 columns */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              {stats.map((stat, index) => (
                <View key={index} style={{ alignItems: "center", flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "500",
                      color: "#9CA3AF",
                      marginBottom: 8,
                    }}
                  >
                    {stat.label}
                  </Text>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "700",
                      color: "#1F2937",
                    }}
                  >
                    {stat.value}
                  </Text>
                </View>
              ))}
            </View>

            {/* Insights Button - Smaller */}
            <TouchableOpacity
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: 100,
                paddingVertical: 8,
                paddingHorizontal: 14,
                alignSelf: "center",
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.06,
                shadowRadius: 3,
                elevation: 2,
              }}
              onPress={() => {
                // TODO: Navigate to insights
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  fontWeight: "600",
                  color: "#A855F7",
                }}
              >
                ✨ 2 Insights Available
              </Text>
            </TouchableOpacity>
          </View>

          {/* Streak Repairs Section */}
          <TouchableOpacity
            onPress={() => repairsBottomSheetRef.current?.snapToIndex(0)}
            style={{
              backgroundColor: "#FEF3C7",
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
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
                  backgroundColor: "#FCD34D",
                  alignItems: "center",
                  justifyContent: "center",
                  marginRight: 16,
                }}
              >
                <Text style={{ fontSize: 24 }}>🛠️</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: "#1a1a1a",
                    marginBottom: 2,
                  }}
                >
                  Streak Repairs
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#92400E",
                    fontWeight: "500",
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

          {/* Milestones Section - Simplified Card Design */}
          <View style={{ marginBottom: 24 }}>
            {/* Section Header */}
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
                  fontSize: 22,
                  fontWeight: "700",
                  color: "#09332C",
                }}
              >
                Your Milestones
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: "#9CA3AF",
                }}
              >
                {unlockedCount}/{milestones.length}
              </Text>
            </View>

            {/* Milestones Grid - 2 columns */}
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
              }}
            >
              {milestones.map((milestone) => renderMilestoneCard(milestone))}
            </View>
          </View>

          {/* Motivational Footer */}
          <View
            style={{
              backgroundColor: "#FFF5F0",
              borderRadius: 12,
              padding: 16,
              alignItems: "center",
            }}
          >
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#F0531C",
                textAlign: "center",
                lineHeight: 20,
              }}
            >
              💪 Keep logging daily to maintain your streak!
            </Text>
          </View>
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Milestone Detail Modal */}
      <MilestoneModal
        visible={milestoneModalVisible}
        milestone={selectedMilestone}
        onClose={() => setMilestoneModalVisible(false)}
      />

      {/* Streak Repairs Bottom Sheet */}
      <StreakRepairsBottomSheet
        ref={repairsBottomSheetRef}
        onClose={() => repairsBottomSheetRef.current?.close()}
      />
    </>
  );
}
