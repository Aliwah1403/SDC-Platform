export function getDynamicMessage(hasLoggedData, healthStreak, selectedDate) {
  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();

  if (hasLoggedData && healthStreak > 1) {
    return {
      title: "Health logged",
      subtitle: `${healthStreak} day streak`,
    };
  } else if (hasLoggedData && healthStreak === 1) {
    return {
      title: "Great start!",
      subtitle: "Keep tracking daily",
    };
  } else if (isToday) {
    return {
      title: "Log your health",
      subtitle: "Track symptoms today",
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
    ? ["#4ECDC4", "#44B3AA", "#3A9A92"]
    : ["#E0E0E0", "#D0D0D0", "#C0C0C0"];
}

export function getInsightCards(healthStreak, selectedDate) {
  const formatNavDate = (date) => {
    const options = { month: "long", day: "numeric" };
    return date.toLocaleDateString("en-US", options);
  };

  return [
    {
      id: 1,
      type: "log-symptoms",
      title: "Log your symptoms",
      subtitle: "Track how you feel today",
      emoji: "➕",
      bgColor: "#FFE5F1",
      iconBgColor: "#FF69B4",
    },
    {
      id: 2,
      type: "daily-tip",
      title: `${formatNavDate(selectedDate)}: Symptoms to expect`,
      subtitle: "Based on your tracking patterns",
      emoji: "📊",
      bgColor: "#E8F5E9",
      iconBgColor: "#4CAF50",
    },
    {
      id: 3,
      type: "health-insight",
      title: "Today's wellness tip",
      subtitle: "Stay hydrated and rest well",
      emoji: "💡",
      bgColor: "#E3F2FD",
      iconBgColor: "#2196F3",
    },
    {
      id: 4,
      type: "milestone",
      title: `${healthStreak} day streak!`,
      subtitle: "Keep up the great work",
      emoji: "🔥",
      bgColor: "#FFF3E0",
      iconBgColor: "#FF9800",
    },
  ];
}
