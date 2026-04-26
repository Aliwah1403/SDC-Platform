import {
  Activity,
  HeartPulse,
  LifeBuoy,
  Siren,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const featureHighlights = [
  {
    icon: Activity,
    title: "Daily Health Log",
    description: "7-step check-ins for pain, symptoms, mood, hydration, triggers, and notes.",
  },
  {
    icon: TrendingUp,
    title: "Health Trends",
    description: "7-day and 30-day views to spot patterns you can act on early.",
  },
  {
    icon: HeartPulse,
    title: "Weekly Insights",
    description: "A wellbeing score with context on what improved or worsened this week.",
  },
  {
    icon: LifeBuoy,
    title: "Care Hub",
    description: "Medications, appointments, care team, crisis plan, and emergency profile.",
  },
  {
    icon: Siren,
    title: "Emergency SOS",
    description: "One-tap SOS flow so help is available fast when a crisis escalates.",
  },
];

const AppFeatures = () => {
  return (
    <section id="features" className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
      <div className="mb-14 flex flex-col items-center gap-4 text-center">
        <Badge variant="secondary" className="w-fit">Feature Highlights</Badge>
        <h2 className="max-w-3xl text-balance text-4xl font-bold sm:text-5xl">
          The Essentials For Everyday Sickle Cell Self-Management
        </h2>
        <p className="max-w-2xl text-balance text-muted-foreground">
          Hemo focuses on what people with SCD need most: clear daily tracking,
          useful patterns, and practical support before things become urgent.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {featureHighlights.map((feature) => (
          <Card key={feature.title} className="rounded-2xl border">
            <CardContent className="flex h-full flex-col gap-3 px-6 py-6">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <feature.icon className="size-5" />
              </div>
              <h3 className="text-lg font-semibold">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default AppFeatures;
