import React, { useMemo, useState } from "react";
import { View, Text, TouchableOpacity, Dimensions, ScrollView } from "react-native";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
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
  X,
  Award,
  Users,
  Star,
  Clock,
  Zap,
  Wrench,
} from "lucide-react-native";
import { useAppStore } from "@/store/appStore";
import { fonts } from "@/utils/fonts";
import { LinearGradient } from "expo-linear-gradient";
import MilestoneModal from "@/components/MilestoneModal";
import { mockBadges, mockChallenges } from "@/types";

const { width } = Dimensions.get("window");

const HEMO = {
  dark: "#781D11",
  wine: "#A9334D",
  rose: "#D09F9A",
  blush: "#F8E9E7",
};

const BADGE_IMAGES = {
  a: require("../../assets/images/badge-a.png"),
  b: require("../../assets/images/badge-b.png"),
  c: require("../../assets/images/badge-c.png"),
};

const RARITY_TO_BADGE = {
  Common: "a",
  Uncommon: "a",
  Rare: "b",
  Epic: "c",
  Legendary: "c",
};

export default function StreakModal() {
  const router = useRouter();
  const { currentUser, healthStreak, healthData, getWeeklyAverage } = useAppStore();
  const [selectedMilestone, setSelectedMilestone] = useState(null);
  const [milestoneModalVisible, setMilestoneModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("streaks"); // "streaks" | "rewards"
  const [activeRewardsTab, setActiveRewardsTab] = useState("challenges"); // "challenges" | "badges" | "leaderboard"

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

  const avgHydration = getWeeklyAverage("hydration");
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
      description: "Welcome to your health journey! Every great journey begins with a single step.",
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
      description: "You're building a habit! Consistency is the key to understanding your health patterns.",
      rarity: "Common",
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
      description: "Double digits! You're developing a strong tracking habit that will serve you well.",
      rarity: "Uncommon",
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
      description: "Your commitment is impressive! You're gathering valuable insights about your health.",
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
      description: "Incredible dedication! You're a true health champion with a wealth of data to guide you.",
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
      description: "A hundred days of commitment! You've built an unshakeable health tracking foundation.",
      rarity: "Legendary",
      unlocked: daysLogged >= 100,
      current: daysLogged,
    },
    {
      id: "streak-3",
      name: "Streak Starter",
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
      name: "Week Warrior",
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
      description: "Two weeks strong! You're proving that consistency pays off.",
      rarity: "Rare",
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
      description: "Your symptom data is becoming more valuable with each entry.",
      rarity: "Uncommon",
      unlocked: symptomsLogged >= 25,
      current: symptomsLogged,
    },
    {
      id: "hydration-7",
      name: "Hydration Hero",
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
      name: "Self-Care Starter",
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
  ];

  const unlockedCount = milestones.filter((m) => m.unlocked).length;

  const handleMilestonePress = (milestone) => {
    setSelectedMilestone(milestone);
    setMilestoneModalVisible(true);
  };

  const renderMilestoneCard = (milestone) => {
    const isUnlocked = milestone.unlocked;
    const progress = Math.min((milestone.current / milestone.target) * 100, 100);
    const badgeSource = BADGE_IMAGES[RARITY_TO_BADGE[milestone.rarity] ?? "a"];

    const MilestoneIcon = {
      days: Trophy,
      streak: Flame,
      symptoms: Target,
      hydration: Droplet,
      care: Heart,
      learning: BookOpen,
    }[milestone.type];

    const getUnitText = () => {
      if (["days", "streak", "hydration"].includes(milestone.type)) return "days";
      if (milestone.type === "symptoms") return "logged";
      if (milestone.type === "care") return "tasks";
      return "modules";
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
        {/* Badge image with overlay */}
        <View style={{ width: "100%", aspectRatio: 1, marginBottom: 16 }}>
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
          {isUnlocked ? (
            <View
              style={{
                position: "absolute",
                bottom: 6,
                right: 6,
                width: 28,
                height: 28,
                borderRadius: 14,
                backgroundColor: "rgba(255,255,255,0.9)",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <MilestoneIcon size={16} color={HEMO.wine} strokeWidth={2} />
            </View>
          ) : (
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
            color: "#1a1a1a",
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
            color: "#999",
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
            backgroundColor: "#FFF9F9",
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

  // ─── Rewards tab sub-components ───────────────────────────────────────────

  const leaderboardData = [
    { rank: 1, user: "Sarah M.", streak: 45, points: 2250 },
    { rank: 2, user: "Michael K.", streak: 38, points: 1980 },
    { rank: 3, user: "Jessica L.", streak: 35, points: 1850 },
    {
      rank: 4,
      user: currentUser?.name || "You",
      streak: healthStreak,
      points: healthStreak * 15 + 120,
      isCurrentUser: true,
    },
    { rank: 5, user: "David R.", streak: 28, points: 1420 },
    { rank: 6, user: "Emma S.", streak: 25, points: 1375 },
    { rank: 7, user: "Chris P.", streak: 22, points: 1180 },
  ];

  const getTypeColor = (type) => {
    switch (type) {
      case "daily": return "#059669";
      case "weekly": return HEMO.wine;
      case "monthly": return "#F59E0B";
      default: return "#6B7280";
    }
  };

  const RewardsProgressBar = ({ progress, target, color = HEMO.wine }) => {
    const percentage = Math.min((progress / target) * 100, 100);
    return (
      <View style={{ backgroundColor: HEMO.blush, borderRadius: 8, height: 8, overflow: "hidden", marginVertical: 8 }}>
        <View style={{ backgroundColor: color, height: "100%", width: `${percentage}%`, borderRadius: 8 }} />
      </View>
    );
  };

  const ChallengeCard = ({ challenge }) => {
    const isCompleted = challenge.progress >= challenge.target;
    const daysLeft = challenge.expiresAt
      ? Math.ceil((new Date(challenge.expiresAt) - new Date()) / (1000 * 60 * 60 * 24))
      : null;

    return (
      <View
        style={{
          backgroundColor: "#ffffff",
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: "#F3F4F6",
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.05,
          shadowRadius: 3,
          elevation: 2,
        }}
      >
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 4 }}>
              <View
                style={{
                  backgroundColor: `${getTypeColor(challenge.type)}15`,
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  marginRight: 8,
                }}
              >
                <Text style={{ fontFamily: fonts.medium, fontSize: 11, color: getTypeColor(challenge.type), textTransform: "capitalize" }}>
                  {challenge.type}
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Star size={14} color="#F59E0B" />
                <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: "#F59E0B", marginLeft: 2 }}>
                  {challenge.points} pts
                </Text>
              </View>
            </View>
            <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: "#111827", marginBottom: 4 }}>
              {challenge.title}
            </Text>
            <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: "#6B7280", lineHeight: 18 }}>
              {challenge.description}
            </Text>
          </View>
          {isCompleted && (
            <View style={{ backgroundColor: "#F0FDF4", borderRadius: 20, padding: 8, marginLeft: 12 }}>
              <Trophy size={16} color="#059669" />
            </View>
          )}
        </View>

        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: "#111827" }}>
            Progress: {challenge.progress}/{challenge.target}
          </Text>
          {daysLeft !== null && daysLeft > 0 && (
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Clock size={12} color="#6B7280" />
              <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#6B7280", marginLeft: 4 }}>
                {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
              </Text>
            </View>
          )}
        </View>
        <RewardsProgressBar
          progress={challenge.progress}
          target={challenge.target}
          color={isCompleted ? "#059669" : getTypeColor(challenge.type)}
        />
      </View>
    );
  };

  const BadgeCard = ({ badge, size = "normal" }) => {
    const cardWidth = size === "large" ? width * 0.4 : 120;
    const isUnlocked = badge.unlockedAt !== null;

    return (
      <View
        style={{
          backgroundColor: isUnlocked ? "#ffffff" : "#F9FAFB",
          borderRadius: 12,
          padding: size === "large" ? 20 : 16,
          marginRight: 12,
          width: cardWidth,
          alignItems: "center",
          borderWidth: 1,
          borderColor: isUnlocked ? HEMO.rose + "66" : "#E5E7EB",
          opacity: isUnlocked ? 1 : 0.6,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isUnlocked ? 0.05 : 0.02,
          shadowRadius: 3,
          elevation: isUnlocked ? 2 : 1,
        }}
      >
        <View style={{ marginBottom: size === "large" ? 12 : 8 }}>
          <badge.icon size={size === "large" ? 40 : 32} color={isUnlocked ? HEMO.wine : "#9CA3AF"} strokeWidth={1.5} />
        </View>
        <Text style={{ fontFamily: fonts.semibold, fontSize: size === "large" ? 14 : 12, color: "#111827", textAlign: "center", marginBottom: 4 }}>
          {badge.name}
        </Text>
        <Text style={{ fontFamily: fonts.regular, fontSize: size === "large" ? 12 : 10, color: "#6B7280", textAlign: "center", marginBottom: size === "large" ? 8 : 4, lineHeight: size === "large" ? 16 : 14 }}>
          {badge.description}
        </Text>
        {isUnlocked && badge.unlockedAt && (
          <Text style={{ fontFamily: fonts.medium, fontSize: 10, color: HEMO.wine }}>
            {new Date(badge.unlockedAt).toLocaleDateString()}
          </Text>
        )}
        {!isUnlocked && (
          <Text style={{ fontFamily: fonts.regular, fontSize: 10, color: "#9CA3AF", fontStyle: "italic" }}>
            Locked
          </Text>
        )}
      </View>
    );
  };

  const LeaderboardItem = ({ rank, user, streak, points, isCurrentUser = false }) => (
    <View
      style={{
        backgroundColor: isCurrentUser ? HEMO.blush : "#ffffff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: isCurrentUser ? HEMO.wine : "#F3F4F6",
        flexDirection: "row",
        alignItems: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1,
      }}
    >
      <View
        style={{
          backgroundColor: rank <= 3 ? "#F59E0B" : "#F3F4F6",
          borderRadius: 20,
          width: 32,
          height: 32,
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Text style={{ fontFamily: fonts.bold, fontSize: 14, color: rank <= 3 ? "#ffffff" : "#6B7280" }}>
          #{rank}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: "#111827", marginBottom: 2 }}>
          {user}{isCurrentUser ? " (You)" : ""}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginRight: 16 }}>
            <Zap size={14} color="#F59E0B" />
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#6B7280", marginLeft: 4 }}>
              {streak} day streak
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Star size={14} color="#F59E0B" />
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#6B7280", marginLeft: 4 }}>
              {points} pts
            </Text>
          </View>
        </View>
      </View>
      {rank <= 3 && <Trophy size={20} color="#F59E0B" />}
    </View>
  );

  const RewardsSubTabButton = ({ title, icon: Icon, isActive, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: isActive ? HEMO.dark : "transparent",
      }}
    >
      <Icon size={18} color={isActive ? HEMO.dark : "#6B7280"} />
      <Text style={{ fontFamily: isActive ? fonts.semibold : fonts.regular, fontSize: 14, color: isActive ? HEMO.dark : "#6B7280", marginLeft: 6 }}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
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
            backgroundColor: "#F3F4F6",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={20} color="#1F2937" />
        </TouchableOpacity>
      </View>

      {/* Top tab switcher: Streaks | Rewards */}
      <View
        style={{
          flexDirection: "row",
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
          marginHorizontal: 20,
        }}
      >
        {["streaks", "rewards"].map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={{
              flex: 1,
              paddingVertical: 14,
              alignItems: "center",
              borderBottomWidth: 2,
              borderBottomColor: activeTab === tab ? HEMO.dark : "transparent",
              marginBottom: -1,
            }}
          >
            <Text
              style={{
                fontFamily: activeTab === tab ? fonts.semibold : fonts.regular,
                fontSize: 15,
                color: activeTab === tab ? HEMO.dark : "#9CA3AF",
              }}
            >
              {tab === "streaks" ? "Streaks" : "Rewards"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "streaks" ? (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={{ alignItems: "center", marginTop: 8, marginBottom: 32 }}>
            <View
              style={{
                width: 100,
                height: 100,
                borderRadius: 50,
                backgroundColor: HEMO.blush,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 20,
              }}
            >
              <Flame size={60} color={HEMO.wine} fill={HEMO.wine} />
            </View>

            <Text style={{ fontFamily: fonts.extrabold, fontSize: 56, color: HEMO.dark, marginBottom: 8 }}>
              {healthStreak}
            </Text>

            <Text style={{ fontFamily: fonts.bold, fontSize: 24, marginBottom: 12 }}>
              Day Streak
            </Text>

            <Text style={{ fontFamily: fonts.medium, fontSize: 14, color: "#666", textAlign: "center", lineHeight: 22 }}>
              You are doing really great,{" "}
              {currentUser?.name?.split(" ")[0] || "there"}!
            </Text>
          </View>

          {/* Week Progress */}
          <View style={{ marginBottom: 24 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 17 }}>
                This Week
              </Text>
              <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: "#666" }}>
                {completedDays}/7 days
              </Text>
            </View>

            <View style={{ flexDirection: "row", justifyContent: "space-between", paddingHorizontal: 4 }}>
              {weekData.map((day, index) => (
                <View key={index} style={{ alignItems: "center", width: 48 }}>
                  <Text
                    style={{
                      fontFamily: day.isToday ? fonts.bold : fonts.medium,
                      fontSize: 14,
                      color: day.isToday ? HEMO.dark : "#999",
                      marginBottom: 12,
                    }}
                  >
                    {day.day}
                  </Text>

                  {day.hasData ? (
                    <LinearGradient
                      colors={[HEMO.rose, HEMO.wine]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={{
                        width: 35,
                        height: 35,
                        borderRadius: 20,
                        alignItems: "center",
                        justifyContent: "center",
                        shadowColor: HEMO.wine,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.3,
                        shadowRadius: 8,
                        elevation: 4,
                      }}
                    >
                      <Check size={17} color="#FFFFFF" strokeWidth={3} />
                    </LinearGradient>
                  ) : (
                    <View style={{ width: 35, height: 35, alignItems: "center", justifyContent: "center" }}>
                      <Text
                        style={{
                          fontFamily: day.isToday ? fonts.bold : fonts.regular,
                          fontSize: 20,
                          color: day.isToday ? HEMO.dark : "#D1D5DB",
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

          {/* Stats Card */}
          <View
            style={{
              backgroundColor: "#F9FAFB",
              borderRadius: 20,
              marginBottom: 24,
              marginTop: 20,
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <Text style={{ fontFamily: fonts.medium, fontSize: 16, color: "#9CA3AF", textAlign: "center", marginBottom: 24 }}>
              Your Stats
            </Text>

            <View style={{ flexDirection: "row", justifyContent: "space-between", marginBottom: 20 }}>
              {stats.map((stat, index) => (
                <React.Fragment key={index}>
                  {index > 0 && (
                    <View style={{ width: 1, height: 36, backgroundColor: "#E5E7EB", alignSelf: "center" }} />
                  )}
                  <View style={{ alignItems: "center", flex: 1 }}>
                    <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: "#9CA3AF", marginBottom: 8 }}>
                      {stat.label}
                    </Text>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: "#1F2937" }}>
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
                backgroundColor: "#FFFFFF",
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
              <Sparkles size={14} color={HEMO.wine} />
              <Text style={{ fontFamily: fonts.semibold, fontSize: 12, color: HEMO.wine }}>
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
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.05,
              shadowRadius: 8,
              elevation: 2,
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
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
                <Text style={{ fontFamily: fonts.bold, fontSize: 16, color: "#1a1a1a", marginBottom: 2 }}>
                  Streak Repairs
                </Text>
                <Text style={{ fontFamily: fonts.medium, fontSize: 13, color: "#92400E" }}>
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
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <Text style={{ fontFamily: fonts.bold, fontSize: 22, color: HEMO.dark }}>
                Your Milestones
              </Text>
              <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: "#9CA3AF" }}>
                {unlockedCount}/{milestones.length}
              </Text>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
              {milestones.map((milestone) => renderMilestoneCard(milestone))}
            </View>
          </View>

          {/* Footer */}
          <View style={{ backgroundColor: HEMO.blush, borderRadius: 12, padding: 16, alignItems: "center" }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Zap size={16} color={HEMO.wine} strokeWidth={2} />
              <Text style={{ fontFamily: fonts.semibold, fontSize: 14, color: HEMO.wine, textAlign: "center", lineHeight: 20 }}>
                Keep logging daily to maintain your streak!
              </Text>
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Points Banner */}
          <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 0 }}>
            <LinearGradient
              colors={[HEMO.wine, HEMO.dark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{
                borderRadius: 16,
                padding: 16,
                marginBottom: 20,
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: "#ffffff", marginBottom: 4 }}>
                  Total Points
                </Text>
                <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: HEMO.rose }}>
                  Keep logging to earn more!
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Star size={24} color="#F59E0B" />
                <Text style={{ fontFamily: fonts.bold, fontSize: 32, color: "#ffffff", marginLeft: 8 }}>
                  {healthStreak * 15 + 120}
                </Text>
              </View>
            </LinearGradient>

            {/* Rewards Sub-tab Navigation */}
            <View style={{ flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#F3F4F6" }}>
              <RewardsSubTabButton
                title="Challenges"
                icon={Target}
                isActive={activeRewardsTab === "challenges"}
                onPress={() => setActiveRewardsTab("challenges")}
              />
              <RewardsSubTabButton
                title="Badges"
                icon={Award}
                isActive={activeRewardsTab === "badges"}
                onPress={() => setActiveRewardsTab("badges")}
              />
              <RewardsSubTabButton
                title="Leaderboard"
                icon={Users}
                isActive={activeRewardsTab === "leaderboard"}
                onPress={() => setActiveRewardsTab("leaderboard")}
              />
            </View>
          </View>

          {/* Rewards Content */}
          <View style={{ padding: 20 }}>
            {activeRewardsTab === "challenges" && (
              <View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 18, color: "#111827" }}>
                    Active Challenges
                  </Text>
                  <View style={{ backgroundColor: HEMO.blush, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: HEMO.wine }}>
                      {mockChallenges.length} active
                    </Text>
                  </View>
                </View>

                {mockChallenges.map((challenge) => (
                  <ChallengeCard key={challenge.id} challenge={challenge} />
                ))}

                <View
                  style={{
                    backgroundColor: "#F0FDF4",
                    borderRadius: 12,
                    padding: 16,
                    marginTop: 8,
                    borderWidth: 1,
                    borderColor: "#BBF7D0",
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View style={{ backgroundColor: "#059669", borderRadius: 20, padding: 8, marginRight: 12 }}>
                    <Trophy size={20} color="#ffffff" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: "#059669", marginBottom: 2 }}>
                      5 Challenges Completed
                    </Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 13, color: "#16A34A" }}>
                      You've earned 175 total points!
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {activeRewardsTab === "badges" && (
              <View>
                <Text style={{ fontFamily: fonts.semibold, fontSize: 18, color: "#111827", marginBottom: 16 }}>
                  Achievement Badges
                </Text>

                <View style={{ marginBottom: 24 }}>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: "#111827", marginBottom: 12 }}>
                    Recently Unlocked
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingRight: 20 }}>
                    {mockBadges.filter((b) => b.unlockedAt).map((badge) => (
                      <BadgeCard key={badge.id} badge={badge} size="large" />
                    ))}
                  </ScrollView>
                </View>

                <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: "#111827", marginBottom: 12 }}>
                  All Badges
                </Text>
                <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" }}>
                  {mockBadges.map((badge) => (
                    <View key={badge.id} style={{ width: "48%", marginBottom: 12 }}>
                      <BadgeCard badge={badge} />
                    </View>
                  ))}
                </View>
              </View>
            )}

            {activeRewardsTab === "leaderboard" && (
              <View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 18, color: "#111827" }}>
                    Community Leaderboard
                  </Text>
                  <View style={{ backgroundColor: HEMO.blush, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 }}>
                    <Text style={{ fontFamily: fonts.medium, fontSize: 12, color: HEMO.wine }}>
                      This Week
                    </Text>
                  </View>
                </View>

                <Text style={{ fontFamily: fonts.regular, fontSize: 14, color: "#6B7280", marginBottom: 20, lineHeight: 20 }}>
                  Compete with others in the Hemo community! Rankings based on health tracking consistency and points earned.
                </Text>

                {leaderboardData.map((item, index) => (
                  <LeaderboardItem
                    key={index}
                    rank={item.rank}
                    user={item.user}
                    streak={item.streak}
                    points={item.points}
                    isCurrentUser={item.isCurrentUser}
                  />
                ))}

                <View
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 12,
                    padding: 16,
                    marginTop: 16,
                    borderWidth: 1,
                    borderColor: "#F3F4F6",
                  }}
                >
                  <Text style={{ fontFamily: fonts.semibold, fontSize: 16, color: "#111827", marginBottom: 12 }}>
                    Community Stats
                  </Text>
                  <View style={{ flexDirection: "row", justifyContent: "space-around" }}>
                    <View style={{ alignItems: "center" }}>
                      <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: HEMO.wine }}>1,247</Text>
                      <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#6B7280" }}>Active Users</Text>
                    </View>
                    <View style={{ alignItems: "center" }}>
                      <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: "#059669" }}>23.5</Text>
                      <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#6B7280" }}>Avg Streak</Text>
                    </View>
                    <View style={{ alignItems: "center" }}>
                      <Text style={{ fontFamily: fonts.bold, fontSize: 20, color: HEMO.wine }}>15,823</Text>
                      <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "#6B7280" }}>Total Logs</Text>
                    </View>
                  </View>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      )}

      <MilestoneModal
        visible={milestoneModalVisible}
        milestone={selectedMilestone}
        onClose={() => setMilestoneModalVisible(false)}
      />
    </SafeAreaView>
  );
}
