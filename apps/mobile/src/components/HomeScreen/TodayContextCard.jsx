import { View, Text } from "react-native";
import { fonts } from "@/utils/fonts";

function computeContext(healthData, healthStreak, currentUser) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Build last 7 days newest-first for trailing-run detection
  const last7 = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    last7.push(healthData.find((e) => e.date === dateStr) ?? null);
  }

  // Priority 1: high pain 3+ consecutive trailing days
  let highPainRun = 0;
  for (const entry of last7) {
    if (!entry || entry.painLevel === 0) break;
    if (entry.painLevel >= 7) highPainRun++;
    else break;
  }
  if (highPainRun >= 3) {
    return {
      headline: `High pain for ${highPainRun} days in a row`,
      body: "Consider contacting your care team if this continues.",
      severity: "alert",
    };
  }

  // Priority 2: low-pain streak ≥ 7 (computed from healthData)
  let lowPainRun = 0;
  for (const entry of last7) {
    if (!entry || entry.painLevel === 0) break;
    if (entry.painLevel < 5) lowPainRun++;
    else break;
  }
  if (lowPainRun >= 7) {
    return {
      headline: `${lowPainRun}-day low-pain streak`,
      body: "Excellent consistency — keep your habits going.",
      severity: "positive",
    };
  }

  // Priority 3: hydration below goal 3+ consecutive trailing days
  let lowHydrationRun = 0;
  for (const entry of last7) {
    if (!entry || entry.hydration === 0) break;
    if (entry.hydration < 8) lowHydrationRun++;
    else break;
  }
  if (lowHydrationRun >= 3) {
    return {
      headline: `Hydration below goal ${lowHydrationRun} days running`,
      body: "Aim for 8 glasses today — hydration is key for SCD.",
      severity: "warning",
    };
  }

  // Priority 4: active tracking streak
  if (healthStreak >= 3) {
    return {
      headline: `${healthStreak}-day tracking streak`,
      body: "Consistent logging gives you the clearest picture of your health.",
      severity: "positive",
    };
  }

  // Priority 5: time-of-day fallback
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const firstName =
    currentUser?.nickname || currentUser?.fullName?.split(" ")[0] || "";
  return {
    headline: `${greeting}${firstName ? `, ${firstName}` : ""}`,
    body: "How are you feeling today?",
    severity: "neutral",
  };
}

const SEVERITY_STYLE = {
  alert:    { bg: "#FEF2F2", headline: "#781D11", body: "#A9334D" },
  warning:  { bg: "#FFF8F0", headline: "#781D11", body: "#A9334D" },
  positive: { bg: "#F8E9E7", headline: "#781D11", body: "#A9334D" },
  neutral:  { bg: "#F8E9E7", headline: "#781D11", body: "#A9334D" },
};

export function TodayContextCard({ healthData, healthStreak, currentUser }) {
  const ctx = computeContext(healthData, healthStreak, currentUser);
  const s = SEVERITY_STYLE[ctx.severity];

  return (
    <View style={{ paddingHorizontal: 16, paddingTop: 8, marginBottom: 20 }}>
      <Text
        style={{
          fontFamily: fonts.bold,
          fontSize: 22,
          color: s.headline,
          marginBottom: 4,
          lineHeight: 28,
        }}
      >
        {ctx.headline}
      </Text>
      <Text
        style={{
          fontFamily: fonts.regular,
          fontSize: 14,
          color: "#6B7280",
          lineHeight: 20,
        }}
      >
        {ctx.body}
      </Text>
    </View>
  );
}
