import { ArrowRight } from "lucide-react";

import WaitlistCTAButton from "@/components/WaitlistCTAButton";
import { Button } from "@/components/ui/button";
import { Iphone } from "@/components/ui/iphone";

const HeroSection = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 pb-0 pt-16 text-center sm:px-6 lg:px-8">
      <div className="flex flex-col items-center gap-6">
        <a
          href="/features"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-secondary-foreground transition-colors hover:bg-secondary/80"
        >
          <span className="font-medium text-primary">Built for bad pain days</span>
          <ArrowRight className="size-3.5 text-primary" />
        </a>

        <h1 className="max-w-4xl text-balance text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          Feel More In Control Of Sickle Cell, Every Day
        </h1>

        <p className="max-w-2xl text-balance text-lg text-muted-foreground">
          Hemo helps you log symptoms in under two minutes, spot patterns over
          time, and walk into appointments with 90 days of clear health context.
        </p>

        <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
          <Button variant="outline" size="lg" className="rounded-full px-7" render={<a href="/why-hemo" />}>
            Why Hemo
          </Button>
          <WaitlistCTAButton size="lg" className="rounded-full px-7" />
        </div>
      </div>

      <div className="relative mt-24 flex items-end justify-center gap-4">
        <div className="order-2 h-[600px] w-full max-w-sm overflow-hidden md:h-[350px] lg:h-[450px] xl:h-[600px]">
          <Iphone
            className="dark"
            src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-phone-1.svg"
          />
        </div>
        <div className="order-1 hidden h-[250px] w-full max-w-sm overflow-hidden md:block lg:h-[350px] xl:h-[450px]">
          <Iphone
            className="dark size-full"
            src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-phone-2.svg"
          />
        </div>
        <div className="order-3 hidden h-[250px] w-full max-w-sm overflow-hidden md:block lg:h-[350px] xl:h-[450px]">
          <Iphone
            className="dark size-full"
            src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-phone-3.svg"
          />
        </div>
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-10 h-56"
          style={{
            background:
              "linear-gradient(to top, #fffaf9 0%, rgba(255,250,249,0.85) 40%, transparent 100%)",
          }}
        />
      </div>
    </section>
  );
};

export default HeroSection;
