import { motion } from "framer-motion";

const SlideVision = () => {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center px-6 text-center sm:px-16">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-xs font-semibold uppercase tracking-[0.2em] text-primary"
      >
        Vision
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.08 }}
        className="mt-6 max-w-3xl text-balance text-4xl font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-5xl"
      >
        Care for sickle cell disease shouldn't reset every time you change rooms.
      </motion.h2>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="mt-6 max-w-xl text-muted-foreground"
      >
        Hemo is built to carry context between the home, the clinic, and the
        emergency room — so the person living with SCD only has to say it once.
      </motion.p>
    </div>
  );
};

export default SlideVision;
