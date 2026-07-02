import { View, TouchableOpacity } from "react-native";
import { useTheme } from "@/hooks/useTheme";

const SHADOW = {
  shadowColor: "#000000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.06,
  shadowRadius: 8,
  elevation: 2,
};

// variant: "default" (bordered + shadow), "subtle" (bordered, no shadow, tinted bg), "flush" (no border/shadow)
export function Card({ variant = "default", onPress, style, children, ...rest }) {
  const t = useTheme();

  const variantStyle =
    variant === "subtle"
      ? { backgroundColor: t.background, borderWidth: 1, borderColor: t.border }
      : variant === "flush"
      ? { backgroundColor: "transparent" }
      : { backgroundColor: t.surface, borderWidth: 1, borderColor: t.border, ...SHADOW };

  const combinedStyle = [{ borderRadius: 20 }, variantStyle, style];

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.9} onPress={onPress} style={combinedStyle} {...rest}>
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={combinedStyle} {...rest}>
      {children}
    </View>
  );
}
