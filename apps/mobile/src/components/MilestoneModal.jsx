import { View, Text, TouchableOpacity, ScrollView, Modal } from "react-native";
import {
  X,
  Sparkles,
  Trophy,
  Droplet,
  Heart,
  BookOpen,
  Target,
  Wrench,
  Zap,
  Clock,
} from "lucide-react-native";
import { StreakFireIcon } from "@/utils/streakFire";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MILESTONE_ICONS = {
  days: Trophy,
  streak: StreakFireIcon,
  symptoms: Target,
  hydration: Droplet,
  care: Heart,
  learning: BookOpen,
  repair: Wrench,
  restart: Zap,
  medications: Clock,
};

const MILESTONE_BADGE_IMAGES = {
  days:        require("../../assets/images/badges/badge-4.svg"),
  streak:      require("../../assets/images/badges/badge-2.svg"),
  symptoms:    require("../../assets/images/badges/badge-11.svg"),
  hydration:   require("../../assets/images/badges/badge-8.svg"),
  care:        require("../../assets/images/badges/badge-9.svg"),
  learning:    require("../../assets/images/badges/badge-10.svg"),
  repair:      require("../../assets/images/badges/badge-12.svg"),
  restart:     require("../../assets/images/badges/badge-13.svg"),
  medications: require("../../assets/images/badges/badge-14.svg"),
};

const MILESTONE_COLORS = {
  days: { primary: "#A9334D", secondary: "#C4566D", bg: "#FFF9F9" },
  streak: { primary: "#781D11", secondary: "#9B3628", bg: "#FFF9F9" },
  symptoms: { primary: "#D09F9A", secondary: "#B8827C", bg: "#F8E9E7" },
  hydration: { primary: "#2563EB", secondary: "#3B82F6", bg: "#EFF6FF" },
  care: { primary: "#A9334D", secondary: "#C4566D", bg: "#FFF9F9" },
  learning: { primary: "#059669", secondary: "#34D399", bg: "#ECFDF5" },
  repair: { primary: "#781D11", secondary: "#9B3628", bg: "#FFF9F9" },
  restart: { primary: "#A9334D", secondary: "#C4566D", bg: "#FFF9F9" },
  medications: { primary: "#059669", secondary: "#34D399", bg: "#ECFDF5" },
};

const RARITY_CONFIG = {
  Common: { color: "#9CA3AF" },
  Uncommon: { color: "#059669" },
  Rare: { color: "#2563EB" },
  Epic: { color: "#A9334D" },
  Legendary: { color: "#781D11" },
  Mythic: { color: "#D09F9A" },
};

export default function MilestoneModal({ visible, milestone, onClose }) {
  const insets = useSafeAreaInsets();

  // All hooks must be called unconditionally before any early return
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      rotateY.value = interpolate(e.translationX, [-150, 150], [-28, 28], Extrapolation.CLAMP);
      rotateX.value = interpolate(e.translationY, [-150, 150], [28, -28], Extrapolation.CLAMP);
    })
    .onEnd(() => {
      rotateX.value = withSpring(0, { damping: 14, stiffness: 140 });
      rotateY.value = withSpring(0, { damping: 14, stiffness: 140 });
    });

  const badgeAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
    ],
  }));

  const shineStyle = useAnimatedStyle(() => {
    const magnitude = Math.sqrt(rotateX.value ** 2 + rotateY.value ** 2);
    return {
      opacity: interpolate(magnitude, [0, 40], [0, 0.55], Extrapolation.CLAMP),
      transform: [
        { translateX: interpolate(rotateY.value, [-28, 28], [70, -70], Extrapolation.CLAMP) },
        { translateY: interpolate(rotateX.value, [-28, 28], [-70, 70], Extrapolation.CLAMP) },
      ],
    };
  });

  if (!milestone) return null;

  const Icon = MILESTONE_ICONS[milestone.type];
  const colors = MILESTONE_COLORS[milestone.type];
  const rarityInfo = RARITY_CONFIG[milestone.rarity];
  const badgeImage = milestone.image ?? MILESTONE_BADGE_IMAGES[milestone.type];

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

            {/* Milestone Badge — 3D tilt */}
            <GestureDetector gesture={panGesture}>
              <Animated.View
                style={[
                  {
                    width: 260,
                    height: 260,
                    alignSelf: "center",
                    marginBottom: 32,
                    opacity: milestone.unlocked ? 1 : 0.3,
                  },
                  badgeAnimStyle,
                ]}
              >
                <Image
                  source={badgeImage}
                  style={{ width: 260, height: 260 }}
                  contentFit="contain"
                />
                {/* Specular highlight overlay */}
                <Animated.View
                  pointerEvents="none"
                  style={[
                    {
                      position: "absolute",
                      width: 180,
                      height: 180,
                      borderRadius: 90,
                    },
                    shineStyle,
                  ]}
                >
                  <LinearGradient
                    colors={[
                      "rgba(255,255,255,0.65)",
                      "rgba(255,255,255,0.15)",
                      "transparent",
                    ]}
                    style={{ width: "100%", height: "100%", borderRadius: 90 }}
                    start={{ x: 0.1, y: 0.1 }}
                    end={{ x: 1, y: 1 }}
                  />
                </Animated.View>
              </Animated.View>
            </GestureDetector>

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
                  <View
                    style={{
                      width: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: rarityInfo.color,
                    }}
                  />
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
