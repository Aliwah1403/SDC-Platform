import { Image } from "expo-image";
import { useAppStore } from "@/store/appStore";

const STREAK_FIRES = [
  require("../../assets/images/streak/1.png"),
  require("../../assets/images/streak/2.png"),
  require("../../assets/images/streak/3.png"),
  require("../../assets/images/streak/4.png"),
];

export function getStreakFireAsset(streakCount) {
  if (streakCount >= 90) return STREAK_FIRES[3];
  if (streakCount >= 30) return STREAK_FIRES[2];
  if (streakCount >= 8) return STREAK_FIRES[1];
  return STREAK_FIRES[0];
}

/**
 * Drop-in replacement for the lucide <Flame> icon in streak contexts.
 * Reads the current streak from Zustand and renders the appropriate custom SVG.
 * Accepts `size`, `color`, `strokeWidth` props to match the lucide icon API (color/strokeWidth are unused).
 */
export function StreakFireIcon({ size = 36 }) {
  const healthStreak = useAppStore((s) => s.healthStreak);
  return (
    <Image
      source={getStreakFireAsset(healthStreak)}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}
