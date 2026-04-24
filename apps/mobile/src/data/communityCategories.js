const UX = "?w=800&h=1000&fit=crop&q=80&auto=format";
const img = (id) => `https://images.unsplash.com/photo-${id}${UX}`;

export const COMMUNITY_CATEGORIES_DATA = [
  {
    group: "My Journey",
    categories: [
      {
        id: "wins",
        label: "Wins & Achievements",
        description:
          "Celebrate your victories — big and small. Every step forward matters when living with SCD.",
        gradient: ["#F59E0B", "#A9334D"],
        photo: img("1543269865-cbf427effbad"),
      },
      {
        id: "daily",
        label: "Daily Life",
        description:
          "Real talk about everyday life with sickle cell — the routines, the adjustments, and the moments in between.",
        gradient: ["#059669", "#065F46"],
        photo: img("1543269664-76bc3997d9ea"),
      },
      {
        id: "pain",
        label: "Pain & Crisis",
        description:
          "A space to share your experiences with pain and crises — what helped, what didn't, and how you got through it.",
        gradient: ["#DC2626", "#7F1D1D"],
        photo: img("1576091160550-2173dba999ef"),
      },
      {
        id: "mental",
        label: "Mental Health & Emotions",
        description:
          "Your emotional wellbeing matters. Talk about the mental side of living with a chronic condition.",
        gradient: ["#7C3AED", "#4C1D95"],
        photo: img("1506126613408-eca07ce68773"),
      },
    ],
  },
  {
    group: "Health & Wellness",
    categories: [
      {
        id: "tips",
        label: "Tips & Advice",
        description:
          "Practical wisdom from people who truly get it. Share what's worked for you.",
        gradient: ["#2563EB", "#1E3A8A"],
        photo: img("1484480974693-6ca0a78fb36b"),
      },
      {
        id: "medications",
        label: "Medications",
        description:
          "Discussions about treatments, medications, side effects, and managing your regimen.",
        gradient: ["#0D9488", "#134E4A"],
        photo: img("1471864190281-a93a3070b6de"),
      },
      {
        id: "diet",
        label: "Diet & Nutrition",
        description:
          "Food, hydration, and nutrition strategies from the SCD community.",
        gradient: ["#16A34A", "#14532D"],
        photo: img("1493770348161-369560ae357d"),
      },
      {
        id: "exercise",
        label: "Exercise & Movement",
        description:
          "Moving your body safely with sickle cell — what works, what to avoid, and community-tested tips.",
        gradient: ["#EA580C", "#7C2D12"],
        photo: img("1545205597-3d9d02c29597"),
      },
    ],
  },
  {
    group: "Connect",
    categories: [
      {
        id: "questions",
        label: "Questions",
        description:
          "Ask anything. No question is too big or too small when it comes to your health.",
        gradient: ["#4F46E5", "#312E81"],
        photo: img("1573496359142-b8d87734a5a2"),
      },
      {
        id: "new",
        label: "New to SCD",
        description:
          "Just diagnosed or supporting a loved one? Find guidance and a welcoming community here.",
        gradient: ["#A9334D", "#781D11"],
        photo: img("1500534314209-a25ddb2bd429"),
      },
      {
        id: "research",
        label: "Research & Clinical Trials",
        description:
          "Stay informed on the latest SCD research, treatments, and clinical trial opportunities.",
        gradient: ["#475569", "#0F172A"],
        photo: img("1532187863486-abf9dbad1b69"),
      },
      {
        id: "support",
        label: "Support & Encouragement",
        description:
          "Sometimes you just need to know you're not alone. This is that place.",
        gradient: ["#DB2777", "#831843"],
        photo: img("1529156069898-49953e39b3ac"),
      },
    ],
  },
];

/** Flat map of id → category for quick lookups */
export const CATEGORY_MAP = Object.fromEntries(
  COMMUNITY_CATEGORIES_DATA.flatMap((g) => g.categories).map((c) => [c.id, c])
);

/** All categories as a flat array */
export const ALL_CATEGORIES = COMMUNITY_CATEGORIES_DATA.flatMap(
  (g) => g.categories
);

/** Related categories = same group, excluding self */
export function getRelatedCategories(categoryId) {
  const group = COMMUNITY_CATEGORIES_DATA.find((g) =>
    g.categories.some((c) => c.id === categoryId)
  );
  return group ? group.categories.filter((c) => c.id !== categoryId) : [];
}
