import { View, Text, TouchableOpacity, ScrollView, Modal } from "react-native";
import {
  X,
  Sparkles,
  Trophy,
  Flame,
  Droplet,
  Heart,
  BookOpen,
  Target,
} from "lucide-react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MILESTONE_ICONS = {
  days: Trophy,
  streak: Flame,
  symptoms: Target,
  hydration: Droplet,
  care: Heart,
  learning: BookOpen,
};

const MILESTONE_COLORS = {
  days: { primary: "#FF6B6B", secondary: "#FF8E8E", bg: "#FFF5F5" },
  streak: { primary: "#FF6B35", secondary: "#FF8F5C", bg: "#FFF6F0" },
  symptoms: { primary: "#9B59B6", secondary: "#B77DD4", bg: "#F8F3FF" },
  hydration: { primary: "#3498DB", secondary: "#5DADE2", bg: "#F0F8FF" },
  care: { primary: "#E91E63", secondary: "#F06292", bg: "#FFF0F5" },
  learning: { primary: "#2ECC71", secondary: "#58D68D", bg: "#F0FFF4" },
};

const RARITY_CONFIG = {
  Common: { color: "#9E9E9E", emoji: "⚪" },
  Uncommon: { color: "#4CAF50", emoji: "🟢" },
  Rare: { color: "#2196F3", emoji: "🔵" },
  Epic: { color: "#9C27B0", emoji: "🟣" },
  Legendary: { color: "#FF9800", emoji: "🟠" },
  Mythic: { color: "#F44336", emoji: "🔴" },
};

export default function MilestoneModal({ visible, milestone, onClose }) {
  const insets = useSafeAreaInsets();

  if (!milestone) return null;

  const Icon = MILESTONE_ICONS[milestone.type];
  const colors = MILESTONE_COLORS[milestone.type];
  const rarityInfo = RARITY_CONFIG[milestone.rarity];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
        <TouchableOpacity
          style={{ flex: 1 }}
          activeOpacity={1}
          onPress={onClose}
        />

        <View
          style={{
            backgroundColor: "#F5F5F0",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingTop: Math.max(insets.top, 24),
            paddingBottom: insets.bottom + 24,
          }}
        >
          {/* Close Button */}
          <TouchableOpacity
            onPress={onClose}
            style={{
              position: "absolute",
              top: Math.max(insets.top, 16) + 8,
              right: 16,
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#E0E0DD",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            <X size={20} color="#666" />
          </TouchableOpacity>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
          >
            {/* Title */}
            <Text
              style={{
                fontSize: 28,
                fontWeight: "700",
                color: "#1a1a1a",
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              {milestone.name}
            </Text>

            {/* Milestone Icon/Badge */}
            <View
              style={{
                width: "100%",
                aspectRatio: 1,
                maxWidth: 340,
                alignSelf: "center",
                borderRadius: 24,
                backgroundColor: colors.bg,
                alignItems: "center",
                justifyContent: "center",
                marginBottom: 32,
                borderWidth: 4,
                borderColor: milestone.unlocked ? colors.primary : "#D0D0CC",
                opacity: milestone.unlocked ? 1 : 0.5,
              }}
            >
              {milestone.unlocked && (
                <View
                  style={{
                    position: "absolute",
                    top: -12,
                    left: "50%",
                    marginLeft: -20,
                  }}
                >
                  <Text style={{ fontSize: 40 }}>⭐</Text>
                </View>
              )}

              <View
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: 80,
                  backgroundColor: milestone.unlocked
                    ? colors.primary
                    : "#D0D0CC",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Icon size={80} color="white" strokeWidth={2.5} />
              </View>

              <Text
                style={{
                  fontSize: 48,
                  fontWeight: "800",
                  color: milestone.unlocked ? colors.primary : "#999",
                  marginTop: 16,
                }}
              >
                {milestone.value}
              </Text>
            </View>

            {/* Info Cards */}
            <View style={{ gap: 12, marginBottom: 24 }}>
              {/* Description */}
              <View
                style={{
                  backgroundColor: "white",
                  borderRadius: 16,
                  padding: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#999",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Description
                </Text>
                <Text
                  style={{
                    fontSize: 16,
                    color: "#1a1a1a",
                    lineHeight: 24,
                  }}
                >
                  {milestone.description}
                </Text>
              </View>

              {/* Rarity */}
              <View
                style={{
                  backgroundColor: "white",
                  borderRadius: 16,
                  padding: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#999",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Rarity
                </Text>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Text style={{ fontSize: 20 }}>{rarityInfo.emoji}</Text>
                  <Text
                    style={{
                      fontSize: 16,
                      fontWeight: "600",
                      color: rarityInfo.color,
                    }}
                  >
                    {milestone.rarity}
                  </Text>
                </View>
              </View>

              {/* Achievement Requirement */}
              <View
                style={{
                  backgroundColor: "white",
                  borderRadius: 16,
                  padding: 20,
                }}
              >
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#999",
                    marginBottom: 8,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  Achievement Requirement
                </Text>
                <View
                  style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
                >
                  <Text style={{ fontSize: 20 }}>{milestone.emoji}</Text>
                  <Text
                    style={{
                      fontSize: 16,
                      color: "#1a1a1a",
                      fontWeight: "600",
                    }}
                  >
                    {milestone.requirement}
                  </Text>
                </View>
              </View>

              {/* Progress */}
              {!milestone.unlocked && milestone.progress !== undefined && (
                <View
                  style={{
                    backgroundColor: "white",
                    borderRadius: 16,
                    padding: 20,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 13,
                      fontWeight: "600",
                      color: "#999",
                      marginBottom: 12,
                      textTransform: "uppercase",
                      letterSpacing: 0.5,
                    }}
                  >
                    Progress
                  </Text>
                  <View
                    style={{
                      height: 8,
                      backgroundColor: "#F0F0ED",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: "100%",
                        width: `${milestone.progress}%`,
                        backgroundColor: colors.primary,
                      }}
                    />
                  </View>
                  <Text
                    style={{
                      fontSize: 14,
                      color: "#666",
                      marginTop: 8,
                      textAlign: "center",
                    }}
                  >
                    {milestone.progress}% Complete
                  </Text>
                </View>
              )}

              {/* Unlocked Status */}
              {milestone.unlocked && (
                <View
                  style={{
                    backgroundColor: colors.bg,
                    borderRadius: 16,
                    padding: 20,
                    borderWidth: 2,
                    borderColor: colors.primary,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                    }}
                  >
                    <Sparkles size={20} color={colors.primary} />
                    <Text
                      style={{
                        fontSize: 16,
                        fontWeight: "700",
                        color: colors.primary,
                      }}
                    >
                      Achievement Unlocked!
                    </Text>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
