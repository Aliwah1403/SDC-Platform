// Core Types and Interfaces for Hemo App
import { Target, Flame, Droplets } from "lucide-react-native";

// Mock data and constants will be imported from here
export const PAIN_LEVELS = [
  { value: 0, label: "No Pain", color: "#10B981" },
  { value: 1, label: "Very Mild", color: "#34D399" },
  { value: 2, label: "Mild", color: "#6EE7B7" },
  { value: 3, label: "Moderate", color: "#FDE047" },
  { value: 4, label: "Moderate+", color: "#FACC15" },
  { value: 5, label: "Strong", color: "#F59E0B" },
  { value: 6, label: "Strong+", color: "#F97316" },
  { value: 7, label: "Severe", color: "#EF4444" },
  { value: 8, label: "Very Severe", color: "#DC2626" },
  { value: 9, label: "Extreme", color: "#B91C1C" },
  { value: 10, label: "Worst Possible", color: "#7F1D1D" },
];

export const MOODS = [
  { value: "excellent", label: "Excellent", emoji: "😄", color: "#10B981" },
  { value: "good", label: "Good", emoji: "🙂", color: "#34D399" },
  { value: "fair", label: "Fair", emoji: "😐", color: "#FCD34D" },
  { value: "poor", label: "Poor", emoji: "😞", color: "#F87171" },
  { value: "terrible", label: "Terrible", emoji: "😢", color: "#EF4444" },
];

export const BODY_LOCATIONS = [
  "Head",
  "Neck",
  "Chest",
  "Back",
  "Arms",
  "Hands",
  "Abdomen",
  "Legs",
  "Feet",
  "Joints",
  "Muscles",
];

export const SCD_TYPES = [
  { value: "SS", label: "Sickle Cell Anemia (SS)" },
  { value: "SC", label: "Sickle-Hemoglobin C (SC)" },
  { value: "SB+", label: "Sickle Beta Plus Thalassemia (SB+)" },
  { value: "SB0", label: "Sickle Beta Zero Thalassemia (SB0)" },
  { value: "Other", label: "Other" },
];

// Mock user data
export const mockUser = {
  id: "1",
  name: "Alex Johnson",
  email: "alex@example.com",
  age: 28,
  scdType: "SS",
  avatar: null,
  createdAt: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  healthStreak: 23,
  totalLogs: 81,
  joinedDays: 90,
};

/**
 * Generates 90 days of realistic SCD health data ending today.
 * Uses a seeded LCG so output is always deterministic — safe to call at module load.
 *
 * Skipped days (simulates missed logs — none in last 23 to preserve streak):
 *   88, 87, 79, 70, 55, 49, 43, 36, 23
 *
 * Pain flare episodes (days ago ranges):
 *   82-85 → moderate-severe crisis
 *   61-64 → moderate flare
 *   40-45 → severe crisis
 *   18-20 → mild flare (within streak period)
 *    8-9  → mild spike (within streak period)
 */
export function generateMockHealthData() {
  let seed = 42;
  function rand(min, max) {
    seed = (seed * 1664525 + 1013904223) & 0x7fffffff;
    return min + (seed % (max - min + 1));
  }

  const today = new Date();
  const data = [];

  const skipped = new Set([88, 87, 79, 70, 55, 49, 43, 36, 23, 0]);

  const flareFor = (daysAgo) => {
    if (daysAgo >= 82 && daysAgo <= 85) return { pain: [5, 7], hyd: [5, 6], mood: [1, 2], steps: [500, 2500], sleep: [35, 55], hr: [78, 98] };
    if (daysAgo >= 61 && daysAgo <= 64) return { pain: [4, 6], hyd: [6, 7], mood: [2, 3], steps: [800, 3000], sleep: [40, 58], hr: [76, 95] };
    if (daysAgo >= 40 && daysAgo <= 45) return { pain: [6, 9], hyd: [4, 6], mood: [1, 2], steps: [200, 1800], sleep: [30, 52], hr: [80, 100] };
    if (daysAgo >= 18 && daysAgo <= 20) return { pain: [3, 5], hyd: [6, 8], mood: [2, 3], steps: [1500, 4000], sleep: [50, 65], hr: [72, 90] };
    if (daysAgo >= 8 && daysAgo <= 9)   return { pain: [3, 4], hyd: [7, 8], mood: [3, 3], steps: [2000, 5000], sleep: [55, 70], hr: [68, 85] };
    return null;
  };

  for (let daysAgo = 89; daysAgo >= 0; daysAgo--) {
    if (skipped.has(daysAgo)) continue;

    const date = new Date(today);
    date.setDate(today.getDate() - daysAgo);
    const dateStr = date.toISOString().split("T")[0];

    const flare = flareFor(daysAgo);
    let painLevel, hydration, mood, steps, sleepHours, heartRate;

    if (flare) {
      painLevel  = rand(flare.pain[0], flare.pain[1]);
      hydration  = rand(flare.hyd[0], flare.hyd[1]);
      mood       = rand(flare.mood[0], flare.mood[1]);
      steps      = rand(flare.steps[0], flare.steps[1]);
      sleepHours = rand(flare.sleep[0], flare.sleep[1]) / 10;
      heartRate  = rand(flare.hr[0], flare.hr[1]);
    } else {
      painLevel  = rand(0, 2);
      hydration  = rand(7, 10);
      mood       = rand(3, 5);
      steps      = rand(3000, 10500);
      sleepHours = rand(60, 85) / 10;
      heartRate  = rand(60, 82);
    }

    data.push({ date: dateStr, painLevel, hydration, mood, steps, sleepHours, heartRate });
  }

  return data;
}

// Mock articles
export const mockArticles = [
  {
    id: "1",
    title: "Managing Pain During a Crisis",
    summary:
      "Practical strategies for getting through pain episodes safely — from heat therapy and positioning to when to call your care team.",
    category: "treatment",
    readTime: 5,
    publishedAt: new Date("2024-11-20"),
    imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80",
    fallbackColor: "#781D11",
    source: "SCD Foundation",
  },
  {
    id: "2",
    title: "Hydration & SCD: Why It Matters",
    summary:
      "Dehydration is one of the leading triggers of pain crises. Learn how much water you need and the best ways to stay consistently hydrated.",
    category: "nutrition",
    readTime: 3,
    publishedAt: new Date("2024-11-18"),
    imageUrl: "https://images.unsplash.com/photo-1559839914-17aae19cec71?auto=format&fit=crop&w=800&q=80",
    fallbackColor: "#2563EB",
    source: "Medical Journal",
  },
  {
    id: "3",
    title: "Safe Exercise with Sickle Cell",
    summary:
      "Regular gentle movement can reduce fatigue and improve well-being. Discover which activities are safest and how to listen to your body.",
    category: "exercise",
    readTime: 7,
    publishedAt: new Date("2024-11-15"),
    imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80",
    fallbackColor: "#059669",
    source: "Health & Wellness",
  },
  {
    id: "4",
    title: "Mental Health & SCD",
    summary:
      "Chronic pain takes an emotional toll. Here are evidence-based coping strategies and resources specifically for people managing SCD.",
    category: "mental-health",
    readTime: 6,
    publishedAt: new Date("2024-11-10"),
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
    fallbackColor: "#A9334D",
    source: "SCD Foundation",
  },
  {
    id: "5",
    title: "Understanding Your SCD Type",
    summary:
      "SS, SC, SB+ — what do the genotypes actually mean? A plain-language guide to how your specific type affects symptoms and treatment.",
    category: "education",
    readTime: 8,
    publishedAt: new Date("2024-11-05"),
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80",
    fallbackColor: "#A9334D",
    source: "Genetics in Medicine",
  },
  {
    id: "6",
    title: "Folate, Nutrition & SCD",
    summary:
      "Folic acid, iron, and antioxidants all play a role in managing SCD. Find out which foods to prioritise and why supplementation matters.",
    category: "nutrition",
    readTime: 4,
    publishedAt: new Date("2024-10-28"),
    imageUrl: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=800&q=80",
    fallbackColor: "#2563EB",
    source: "Nutrition Today",
  },
];

// Badge image assets
const BADGE_IMAGES = {
  1:  require("../assets/images/badges/badge-1.svg"),
  2:  require("../assets/images/badges/badge-2.svg"),
  3:  require("../assets/images/badges/badge-3.svg"),
  4:  require("../assets/images/badges/badge-4.svg"),
  5:  require("../assets/images/badges/badge-5.svg"),
  6:  require("../assets/images/badges/badge-6.svg"),
  7:  require("../assets/images/badges/badge-7.svg"),
  8:  require("../assets/images/badges/badge-8.svg"),
  9:  require("../assets/images/badges/badge-9.svg"),
  10: require("../assets/images/badges/badge-10.svg"),
  11: require("../assets/images/badges/badge-11.svg"),
  12: require("../assets/images/badges/badge-12.svg"),
  13: require("../assets/images/badges/badge-13.svg"),
  14: require("../assets/images/badges/badge-14.svg"),
  15: require("../assets/images/badges/badge-15.svg"),
  16: require("../assets/images/badges/badge-16.svg"),
};

// Mock badges — all 16 from design spec
export const mockBadges = [
  { id: "onboarding-done", name: "Getting Started",   description: "Completed your Hemo setup",              image: BADGE_IMAGES[1],  category: "milestone",  unlockedAt: new Date("2024-10-10") },
  { id: "streak-1",        name: "First Streak",      description: "Logged your first day",                  image: BADGE_IMAGES[2],  category: "streak",     unlockedAt: new Date("2024-10-11") },
  { id: "streak-3",        name: "On Track",          description: "3-day logging streak",                   image: BADGE_IMAGES[3],  category: "streak",     unlockedAt: null },
  { id: "streak-7",        name: "Habit Builder",     description: "7-day logging streak",                   image: BADGE_IMAGES[4],  category: "streak",     unlockedAt: null },
  { id: "streak-14",       name: "Fortnight Fighter", description: "14-day logging streak",                  image: BADGE_IMAGES[5],  category: "streak",     unlockedAt: null },
  { id: "streak-30",       name: "Monthly Monster",   description: "30-day logging streak",                  image: BADGE_IMAGES[6],  category: "streak",     unlockedAt: null },
  { id: "streak-60",       name: "Dedicated Tracker", description: "60-day logging streak",                  image: BADGE_IMAGES[7],  category: "streak",     unlockedAt: null },
  { id: "hydration-7",     name: "Hydration Junkie",  description: "Hit your water goal 7 days in a row",   image: BADGE_IMAGES[8],  category: "health",     unlockedAt: null },
  { id: "care-10",         name: "Self-Care",         description: "Read 10 care articles",                  image: BADGE_IMAGES[9],  category: "learning",   unlockedAt: null },
  { id: "learning-5",      name: "Knowledge Seeker",  description: "Explored 5 learning articles",           image: BADGE_IMAGES[10], category: "learning",   unlockedAt: null },
  { id: "symptoms-10",     name: "Pattern Seeker",    description: "Logged symptoms 10 times",               image: BADGE_IMAGES[11], category: "milestone",  unlockedAt: null },
  { id: "repair-1",        name: "Back on Track",     description: "Used a streak repair",                   image: BADGE_IMAGES[12], category: "streak",     unlockedAt: null },
  { id: "restart-1",       name: "Resilient Restart", description: "Rebuilt your streak after a break",      image: BADGE_IMAGES[13], category: "streak",     unlockedAt: null },
  { id: "meds-streak-7",   name: "On-Time Hero",      description: "Logged meds on time 7 days in a row",   image: BADGE_IMAGES[14], category: "medication", unlockedAt: null },
  { id: "meds-first",      name: "Dose One",          description: "Logged your first medication dose",      image: BADGE_IMAGES[15], category: "medication", unlockedAt: null },
  { id: "week-perfect",    name: "Perfect Week",      description: "Logged every day for a full week",       image: BADGE_IMAGES[16], category: "milestone",  unlockedAt: null },
];

// Mock challenges
export const mockChallenges = [
  {
    id: "1",
    title: "Daily Logger",
    description: "Log your symptoms every day this week",
    type: "weekly",
    points: 50,
    progress: 4,
    target: 7,
    isCompleted: false,
    expiresAt: new Date("2024-12-01"),
  },
  {
    id: "2",
    title: "Hydration Goal",
    description: "Drink 8 glasses of water today",
    type: "daily",
    points: 10,
    progress: 6,
    target: 8,
    isCompleted: false,
    expiresAt: new Date("2024-11-27"),
  },
];

// Mock medications
export const mockMedications = [
  {
    id: "1",
    name: "Hydroxyurea",
    dosage: "500mg",
    frequency: "Daily",
    type: "tablet",
    prescribedBy: "Dr. Smith",
    startDate: new Date("2024-01-15"),
    isActive: true,
    nextDose: "08:00 AM",
    time: "8:00 AM",
    taken: true,
    takenAt: "2024-01-15T08:05:00.000Z",
    notes: "Take with plenty of water",
    category: "Disease-modifying",
  },
  {
    id: "2",
    name: "Folic Acid",
    dosage: "5mg",
    frequency: "Daily",
    type: "capsule",
    prescribedBy: "Dr. Smith",
    startDate: new Date("2024-01-15"),
    isActive: true,
    nextDose: "08:00 AM",
    time: "8:00 AM",
    taken: true,
    takenAt: "2024-01-15T08:05:00.000Z",
    notes: "",
    category: "Supportive",
  },
  {
    id: "3",
    name: "Vitamin D3",
    dosage: "2000 IU",
    frequency: "Daily",
    type: "softgel",
    prescribedBy: "Dr. Smith",
    startDate: new Date("2024-03-01"),
    isActive: true,
    nextDose: "12:00 PM",
    time: "12:00 PM",
    taken: false,
    takenAt: null,
    notes: "Take with food",
    category: "Supportive",
  },
  {
    id: "4",
    name: "Penicillin V",
    dosage: "250mg",
    frequency: "Twice daily",
    type: "tablet",
    prescribedBy: "Dr. Smith",
    startDate: new Date("2024-01-15"),
    isActive: true,
    nextDose: "06:00 PM",
    time: "6:00 PM",
    taken: false,
    takenAt: null,
    notes: "",
    category: "Supportive",
  },
];

// Mock appointments
export const mockAppointments = [
  {
    id: "1",
    title: "Routine Check-up",
    doctor: "Sarah Smith",
    specialty: "Hematologist",
    facility: "City Medical Center",
    date: "2026-04-02",
    time: "10:00 AM",
    type: "routine",
    notes: "Bring recent blood test results",
    status: "upcoming",
    addedToCalendar: false,
    calendarEventId: null,
    reminderIds: [],
  },
  {
    id: "2",
    title: "Blood Work",
    doctor: "",
    specialty: "",
    facility: "Medical Lab Services",
    date: "2026-04-10",
    time: "09:00 AM",
    type: "blood-work",
    notes: "Fasting required — no food after midnight",
    status: "upcoming",
    addedToCalendar: false,
    calendarEventId: null,
    reminderIds: [],
  },
  {
    id: "3",
    title: "Hydroxyurea Follow-up",
    doctor: "James Okafor",
    specialty: "Hematologist",
    facility: "Royal Free Hospital",
    date: "2026-02-14",
    time: "02:30 PM",
    type: "follow-up",
    notes: "",
    status: "completed",
    addedToCalendar: false,
    calendarEventId: null,
    reminderIds: [],
  },
  {
    id: "4",
    title: "Annual Cardiology Review",
    doctor: "Priya Nair",
    specialty: "Cardiologist",
    facility: "Kings College Hospital",
    date: "2026-01-20",
    time: "11:00 AM",
    type: "specialist",
    notes: "Echo results needed",
    status: "completed",
    addedToCalendar: false,
    calendarEventId: null,
    reminderIds: [],
  },
];

// Mock emergency contacts
export const mockEmergencyContacts = [
  {
    id: "1",
    name: "Mom - Sarah Johnson",
    relationship: "Mother",
    phone: "+1 (555) 123-4567",
    isPrimary: true,
  },
  {
    id: "2",
    name: "Dr. Smith",
    relationship: "Primary Doctor",
    phone: "+1 (555) 987-6543",
    isPrimary: false,
  },
  {
    id: "3",
    name: "Emergency Services",
    relationship: "Emergency",
    phone: "911",
    isPrimary: false,
  },
];
