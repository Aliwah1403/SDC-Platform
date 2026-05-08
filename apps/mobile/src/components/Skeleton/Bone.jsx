import { MotiView } from "moti";
import { useTheme } from "@/hooks/useTheme";

export function Bone({ width, height, borderRadius = 8, color, style }) {
  const t = useTheme();
  return (
    <MotiView
      from={{ opacity: 0.35 }}
      animate={{ opacity: 0.9 }}
      transition={{ type: "timing", duration: 750, loop: true, repeatReverse: true }}
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: color ?? (t.isDark ? t.surfaceElevated : "#E8DEDD"),
        },
        style,
      ]}
    />
  );
}
