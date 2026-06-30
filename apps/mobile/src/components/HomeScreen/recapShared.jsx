import { View, Text, TouchableOpacity, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { X } from "lucide-react-native";
import { fonts } from "@/utils/fonts";

const SCREEN_W = Dimensions.get("window").width;
export const CARD_GAP = 12;
export const CARD_WIDTH = SCREEN_W - 45; // 16px page padding + ~40px peek of next card

export function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function entryFor(healthData, d) {
  const entry = healthData.find((e) => e.date === toDateStr(d));
  return {
    painLevel: entry?.painLevel ?? 0,
    hydration: entry?.hydration ?? 0,
    mood: entry?.mood ?? 0,
  };
}

export function computeStats(data) {
  const daysLogged = data.filter(
    (d) => d.painLevel > 0 || d.hydration > 0 || d.mood > 0,
  ).length;
  const goodDays = data.filter((d) => d.painLevel > 0 && d.painLevel <= 3).length;

  const painDays = data.filter((d) => d.painLevel > 0);
  const avgPainLevel =
    painDays.length > 0
      ? (painDays.reduce((s, d) => s + d.painLevel, 0) / painDays.length).toFixed(1)
      : "—";

  const hydrationDays = data.filter((d) => d.hydration > 0);
  const avgHydration =
    hydrationDays.length > 0
      ? (hydrationDays.reduce((s, d) => s + d.hydration, 0) / hydrationDays.length).toFixed(1)
      : "—";

  let current = 0;
  let bestStreak = 0;
  data.forEach((d) => {
    if (d.painLevel > 0 && d.painLevel < 5) {
      current++;
      bestStreak = Math.max(bestStreak, current);
    } else if (d.painLevel >= 5) {
      current = 0;
    }
  });

  return { daysLogged, goodDays, avgPainLevel, avgHydration, bestStreak };
}

export function RecapCard({
  kicker,
  title,
  titleSize = 32,
  subtitle,
  gradient,
  badgeBg,
  badgeColor,
  onDismiss,
}) {
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: CARD_WIDTH, borderRadius: 22, overflow: "hidden" }}
    >
      {/* Abstract floating circles */}
      <View
        pointerEvents="none"
        style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
      >
        <View style={{ position: "absolute", top: -30, right: -20, width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(255,255,255,0.10)" }} />
        <View style={{ position: "absolute", top: 10, right: 90, width: 85, height: 85, borderRadius: 42, backgroundColor: "rgba(208,159,154,0.30)" }} />
        <View style={{ position: "absolute", top: -15, left: 40, width: 100, height: 100, borderRadius: 50, backgroundColor: "rgba(255,255,255,0.07)" }} />
        <View style={{ position: "absolute", top: 45, left: -25, width: 95, height: 95, borderRadius: 48, backgroundColor: "rgba(255,255,255,0.09)" }} />
        <View style={{ position: "absolute", top: 55, right: 10, width: 65, height: 65, borderRadius: 32, backgroundColor: "rgba(120,29,17,0.45)" }} />
        <View style={{ position: "absolute", top: 20, left: 130, width: 55, height: 55, borderRadius: 28, backgroundColor: "rgba(255,255,255,0.13)" }} />
      </View>

      {/* NEW badge */}
      <View
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          backgroundColor: badgeBg,
          borderRadius: 999,
          paddingHorizontal: 9,
          paddingVertical: 3,
        }}
      >
        <Text style={{ fontFamily: fonts.bold, fontSize: 9, letterSpacing: 0.8, color: badgeColor }}>
          NEW
        </Text>
      </View>

      {/* Dismiss */}
      <TouchableOpacity
        onPress={onDismiss}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityLabel="Dismiss recap"
        style={{ position: "absolute", top: 10, right: 10, zIndex: 2 }}
      >
        <X size={18} color="rgba(255,255,255,0.85)" />
      </TouchableOpacity>

      {/* Spacer — circles-only zone */}
      <View style={{ height: 96 }} />

      {/* Frosted glass panel */}
      <BlurView intensity={22} tint="dark" style={{ overflow: "hidden" }}>
        <View style={{ backgroundColor: "rgba(10,0,4,0.18)", paddingHorizontal: 16, paddingTop: 12, paddingBottom: 14 }}>
          <Text
            style={{
              fontFamily: fonts.semibold,
              fontSize: 10,
              letterSpacing: 1.2,
              color: "rgba(255,255,255,0.55)",
              marginBottom: 2,
            }}
          >
            {kicker}
          </Text>

          {/* Title */}
          <Text
            style={{ fontFamily: fonts.bold, fontSize: titleSize, color: "#FFFFFF", lineHeight: titleSize + 4, marginBottom: 2 }}
          >
            {title}
          </Text>

          <Text
            style={{ fontFamily: fonts.regular, fontSize: 13, color: "rgba(255,255,255,0.6)" }}
          >
            {subtitle}
          </Text>
        </View>
      </BlurView>
    </LinearGradient>
  );
}
