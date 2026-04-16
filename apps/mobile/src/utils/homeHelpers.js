import { CheckCircle2, Plus, TrendingUp, Droplets } from "lucide-react-native";
import { StreakFireIcon } from "@/utils/streakFire";

export function getDynamicMessage(
  hasLoggedData,
  healthStreak,
  selectedDate,
  currentUser,
) {
  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();
  const firstName =
    currentUser?.nickname || currentUser?.fullName.split(" ")[0];
  const hour = today.getHours();
  const timeGreeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (hasLoggedData && healthStreak > 1) {
    return {
      title: `Well done, ${firstName}!`,
      subtitle: `${healthStreak} day streak`,
    };
  } else if (hasLoggedData && healthStreak === 1) {
    return {
      title: "Great start!",
      subtitle: "Keep tracking daily",
    };
  } else if (isToday) {
    return {
      title: `${timeGreeting}, ${firstName}`,
      subtitle: "How are you feeling?",
    };
  } else {
    return {
      title: "No data logged",
      subtitle: "Start tracking",
    };
  }
}

export function getGradientColors(hasLoggedData) {
  return hasLoggedData
    ? ["#D09F9A", "#A9334D", "#781D11"]
    : ["#C4A09C", "#A9334D", "#781D11"];
}

export function getInsightCards(
  healthStreak,
  selectedDate,
  selectedDateData,
  avgPainLevel,
  avgHydration,
) {
  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();
  const hasLoggedToday = isToday && selectedDateData != null;

  const hydrationToday = selectedDateData?.hydration ?? 0;

  return [
    {
      id: 1,
      type: "log-health",
      title: hasLoggedToday ? "Logged today" : "Log your health",
      subtitle: hasLoggedToday
        ? "Great job keeping track!"
        : "Track how you feel today",
      value: hasLoggedToday ? "✓" : "+",
      unit: "",
      icon: hasLoggedToday ? CheckCircle2 : Plus,
      bgColor: hasLoggedToday ? "#DCFCE7" : "#F0FDF4",
      accentColor: "#059669",
      cta: hasLoggedToday ? null : "Tap to log →",
    },
    {
      id: 2,
      type: "pain-status",
      title: "Avg pain level",
      subtitle: "Last 30 days",
      value: avgPainLevel && parseFloat(avgPainLevel) > 0 ? avgPainLevel : "—",
      unit: avgPainLevel && parseFloat(avgPainLevel) > 0 ? "/ 10" : "",
      icon: TrendingUp,
      bgColor: "#FEF2F2",
      accentColor: "#DC2626",
      cta: null,
    },
    {
      id: 3,
      type: "hydration",
      title: "Hydration today",
      subtitle: "Goal: 8 glasses",
      value: hydrationToday > 0 ? String(hydrationToday) : "—",
      unit: hydrationToday > 0 ? "/ 8" : "",
      icon: Droplets,
      bgColor: "#EFF6FF",
      accentColor: "#3B82F6",
      cta: null,
    },
    {
      id: 4,
      type: "streak",
      title: "Day streak",
      subtitle:
        healthStreak >= 7
          ? "You're on fire!"
          : healthStreak > 0
            ? "Keep it going!"
            : "Start your streak today",
      value: String(healthStreak),
      unit: healthStreak === 1 ? "day" : "days",
      icon: StreakFireIcon,
      bgColor: "#F8E9E7",
      accentColor: "#A9334D",
      cta: null,
    },
  ];
}
