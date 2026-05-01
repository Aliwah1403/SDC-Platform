import { toLocalDateStr } from "./dateUtils";

const SCD_TIPS = [
  "Staying hydrated reduces your risk of a painful crisis.",
  "Cold weather is a common SCD trigger — layer up today.",
  "Even a 5-minute log helps spot patterns over time.",
  "Overexertion can trigger a crisis — rest is part of the plan.",
  "Stress affects pain levels. Small breaks matter.",
  "Tracking consistently helps your care team spot issues early.",
  "High altitudes and extreme heat can trigger symptoms — plan ahead.",
];

export function getDynamicMessage({
  hasLoggedData,
  healthStreak,
  selectedDate,
  currentUser,
  selectedDateData,
  healthData = [],
}) {
  const today = new Date();
  const todayStr = toLocalDateStr(today);
  const selectedStr = toLocalDateStr(selectedDate);
  const isToday = selectedStr === todayStr;

  const firstName =
    currentUser?.nickname || currentUser?.fullName?.split(" ")[0] || "";
  const hour = today.getHours();
  const timeOfDay =
    hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";

  const pain = selectedDateData?.painLevel ?? 0;
  const hydration = selectedDateData?.hydration ?? 0;
  const mood = selectedDateData?.mood ?? 0;

  const last3 = healthData
    .filter((d) => d.date !== todayStr)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 3);
  const avg3Pain =
    last3.length
      ? last3.reduce((s, d) => s + (d.painLevel || 0), 0) / last3.length
      : null;

  // --- Past date ---
  if (!isToday) {
    if (!hasLoggedData) {
      return {
        label: null,
        headline: "No data for this day.",
        body: "Nothing was logged here. Navigate back to today to track your health.",
        basis: null,
      };
    }

    const moodLabels = ["", "Very low", "Low", "Okay", "Good", "Great"];
    const moodLabel = mood > 0 ? moodLabels[Math.round(mood)] ?? "" : null;
    return {
      label: "PAST DAY",
      headline:
        pain === 0
          ? "No pain logged that day."
          : pain <= 3
            ? `Low pain day — ${pain}/10.`
            : pain <= 6
              ? `Moderate pain day — ${pain}/10.`
              : `High pain day — ${pain}/10.`,
      body: [
        hydration > 0 ? `Hydration: ${hydration} of 8 glasses.` : null,
        moodLabel ? `Mood: ${moodLabel}.` : null,
      ]
        .filter(Boolean)
        .join(" ") || "Review your log for more details.",
      basis: "Historical entry",
    };
  }

  // --- Today, not logged ---
  if (!hasLoggedData) {
    const tip = SCD_TIPS[today.getDay() % SCD_TIPS.length];
    return {
      label: "TODAY'S FORECAST",
      headline: `Good ${timeOfDay}${firstName ? `, ${firstName}` : ""}.`,
      body: `No data logged yet. ${tip}`,
      basis: "Log today to get your forecast",
    };
  }

  // --- Today, logged: priority rules ---

  // High pain + low hydration — crisis risk
  if (pain >= 7 && hydration < 5) {
    return {
      label: "WATCH OUT",
      headline: "High pain with low hydration.",
      body: `Pain at ${pain}/10 with only ${hydration} of 8 glasses logged. This combination raises your crisis risk. Rest, hydrate, and contact your care team if pain worsens.`,
      basis: "Based on today's log",
    };
  }

  // Low hydration
  if (hydration < 5 && hydration > 0) {
    return {
      label: "TODAY'S FORECAST",
      headline: "Hydration needs attention.",
      body: `You've logged ${hydration} of your 8 daily glasses. Dehydration is one of the most common triggers for a sickle cell crisis — keep a bottle close.`,
      basis: "Based on today's log",
    };
  }

  // High pain
  if (pain >= 7) {
    return {
      label: "TODAY'S FORECAST",
      headline: "Rest and monitor closely.",
      body: `Pain at ${pain}/10 today. Avoid overexertion, stay warm, and keep hydrated. Contact your care team if this level persists or worsens.`,
      basis: "Based on today's log",
    };
  }

  // Pain trending up
  if (avg3Pain !== null && pain > avg3Pain + 1.5) {
    return {
      label: "TODAY'S FORECAST",
      headline: "Pain is rising — take it easy.",
      body: `Today's pain (${pain}/10) is above your recent average of ${avg3Pain.toFixed(1)}. A good day to pace yourself, prioritise hydration, and avoid cold or stress.`,
      basis: `Based on your last ${last3.length} days`,
    };
  }

  // Moderate pain, stable
  if (pain >= 4 && pain <= 6) {
    return {
      label: "TODAY'S FORECAST",
      headline: "A moderate day — pace yourself.",
      body: `Pain at ${pain}/10. Light activity is manageable, but avoid anything strenuous. Keep fluids up${hydration < 6 ? ` — you're at ${hydration} of 8 glasses` : ""}.`,
      basis: "Based on today's log",
    };
  }

  // Pain trending down
  if (avg3Pain !== null && pain < avg3Pain - 1.5) {
    return {
      label: "TODAY'S FORECAST",
      headline: "Pain is improving.",
      body: `Today's pain (${pain}/10) is lower than your recent average of ${avg3Pain.toFixed(1)}. An encouraging trend — keep up the hydration and steady routine.`,
      basis: `Based on your last ${last3.length} days`,
    };
  }

  // Low pain, good hydration
  if (pain <= 3 && hydration >= 6) {
    return {
      label: "TODAY'S FORECAST",
      headline: "Good day for light activity.",
      body: `Pain is low at ${pain}/10 and hydration is solid. A stable day — a good time for a gentle walk, light tasks, or social time.`,
      basis: "Based on today's log",
    };
  }

  // Long streak fallback
  if (healthStreak > 7) {
    return {
      label: "TODAY'S FORECAST",
      headline: "You're on a great streak.",
      body: `${healthStreak} days of consistent tracking. The patterns building in your data will help you and your care team make better decisions.`,
      basis: "Based on today's log",
    };
  }

  // Default
  return {
    label: "TODAY'S FORECAST",
    headline: "Keep tracking — it matters.",
    body: "Consistent logging helps you and your care team spot patterns before they become crises. Every entry counts.",
    basis: "Based on today's log",
  };
}

export function getGradientColors(hasLoggedData) {
  return hasLoggedData
    ? ["#D09F9A", "#A9334D", "#781D11"]
    : ["#C4A09C", "#A9334D", "#781D11"];
}
