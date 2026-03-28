import { useMemo, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, Dimensions } from "react-native";
import { Image } from "expo-image";
import { MotiView } from "moti";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width: SCREEN_W } = Dimensions.get("window");

const BADGE_MAP = {
  "streak-1":   require("../../assets/images/badges/badge-2.svg"),
  "streak-3":   require("../../assets/images/badges/badge-3.svg"),
  "streak-7":   require("../../assets/images/badges/badge-4.svg"),
  "streak-14":  require("../../assets/images/badges/badge-5.svg"),
  "streak-30":  require("../../assets/images/badges/badge-6.svg"),
  "streak-60":  require("../../assets/images/badges/badge-7.svg"),
  "streak-100": require("../../assets/images/badges/badge-7.svg"),
};


const CONFETTI_COLORS = ["#A9334D", "#F0531C", "#DC2626", "#F8E9E7", "#781D11"];

const CONFETTI_PIECES = Array.from({ length: 28 }, (_, i) => ({
  key: i,
  x: Math.random() * SCREEN_W,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 6 + Math.random() * 7,
  delay: Math.floor(Math.random() * 700),
  rotation: Math.floor(Math.random() * 360),
  duration: 1200 + Math.floor(Math.random() * 600),
}));

function ConfettiPiece({ x, color, size, delay, rotation, duration }) {
  return (
    <MotiView
      from={{ translateY: -20, opacity: 1, rotate: `${rotation}deg` }}
      animate={{ translateY: 680, opacity: 0, rotate: `${rotation + 180}deg` }}
      transition={{ type: "timing", duration, delay }}
      style={{
        position: "absolute",
        left: x,
        top: 0,
        width: size,
        height: size * 0.5,
        borderRadius: 2,
        backgroundColor: color,
      }}
    />
  );
}

function WeekStrip({ healthData }) {
  const days = useMemo(() => {
    const result = [];
    const today = new Date();
    const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      result.push({
        letter: DAY_LETTERS[d.getDay()],
        hasData: (healthData || []).some((entry) => entry.date === dateStr),
        isToday: i === 0,
      });
    }
    return result;
  }, [healthData]);

  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 8, marginVertical: 20 }}>
      {days.map((day, idx) => (
        <View key={idx} style={{ alignItems: "center", gap: 6 }}>
          <Text style={{ fontSize: 11, color: "#9CA3AF", fontFamily: "Geist-Medium" }}>
            {day.letter}
          </Text>
          <View
            style={{
              width: 30,
              height: 30,
              borderRadius: 15,
              backgroundColor: day.hasData ? "#A9334D" : "transparent",
              borderWidth: day.hasData ? 0 : 1.5,
              borderColor: "#D5CCC8",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {day.hasData && (
              <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#F8E9E7" }} />
            )}
          </View>
        </View>
      ))}
    </View>
  );
}

export default function StreakAchievementModal({ visible, milestone, healthData, onClaim }) {
  const insets = useSafeAreaInsets();
  const badgeScale = useSharedValue(0.7);

  useEffect(() => {
    if (visible) {
      badgeScale.value = withDelay(
        300,
        withSpring(1, { damping: 10, stiffness: 160 })
      );
    } else {
      badgeScale.value = 0.7;
    }
  }, [visible]);

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
  }));

  if (!milestone) return null;

  const badgeImage = BADGE_MAP[milestone.milestoneId];
  const isStreak = milestone.type === "streak";

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      {/* Scrim */}
      <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.6)", justifyContent: "center", alignItems: "center" }}>

        {/* Confetti layer */}
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }} pointerEvents="none">
          {CONFETTI_PIECES.map(({ key, ...p }) => (
            <ConfettiPiece key={key} {...p} />
          ))}
        </View>

        {/* Card slide-up */}
        <MotiView
          from={{ translateY: 60, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 18, stiffness: 180, delay: 80 }}
          style={{
            backgroundColor: "#fff",
            borderRadius: 28,
            width: SCREEN_W - 48,
            paddingTop: 36,
            paddingBottom: insets.bottom + 28,
            paddingHorizontal: 28,
            alignItems: "center",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.18,
            shadowRadius: 24,
            elevation: 16,
          }}
        >
          {/* Badge */}
          <Animated.View style={[badgeStyle, { marginBottom: 20 }]}>
            <View
              style={{
                width: 120,
                height: 120,
                borderRadius: 60,
                backgroundColor: "#F8E9E7",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {badgeImage ? (
                <Image source={badgeImage} style={{ width: 88, height: 88 }} contentFit="contain" />
              ) : (
                <Text style={{ fontSize: 48 }}>🏅</Text>
              )}
            </View>
          </Animated.View>

          {/* Headline */}
          <Text style={{ fontSize: 28, fontFamily: "Geist-Bold", color: "#1a1a1a", textAlign: "center", marginBottom: 8 }}>
            {milestone.title}
          </Text>

          {/* Subtitle */}
          <Text style={{ fontSize: 15, fontFamily: "Geist-Regular", color: "#9CA3AF", textAlign: "center", lineHeight: 22, marginBottom: 4 }}>
            {milestone.subtitle}
          </Text>

          {/* Week strip — only for streak milestones */}
          {isStreak && <WeekStrip healthData={healthData} />}

          {/* Claim button */}
          <TouchableOpacity
            onPress={onClaim}
            activeOpacity={0.85}
            style={{
              backgroundColor: "#A9334D",
              borderRadius: 16,
              width: "100%",
              paddingVertical: 16,
              alignItems: "center",
              marginTop: 4,
            }}
          >
            <Text style={{ fontSize: 17, fontFamily: "Geist-Bold", color: "#F8E9E7", letterSpacing: 0.3 }}>
              Claim!
            </Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    </Modal>
  );
}
