import { useMemo, useEffect } from "react";
import { View, Text, TouchableOpacity, Modal, Dimensions, StatusBar } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { MotiView } from "moti";
import { Sparkles } from "lucide-react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { fonts } from "@/utils/fonts";

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

// ── Badge images ─────────────────────────────────────────────────────────────

const BADGE_MAP = {
  "streak-1":      require("../../assets/images/badges/first-streak.svg"),
  "streak-3":      require("../../assets/images/badges/on-track.svg"),
  "streak-7":      require("../../assets/images/badges/habit-builder.png"),
  "streak-14":     require("../../assets/images/badges/fortnight-fighter.svg"),
  "streak-30":     require("../../assets/images/badges/monthly-monster.svg"),
  "streak-60":     require("../../assets/images/badges/dedicated-tracker.svg"),
  "days-1":        require("../../assets/images/badges/first-streak.svg"),
  "days-5":        require("../../assets/images/badges/getting-started.svg"),
  "symptoms-10":   require("../../assets/images/badges/pattern-seeker.svg"),
  "hydration-7":   require("../../assets/images/badges/hydration-junkie.png"),
  // TODO: add images for days-10, days-25, days-50, days-100, symptoms-25
};

// ── Confetti ──────────────────────────────────────────────────────────────────

const CONFETTI_COLORS = ["#A9334D", "#F0531C", "#DC2626", "#F8E9E7", "#781D11", "#D09F9A"];

const CONFETTI_PIECES = Array.from({ length: 36 }, (_, i) => ({
  key: i,
  x: (i / 36) * SCREEN_W + (Math.random() - 0.5) * 40,
  color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
  size: 5 + Math.random() * 8,
  delay: Math.floor(Math.random() * 800),
  rotation: Math.floor(Math.random() * 360),
  duration: 1400 + Math.floor(Math.random() * 800),
  isRect: Math.random() > 0.5,
}));

function ConfettiPiece({ x, color, size, delay, rotation, duration, isRect }) {
  return (
    <MotiView
      from={{ translateY: -30, opacity: 1, rotate: `${rotation}deg` }}
      animate={{ translateY: SCREEN_H * 0.65, opacity: 0, rotate: `${rotation + 270}deg` }}
      transition={{ type: "timing", duration, delay }}
      style={{
        position: "absolute",
        left: x,
        top: 0,
        width: isRect ? size : size * 0.6,
        height: isRect ? size * 0.45 : size,
        borderRadius: isRect ? 2 : size / 2,
        backgroundColor: color,
      }}
    />
  );
}

// ── Week strip ────────────────────────────────────────────────────────────────

function WeekStrip({ healthData }) {
  const days = useMemo(() => {
    const today = new Date();
    const DAY_LETTERS = ["S", "M", "T", "W", "T", "F", "S"];
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const dateStr = d.toISOString().split("T")[0];
      return {
        letter: DAY_LETTERS[d.getDay()],
        hasData: (healthData || []).some((e) => e.date === dateStr),
        isToday: i === 6,
      };
    });
  }, [healthData]);

  return (
    <View style={{ flexDirection: "row", justifyContent: "center", gap: 6, marginBottom: 24 }}>
      {days.map((day, idx) => (
        <View key={idx} style={{ alignItems: "center", gap: 5 }}>
          <Text style={{ fontSize: 10, color: "#9CA3AF", fontFamily: fonts.semibold }}>
            {day.letter}
          </Text>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: day.hasData ? "#09332C" : "transparent",
              borderWidth: day.hasData ? 0 : 1.5,
              borderColor: "#E5E0DB",
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

// ── Main component ────────────────────────────────────────────────────────────

export default function StreakAchievementModal({ visible, milestone, healthData, onClaim }) {
  const insets = useSafeAreaInsets();

  // Badge spring entrance
  const badgeScale = useSharedValue(0.5);
  const badgeOpacity = useSharedValue(0);

  // 3D tilt (same as MilestoneModal)
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      rotateY.value = interpolate(e.translationX, [-150, 150], [-25, 25], Extrapolation.CLAMP);
      rotateX.value = interpolate(e.translationY, [-150, 150], [25, -25], Extrapolation.CLAMP);
    })
    .onEnd(() => {
      rotateX.value = withSpring(0, { damping: 14, stiffness: 140 });
      rotateY.value = withSpring(0, { damping: 14, stiffness: 140 });
    });

  const badgeTiltStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 800 },
      { rotateX: `${rotateX.value}deg` },
      { rotateY: `${rotateY.value}deg` },
    ],
  }));

  const shineStyle = useAnimatedStyle(() => {
    const mag = Math.sqrt(rotateX.value ** 2 + rotateY.value ** 2);
    return {
      opacity: interpolate(mag, [0, 35], [0, 0.5], Extrapolation.CLAMP),
      transform: [
        { translateX: interpolate(rotateY.value, [-25, 25], [60, -60], Extrapolation.CLAMP) },
        { translateY: interpolate(rotateX.value, [-25, 25], [-60, 60], Extrapolation.CLAMP) },
      ],
    };
  });

  const badgeEntranceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badgeScale.value }],
    opacity: badgeOpacity.value,
  }));

  useEffect(() => {
    if (visible) {
      badgeScale.value = withDelay(250, withSpring(1, { damping: 11, stiffness: 170 }));
      badgeOpacity.value = withDelay(200, withSpring(1, { damping: 20 }));
    } else {
      badgeScale.value = 0.5;
      badgeOpacity.value = 0;
      rotateX.value = 0;
      rotateY.value = 0;
    }
  }, [visible]);

  if (!milestone) return null;

  const badgeImage = BADGE_MAP[milestone.milestoneId];
  const isStreak = milestone.type === "streak";

  return (
    <Modal
      visible={visible}
      transparent={false}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClaim}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={{ flex: 1, backgroundColor: "#781D11" }}>
        {/* ── Gradient hero section ── */}
        <LinearGradient
          colors={["#4A1309", "#781D11", "#A9334D", "#D09F9A"]}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
        >
          {/* Decorative circles */}
          <View style={{ position: "absolute", width: 300, height: 300, borderRadius: 150, borderWidth: 1, borderColor: "rgba(248,233,231,0.08)", top: insets.top + 20, right: -80 }} />
          <View style={{ position: "absolute", width: 200, height: 200, borderRadius: 100, borderWidth: 1, borderColor: "rgba(248,233,231,0.06)", bottom: 40, left: -60 }} />
          <View style={{ position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(248,233,231,0.04)", top: insets.top + 60, left: 30 }} />

          {/* Confetti — only in hero area */}
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" }} pointerEvents="none">
            {CONFETTI_PIECES.map(({ key, ...p }) => (
              <ConfettiPiece key={key} {...p} />
            ))}
          </View>

          {/* "NEW ACHIEVEMENT" label */}
          <MotiView
            from={{ opacity: 0, translateY: -10 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ type: "timing", duration: 400, delay: 100 }}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: "rgba(248,233,231,0.12)",
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 6,
              marginBottom: 32,
            }}
          >
            <Sparkles size={13} color="#F8E9E7" strokeWidth={2} />
            <Text style={{ fontFamily: fonts.bold, fontSize: 12, color: "#F8E9E7", letterSpacing: 1.5, textTransform: "uppercase" }}>
              Achievement Unlocked
            </Text>
          </MotiView>

          {/* Badge */}
          <Animated.View style={badgeEntranceStyle}>
            <GestureDetector gesture={panGesture}>
              <Animated.View style={[{ width: 200, height: 200 }, badgeTiltStyle]}>
                {/* Glow ring */}
                <View
                  style={{
                    position: "absolute",
                    width: 220,
                    height: 220,
                    borderRadius: 110,
                    backgroundColor: "rgba(248,233,231,0.1)",
                    top: -10,
                    left: -10,
                  }}
                />
                <View
                  style={{
                    position: "absolute",
                    width: 240,
                    height: 240,
                    borderRadius: 120,
                    backgroundColor: "rgba(248,233,231,0.05)",
                    top: -20,
                    left: -20,
                  }}
                />

                {badgeImage ? (
                  <Image
                    source={badgeImage}
                    style={{ width: 200, height: 200 }}
                    contentFit="contain"
                  />
                ) : (
                  <View style={{ width: 200, height: 200, borderRadius: 100, backgroundColor: "#A9334D", alignItems: "center", justifyContent: "center", borderWidth: 3, borderColor: "rgba(248,233,231,0.3)" }}>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: "#F8E9E7", letterSpacing: 1, textTransform: "uppercase" }}>No Image</Text>
                    <Text style={{ fontFamily: fonts.regular, fontSize: 11, color: "rgba(248,233,231,0.6)", marginTop: 4 }}>{milestone.milestoneId}</Text>
                  </View>
                )}

                {/* Specular highlight */}
                <Animated.View
                  pointerEvents="none"
                  style={[{ position: "absolute", width: 140, height: 140, borderRadius: 70 }, shineStyle]}
                >
                  <LinearGradient
                    colors={["rgba(255,255,255,0.6)", "rgba(255,255,255,0.1)", "transparent"]}
                    style={{ width: "100%", height: "100%", borderRadius: 70 }}
                    start={{ x: 0.1, y: 0.1 }}
                    end={{ x: 1, y: 1 }}
                  />
                </Animated.View>
              </Animated.View>
            </GestureDetector>
          </Animated.View>

          {/* Drag hint */}
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "timing", duration: 500, delay: 900 }}
            style={{ marginTop: 16 }}
          >
            <Text style={{ fontFamily: fonts.regular, fontSize: 12, color: "rgba(248,233,231,0.45)", letterSpacing: 0.5 }}>
              Drag to tilt
            </Text>
          </MotiView>
        </LinearGradient>

        {/* ── Content card ── */}
        <MotiView
          from={{ translateY: 40, opacity: 0 }}
          animate={{ translateY: 0, opacity: 1 }}
          transition={{ type: "spring", damping: 20, stiffness: 180, delay: 150 }}
          style={{
            backgroundColor: "#F8F4F0",
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            paddingTop: 28,
            paddingHorizontal: 28,
            paddingBottom: insets.bottom + 24,
            marginTop: -24,
          }}
        >
          {/* Title */}
          <Text style={{ fontFamily: fonts.extrabold, fontSize: 30, color: "#09332C", textAlign: "center", marginBottom: 8, letterSpacing: -0.5 }}>
            {milestone.title}
          </Text>

          {/* Subtitle */}
          <Text style={{ fontFamily: fonts.regular, fontSize: 15, color: "#9CA3AF", textAlign: "center", lineHeight: 22, marginBottom: 20 }}>
            {milestone.subtitle}
          </Text>

          {/* Week strip for streak milestones */}
          {isStreak && <WeekStrip healthData={healthData} />}

          {/* Claim CTA */}
          <TouchableOpacity
            onPress={onClaim}
            activeOpacity={0.88}
            style={{
              backgroundColor: "#F0531C",
              borderRadius: 18,
              paddingVertical: 17,
              alignItems: "center",
            }}
          >
            <Text style={{ fontFamily: fonts.bold, fontSize: 17, color: "#fff", letterSpacing: 0.3 }}>
              Claim Reward
            </Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    </Modal>
  );
}
