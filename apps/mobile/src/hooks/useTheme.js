import { useColorScheme } from "react-native";
import { useAppearanceStore } from "@/store/appearanceStore";
import { lightTheme, darkTheme } from "@/utils/theme";

export function useTheme() {
  const { theme } = useAppearanceStore();
  const systemScheme = useColorScheme();
  const resolved = theme === "system" ? (systemScheme ?? "light") : theme;
  return resolved === "dark" ? darkTheme : lightTheme;
}
