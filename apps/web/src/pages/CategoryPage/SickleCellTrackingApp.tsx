import { motion } from "framer-motion";
import { Check, Minus } from "lucide-react";

import PageWaitlistCTA from "@/components/PageWaitlistCTA";
import { Badge } from "@/components/ui/badge";
import { Iphone } from "@/components/ui/iphone";
import { FAQScrollAccordion } from "@/components/faq-scroll-accordion";
import DailyLogScreen from "@/assets/screenshots/daily-log.png";
import HealthTrendsScreen from "@/assets/screenshots/health-trends.png";
import InsightsScreen from "@/assets/screenshots/insights.png";
import CareScreen from "@/assets/screenshots/care-screen.png";
import StreaksScreen from "@/assets/screenshots/streaks.png";
import HomeScreen from "@/assets/screenshots/home-screen.png";

// ─── Data ─────────────────────────────────────────────────────────────────────

const WALKTHROUGH = [
  {
    label: "Daily Log",
    title: "A guided sickle cell pain diary, not a blank text box",
    description:
      "Log pain level, body location, mood, hydration, sleep, and possible triggers in one short guided flow — built for real SCD days, including the hard ones.",
    screenshot: DailyLogScreen,
  },
  {
    label: "Health Trends",
    title: "Patterns across every metric, not just pain",
    description:
      "Calendar and chart views for pain, mood, hydration, sleep, steps, and heart rate, with 7-day and 30-day toggles so patterns are visible instead of buried in memory.",
    screenshot: HealthTrendsScreen,
  },
  {
    label: "Health Insights",
    title: "This week vs. last week, in plain language",
    description:
      "A weekly wellbeing score and plain-language callouts for what actually changed — context, not just raw numbers to interpret yourself.",
    screenshot: InsightsScreen,
  },
  {
    label: "Care Hub",
    title: "Medications, care team, and crisis plan in one place",
    description:
      "Medication list with dosage and frequency, care team contacts, crisis plan, and emergency profile — organised and reachable fast when it matters.",
    screenshot: CareScreen,
  },
  {
    label: "Streaks",
    title: "A habit system that doesn't punish missed days",
    description:
      "Daily streaks celebrate consistency, and a limited number of streak repairs cover the days you couldn't log — because consistency, not perfection, builds the useful history.",
    screenshot: StreaksScreen,
  },
  {
    label: "Home",
    title: "Today's status at a glance",
    description:
      "A home screen that surfaces what needs attention today — your streak, today's log status, and the metrics you're tracking — without digging through menus.",
    screenshot: HomeScreen,
  },
] as const;

type CellValue = "yes" | "partial" | "no" | string;

type ComparisonRow = {
  criterion: string;
  hemo: CellValue;
  generic: CellValue;
  paper: CellValue;
};

const COMPARISON: ComparisonRow[] = [
  {
    criterion: "SCD-specific pain & crisis logging",
    hemo: "yes",
    generic: "partial",
    paper: "Manual — you design the format",
  },
  {
    criterion: "Trigger tracking",
    hemo: "yes",
    generic: "partial",
    paper: "Manual — easy to forget",
  },
  {
    criterion: "Hydration goals",
    hemo: "yes",
    generic: "no",
    paper: "Manual",
  },
  {
    criterion: "Clinical summary / PDF export",
    hemo: "yes",
    generic: "partial",
    paper: "The notebook itself",
  },
  {
    criterion: "Price",
    hemo: "Free to start; Hemo+ $7.99/mo or $59.99/yr",
    generic: "Free – $10+/mo, varies by app",
    paper: "Cost of a notebook",
  },
];

const FAQS = [
  {
    question: "What makes Hemo different from a generic symptom tracker?",
    answer:
      "Generic symptom trackers cover pain on a broad scale but aren't built around SCD specifics like crisis logging, trigger tags, or hydration goals. Hemo is a sickle cell tracker from the ground up, so every field in the daily log maps to how SCD is actually managed day to day.",
  },
  {
    question: "Can Hemo replace a paper pain diary?",
    answer:
      "For most people, yes. A paper diary works and costs nothing, but it can't chart trends, remind you to log, or export a clinic-ready summary. Hemo keeps the same idea — a daily pain and symptom record — while adding structure, reminders, and pattern tracking on top.",
  },
  {
    question: "Does Hemo track hydration and crisis triggers?",
    answer:
      "Yes. The daily log includes a hydration tracker with a personal goal, plus trigger tags you can attach to any entry — weather, exertion, stress, and more. Over time this builds a picture of what tends to precede a bad day.",
  },
  {
    question: "How much does the app for sickle cell patients cost?",
    answer:
      "Hemo is free to start — logging, 7-day stats, Emergency SOS, community, and the basic care hub don't require payment. Hemo+ unlocks unlimited history, AI insights, and PDF reports for $7.99/mo or $59.99/yr, with a 7-day free trial and a 50% hardship discount for qualifying users.",
  },
];

// ─── Comparison cell ───────────────────────────────────────────────────────

function ComparisonCell({ value }: { value: CellValue }) {
  if (value === "yes")
    return <Check className="mx-auto size-4 text-primary" />;
  if (value === "no")
    return <Minus className="mx-auto size-4 text-muted-foreground/40" />;
  if (value === "partial")
    return (
      <span className="text-xs font-medium text-muted-foreground">
        Partial
      </span>
    );
  return <span className="text-sm text-muted-foreground">{value}</span>;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

const SickleCellTrackingApp = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* ── Header ── */}
      <Badge variant="secondary" className="px-3 py-1 text-xs">
        Sickle Cell Tracking App
      </Badge>

      <motion.h1
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1 }}
        className="mt-4 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.02em] sm:text-5xl lg:text-6xl"
      >
        The sickle cell tracking app for pain, patterns, and appointments
      </motion.h1>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.2 }}
        className="mt-5 max-w-3xl space-y-4 text-lg text-muted-foreground"
      >
        <p>
          Hemo is a sickle cell app built for people with Sickle Cell Disease
          (SCD) to track pain, hydration, mood, sleep, and medications in one
          place. As a dedicated sickle cell tracker — not a generic wellness
          app adapted after the fact — Hemo turns short daily logs into
          patterns you and your care team can actually use.
        </p>
        <p>
          Think of it as a sickle cell pain diary app with the rest of
          day-to-day SCD care built in around it — medications, care team
          contacts, and appointment prep alongside your pain and symptom log.
          If you're looking for an app for sickle cell patients that goes
          further than a generic pain scale, this page walks through what
          Hemo does and how it compares to the alternatives.
        </p>
      </motion.div>

      {/* ── Feature walkthrough ── */}
      <section className="mt-20">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
          What the app actually does
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Six screens, one goal: make daily SCD tracking fast enough to
          actually keep up, and useful enough to change your next
          appointment.
        </p>

        <div className="mt-12 grid gap-x-8 gap-y-16 sm:grid-cols-2 lg:grid-cols-3">
          {WALKTHROUGH.map((item, i) => (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.08, ease: "easeOut" }}
              className="flex flex-col items-center text-center"
            >
              <Iphone
                className="max-w-52"
                src={item.screenshot}
                alt={`${item.label} screen in the Hemo sickle cell tracking app`}
              />
              <p className="mt-6 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {item.label}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Comparison table ── */}
      <section className="mt-24">
        <h2 className="max-w-2xl text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
          Hemo vs. generic symptom trackers vs. a paper diary
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Generic symptom trackers and paper diaries both genuinely work for
          plenty of people — they're flexible, cheap or free, and don't
          require adopting new software. The honest difference is
          SCD-specificity: how much of the setup, structure, and reminders
          are already built around sickle cell management instead of left
          for you to invent.
        </p>

        <div className="mt-8 overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-5 py-4 font-semibold text-foreground">
                  Criteria
                </th>
                <th className="px-5 py-4 text-center font-semibold text-primary">
                  Hemo
                </th>
                <th className="px-5 py-4 text-center font-semibold text-foreground">
                  Generic symptom tracker
                </th>
                <th className="px-5 py-4 text-center font-semibold text-foreground">
                  Paper diary
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.criterion} className="border-t">
                  <td className="px-5 py-3.5 text-foreground">
                    {row.criterion}
                  </td>
                  <td className="bg-primary/[0.03] px-5 py-3.5 text-center">
                    <ComparisonCell value={row.hemo} />
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <ComparisonCell value={row.generic} />
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <ComparisonCell value={row.paper} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          "Partial" means the capability exists in some generic trackers but
          isn't built around SCD specifically (e.g. a free-text field instead
          of structured trigger tags). Pricing for generic trackers varies
          widely by app and plan.
        </p>
      </section>

      {/* ── FAQ ── */}
      <section className="mt-24">
        <FAQScrollAccordion
          title="Frequently asked questions"
          items={FAQS}
        />
      </section>

      <PageWaitlistCTA
        title="Ready to try a sickle cell tracker built for SCD?"
        description="Join the waitlist for early access to Hemo and get updates as the app rolls out."
      />
    </div>
  );
};

export default SickleCellTrackingApp;
