import React from "react";
import { Pricing34 } from "@/components/pricing34";
import { Badge } from "@/components/ui/badge";

const PricingSection = () => {
  return (
    <section id="pricing" className="bg-secondary py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <Badge variant="secondary" className="px-3 py-1 text-xs">
            Pricing
          </Badge>
          <h2 className="mx-auto mt-4 max-w-xl text-balance text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
            Free to start. Upgrade when it matters.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Core daily tracking is free with no time limit. Hemo+ unlocks
            unlimited history, AI insights, and the full care toolkit for
            $7.99/month — or $59.99/year.
          </p>
        </div>
        <Pricing34 showCTA />
      </div>
    </section>
  );
};

export default PricingSection;
