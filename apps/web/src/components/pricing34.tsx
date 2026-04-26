import { BadgeCheck } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    name: "Free",
    monthlyPrice: "$0",
    yearlyPrice: "$0",
    period: { monthly: "forever", yearly: "forever" },
    description: {
      monthly:
        "Core daily tracking to build your health habit. No credit card needed.",
      yearly:
        "Core daily tracking to build your health habit. No credit card needed.",
    },
    buttonText: "Get started free",
    buttonVariant: "outline" as const,
    highlighted: false,
    features: [
      "Daily health log (pain, mood, hydration, sleep)",
      "7-day trend history",
      "Emergency SOS",
      "Medications & contacts in care hub",
      "Community access",
      "1 streak repair per month",
    ],
  },
  {
    name: "Pro",
    monthlyPrice: "$4.99",
    yearlyPrice: "$39.99",
    period: { monthly: "per month", yearly: "per year — save 33%" },
    description: {
      monthly:
        "Full history and AI-powered insights for serious health tracking.",
      yearly: "Full history and AI-powered insights. Best value.",
    },
    buttonText: "Start 14-day trial",
    buttonVariant: "default" as const,
    highlighted: true,
    badge: "Most popular",
    features: [
      "Everything in Free",
      "Full 90-day trend history",
      "AI health insights",
      "Unlimited streak repairs",
      "Full care hub (appointments, crisis plan, care team)",
      "PDF health export",
    ],
  },
  {
    name: "Plus",
    monthlyPrice: "$9.99",
    yearlyPrice: "$79.99",
    period: { monthly: "per month", yearly: "per year — save 33%" },
    description: {
      monthly: "Advanced tools and priority support for power users.",
      yearly: "Advanced tools and priority support. Best value.",
    },
    buttonText: "Get Plus",
    buttonVariant: "outline" as const,
    highlighted: false,
    features: [
      "Everything in Pro",
      "Unlimited AI assistant queries",
      "Custom metric goals",
      "Advanced analytics",
      "Priority support",
      "Early feature access",
    ],
  },
  {
    name: "Family",
    monthlyPrice: "$14.99",
    yearlyPrice: "$119.99",
    period: { monthly: "per month", yearly: "per year — save 33%" },
    description: {
      monthly:
        "One plan for the whole household. Supports patients and caregivers together.",
      yearly: "One plan for the whole household. Best value.",
    },
    buttonText: "Get Family",
    buttonVariant: "outline" as const,
    highlighted: false,
    features: [
      "Everything in Plus",
      "Up to 5 member profiles",
      "Caregiver view",
      "Shared emergency contacts",
      "Family health overview",
    ],
  },
];

interface Pricing34Props {
  className?: string;
  showCTA?: boolean;
}

const Pricing34 = ({ className, showCTA = false }: Pricing34Props) => {
  const [billing, setBilling] = useState("monthly");

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
            className="h-8 w-28 rounded-sm text-sm data-[state=on]:bg-background"
          >
            Yearly
          </ToggleGroupItem>
        </ToggleGroup>
      </div>

      <div className="mt-2 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {PLANS.map((plan) => (
          <Card
            key={plan.name}
            className={cn(
              "relative overflow-visible shadow-sm max-w-sm",
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
                {plan.name}
              </CardTitle>
              <div className="mt-3">
                <span className="text-4xl font-semibold tracking-tight">
                  {billing === "monthly" ? plan.monthlyPrice : plan.yearlyPrice}
                </span>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {billing === "monthly"
                    ? plan.period.monthly
                    : plan.period.yearly}
                </p>
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
            </CardContent>
          </Card>
        ))}
      </div>

      {showCTA && (
        <div className="text-center">
          <p className="mb-4 text-sm text-muted-foreground">
            Compare all features in detail, including enterprise options.
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
