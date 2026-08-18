export const ACHIEVEMENTS = [
  {
    id: "onboarding-done",
    name: "Getting Started",
    description: "Completed your Hemo setup",
    category: "milestone",
    type: "onboarding",
    requirement: "Complete your Hemo setup",
    rarity: "Common",
    image: require("../../assets/images/badges-3/getting-started.png"),
  },
  {
    id: "days-1",
    name: "First Step",
    description:
      "Welcome to your health journey! Every great journey begins with a single step.",
    category: "milestone",
    type: "days",
    target: 1,
    requirement: "Log your first day",
    rarity: "Common",
    image: require("../../assets/images/badges-3/first-step.png"),
  },
  {
    id: "days-5",
    name: "Getting Started",
    description:
      "You're building a habit! Consistency is the key to understanding your health patterns.",
    category: "milestone",
    type: "days",
    target: 5,
    requirement: "Log 5 days",
    rarity: "Common",
    image: require("../../assets/images/badges-3/getting-started.png"),
  },
  {
    id: "days-10",
    name: "Double Digits",
    description:
      "Double digits! You're developing a strong tracking habit that will serve you well.",
    category: "milestone",
    type: "days",
    target: 10,
    requirement: "Log 10 days",
    rarity: "Uncommon",
    image: require("../../assets/images/badges-3/double-digits.png"),
  },
  {
    id: "days-25",
    name: "Quarter Century",
    description:
      "Your commitment is impressive! You're gathering valuable insights about your health.",
    category: "milestone",
    type: "days",
    target: 25,
    requirement: "Log 25 days",
    rarity: "Rare",
    image: require("../../assets/images/badges-3/quarter-century.png"),
  },
  {
    id: "days-50",
    name: "Health Champion",
    description:
      "Incredible dedication! You're a true health champion with a wealth of data to guide you.",
    category: "milestone",
    type: "days",
    target: 50,
    requirement: "Log 50 days",
    rarity: "Epic",
    image: require("../../assets/images/badges-3/health-champion.png"),
  },
  {
    id: "days-100",
    name: "Century Master",
    description:
      "A hundred days of commitment! You've built an unshakeable health tracking foundation.",
    category: "milestone",
    type: "days",
    target: 100,
    requirement: "Log 100 days",
    rarity: "Legendary",
    image: require("../../assets/images/badges-3/century-master.png"),
  },
  {
    id: "streak-3",
    name: "On Track",
    description: "Three days in a row! You're building momentum.",
    category: "streak",
    type: "streak",
    target: 3,
    requirement: "Maintain a 3-day streak",
    rarity: "Common",
    image: require("../../assets/images/badges-3/on-track.png"),
  },
  {
    id: "streak-7",
    name: "Habit Builder",
    description: "A full week of consistency! Your dedication is showing.",
    category: "streak",
    type: "streak",
    target: 7,
    requirement: "Maintain a 7-day streak",
    rarity: "Uncommon",
    image: require("../../assets/images/badges-3/habit-builder.png"),
  },
  {
    id: "streak-14",
    name: "Fortnight Fighter",
    description: "Two weeks strong! You're proving that consistency pays off.",
    category: "streak",
    type: "streak",
    target: 14,
    requirement: "Maintain a 14-day streak",
    rarity: "Rare",
    image: require("../../assets/images/badges-3/fortnight-fighter.png"),
  },
  {
    id: "streak-30",
    name: "Monthly Monster",
    description: "A full month! Your habit is now deeply ingrained.",
    category: "streak",
    type: "streak",
    target: 30,
    requirement: "Maintain a 30-day streak",
    rarity: "Epic",
    image: require("../../assets/images/badges-3/monthly-monster.png"),
  },
  {
    id: "streak-60",
    name: "Dedicated Tracker",
    description: "Two months of relentless tracking.",
    category: "streak",
    type: "streak",
    target: 60,
    requirement: "Maintain a 60-day streak",
    rarity: "Legendary",
    image: require("../../assets/images/badges-3/century-master.png"),
  },
  {
    id: "symptoms-10",
    name: "Pattern Seeker",
    description: "You're starting to identify patterns in your symptoms.",
    category: "milestone",
    type: "symptoms",
    target: 10,
    requirement: "Log 10 symptoms",
    rarity: "Common",
    image: require("../../assets/images/badges-3/pattern-seeker.png"),
  },
  {
    id: "symptoms-25",
    name: "Symptom Tracker",
    description: "Your symptom data is becoming more valuable with each entry.",
    category: "milestone",
    type: "symptoms",
    target: 25,
    requirement: "Log 25 symptoms",
    rarity: "Uncommon",
    image: require("../../assets/images/badges-3/symptom-tracker.png"),
  },
  {
    id: "hydration-7",
    name: "Hydration Junkie",
    description: "A week of staying hydrated! Your body thanks you.",
    category: "health",
    type: "hydration",
    target: 7,
    requirement: "Meet hydration goals for 7 days",
    rarity: "Uncommon",
    image: require("../../assets/images/badges-3/hydration-junkie.png"),
  },
  {
    id: "care-10",
    name: "Self-Care",
    description: "You're prioritizing self-care and it shows!",
    category: "learning",
    type: "care",
    target: 10,
    requirement: "Complete 10 care tasks",
    rarity: "Common",
    image: require("../../assets/images/badges-3/self-care.png"),
  },
  {
    id: "learning-5",
    name: "Knowledge Seeker",
    description: "You're expanding your health knowledge with every module.",
    category: "learning",
    type: "learning",
    target: 5,
    requirement: "Complete 5 learning modules",
    rarity: "Uncommon",
    image: require("../../assets/images/badges-3/knowledge-seeker.png"),
  },
  {
    id: "repair-1",
    name: "Back on Track",
    description:
      "Life happens. Using a repair shows you're committed to bouncing back.",
    category: "streak",
    type: "repair",
    target: 1,
    requirement: "Use your first streak repair",
    rarity: "Common",
    image: require("../../assets/images/badges-3/back-on-track.png"),
  },
  {
    id: "restart-1",
    name: "Resilient Restart",
    description:
      "Every restart is a win. Coming back after a gap takes real courage.",
    category: "streak",
    type: "restart",
    target: 1,
    requirement: "Log again after missing 3+ days",
    rarity: "Uncommon",
    image: require("../../assets/images/badges-3/resilient-restart.png"),
  },
  {
    id: "meds-first",
    name: "Dose One",
    description:
      "Your first logged medication. Knowledge of your treatment is a superpower.",
    category: "medication",
    type: "medications",
    target: 1,
    requirement: "Log your first medication",
    rarity: "Common",
    image: require("../../assets/images/badges-3/dose-one.png"),
  },
  {
    id: "meds-streak-7",
    name: "On-Time Hero",
    description:
      "Seven days of staying on top of your treatment. Your future self will thank you.",
    category: "medication",
    type: "medications",
    target: 7,
    requirement: "Complete 7 medication check-ins",
    rarity: "Rare",
    image: require("../../assets/images/badges-3/on-time-hero.png"),
  },
  {
    id: "week-perfect",
    name: "Perfect Week",
    description: "Seven days, zero gaps. A truly perfect week of health tracking.",
    category: "milestone",
    type: "streak",
    target: 7,
    metric: "completedDays",
    requirement: "Log every day for a full week",
    rarity: "Epic",
    image: require("../../assets/images/badges-3/perfect-week.png"),
  },
];

export function getAchievementCurrentValue(achievement, metrics = {}) {
  const metric = achievement.metric ?? achievement.type;
  switch (metric) {
    case "days":
      return metrics.daysLogged ?? 0;
    case "streak":
      return metrics.currentStreak ?? 0;
    case "symptoms":
      return metrics.symptomsLogged ?? 0;
    case "hydration":
      return metrics.hydrationDays ?? 0;
    case "care":
      return metrics.careTasksCompleted ?? 0;
    case "learning":
      return metrics.learningModulesCompleted ?? 0;
    case "repair":
      return metrics.repairsUsed ?? 0;
    case "restart":
      return (metrics.restarts ?? 0) || ((metrics.repairsUsed ?? 0) > 0 ? 1 : 0);
    case "medications":
      return metrics.medicationCheckIns ?? metrics.medicationsCount ?? 0;
    case "completedDays":
      return metrics.completedDays ?? 0;
    default:
      return 0;
  }
}

export function normalizeAchievementId(id) {
  return id === "streak-1" ? "days-1" : id;
}

export function getAchievementsWithProgress(metrics = {}) {
  return ACHIEVEMENTS.map((achievement) => {
    const current = getAchievementCurrentValue(achievement, metrics);
    const target = achievement.target;
    const progressTarget = target ?? 1;
    const unlocked = achievement.target != null && current >= target;
    return {
      ...achievement,
      value: target,
      target,
      current,
      unlocked,
      progress: Math.min(100, Math.round((current / progressTarget) * 100)),
    };
  });
}

export function getEarnedAchievements(metrics = {}) {
  return getAchievementsWithProgress(metrics).filter((achievement) => achievement.unlocked);
}

export function toAchievementMilestone(achievement) {
  return {
    milestoneId: achievement.id,
    type: achievement.type,
    title: achievement.name,
    subtitle: achievement.description,
    streakCount: achievement.type === "streak" ? achievement.current : null,
    image: achievement.image,
  };
}
