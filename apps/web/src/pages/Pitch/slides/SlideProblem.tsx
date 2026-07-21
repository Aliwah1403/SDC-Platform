import { motion } from "framer-motion";
import { BrainCircuit, FileWarning, Siren } from "lucide-react";

const PROBLEMS = [
  {
    icon: BrainCircuit,
    title: "Symptoms fade from memory",
    description:
      "Pain, hydration, mood, and triggers are hard to recall accurately days or weeks later — by the appointment, the details that matter most are already gone.",
  },
  {
    icon: FileWarning,
    title: "Care teams see only snapshots",
    description:
      "A ten-minute clinic visit is built from memory, not data. Patterns that would change a treatment plan never surface because nobody was tracking them.",
  },
  {
    icon: Siren,
    title: "Crisis plans live in a drawer",
    description:
      "Allergies, medications, and escalation steps exist on paper somewhere — not in the hand of the person in pain, and not on the phone that's already open.",
  },
] as const;

const SlideProblem = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6 sm:px-12">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-xs font-semibold uppercase tracking-[0.2em] text-primary"
      >
        The problem
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.05 }}
        className="mt-3 max-w-2xl text-balance text-center text-3xl font-semibold tracking-[-0.02em] text-foreground sm:text-4xl"
      >
        Self-managing sickle cell disease shouldn't be this scattered.
      </motion.h2>

      <div className="mt-12 grid max-w-5xl gap-5 sm:grid-cols-3">
        {PROBLEMS.map(({ icon: Icon, title, description }, i) => (
          <motion.div
            key={title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
            className="rounded-2xl border border-border bg-card/60 p-6"
          >
            <div className="flex size-11 items-center justify-center rounded-full bg-primary/15">
              <Icon className="size-5 text-primary" />
            </div>
            <h3 className="mt-5 text-lg font-semibold text-foreground">
              {title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {description}
            </p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SlideProblem;
