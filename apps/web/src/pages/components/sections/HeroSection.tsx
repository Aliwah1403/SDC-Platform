import { ArrowRight } from "lucide-react";
import { Iphone } from "@/components/ui/iphone";
import { Button } from "@/components/ui/button";

const HeroSection = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 pt-16 pb-0 sm:px-6 lg:px-8 text-center">
      <div className="flex flex-col items-center gap-6">
        <a
          href="#features"
          className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-4 py-1.5 text-sm text-secondary-foreground hover:bg-secondary/80 transition-colors"
        >
          <span className="text-primary font-medium">
            #1 Sickle Cell Companion App
          </span>
          <ArrowRight className="size-3.5 text-primary" />
        </a>

        <h1 className="max-w-3xl text-balance text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
          Take Control Of Your Sickle Cell Health Journey
        </h1>

        <p className="max-w-xl text-balance text-lg text-muted-foreground">
          Track symptoms, stay on top of care, and share clearer health context
          with your support team — all in one place.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
          <Button
            variant="outline"
            size="lg"
            className="rounded-full px-7"
            onClick={() => jumpTo("features")}
          >
            Learn More
          </Button>
          <Button
            size="lg"
            className="rounded-full px-7 bg-foreground text-background hover:bg-foreground/85"
            onClick={() => jumpTo("waitlist")}
          >
            Get Started
          </Button>
        </div>
      </div>

      <div className="relative mt-28 flex items-end justify-center gap-4">
        <div className="order-2 h-[600px] w-full max-w-sm overflow-hidden md:h-[350px] lg:h-[450px] xl:h-[600px]">
          <div className="relative">
            <Iphone
              className="dark"
              src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-phone-1.svg"
            />
          </div>
        </div>
        <div className="order-1 hidden h-[250px] w-full max-w-sm overflow-hidden md:block lg:h-[350px] xl:h-[450px]">
          <div className="relative">
            <Iphone
              className="dark size-full"
              src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-phone-2.svg"
            />
          </div>
        </div>
        <div className="order-3 hidden h-[250px] w-full max-w-sm overflow-hidden md:block lg:h-[350px] xl:h-[450px]">
          <div className="relative">
            <Iphone
              className="dark size-full"
              src="https://deifkwefumgah.cloudfront.net/shadcnblocks/block/placeholder-phone-3.svg"
            />
          </div>
        </div>
        {/* Cloudy base fade */}
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 h-56 z-10"
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
