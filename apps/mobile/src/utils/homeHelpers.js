export function getDynamicMessage(
  hasLoggedData,
  healthStreak,
  selectedDate,
  currentUser,
) {
  const today = new Date();
  const isToday = selectedDate.toDateString() === today.toDateString();
  const firstName =
    currentUser?.nickname || currentUser?.fullName?.split(" ")[0] || "";
  const hour = today.getHours();
  const timeGreeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  if (hasLoggedData && healthStreak > 1) {
    return {
      title: `Well done${firstName ? `, ${firstName}` : ""}!`,
      subtitle: `${healthStreak} day streak`,
    };
  } else if (hasLoggedData && healthStreak === 1) {
    return {
      title: "Great start!",
      subtitle: "Keep tracking daily",
    };
  } else if (isToday) {
    return {
      title: `${timeGreeting}${firstName ? `, ${firstName}` : ""}`,
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

