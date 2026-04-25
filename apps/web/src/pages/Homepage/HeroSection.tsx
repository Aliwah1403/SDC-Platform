import { motion } from "framer-motion";

import WaitlistCTAButton from "@/components/WaitlistCTAButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function PhoneShell({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[2.2rem] border-4 border-[#1e2322] bg-white shadow-[0_24px_60px_-35px_rgba(0,0,0,0.5)] ${className}`}
    >
      <div className="mx-auto mt-2 h-5 w-20 rounded-full bg-[#1e2322]" />
      <div className="p-4">
        <div className="rounded-2xl bg-[#f8f4f1] p-3">
          <div className="h-2 w-24 rounded-full bg-[#d8cec9]" />
          <div className="mt-2 h-2 w-36 rounded-full bg-[#e2d8d2]" />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="h-12 rounded-xl bg-white" />
            <div className="h-12 rounded-xl bg-white" />
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-10 rounded-xl bg-[#f5efeb]" />
          <div className="h-10 rounded-xl bg-[#f5efeb]" />
          <div className="h-10 rounded-xl bg-[#f5efeb]" />
        </div>
      </div>
    </div>
  );
}

const HeroSection = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-12 pt-18 text-center sm:px-6 lg:px-8 lg:pt-24">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Badge variant="secondary" className="px-3 py-1 text-xs">
          #1 Sickle Cell Companion App
        </Badge>
        <h1 className="mx-auto mt-6 max-w-4xl text-balance text-5xl font-semibold tracking-[-0.03em] sm:text-6xl lg:text-7xl">
          Daily clarity for life with Sickle Cell
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
          Log symptoms, spot patterns, and show up to every clinic visit
          prepared with real health context.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <WaitlistCTAButton size="lg" className="px-8" />
          <Button
            variant="outline"
            size="lg"
            className="px-8"
            render={<a href="#story" />}
          >
            See how it works
          </Button>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="relative mt-16 grid items-end justify-center gap-4 sm:grid-cols-3"
      >
        <PhoneShell className="mx-auto hidden w-full max-w-[220px] sm:block" />
        <PhoneShell className="mx-auto w-full max-w-[240px] sm:max-w-[260px]" />
        <PhoneShell className="mx-auto hidden w-full max-w-[220px] sm:block" />
        <div className="pointer-events-none absolute bottom-[-2px] left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent" />
      </motion.div>
    </section>
  );
};

export default HeroSection;
