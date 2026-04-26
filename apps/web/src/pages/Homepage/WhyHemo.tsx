import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const WhyHemo = () => {
  return (
    <section id="story" className="bg-secondary py-18">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
        <div>
          <Badge variant="secondary" className="px-3 py-1 text-xs">
            Why Hemo
          </Badge>
          <h2 className="mt-4 max-w-xl text-balance text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
            Connecting daily logs to better clinic visits
          </h2>
          <p className="mt-4 max-w-xl text-muted-foreground">
            SCD management can feel fragmented. Hemo gives one calm daily flow
            that turns scattered symptoms into useful long-term context.
          </p>
          <Button
            variant="outline"
            className="mt-6 px-6"
            render={<a href="#features" />}
          >
            Learn more
          </Button>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-lg bg-white p-5">
            <p className="text-4xl font-semibold tracking-tight">250K</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Health logs guiding safer weekly decisions
            </p>
          </article>
          <article className="rounded-lg bg-white p-5">
            <p className="text-4xl font-semibold tracking-tight">350K</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Moments where critical care details stayed accessible
            </p>
          </article>
          <article className="col-span-full rounded-lg bg-white p-5 text-sm text-muted-foreground">
            Designed for all major SCD types, with patient-first language and
            emergency-aware workflows.
          </article>
        </div>
      </div>
    </section>
  );
};

export default WhyHemo;
