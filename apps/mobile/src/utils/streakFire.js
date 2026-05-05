import { Image } from "expo-image";

const STREAK_FIRE = require("../../assets/images/streak/streak-fire.png");

export function getStreakFireAsset() {
  return STREAK_FIRE;
}

export function StreakFireIcon({ size = 36 }) {
  return (
    <Image
      source={STREAK_FIRE}
      style={{ width: size, height: size }}
      contentFit="contain"
    />
  );
}
