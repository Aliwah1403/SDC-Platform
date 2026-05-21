import { motion } from "framer-motion";
import { Iphone } from "@/components/ui/iphone";
import CareScreen from "@/assets/screenshots/care-screen.png";
import HealthTrends from "@/assets/screenshots/health-trends.png";
import Streaks from "@/assets/screenshots/streaks.png";
import Community from "@/assets/screenshots/community.png";
import DailyLog from "@/assets/screenshots/daily-log.png";
import Insights from "@/assets/screenshots/insights.png";
const FEATURE_STORIES = [
  {
    title: "Daily Health Log",
    headline: "Know your body in under two minutes.",
    description:
      "Capture pain, symptoms, hydration, mood, triggers, and notes in one guided check-in. It is short enough to complete on difficult days.",
    result: "Two minutes today gives you answers later.",
    source: DailyLog,
  },
  {
    title: "Health Trends",
    headline: "See patterns before they become surprises.",
    description:
      "Track pain, mood, hydration, sleep, steps, and heart rate over 7 and 30 days with clear visual history.",
    result: "You stop guessing and start spotting what helps.",
    source: HealthTrends,
  },
  {
    title: "Insights",
    headline: "Your week, scored and explained.",
    description:
      "Hemo compares this week to last week and calls out meaningful changes in plain language.",
    result: "Context, not just numbers.",
    source: Insights,
  },
  {
    title: "Streak System",
    headline: "Build the habit. Protect your streak.",
    description:
      "Streak repairs and milestone badges reward consistency without making missed days feel like failure.",
    result: "Better routine, less pressure.",
    source: Streaks,
  },
  {
    title: "Care Hub",
    headline: "Everything for your care in one place.",
    description:
      "Medication details, appointments, contacts, crisis plan, and emergency profile stay organized and easy to reach.",
    result: "Less scrambling when you need clarity.",
    source: CareScreen,
  },
  {
    title: "Community",
    headline: "Find people who actually get it.",
    description:
      "Connect with others living with SCD — share what works, ask questions, and feel less alone on the harder days.",
    result: "Support from people who understand firsthand.",
    source: Community,
  },
] as const;

const AppFeatures = () => {
  return (
    <section
      id="features"
      className="mx-auto max-w-7xl px-4 py-18 sm:px-6 lg:px-8"
    >
      <div className="space-y-14">
        {FEATURE_STORIES.map((feature, index) => (
          <motion.article
            key={feature.title}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.55 }}
            className="grid items-center gap-10 lg:grid-cols-2"
          >
            <div className={index % 2 === 1 ? "lg:order-2" : ""}>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                {feature.title}
              </p>
              <h3 className="mt-3 max-w-xl text-balance text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
                {feature.headline}
              </h3>
              <p className="mt-4 max-w-xl text-muted-foreground">
                {feature.description}
              </p>
              <p className="mt-3 text-base font-medium">{feature.result}</p>
            </div>
            <div
              className={`flex items-center justify-center ${index % 2 === 1 ? "lg:order-1" : ""}`}
            >
              <Iphone
                className="w-full max-w-72"
                src={feature.source as string | undefined}
                alt={`${feature.title} screenshot`}
              />
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
};

export default AppFeatures;
