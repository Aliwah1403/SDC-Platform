import { ClipboardPenLine, Stethoscope, TrendingUp } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: ClipboardPenLine,
    title: "1. Log",
    description: "Complete your daily check-in in under two minutes.",
  },
  {
    icon: TrendingUp,
    title: "2. Track",
    description: "See what is changing week to week across pain, mood, and hydration.",
  },
  {
    icon: Stethoscope,
    title: "3. Prepare",
    description: "Bring clear trends into every appointment and make better care decisions.",
  },
];

const HowItWorks = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <Badge variant="secondary">How It Works</Badge>
        <h2 className="mt-4 text-balance text-4xl font-bold sm:text-5xl">
          Three Steps To Better Daily Control
        </h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <Card key={step.title} className="rounded-2xl border">
            <CardContent className="space-y-3 p-6">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <step.icon className="size-5" />
              </div>
              <h3 className="text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
};

export default HowItWorks;
