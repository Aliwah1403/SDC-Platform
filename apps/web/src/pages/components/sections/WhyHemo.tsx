import { HeartPulse, ShieldPlus, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const cards = [
  {
    icon: HeartPulse,
    title: "Built for real-life SCD management",
    description:
      "Logging is designed to be quick even on difficult days, so consistency is realistic.",
  },
  {
    icon: TrendingUp,
    title: "Data that improves appointments",
    description:
      "90 days of structured logs give clinicians clearer patterns than memory alone.",
  },
  {
    icon: ShieldPlus,
    title: "Support beyond symptom tracking",
    description:
      "Care Hub and SOS features keep practical care details ready when timing matters.",
  },
];

const WhyHemo = () => {
  return (
    <section id="impact" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="grid items-start gap-10 lg:grid-cols-2 lg:gap-14">
        <div className="space-y-5">
          <Badge variant="secondary" className="w-fit">Why Hemo</Badge>
          <h2 className="text-balance text-4xl font-bold leading-tight sm:text-5xl">
            Not Just A Tracker. A Daily Companion For Better Care Decisions.
          </h2>
          <p className="max-w-xl text-muted-foreground">
            SCD management can feel fragmented across symptoms, meds, appointments,
            and emergencies. Hemo brings it together so people can make clearer,
            calmer decisions day by day.
          </p>
          <div className="grid grid-cols-2 gap-6 pt-2">
            <div>
              <p className="text-5xl font-bold tracking-tight">90</p>
              <p className="text-sm text-muted-foreground">days of health history ready for clinic</p>
            </div>
            <div>
              <p className="text-5xl font-bold tracking-tight">7</p>
              <p className="text-sm text-muted-foreground">core metrics logged in one quick flow</p>
            </div>
          </div>
        </div>

        <div className="grid gap-4">
          {cards.map((card) => (
            <Card key={card.title} className="rounded-2xl border">
              <CardContent className="flex gap-4 px-5 py-5">
                <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                  <card.icon className="size-4" />
                </div>
                <div>
                  <h3 className="font-semibold">{card.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{card.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyHemo;
