import { useRef } from "react";
import NumberFlow from "@number-flow/react";
import { useInView } from "framer-motion";

const STATS = [
  { number: 2,  suffix: " min",  label: "Daily log" },
  { number: 90, suffix: " days", label: "Trend history" },
  { number: 7,  suffix: "",      label: "Metrics tracked" },
  { number: 1,  suffix: "-tap",  label: "Emergency SOS" },
] as const;

const TrustLogoSection = () => {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section ref={ref} className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
      <div className="mx-auto mt-10 flex w-full max-w-xl flex-wrap items-center justify-between gap-6 sm:gap-10">
        {STATS.map((stat) => (
          <div key={stat.label} className="flex flex-col items-center gap-1">
            <p className="text-2xl font-medium tracking-tight text-foreground">
              <NumberFlow
                value={inView ? stat.number : 0}
                suffix={stat.suffix}
                transformTiming={{ duration: 900, easing: "ease-out" }}
                spinTiming={{ duration: 900, easing: "ease-out" }}
              />
            </p>
            <p className="text-xs text-muted-foreground sm:text-sm">
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TrustLogoSection;
