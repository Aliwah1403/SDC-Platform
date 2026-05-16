import { BadgeCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";
import NumberFlow from "@number-flow/react";

type FlatPlan = {
  kind: "flat";
  features: string[];
};

type GroupedPlan = {
  kind: "grouped";
  preamble: string;
  groups: { label: string; items: string[] }[];
};

type Plan = {
  name: string;
  label: string;
  monthlyPrice: number;
  yearlyPrice: number;
  period: { monthly: string };
  description: { monthly: string; yearly: string };
  buttonText: string;
  buttonVariant: "outline" | "default";
  highlighted: boolean;
  badge?: string;
} & (FlatPlan | GroupedPlan);

const PLANS: Plan[] = [
  {
    name: "Companion",
    label: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    period: { monthly: "forever", yearly: "forever" },
    description: {
      monthly:
        "The core Hemo experience — no time limit, no credit card needed.",
      yearly:
        "The core Hemo experience — no time limit, no credit card needed.",
    },
    buttonText: "Get started free",
    buttonVariant: "outline",
    highlighted: false,
    kind: "flat",
    features: [
      "Daily symptom log (pain, mood, hydration, sleep)",
      "7-day trend charts",
      "Emergency SOS — always free",
      "Health streak, milestones & rewards",
      "2 streak repairs per month",
      "Medications (up to 2) with SCD safety warnings",
      "Care team (1 member) & 1 crisis plan",
      "Appointments (up to 3 upcoming)",
      "Learn section & full community access",
    ],
  },
  {
    name: "Hemo+",
    label: "Hemo+",
    monthlyPrice: 7.99,
    yearlyPrice: 59.99,
    period: { monthly: "per month" },
    description: {
      monthly:
        "Unlimited history, AI insights, and the full care hub. Try free for 7 days.",
      yearly:
        "Unlimited history, AI insights, and the full care hub. Best value.",
    },
    buttonText: "Start 7-day free trial",
    buttonVariant: "default",
    highlighted: true,
    badge: "Most popular",
    kind: "grouped",
    preamble: "Everything in Free, plus:",
    groups: [
      {
        label: "Deeper tracking",
        items: [
          "Full health history — unlimited",
          "Month-view charts & 7-day calendar navigation",
          "PDF health reports",
        ],
      },
      {
        label: "Care coordination",
        items: [
          "Unlimited medications, appointments & care team",
          "Dose reminders, Specific Days scheduling & calendar sync",
          "Hospital & facility finder",
        ],
      },
      {
        label: "Smarter support",
        items: [
          "AI-powered health insights",
          "Drug info cards, barcode scanner & Photo AI pill ID",
          "Crisis plan sharing, export & expert forum",
        ],
      },
    ],
  },
];

interface Pricing34Props {
  className?: string;
  showCTA?: boolean;
}

const Pricing34 = ({ className, showCTA = false }: Pricing34Props) => {
  const [billing, setBilling] = useState("yearly");

  return (
    <div className={cn("flex flex-col gap-10", className)}>
      <div className="flex justify-center">
        <ToggleGroup
          type="single"
          value={billing}
          onValueChange={(v) => {
            if (v) setBilling(v);
          }}
          className="rounded bg-muted p-1"
        >
          <ToggleGroupItem
            value="monthly"
            className="h-8 w-28 rounded-sm text-sm data-[state=on]:bg-background"
          >
            Monthly
          </ToggleGroupItem>
          <ToggleGroupItem
            value="yearly"
            className="h-8 w-36 rounded-sm text-sm data-[state=on]:bg-background"
          >
            Yearly · Save 37%
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="mt-2 grid gap-5 sm:grid-cols-2 max-w-3xl mx-auto w-full">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "relative overflow-visible shadow-sm",
              plan.highlighted ? "border-2 border-primary" : "border-border",
            )}
          >
            {plan.badge && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                {plan.badge}
              </span>
            )}
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">
                {plan.label}
              </CardTitle>
              <div className="mt-3">
                <span className="text-4xl font-semibold tracking-tight">
                  <NumberFlow
                    value={
                      billing === "monthly"
                        ? plan.monthlyPrice
                        : plan.yearlyPrice
                    }
                    format={{
                      style: "currency",
                      currency: "USD",
                      trailingZeroDisplay: "stripIfInteger",
                    }}
                  />
                </span>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {billing === "monthly"
                    ? plan.period.monthly
                    : plan.period.yearly}
                </p>
                {billing === "yearly" && plan.yearlyPrice > 0 && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    $4.99/month equivalent
                  </p>
                )}
              </div>
            </CardHeader>

            <CardContent className="px-6 pt-4">
              <p className="mb-5 text-sm text-muted-foreground">
                {billing === "monthly"
                  ? plan.description.monthly
                  : plan.description.yearly}
              </p>

              <Button variant={plan.buttonVariant} className="w-full">
                {plan.buttonText}
              </Button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <Separator />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-card px-2 text-xs uppercase tracking-wide text-muted-foreground/50">
                    includes
                  </span>
                </div>
              </div>

              {plan.kind === "flat" ? (
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="space-y-5">
                  <p className="text-sm text-muted-foreground">
                    {plan.preamble}
                  </p>
                  {plan.groups.map((group) => (
                    <div key={group.label}>
                      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-foreground/60">
                        {group.label}
                      </p>
                      <ul className="space-y-2">
                        {group.items.map((item) => (
                          <li key={item} className="flex items-start gap-2.5">
                            <BadgeCheck className="mt-0.5 size-4 shrink-0 text-primary" />
                            <span className="text-sm text-muted-foreground">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {showCTA && (
        <div className="text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            See the full feature breakdown, including institutional plans.
          </p>
          <Button
            variant="outline"
            className="px-8"
            render={<Link to="/pricing" />}
          >
            See full pricing details
          </Button>
        </div>
      )}
    </div>
  );
};

export { Pricing34 };
