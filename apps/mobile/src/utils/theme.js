export const lightTheme = {
  isDark: false,
  background: "#F8F4F0",
  surface: "#FFFFFF",
  surfaceElevated: "#FFFFFF",
  text: "#1A1A1A",
  textSecondary: "#9CA3AF",
  textTertiary: "#C4A8A4",
  accent: "#A9334D",
  cta: "#F0531C",
  border: "#F0E4E1",
  divider: "#F8E9E7",
  tabBarBackground: "#FFFFFF",
  tabActiveText: "#DC2626", // intentionally matches destructive in light mode; diverges in dark
  tabInactiveText: "#6B6B6B",
  destructive: "#DC2626", // error / danger actions — same red as tabActiveText in light only
  modalBackdrop: "rgba(0,0,0,0.5)",
};

export const darkTheme = {
  isDark: true,
  background: "#141414",
  surface: "#1F1F1F",
  surfaceElevated: "#272727",
  text: "#F8E9E7",
  textSecondary: "#9CA3AF",
  textTertiary: "#6B6B6B",
  accent: "#A9334D",
  cta: "#F0531C",
  border: "#333333",
  divider: "#282828",
  tabBarBackground: "#141414",
  tabActiveText: "#DC2626",
  tabInactiveText: "#888888",
  destructive: "#EF4444",
  modalBackdrop: "rgba(0,0,0,0.75)",
};
