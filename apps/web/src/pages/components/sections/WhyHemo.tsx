import { HeartPulse, Globe, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const whyCards = [
  {
    icon: Globe,
    title: "Always Within Reach",
    description:
      "One-tap emergency SOS and instant access to your care contacts wherever you are.",
  },
  {
    icon: HeartPulse,
    title: "Built For Real Impact",
    description:
      "Daily check-ins that drive better, more informed clinic conversations.",
  },
  {
    icon: TrendingUp,
    title: "Insights That Help You Grow",
    description:
      "Spot patterns in your pain, mood, sleep, and hydration over time.",
  },
];

const WhyHemo = () => {
  return (
    <section
      id="impact"
      className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-16 items-start">
        {/* Left */}
        <div className="flex flex-col gap-5">
          <Badge variant="secondary" className="w-fit">
            Why Choose Hemo
          </Badge>
          <h2 className="text-4xl font-bold leading-tight sm:text-5xl">
            Empowering Lives,
            <br />
            Creating Better
            <br />
            Health Futures
          </h2>
          <p className="text-muted-foreground max-w-md">
            Gain deep visibility into your day-to-day health so you can
            understand what matters most and communicate it clearly to your care
            team.
          </p>
          <Button
            variant="outline"
            className="w-fit rounded-full px-6"
            onClick={() => jumpTo("features")}
          >
            Learn More
          </Button>
        </div>

        {/* Right — stats */}
        <div className="grid grid-cols-2 gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-7xl font-bold tracking-tighter text-foreground">
              90+
            </p>
            <p className="text-sm text-muted-foreground">
              Days of trend visibility from your symptom logs
            </p>
          </div>
          <div className="flex flex-col gap-1">
            <p className="text-7xl font-bold tracking-tighter text-foreground">
              7
            </p>
            <p className="text-sm text-muted-foreground">
              Care tools in one unified experience
            </p>
          </div>
        </div>
      </div>

      {/* Feature cards */}
      <div className="mt-14 grid gap-4 sm:grid-cols-3">
        {whyCards.map((card) => (
          <Card key={card.title} className="border rounded-2xl p-1">
            <CardContent className="flex flex-col gap-3 pt-5 pb-5 px-5">
              <div className="size-9 rounded-xl bg-secondary flex items-center justify-center">
                <card.icon className="size-4 text-secondary-foreground" />
              </div>
              <p className="font-semibold text-foreground">{card.title}</p>
              <p className="text-sm text-muted-foreground">
                {card.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default WhyHemo;
