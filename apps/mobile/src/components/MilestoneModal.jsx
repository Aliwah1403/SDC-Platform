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
  Star,
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
  days:      { primary: "#A9334D", secondary: "#C4566D", bg: "#FFF9F9" },
  streak:    { primary: "#781D11", secondary: "#9B3628", bg: "#FFF9F9" },
  symptoms:  { primary: "#D09F9A", secondary: "#B8827C", bg: "#F8E9E7" },
  hydration: { primary: "#2563EB", secondary: "#3B82F6", bg: "#EFF6FF" },
  care:      { primary: "#A9334D", secondary: "#C4566D", bg: "#FFF9F9" },
  learning:  { primary: "#059669", secondary: "#34D399", bg: "#ECFDF5" },
};

const RARITY_CONFIG = {
  Common:    { color: "#9CA3AF" },
  Uncommon:  { color: "#059669" },
  Rare:      { color: "#2563EB" },
  Epic:      { color: "#A9334D" },
  Legendary: { color: "#781D11" },
  Mythic:    { color: "#D09F9A" },
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
            backgroundColor: "#FFF9F9",
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
                borderColor: milestone.unlocked ? colors.primary : "#D09F9A",
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
                  <Star size={40} color="#F59E0B" />
                </View>
              )}

              <View
                style={{
                  width: 160,
                  height: 160,
                  borderRadius: 80,
                  backgroundColor: milestone.unlocked
                    ? colors.primary
                    : "#D09F9A",
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
                  <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: rarityInfo.color }} />
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
                  <Icon size={20} color={colors.primary} strokeWidth={2} />
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
                      backgroundColor: "#FFF9F9",
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
