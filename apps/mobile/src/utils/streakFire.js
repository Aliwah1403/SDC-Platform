import { Image } from "expo-image";
import { useStreakQuery } from "@/hooks/queries/useStreakQuery";

const STREAK_FIRES = [
  require("../../assets/images/streak/1.svg"),
  require("../../assets/images/streak/2.svg"),
  require("../../assets/images/streak/3.svg"),
  require("../../assets/images/streak/4.svg"),
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
  const { data: streak } = useStreakQuery();
  const healthStreak = streak?.currentStreak ?? 0;
  return (
    <Image
      source={getStreakFireAsset(healthStreak)}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}
