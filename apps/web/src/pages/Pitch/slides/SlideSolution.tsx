import { motion } from "framer-motion";
import { Iphone } from "@/components/ui/iphone";
import DailyLog from "@/assets/screenshots/daily-log.webp";
import HealthTrends from "@/assets/screenshots/health-trends.webp";
import CareScreen from "@/assets/screenshots/care-screen.webp";

const SOLUTIONS = [
  {
    title: "Daily Health Log",
    description:
      "A two-minute guided check-in captures pain, symptoms, hydration, mood, and triggers — short enough to complete on the hard days.",
    src: DailyLog,
  },
  {
    title: "Health Trends",
    description:
      "Pain, mood, hydration, sleep, and heart rate over 7 and 30 days — patterns become visible instead of anecdotal.",
    src: HealthTrends,
  },
  {
    title: "Crisis Plan & Care Hub",
    description:
      "Allergies, medications, contacts, and escalation steps live on the phone that's already in hand — not on paper in a drawer.",
    src: CareScreen,
  },
] as const;

const SlideSolution = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6 sm:px-12">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-xs font-semibold uppercase tracking-[0.2em] text-primary"
      >
        The solution
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mt-2 max-w-2xl text-balance text-center text-3xl font-semibold tracking-[-0.02em] text-foreground sm:text-4xl"
      >
        Everything the user and their care team need, in one place.
      </motion.h2>

      <div className="mt-5 grid max-w-4xl gap-6 sm:grid-cols-3">
        {SOLUTIONS.map(({ title, description, src }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
            className="flex flex-col items-center text-center"
          >
            <Iphone className="w-24 sm:w-28" src={src} alt={`${title} screenshot`} />
            <h3 className="mt-3 text-base font-semibold text-foreground">
              {title}
            </h3>
            <p className="mt-2 max-w-[220px] text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </motion.div>
        ))}
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
        className="mt-5 max-w-md text-center text-xs text-muted-foreground/70"
      >
        Also inside: wearable health alerts and a scannable ED emergency card.
      </motion.p>
    </div>
  );
};

export default SlideSolution;
