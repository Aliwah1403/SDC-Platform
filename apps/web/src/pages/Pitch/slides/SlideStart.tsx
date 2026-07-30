import { motion } from "framer-motion";

const SlideStart = () => {
  return (
    <div className="relative flex h-full w-full items-center justify-center overflow-hidden">
      <div
        className="pointer-events-none absolute -left-32 -top-32 size-[480px] rounded-full opacity-25 blur-3xl"
        style={{ background: "#D09F9A" }}
      />
      <div
        className="pointer-events-none absolute -bottom-40 -right-24 size-[560px] rounded-full opacity-20 blur-3xl"
        style={{ background: "#781D11" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative flex flex-col items-center px-6 text-center"
      >
        <img src="/logo-cream.png" alt="Hemo" className="h-20 w-20" />
        <h1 className="mt-8 text-6xl font-semibold tracking-[-0.03em] text-foreground sm:text-7xl">
          Hemo
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Your sickle cell companion
        </p>
        <p className="mt-10 text-sm uppercase tracking-[0.2em] text-muted-foreground/70">
          Product walkthrough
        </p>
      </motion.div>
    </div>
  );
};

export default SlideStart;
