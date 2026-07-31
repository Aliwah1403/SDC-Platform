import { motion } from "framer-motion";
import { MessageSquareQuote, Sparkles, ShieldCheck } from "lucide-react";
import SharedSummary from "@/assets/screenshots/shared-summary.png";

const HIGHLIGHTS = [
  {
    icon: Sparkles,
    title: "AI-generated “What we noticed”",
    description:
      "Pain, hydration, sleep, and medication patterns from the last 7, 30, or 60 days — summarised in plain language before the appointment even starts.",
  },
  {
    icon: MessageSquareQuote,
    title: "The patient's own context",
    description:
      "“My pain has been worse in the mornings” — free-text notes the patient adds sit alongside the data, not buried in a separate message.",
  },
  {
    icon: ShieldCheck,
    title: "Shared on their terms",
    description:
      "A revocable link, with a choice of full name, initials, or partial anonymisation — the patient decides what the care team sees.",
  },
] as const;

const BrowserPlaceholder = () => (
  <div className="w-full max-w-[420px] overflow-hidden rounded-2xl border border-border bg-card/60 shadow-lg">
    <div className="flex items-center gap-1.5 border-b border-border px-4 py-3">
      <span className="size-2.5 rounded-full bg-[#DC2626]/60" />
      <span className="size-2.5 rounded-full bg-[#F0531C]/60" />
      <span className="size-2.5 rounded-full bg-[#10B981]/60" />
    </div>
    <img
      src={SharedSummary}
      alt="Shared health summary"
      className="block w-full"
    />
  </div>
);

const SlideSummary = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6 sm:px-12">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-xs font-semibold uppercase tracking-[0.2em] text-primary"
      >
        For the care team
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mt-3 max-w-2xl text-balance text-center text-3xl font-semibold tracking-[-0.02em] text-foreground sm:text-4xl"
      >
        What Hemo noticed, ready before the appointment starts.
      </motion.h2>

      <div className="mt-10 grid w-full max-w-5xl items-center gap-10 lg:grid-cols-[0.9fr_1fr]">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.12 }}
          className="flex justify-center lg:justify-end"
        >
          <BrowserPlaceholder />
        </motion.div>

        <div className="space-y-6">
          {HIGHLIGHTS.map(({ icon: Icon, title, description }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 + i * 0.08 }}
              className="flex gap-4"
            >
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15">
                <Icon className="size-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">
                  {title}
                </h3>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SlideSummary;
