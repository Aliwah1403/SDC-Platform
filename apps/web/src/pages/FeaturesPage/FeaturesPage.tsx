import { motion } from "framer-motion";
import {
  Activity,
  Brain,
  CalendarCheck,
  CheckCircle2,
  Flame,
  LifeBuoy,
  MessageSquareText,
  Siren,
  Users,
} from "lucide-react";

import PageWaitlistCTA from "@/components/PageWaitlistCTA";
import { Badge } from "@/components/ui/badge";
import { Iphone } from "@/components/ui/iphone";
import HomeScreen from "@/assets/screenshots/home-screen.jpeg";
import InsightsScreen from "@/assets/screenshots/insights.jpeg";
import CareScreen from "@/assets/screenshots/care-screen.jpeg";

// ─── Data ─────────────────────────────────────────────────────────────────────

const HERO_FEATURES = [
  {
    label: "Daily Health Log",
    headline: "Know your body in under two minutes.",
    description:
      "A guided check-in designed for real SCD days — including the difficult ones. Capture everything that matters without the overhead of a complicated app.",
    bullets: [
      "Track pain level, body location, mood, and triggers",
      "Guided 7-step flow — completes in under 2 minutes",
      "Builds reliable trend data automatically over time",
    ],
    outcome: "Two minutes today gives you answers later.",
    icon: Activity,
    screenshot: HomeScreen,
    accent: "#A9334D",
  },
  {
    label: "Health Trends & Tracking",
    headline: "See patterns before they become surprises.",
    description:
      "SCD symptoms fluctuate in ways that are hard to spot from memory alone. Hemo turns consistent daily logs into clear visual patterns across every metric that matters.",
    bullets: [
      "Calendar and chart views for pain, mood, hydration, sleep, steps, and heart rate",
      "7-day and 30-day toggle for short and longer-term perspective",
      "Patterns visible at a glance, not buried in a spreadsheet",
    ],
    outcome: "Stop guessing. Start spotting what helps.",
    icon: CalendarCheck,
    screenshot: undefined,
    accent: "#A9334D",
  },
  {
    label: "Health Insights",
    headline: "Your week, scored and explained.",
    description:
      "Raw numbers don't tell you whether you're doing better or worse. Hemo compares this week to last and surfaces what actually changed — in plain language.",
    bullets: [
      "Weekly wellbeing score based on your logged data",
      "Side-by-side comparison: this week vs. last week",
      "Plain-language callouts for meaningful changes",
    ],
    outcome: "Context, not just numbers.",
    icon: Brain,
    screenshot: InsightsScreen,
    accent: "#781D11",
  },
  {
    label: "Streaks & Rewards",
    headline: "Build the habit. Protect the streak.",
    description:
      "Long-term self-management requires consistency — but missed days happen. Hemo's streak system is designed to reward the habit without punishing the gaps.",
    bullets: [
      "Daily streaks that celebrate consecutive check-ins",
      "Streak repairs — limited uses to cover missed days",
      "Milestone badges and challenges for long-term motivation",
    ],
    outcome: "Better routine, less pressure.",
    icon: Flame,
    screenshot: undefined,
    accent: "#F0531C",
  },
  {
    label: "Care Hub",
    headline: "Everything for your care in one place.",
    description:
      "Care coordination often lives across texts, notes, and memory. Hemo keeps the essential details organized and immediately accessible — especially when you need them fast.",
    bullets: [
      "Medication list with dosage, frequency, and reminders",
      "Care team contacts, appointments, and crisis plan",
      "Emergency profile and nearby facilities always on hand",
    ],
    outcome: "Less scrambling when clarity counts.",
    icon: LifeBuoy,
    screenshot: CareScreen,
    accent: "#A9334D",
  },
  {
    label: "Emergency SOS",
    headline: "Help is one tap away.",
    description:
      "During a crisis, speed and clarity matter. Hemo's SOS flow is designed to get help moving with minimal friction — no menus, no searching.",
    bullets: [
      "One-tap SOS with a countdown and confirmation step",
      "Direct emergency contact dialing or 911",
      "Emergency profile accessible even from the lock screen",
    ],
    outcome: "Speed when it matters most.",
    icon: Siren,
    screenshot: undefined,
    accent: "#DC2626",
  },
] as const;

const SUPPORT_FEATURES = [
  {
    label: "AI Health Assistant",
    headline: "Plain-language answers, always on.",
    description:
      "SCD-specific Q&A with persistent chat history. Reliable information in one place — not scattered across search results.",
    outcome: "Guidance you can actually understand.",
    icon: MessageSquareText,
    accent: "#A9334D",
  },
  {
    label: "Community Feed",
    headline: "You're not doing this alone.",
    description:
      "A peer-support feed for experiences, tips, questions, and encouragement from others who understand what SCD actually feels like.",
    outcome: "Less isolation. More support.",
    icon: Users,
    accent: "#781D11",
  },
] as const;

const STATS = [
  { value: "< 2 min", label: "Daily check-in" },
  { value: "8", label: "Core features" },
  { value: "90 days", label: "Health history" },
  { value: "7 steps", label: "Guided log" },
];

const DIFFERENTIATORS = [
  "Built specifically for Sickle Cell Disease — not a generic tracker",
  "Arrive at clinic visits with structured, timestamped data",
  "One-tap emergency access without navigating menus",
  "Streak repairs so a missed day doesn't break your habit",
];

// ─── Feature visual placeholder (no screenshot available) ────────────────────

function FeaturePlaceholder({
  icon: Icon,
  accent,
}: {
  icon: React.ElementType;
  accent: string;
}) {
  return (
    <div className="flex items-center justify-center">
      <div className="relative flex items-center justify-center">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: 72 + i * 56,
              height: 72 + i * 56,
              backgroundColor: accent,
              opacity: 0.06 - i * 0.015,
            }}
            animate={{ scale: [1, 1.04, 1] }}
            transition={{
              duration: 3.5,
              delay: i * 0.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
        <div
          className="relative z-10 flex size-24 items-center justify-center rounded-3xl shadow-xl"
          style={{ backgroundColor: `${accent}18`, border: `1.5px solid ${accent}22` }}
        >
          <Icon className="size-10" style={{ color: accent }} />
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const FeaturesPage = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Badge variant="secondary">Features</Badge>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1 }}
        className="mt-4 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.02em] sm:text-3xl lg:text-4xl"
      >
        Everything Hemo includes for day-to-day SCD management
      </motion.h1>

      <motion.p
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.2 }}
        className="mt-5 max-w-2xl text-md text-balance text-muted-foreground"
      >
        Each feature is built around one principle: give people with Sickle Cell Disease
        clearer control, better context, and faster access to support when needed.
      </motion.p>

      {/* ── Stats row ── */}
      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {STATS.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.45, delay: i * 0.08, ease: "easeOut" }}
            className="rounded-2xl border bg-muted/40 px-5 py-4 text-center"
          >
            <p className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
              {stat.value}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* ── Alternating hero feature sections ── */}
      <div className="mt-20 space-y-28">
        {HERO_FEATURES.map((feature, index) => {
          const Icon = feature.icon;
          const isEven = index % 2 === 0;

          return (
            <motion.article
              key={feature.label}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20"
            >
              {/* Text side */}
              <motion.div
                initial={{ opacity: 0, x: isEven ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.55, delay: 0.1, ease: "easeOut" }}
                className={isEven ? "" : "lg:order-2"}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex size-9 items-center justify-center rounded-xl"
                    style={{ backgroundColor: `${feature.accent}18` }}
                  >
                    <Icon className="size-4.5" style={{ color: feature.accent }} />
                  </div>
                  <p
                    className="text-xs font-semibold uppercase tracking-[0.16em]"
                    style={{ color: feature.accent }}
                  >
                    {feature.label}
                  </p>
                </div>

                <h2 className="mt-4 text-balance text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
                  {feature.headline}
                </h2>

                <p className="mt-4 text-muted-foreground">{feature.description}</p>

                <ul className="mt-6 space-y-3">
                  {feature.bullets.map((bullet, bi) => (
                    <motion.li
                      key={bi}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.5 }}
                      transition={{ duration: 0.38, delay: 0.2 + bi * 0.07, ease: "easeOut" }}
                      className="flex items-start gap-2.5"
                    >
                      <CheckCircle2
                        className="mt-0.5 size-4 shrink-0"
                        style={{ color: feature.accent }}
                      />
                      <span className="text-sm text-muted-foreground">{bullet}</span>
                    </motion.li>
                  ))}
                </ul>

                <div
                  className="mt-7 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
                  style={{ backgroundColor: `${feature.accent}12`, color: feature.accent }}
                >
                  <CheckCircle2 className="size-3.5" />
                  {feature.outcome}
                </div>
              </motion.div>

              {/* Visual side */}
              <motion.div
                initial={{ opacity: 0, x: isEven ? 20 : -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.6, delay: 0.05, ease: "easeOut" }}
                className={`flex items-center justify-center ${isEven ? "" : "lg:order-1"}`}
              >
                {feature.screenshot ? (
                  <Iphone className="max-w-72" src={feature.screenshot} />
                ) : (
                  <FeaturePlaceholder icon={feature.icon} accent={feature.accent} />
                )}
              </motion.div>
            </motion.article>
          );
        })}
      </div>

      {/* ── Supporting features ── */}
      <div className="mt-20 grid gap-5 sm:grid-cols-2">
        {SUPPORT_FEATURES.map((feature, i) => {
          const Icon = feature.icon;
          return (
            <motion.div
              key={feature.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: i * 0.1, ease: "easeOut" }}
              className="relative overflow-hidden rounded-3xl border p-8"
            >
              <div
                className="mb-5 flex size-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${feature.accent}15` }}
              >
                <Icon className="size-5" style={{ color: feature.accent }} />
              </div>
              <p
                className="mb-1.5 text-xs font-semibold uppercase tracking-[0.16em]"
                style={{ color: feature.accent }}
              >
                {feature.label}
              </p>
              <h3 className="text-xl font-semibold tracking-tight">{feature.headline}</h3>
              <p className="mt-3 text-sm text-muted-foreground">{feature.description}</p>
              <p className="mt-5 text-sm font-medium" style={{ color: feature.accent }}>
                {feature.outcome}
              </p>
              <div
                className="pointer-events-none absolute -bottom-14 -right-14 size-44 rounded-full opacity-[0.05]"
                style={{ backgroundColor: feature.accent }}
              />
            </motion.div>
          );
        })}
      </div>

      {/* ── Built differently ── */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
        className="mt-20"
      >
        <div className="grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
              Built differently
            </p>
            <h2 className="mt-3 text-balance text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
              Not a generic tracker dressed up for SCD — built for it from the start.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Most health apps are designed for general wellness and retrofitted for specific
              conditions. Hemo started with the realities of Sickle Cell Disease — pain crises,
              clinic visits, emergency access, and consistent logging on bad days.
            </p>
          </div>

          <ul className="space-y-4 self-center">
            {DIFFERENTIATORS.map((point, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -12 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
                className="flex items-start gap-3"
              >
                <div className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/15">
                  <CheckCircle2 className="size-3.5 text-primary" />
                </div>
                <span className="text-sm text-muted-foreground">{point}</span>
              </motion.li>
            ))}
          </ul>
        </div>
      </motion.section>

      {/* ── Outcome cards ── */}
      <div className="mt-14 grid gap-4 md:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-[#A9334D]/10 via-[#D09F9A]/8 to-transparent p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Clinic-ready
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight">
            Arrive with 90 days of context, not guesswork.
          </h3>
          <p className="mt-3 text-muted-foreground">
            Structured symptom, mood, hydration, and medication logs give your care team real
            data — improving the quality of every appointment conversation.
          </p>
          <div className="pointer-events-none absolute -bottom-12 -right-12 size-40 rounded-full bg-primary opacity-[0.05]" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl border bg-gradient-to-br from-[#DC2626]/10 via-[#F0531C]/8 to-transparent p-8"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-destructive">
            Crisis-ready
          </p>
          <h3 className="mt-3 text-2xl font-semibold tracking-tight">
            Critical information, always within reach.
          </h3>
          <p className="mt-3 text-muted-foreground">
            From one-tap SOS to crisis planning and emergency profile access — speed and clarity
            are built into every part of the experience.
          </p>
          <div className="pointer-events-none absolute -bottom-12 -right-12 size-40 rounded-full bg-destructive opacity-[0.05]" />
        </motion.div>
      </div>

      <PageWaitlistCTA
        title="Want early access to the full feature set?"
        description="Join the waitlist and get updates as new capabilities roll out."
      />
    </div>
  );
};

export default FeaturesPage;
