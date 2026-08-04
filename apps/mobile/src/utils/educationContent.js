// Placeholder editorial content for the in-app education articles surfaced
// from Insights ("Managing pain during a crisis →", "Why hydration matters in
// SCD →") and the Learn tab library. This is dummy copy standing in for
// real, clinically-reviewed content — swap it out once that content exists.
// Not medical advice; the article screen renders its own disclaimer footer.
//
// Topic slugs (article keys) and category slugs are a permanent public
// contract — they're PostHog event properties and deep-link params. Never
// rename or reuse one; only add new ones.

// Library sections, Gentler Streak style — title + one-line description per
// section, ordered by sortOrder. Tint tokens live in utils/colors.js.
export const EDUCATION_CATEGORIES = {
  "pain-crises": {
    slug: "pain-crises",
    title: "Pain & Crises",
    description: "How to recognize, respond to, and recover from a crisis.",
    tint: "burgundyTint",
    sortOrder: 1,
  },
  "everyday-levers": {
    slug: "everyday-levers",
    title: "Everyday Levers",
    description: "Small daily habits — hydration, sleep, movement — that add up.",
    tint: "orangeTint",
    sortOrder: 2,
  },
  "know-your-body": {
    slug: "know-your-body",
    title: "Know Your Body",
    description: "Learn your personal patterns and what tends to set them off.",
    tint: "darkBurgundyTint",
    sortOrder: 3,
  },
};

// An article counts as NEW for this many days after publishedAt.
export const NEW_BADGE_WINDOW_DAYS = 14;

export const EDUCATION_ARTICLES = {
  pain: {
    topic: "pain",
    category: "pain-crises",
    sortOrder: 1,
    publishedAt: "2026-07-19",
    isPremium: false,
    kicker: "PAIN & CRISES",
    title: "Managing pain during a crisis",
    readTime: 4,
    intro:
      "A pain crisis can come on fast and feel overwhelming, but you're not starting from zero. Having a simple plan for the first hour — before the pain peaks — can make the rest of the episode easier to ride out.",
    sections: [
      {
        heading: "What's actually happening",
        body: "During a crisis, sickle-shaped red blood cells get stuck in small blood vessels, slowing or blocking blood flow to the surrounding tissue. That's what produces the deep, aching pain — often in your back, chest, joints, or limbs. It isn't in your head, and it isn't something you can simply push through by ignoring it.",
      },
      {
        heading: "First steps at home",
        body: "In the early stages, small comfort measures can take the edge off and sometimes slow things down before they escalate:",
        bullets: [
          "Apply warmth — a heating pad or warm bath — to the affected area; avoid ice, which can worsen sickling",
          "Rest in a position that takes pressure off the painful area rather than pushing through activity",
          "Start sipping water steadily; dehydration makes sickling more likely",
          "Take your prescribed pain medication early, at the first sign of a crisis, rather than waiting to see if it passes",
        ],
      },
      {
        heading: "Pain relief basics",
        body: "Most people have a step-up plan agreed with their care team — often starting with an over-the-counter or prescribed oral medication, moving to stronger options if pain isn't controlled within the expected window. Stick to the plan you've agreed rather than experimenting with timing or doses on the fly, and keep a rough note of what you've taken and when, so you (or whoever helps you) can answer that question quickly if things escalate.",
      },
      {
        heading: "Pacing your recovery",
        body: "Once the worst of the pain eases, resist the urge to jump straight back into a full day. Reintroduce activity gradually over a day or two, keep fluids up, and prioritise sleep — recovery is when your body does most of the repair work, and rushing it is a common reason crises seem to recur close together.",
      },
    ],
    callout: {
      title: "When to get help",
      body: "Call your care team or emergency services if you notice chest pain, trouble breathing, a fever over 38°C (100.4°F), sudden weakness or numbness on one side, or a painful erection lasting more than a few hours (priapism). These can signal a complication that needs urgent attention, not just a pain crisis.",
    },
  },
  hydration: {
    topic: "hydration",
    category: "everyday-levers",
    sortOrder: 1,
    publishedAt: "2026-07-19",
    isPremium: false,
    kicker: "HYDRATION",
    title: "Why hydration matters in SCD",
    readTime: 3,
    intro:
      "Water is one of the simplest, most within-your-control tools you have against sickling. Even mild dehydration changes how your blood behaves — which is why hydration shows up so often as a lever in your logs.",
    sections: [
      {
        heading: "How dehydration triggers sickling",
        body: "When you're low on fluids, your blood plasma becomes more concentrated. That makes red blood cells more likely to take on the rigid, sickle shape and get stuck in smaller vessels — which is exactly the mechanism behind a pain crisis. Staying ahead of thirst, rather than reacting to it, keeps that concentration effect from creeping up on you.",
      },
      {
        heading: "How much to aim for",
        body: "There's no single number that fits everyone, but a common starting goal is around 8 cups (roughly 2 litres) a day, adjusted upward in hot weather, during illness, or after exercise when you lose more fluid through sweat. Your care team may have given you a more specific target — that one takes priority over any general guideline.",
      },
      {
        heading: "Making it stick day-to-day",
        body: "The habit matters more than any single glass. A few small changes tend to make the biggest difference:",
        bullets: [
          "Keep a bottle somewhere you'll actually see it — desk, bag, bedside table",
          "Front-load your intake earlier in the day so you're not catching up in the evening",
          "Lean on water-rich foods like fruit, soup, and vegetables alongside what you drink",
          "Go easy on alcohol and heavy caffeine, both of which increase fluid loss",
        ],
      },
    ],
    callout: {
      title: "Signs to act on",
      body: "Dark urine, a dry mouth, dizziness when standing, or a headache that won't shift are all early signs you're behind on fluids — worth addressing right away with steady sipping. If dehydration is severe (very little urine, extreme dizziness, confusion) or coincides with a pain crisis, contact your care team or emergency services rather than trying to catch up alone.",
    },
  },
  sleep: {
    topic: "sleep",
    category: "everyday-levers",
    sortOrder: 2,
    publishedAt: "2026-07-19",
    isPremium: false,
    kicker: "REST & RECOVERY",
    title: "Sleep and sickle cell",
    readTime: 3,
    intro:
      "Sleep isn't just downtime — it's when your body does a lot of its repair work. A rough night here and there is normal, but a pattern of short or broken sleep tends to show up in your logs right before a harder day.",
    sections: [
      {
        heading: "Why short nights precede hard days",
        body: "Poor sleep adds physical stress at exactly the moment your body could use less of it. Less rest means less recovery time for the small, everyday strain your body is already managing, which is part of why a stretch of bad nights so often lines up with a rougher patch of symptoms a day or two later.",
      },
      {
        heading: "Building a wind-down",
        body: "You don't need a complicated routine — just something consistent enough that your body learns to recognise it as the signal to slow down: dimming lights an hour before bed, putting the phone somewhere else in the room, and keeping a roughly steady bedtime even on weekends.",
      },
      {
        heading: "When pain disrupts sleep",
        body: "If joint or body pain is what's keeping you up, the fix isn't always more willpower at bedtime — it's addressing the pain itself earlier in the evening, using whatever positioning or warmth measures usually help, so you're not trying to fall asleep while still uncomfortable.",
      },
    ],
    callout: {
      title: "Worth raising with your care team",
      body: "If poor sleep becomes a persistent pattern rather than an occasional bad night — especially alongside snoring, gasping, or daytime exhaustion that doesn't improve — mention it at your next appointment. It's a common and treatable issue in SCD, not something to just live with.",
    },
  },
  triggers: {
    topic: "triggers",
    category: "know-your-body",
    sortOrder: 1,
    publishedAt: "2026-07-19",
    isPremium: false,
    kicker: "KNOW YOUR TRIGGERS",
    title: "Getting to know your triggers",
    readTime: 3,
    intro:
      "Two people with SCD can have completely different trigger lists. Learning yours — patiently, over time — is one of the most useful things logging can do for you.",
    sections: [
      {
        heading: "Common triggers",
        body: "The usual suspects show up again and again across the SCD community, even if not everyone reacts to all of them: cold temperatures, dehydration, emotional or physical stress, overexertion, and infections or illness. None of these guarantee a crisis, but each one raises the odds.",
      },
      {
        heading: "Why triggers differ per person",
        body: "Your body's threshold for each of these is your own — shaped by your specific SCD type, your baseline hydration and fitness, and plenty of things that are simply individual. That's exactly why a generic list only gets you so far, and why your own history matters more than anyone else's.",
      },
      {
        heading: "How logging reveals yours",
        body: "A single bad day rarely tells you much. A pattern across weeks or months does. Logging consistently — even on the good days — is what lets Hemo (and you) start noticing which specific conditions tend to show up before your symptoms do.",
      },
    ],
    callout: {
      title: "Act early when triggers stack",
      body: "A cold snap on a day you're already behind on water and short on sleep is a very different risk than any one of those alone. When you notice several known triggers lining up on the same day, treat it as a cue to double down on rest, fluids, and warmth before symptoms start rather than after.",
    },
  },
  movement: {
    topic: "movement",
    category: "everyday-levers",
    sortOrder: 3,
    publishedAt: "2026-07-19",
    isPremium: false,
    kicker: "MOVEMENT",
    title: "Moving safely with SCD",
    readTime: 3,
    intro:
      "Staying still isn't automatically safer — gentle, regular movement supports circulation and general wellbeing. The key is choosing the right kind and pace, and knowing when to ease off.",
    sections: [
      {
        heading: "Why gentle movement helps",
        body: "Light activity keeps blood flowing well and supports joint health and mood, all of which play a part in day-to-day symptom management. The goal isn't intensity — it's consistency at a level your body can comfortably sustain.",
      },
      {
        heading: "Safest activities to start with",
        body: "Low-impact options tend to be the most forgiving place to start:",
        bullets: [
          "Walking at a comfortable, conversational pace",
          "Swimming or gentle movement in warm water",
          "Stretching or light yoga to keep joints mobile",
          "Easy, short cycling sessions on flat ground",
        ],
      },
      {
        heading: "Listening to your body",
        body: "Warm up gradually, avoid pushing through fatigue, and keep water close by before, during, and after — exercise increases fluid loss, and starting or ending dehydrated raises your risk. If something feels off, easing back is the safer default, not a setback.",
      },
    ],
    callout: {
      title: "Stop at the first sign",
      body: "Pause and rest immediately if you notice pain, dizziness, or shortness of breath during activity. Pushing through these signals is not the same as building endurance — it's a common way a gentle session turns into a harder day.",
    },
  },
};

export function getEducationArticle(topic) {
  return EDUCATION_ARTICLES[topic] ?? null;
}

// All articles except the current one — used to populate the "Others you
// might like" carousel on the article screen. Same-category articles sort
// first (most relevant to what was just read), then everything else, each
// group in stable (object insertion) order. Returns [] if topic is
// falsy/unknown, which just hides the section since it's meant to show "the
// other N" articles.
export function getRelatedArticles(topic) {
  const current = EDUCATION_ARTICLES[topic];
  const others = Object.values(EDUCATION_ARTICLES).filter((a) => a.topic !== topic);
  if (!current) return others;
  const sameCategory = others.filter((a) => a.category === current.category);
  const rest = others.filter((a) => a.category !== current.category);
  return [...sameCategory, ...rest];
}

// Categories ordered for library display.
export function getCategories() {
  return Object.values(EDUCATION_CATEGORIES).sort((a, b) => a.sortOrder - b.sortOrder);
}

// Articles within one category, ordered for library display.
export function getArticlesByCategory(categorySlug) {
  return Object.values(EDUCATION_ARTICLES)
    .filter((a) => a.category === categorySlug)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

// Whether an article should show the NEW badge in the library.
export function isNewArticle(article) {
  if (!article?.publishedAt) return false;
  const publishedMs = new Date(article.publishedAt).getTime();
  if (Number.isNaN(publishedMs)) return false;
  const ageDays = (Date.now() - publishedMs) / (1000 * 60 * 60 * 24);
  return ageDays >= 0 && ageDays < NEW_BADGE_WINDOW_DAYS;
}
