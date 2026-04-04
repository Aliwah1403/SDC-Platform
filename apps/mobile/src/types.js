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

// ── Community mock data ────────────────────────────────────────────────────────

const _now = Date.now();
const _ago = (hours) => new Date(_now - hours * 60 * 60 * 1000);

export const mockCommunityPosts = [
  {
    id: "cp1",
    author: { id: "u1", name: "Amara D.", avatarInitials: "AD", scdType: "HbSS" },
    content: "Just completed my first 5K walk since my last crisis. Took me 55 mins and I had to stop twice, but I finished it! Six months ago I couldn't walk to the corner shop without pain. Small steps, big wins 💪",
    imageUrl: "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80",
    category: "wins",
    likes: 47,
    timestamp: _ago(1.5),
    comments: [
      { id: "cc1a", author: { name: "Marcus T.", avatarInitials: "MT" }, content: "This is huge!! I remember when you mentioned your goal in January. So proud of you!", timestamp: _ago(1.2) },
      { id: "cc1b", author: { name: "Priya N.", avatarInitials: "PN" }, content: "This literally made me tear up. You're an inspiration 🥹", timestamp: _ago(0.8) },
      { id: "cc1c", author: { name: "Kofi A.", avatarInitials: "KA" }, content: "55 mins for a 5K WITH stops is actually great! Keep going ❤️", timestamp: _ago(0.5) },
    ],
  },
  {
    id: "cp2",
    author: { id: "u2", name: "Jordan L.", avatarInitials: "JL", scdType: "HbSC" },
    content: "PSA for anyone with HbSC: don't let anyone tell you your pain 'isn't as bad' just because you don't have SS. I spent years being gaslit by doctors before finding one who actually listens. You deserve proper care regardless of your type. 🙏",
    category: "pain",
    likes: 89,
    timestamp: _ago(5),
    comments: [
      { id: "cc2a", author: { name: "Amara D.", avatarInitials: "AD" }, content: "THANK YOU. I have SC too and the invalidation is real.", timestamp: _ago(4.5) },
      { id: "cc2b", author: { name: "Olivia W.", avatarInitials: "OW" }, content: "How did you find a good doctor finally? I'm still searching.", timestamp: _ago(4) },
      { id: "cc2c", author: { name: "Jordan L.", avatarInitials: "JL" }, content: "@Olivia — honestly I asked my SCD nurse for a referral and specifically said I wanted someone with experience in SC variants. Took 3 tries but worth it.", timestamp: _ago(3.5) },
      { id: "cc2d", author: { name: "Ben O.", avatarInitials: "BO" }, content: "Saved this post. This is the validation I needed today.", timestamp: _ago(2) },
    ],
  },
  {
    id: "cp3",
    author: { id: "u3", name: "Sasha K.", avatarInitials: "SK", scdType: "HbSS" },
    content: "Hot tip that changed my pain crisis management: I now keep a 'crisis kit' by my bed — heating pad, a water bottle, paracetamol/codeine already measured out, a playlist, and a laminated sheet with my pain plan. In those moments your brain doesn't work well so having everything ready is a game changer.",
    imageUrl: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=800&q=80",
    category: "tips",
    likes: 112,
    timestamp: _ago(11),
    comments: [
      { id: "cc3a", author: { name: "Fatima R.", avatarInitials: "FR" }, content: "The laminated sheet idea is genius. I always forget what I'm supposed to do when I'm in pain.", timestamp: _ago(10) },
      { id: "cc3b", author: { name: "Noah B.", avatarInitials: "NB" }, content: "I do something similar but the pre-measured meds is something I haven't thought of. Adding that now!", timestamp: _ago(9) },
      { id: "cc3c", author: { name: "Sasha K.", avatarInitials: "SK" }, content: "@Fatima yes! My pain plan has: 1) take meds 2) heat 3) call this number if no improvement in 2hrs. Simple but I can barely read when I'm at a 7.", timestamp: _ago(8) },
    ],
  },
  {
    id: "cp4",
    author: { id: "u4", name: "Tobias M.", avatarInitials: "TM", scdType: "HbSS" },
    content: "Hi everyone 👋 I was diagnosed late (found out at 24 after years of unexplained pain episodes). Still wrapping my head around everything. Is it normal to feel grief about the diagnosis even though nothing has 'changed' medically? I already had SCD, I just now know it.",
    category: "new",
    likes: 63,
    timestamp: _ago(18),
    comments: [
      { id: "cc4a", author: { name: "Jordan L.", avatarInitials: "JL" }, content: "Completely normal. You're grieving the version of your life where you didn't have this knowledge — and the years of confusion before diagnosis. It's a lot to process.", timestamp: _ago(17) },
      { id: "cc4b", author: { name: "Amara D.", avatarInitials: "AD" }, content: "Welcome to the community 💙 Late diagnosis is actually really common. Give yourself time to grieve AND celebrate — at least now you have answers.", timestamp: _ago(16) },
      { id: "cc4c", author: { name: "Dr. Lee (Community Mod)", avatarInitials: "DL" }, content: "Very normal. Many people describe a period of mourning followed by relief. If feelings feel overwhelming, please consider speaking to a counsellor who has experience with chronic illness.", timestamp: _ago(14) },
      { id: "cc4d", author: { name: "Sasha K.", avatarInitials: "SK" }, content: "I was diagnosed at 26 and I cried for a week. Then I joined communities like this one and everything started making sense. You're not alone ❤️", timestamp: _ago(12) },
      { id: "cc4e", author: { name: "Tobias M.", avatarInitials: "TM" }, content: "Thank you all so much. I genuinely didn't expect this response. Already feeling less alone.", timestamp: _ago(10) },
    ],
  },
  {
    id: "cp5",
    author: { id: "u5", name: "Priya N.", avatarInitials: "PN", scdType: "HbSS" },
    content: "Has anyone tried the GBT601 gene therapy trial? I've been shortlisted for a site near me and my haematologist is cautiously optimistic. Would love to hear from anyone who's been through a gene therapy process — what questions should I be asking?",
    category: "research",
    likes: 34,
    timestamp: _ago(26),
    comments: [
      { id: "cc5a", author: { name: "Marcus T.", avatarInitials: "MT" }, content: "Not that specific trial but I did the Lyfgenia trial 2 years ago. Key questions: what's the engraftment timeline, what conditioning chemo they use, and what follow-up monitoring looks like. Happy to DM more!", timestamp: _ago(25) },
      { id: "cc5b", author: { name: "Priya N.", avatarInitials: "PN" }, content: "@Marcus please do! This is exactly the kind of lived experience I was looking for.", timestamp: _ago(24) },
      { id: "cc5c", author: { name: "Kofi A.", avatarInitials: "KA" }, content: "Also ask about the fertility preservation options before conditioning — something people don't think about until it's too late.", timestamp: _ago(22) },
    ],
  },
  {
    id: "cp6",
    author: { id: "u6", name: "Fatima R.", avatarInitials: "FR", scdType: "HbSC" },
    content: "Honest question: how do you explain SCD to a new partner? I've been dating someone for 2 months and I keep putting it off because I don't know how to frame it without it sounding catastrophic or like I'm asking for pity.",
    category: "questions",
    likes: 58,
    timestamp: _ago(36),
    comments: [
      { id: "cc6a", author: { name: "Jordan L.", avatarInitials: "JL" }, content: "I do it on a good day, not in the middle of a crisis. I explain what it is factually first ('my red blood cells change shape'), then what it means for me day-to-day. Keeping it grounded in MY experience rather than the scariest case studies helps a lot.", timestamp: _ago(35) },
      { id: "cc6b", author: { name: "Olivia W.", avatarInitials: "OW" }, content: "I once sent my partner a link to an NHS explainer first so they had baseline knowledge, then we talked about my specific situation. Meant I wasn't starting from zero.", timestamp: _ago(34) },
      { id: "cc6c", author: { name: "Amara D.", avatarInitials: "AD" }, content: "The right person won't make it weird. If they do, that's useful information about them 💙", timestamp: _ago(32) },
      { id: "cc6d", author: { name: "Fatima R.", avatarInitials: "FR" }, content: "All of this is so helpful. The 'good day' framing particularly — I've been waiting for the 'right moment' and maybe that's just a calm ordinary evening.", timestamp: _ago(30) },
    ],
  },
  {
    id: "cp7",
    author: { id: "u7", name: "Noah B.", avatarInitials: "NB", scdType: "HbSS" },
    content: "6 months crisis-free today. Last year I was hospitalised 4 times. What changed: strict sleep schedule, no longer flying on short-haul without extra hydration, cut out alcohol completely, and finally got my Hydroxyurea dose optimised. It's boring but it works.",
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=800&q=80",
    category: "wins",
    likes: 134,
    timestamp: _ago(48),
    comments: [
      { id: "cc7a", author: { name: "Sasha K.", avatarInitials: "SK" }, content: "The Hydroxyurea dose thing is so underrated. It took my team 2 years to get mine right and the difference was night and day.", timestamp: _ago(47) },
      { id: "cc7b", author: { name: "Tobias M.", avatarInitials: "TM" }, content: "What do you mean by extra hydration on flights? Do you bring electrolytes?", timestamp: _ago(46) },
      { id: "cc7c", author: { name: "Noah B.", avatarInitials: "NB" }, content: "@Tobias — yes! I drink 500ml extra per hour of flight and avoid anything with alcohol or caffeine. Cabin air is extremely dry. I also get up and walk every 45 mins.", timestamp: _ago(44) },
      { id: "cc7d", author: { name: "Priya N.", avatarInitials: "PN" }, content: "Celebrating with you!! 🎉 6 months is massive.", timestamp: _ago(40) },
    ],
  },
  {
    id: "cp8",
    author: { id: "u8", name: "Marcus T.", avatarInitials: "MT", scdType: "HbSS" },
    content: "Reminder that the cold IS a trigger and it's okay to skip things because of it. I used to push through cold outdoor events to seem 'normal' and ended up in A&E twice. Now I wear layers aggressively, carry a pocket warmer, and leave early if I get cold. My friends understand — and those who don't aren't my people.",
    category: "tips",
    likes: 76,
    timestamp: _ago(60),
    comments: [
      { id: "cc8a", author: { name: "Fatima R.", avatarInitials: "FR" }, content: "The pocket warmer is a genuine lifesaver. I keep one in every bag.", timestamp: _ago(59) },
      { id: "cc8b", author: { name: "Kofi A.", avatarInitials: "KA" }, content: "Cold AND wind. People forget wind chill is a thing. I've started checking 'feels like' temperature specifically.", timestamp: _ago(57) },
      { id: "cc8c", author: { name: "Ben O.", avatarInitials: "BO" }, content: "'Those who don't aren't my people' — needed to hear this today.", timestamp: _ago(54) },
    ],
  },
  {
    id: "cp9",
    author: { id: "u9", name: "Olivia W.", avatarInitials: "OW", scdType: "HbSS" },
    content: "Does anyone have a script for asking for adequate pain relief in A&E? I'm so tired of being undertreated because I 'don't look in enough pain' or because they're worried about me becoming 'dependent'. I have an SCD care plan but staff often ignore it.",
    category: "pain",
    likes: 91,
    timestamp: _ago(72),
    comments: [
      { id: "cc9a", author: { name: "Marcus T.", avatarInitials: "MT" }, content: "I ask them to pull up my care plan specifically and I say 'my haematology team has a documented protocol for my pain management — can you follow that?' It puts the burden on them to justify not following it.", timestamp: _ago(71) },
      { id: "cc9b", author: { name: "Jordan L.", avatarInitials: "JL" }, content: "Bring a printed copy of your care plan. Sounds extra but staff are more likely to read a paper in their hand than navigate an electronic system.", timestamp: _ago(70) },
      { id: "cc9c", author: { name: "Sasha K.", avatarInitials: "SK" }, content: "Also: ask for the SCD specialist nurse on call at your hospital. Most hospitals have one and they'll advocate for you in a way that generic A&E staff often won't.", timestamp: _ago(68) },
      { id: "cc9d", author: { name: "Olivia W.", avatarInitials: "OW" }, content: "The printed care plan idea is brilliant. Thank you all so much.", timestamp: _ago(66) },
    ],
  },
  {
    id: "cp10",
    author: { id: "u10", name: "Kofi A.", avatarInitials: "KA", scdType: "HbSS" },
    content: "Anyone keeping an eye on the Beam Therapeutics base-editing trials? They just published 12-month follow-up data and it looks very promising for HbSS patients. Not gene therapy in the traditional sense — they're editing the existing gene rather than adding a new one. Science is wild.",
    imageUrl: "https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80",
    category: "research",
    likes: 29,
    timestamp: _ago(85),
    comments: [
      { id: "cc10a", author: { name: "Priya N.", avatarInitials: "PN" }, content: "I read this! The thing that surprised me is how quickly they're seeing HbF increase. Month 3 data was already showing meaningful changes.", timestamp: _ago(84) },
      { id: "cc10b", author: { name: "Dr. Lee (Community Mod)", avatarInitials: "DL" }, content: "Base editing is fascinating because it theoretically reduces off-target effects compared to CRISPR. Still early but the trajectory is exciting.", timestamp: _ago(82) },
      { id: "cc10c", author: { name: "Tobias M.", avatarInitials: "TM" }, content: "Can someone explain what HbF is in plain English? I'm still new to all this.", timestamp: _ago(79) },
      { id: "cc10d", author: { name: "Kofi A.", avatarInitials: "KA" }, content: "@Tobias — HbF is fetal haemoglobin. It's the type babies have before birth, and it doesn't sickle. When it's present in adults, it basically dilutes the HbS and reduces crises. Hydroxyurea works partly by boosting HbF.", timestamp: _ago(77) },
    ],
  },
  {
    id: "cp11",
    author: { id: "u11", name: "Ben O.", avatarInitials: "BO", scdType: "HbSC" },
    content: "Just got my first full blood count back where my HbF was above 20% — my haematologist was genuinely excited. 8 months on optimised Hydroxyurea. If you're on it and not seeing results, please push for a dosage review — the therapeutic window varies a lot between people.",
    imageUrl: "https://images.unsplash.com/photo-1559839914-17aae19cec71?auto=format&fit=crop&w=800&q=80",
    category: "wins",
    likes: 68,
    timestamp: _ago(100),
    comments: [
      { id: "cc11a", author: { name: "Noah B.", avatarInitials: "NB" }, content: "HbF above 20% is a big deal!! Congratulations!", timestamp: _ago(99) },
      { id: "cc11b", author: { name: "Amara D.", avatarInitials: "AD" }, content: "What dose are you on now if you don't mind sharing? I'm on 500mg and wondering if there's room to go higher.", timestamp: _ago(98) },
      { id: "cc11c", author: { name: "Ben O.", avatarInitials: "BO" }, content: "@Amara — 1000mg. We went up gradually over about 6 months, checking CBC every 4-6 weeks. Definitely talk to your team though, everyone tolerates it differently.", timestamp: _ago(96) },
    ],
  },
  {
    id: "cp12",
    author: { id: "u12", name: "Lena H.", avatarInitials: "LH", scdType: "HbSS" },
    content: "I'm 22 and just started uni. Trying to figure out how to navigate disclosing my SCD to the disability services office — do I have to share my full medical history? Also worried about being treated differently by tutors if they know. Has anyone gone through this?",
    category: "new",
    likes: 41,
    timestamp: _ago(115),
    comments: [
      { id: "cc12a", author: { name: "Fatima R.", avatarInitials: "FR" }, content: "You only need to share what's relevant — i.e. what adjustments you need, not your full history. A letter from your haematologist outlining accommodations needed is usually enough.", timestamp: _ago(114) },
      { id: "cc12b", author: { name: "Sasha K.", avatarInitials: "SK" }, content: "I went through this! The disability office is actually bound by confidentiality — your tutors won't know your diagnosis, just that you have 'a chronic health condition' requiring adjustments. You can control how much you share.", timestamp: _ago(112) },
      { id: "cc12c", author: { name: "Olivia W.", avatarInitials: "OW" }, content: "Also — get the accommodations sorted BEFORE a crisis hits. It's much harder to sort in an emergency.", timestamp: _ago(110) },
      { id: "cc12d", author: { name: "Lena H.", avatarInitials: "LH" }, content: "This is all so reassuring. I didn't know the confidentiality piece. Booking the disability services appointment today!", timestamp: _ago(108) },
    ],
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
