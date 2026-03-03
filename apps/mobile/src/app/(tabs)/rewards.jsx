import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Award,
  Trophy,
  Target,
  Clock,
  Users,
  Star,
  Gift,
  TrendingUp,
  Calendar,
  Zap,
} from "lucide-react-native";
import { useAppStore } from "../../store/appStore";
import { mockBadges, mockChallenges } from "../../types";

const { width } = Dimensions.get("window");

export default function RewardsScreen() {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState("challenges"); // challenges, badges, leaderboard

  const { currentUser, healthStreak } = useAppStore();

  const TabButton = ({ title, isActive, onPress, icon: Icon }) => (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
        borderBottomWidth: 2,
        borderBottomColor: isActive ? "#DC2626" : "transparent",
      }}
    >
      <Icon size={18} color={isActive ? "#DC2626" : "#6B7280"} />
      <Text
        style={{
          fontSize: 14,
          fontWeight: isActive ? "600" : "400",
          color: isActive ? "#DC2626" : "#6B7280",
          marginLeft: 6,
        }}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );

  const ProgressBar = ({ progress, target, color = "#DC2626" }) => {
    const percentage = Math.min((progress / target) * 100, 100);

    return (
      <View
        style={{
          backgroundColor: "#F3F4F6",
          borderRadius: 8,
          height: 8,
          overflow: "hidden",
          marginVertical: 8,
        }}
      >
        <View
          style={{
            backgroundColor: color,
            height: "100%",
            width: `${percentage}%`,
            borderRadius: 8,
          }}
        />
      </View>
    );
  };

  const ChallengeCard = ({ challenge }) => {
    const isCompleted = challenge.progress >= challenge.target;
    const daysLeft = challenge.expiresAt
      ? Math.ceil(
          (new Date(challenge.expiresAt) - new Date()) / (1000 * 60 * 60 * 24),
        )
      : null;

    const getTypeColor = (type) => {
      switch (type) {
        case "daily":
          return "#059669";
        case "weekly":
          return "#7C3AED";
        case "monthly":
          return "#F59E0B";
        default:
          return "#6B7280";
      }
    };

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
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 12,
          }}
        >
          <View style={{ flex: 1 }}>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                marginBottom: 4,
              }}
            >
              <View
                style={{
                  backgroundColor: `${getTypeColor(challenge.type)}15`,
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  marginRight: 8,
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: "500",
                    color: getTypeColor(challenge.type),
                    textTransform: "capitalize",
                  }}
                >
                  {challenge.type}
                </Text>
              </View>

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                }}
              >
                <Star size={14} color="#F59E0B" />
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "500",
                    color: "#F59E0B",
                    marginLeft: 2,
                  }}
                >
                  {challenge.points} pts
                </Text>
              </View>
            </View>

            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#111827",
                marginBottom: 4,
              }}
            >
              {challenge.title}
            </Text>

            <Text
              style={{
                fontSize: 13,
                color: "#6B7280",
                lineHeight: 18,
              }}
            >
              {challenge.description}
            </Text>
          </View>

          {isCompleted && (
            <View
              style={{
                backgroundColor: "#F0FDF4",
                borderRadius: 20,
                padding: 8,
                marginLeft: 12,
              }}
            >
              <Trophy size={16} color="#059669" />
            </View>
          )}
        </View>

        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 8,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: "500",
              color: "#111827",
            }}
          >
            Progress: {challenge.progress}/{challenge.target}
          </Text>

          {daysLeft !== null && daysLeft > 0 && (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <Clock size={12} color="#6B7280" />
              <Text
                style={{
                  fontSize: 12,
                  color: "#6B7280",
                  marginLeft: 4,
                }}
              >
                {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
              </Text>
            </View>
          )}
        </View>

        <ProgressBar
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
          borderColor: isUnlocked ? "#F3F4F6" : "#E5E7EB",
          opacity: isUnlocked ? 1 : 0.6,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isUnlocked ? 0.05 : 0.02,
          shadowRadius: 3,
          elevation: isUnlocked ? 2 : 1,
        }}
      >
        <Text
          style={{
            fontSize: size === "large" ? 40 : 32,
            marginBottom: size === "large" ? 12 : 8,
          }}
        >
          {badge.icon}
        </Text>

        <Text
          style={{
            fontSize: size === "large" ? 14 : 12,
            fontWeight: "600",
            color: "#111827",
            textAlign: "center",
            marginBottom: 4,
          }}
        >
          {badge.name}
        </Text>

        <Text
          style={{
            fontSize: size === "large" ? 12 : 10,
            color: "#6B7280",
            textAlign: "center",
            marginBottom: size === "large" ? 8 : 4,
            lineHeight: size === "large" ? 16 : 14,
          }}
        >
          {badge.description}
        </Text>

        {isUnlocked && badge.unlockedAt && (
          <Text
            style={{
              fontSize: 10,
              color: "#059669",
              fontWeight: "500",
            }}
          >
            {new Date(badge.unlockedAt).toLocaleDateString()}
          </Text>
        )}

        {!isUnlocked && (
          <Text
            style={{
              fontSize: 10,
              color: "#9CA3AF",
              fontStyle: "italic",
            }}
          >
            Locked
          </Text>
        )}
      </View>
    );
  };

  const LeaderboardItem = ({
    rank,
    user,
    streak,
    points,
    isCurrentUser = false,
  }) => (
    <View
      style={{
        backgroundColor: isCurrentUser ? "#FEF3F2" : "#ffffff",
        borderRadius: 12,
        padding: 16,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: isCurrentUser ? "#DC2626" : "#F3F4F6",
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
        <Text
          style={{
            fontSize: 14,
            fontWeight: "bold",
            color: rank <= 3 ? "#ffffff" : "#6B7280",
          }}
        >
          #{rank}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 16,
            fontWeight: "600",
            color: "#111827",
            marginBottom: 2,
          }}
        >
          {user}
          {isCurrentUser ? " (You)" : ""}
        </Text>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginRight: 16,
            }}
          >
            <Zap size={14} color="#F59E0B" />
            <Text
              style={{
                fontSize: 12,
                color: "#6B7280",
                marginLeft: 4,
              }}
            >
              {streak} day streak
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Star size={14} color="#F59E0B" />
            <Text
              style={{
                fontSize: 12,
                color: "#6B7280",
                marginLeft: 4,
              }}
            >
              {points} pts
            </Text>
          </View>
        </View>
      </View>

      {rank <= 3 && <Trophy size={20} color="#F59E0B" />}
    </View>
  );

  // Mock leaderboard data
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

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar style="dark" />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 20,
          paddingBottom: 0,
          backgroundColor: "#ffffff",
          borderBottomWidth: 1,
          borderBottomColor: "#F3F4F6",
        }}
      >
        <Text
          style={{
            fontSize: 28,
            fontWeight: "bold",
            color: "#111827",
            marginBottom: 4,
          }}
        >
          Rewards
        </Text>

        <Text
          style={{
            fontSize: 16,
            color: "#6B7280",
            marginBottom: 20,
          }}
        >
          Track your progress and achievements
        </Text>

        {/* Current Points Banner */}
        <View
          style={{
            backgroundColor: "#DC2626",
            borderRadius: 16,
            padding: 16,
            marginBottom: 20,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#ffffff",
                marginBottom: 4,
              }}
            >
              Total Points
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: "#FCA5A5",
              }}
            >
              Keep logging to earn more!
            </Text>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <Star size={24} color="#F59E0B" />
            <Text
              style={{
                fontSize: 32,
                fontWeight: "bold",
                color: "#ffffff",
                marginLeft: 8,
              }}
            >
              {healthStreak * 15 + 120}
            </Text>
          </View>
        </View>

        {/* Tab Navigation */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: "#ffffff",
          }}
        >
          <TabButton
            title="Challenges"
            icon={Target}
            isActive={activeTab === "challenges"}
            onPress={() => setActiveTab("challenges")}
          />
          <TabButton
            title="Badges"
            icon={Award}
            isActive={activeTab === "badges"}
            onPress={() => setActiveTab("badges")}
          />
          <TabButton
            title="Leaderboard"
            icon={Users}
            isActive={activeTab === "leaderboard"}
            onPress={() => setActiveTab("leaderboard")}
          />
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          padding: 20,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "challenges" && (
          <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Active Challenges
              </Text>

              <View
                style={{
                  backgroundColor: "#FEF3F2",
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: "#DC2626",
                    fontWeight: "500",
                  }}
                >
                  {mockChallenges.length} active
                </Text>
              </View>
            </View>

            {mockChallenges.map((challenge) => (
              <ChallengeCard key={challenge.id} challenge={challenge} />
            ))}

            {/* Completed Challenges Teaser */}
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
              <View
                style={{
                  backgroundColor: "#059669",
                  borderRadius: 20,
                  padding: 8,
                  marginRight: 12,
                }}
              >
                <Trophy size={20} color="#ffffff" />
              </View>

              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: "#059669",
                    marginBottom: 2,
                  }}
                >
                  5 Challenges Completed
                </Text>
                <Text
                  style={{
                    fontSize: 13,
                    color: "#16A34A",
                  }}
                >
                  You've earned 175 total points!
                </Text>
              </View>
            </View>
          </View>
        )}

        {activeTab === "badges" && (
          <View>
            <Text
              style={{
                fontSize: 18,
                fontWeight: "600",
                color: "#111827",
                marginBottom: 16,
              }}
            >
              Achievement Badges
            </Text>

            {/* Featured/Recent Badge */}
            <View
              style={{
                marginBottom: 24,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: 12,
                }}
              >
                Recently Unlocked
              </Text>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 20 }}
              >
                {mockBadges
                  .filter((b) => b.unlockedAt)
                  .map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} size="large" />
                  ))}
              </ScrollView>
            </View>

            {/* All Badges Grid */}
            <Text
              style={{
                fontSize: 16,
                fontWeight: "600",
                color: "#111827",
                marginBottom: 12,
              }}
            >
              All Badges
            </Text>

            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                justifyContent: "space-between",
              }}
            >
              {mockBadges.map((badge) => (
                <View key={badge.id} style={{ width: "48%", marginBottom: 12 }}>
                  <BadgeCard badge={badge} />
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === "leaderboard" && (
          <View>
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "600",
                  color: "#111827",
                }}
              >
                Community Leaderboard
              </Text>

              <View
                style={{
                  backgroundColor: "#FEF3F2",
                  borderRadius: 6,
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    color: "#DC2626",
                    fontWeight: "500",
                  }}
                >
                  This Week
                </Text>
              </View>
            </View>

            <Text
              style={{
                fontSize: 14,
                color: "#6B7280",
                marginBottom: 20,
                lineHeight: 20,
              }}
            >
              Compete with others in the SickleCell Compass community! Rankings
              based on health tracking consistency and points earned.
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

            {/* Community Stats */}
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
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: "600",
                  color: "#111827",
                  marginBottom: 12,
                }}
              >
                Community Stats
              </Text>

              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-around",
                }}
              >
                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: "#DC2626",
                    }}
                  >
                    1,247
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#6B7280",
                    }}
                  >
                    Active Users
                  </Text>
                </View>

                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: "#059669",
                    }}
                  >
                    23.5
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#6B7280",
                    }}
                  >
                    Avg Streak
                  </Text>
                </View>

                <View style={{ alignItems: "center" }}>
                  <Text
                    style={{
                      fontSize: 20,
                      fontWeight: "bold",
                      color: "#7C3AED",
                    }}
                  >
                    15,823
                  </Text>
                  <Text
                    style={{
                      fontSize: 12,
                      color: "#6B7280",
                    }}
                  >
                    Total Logs
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
