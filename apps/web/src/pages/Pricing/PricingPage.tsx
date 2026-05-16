import { Check, ChevronRight, Minus } from "lucide-react";

import { Pricing34 } from "@/components/pricing34";
import { Badge } from "@/components/ui/badge";
import { FAQScrollAccordion } from "@/components/faq-scroll-accordion";
import { Separator } from "@/components/ui/separator";

type CellValue = string | boolean;

type ComparisonRow =
  | { type: "category"; label: string }
  | { type: "feature"; feature: string; free: CellValue; plus: CellValue };

const COMPARISON: ComparisonRow[] = [
  { type: "category", label: "Deeper Tracking" },
  {
    type: "feature",
    feature: "Daily symptom log (pain, mood, hydration, sleep, triggers, notes)",
    free: true,
    plus: true,
  },
  { type: "feature", feature: "Emergency SOS", free: "Always free", plus: "Always free" },
  { type: "feature", feature: "Learn section", free: true, plus: true },
  { type: "feature", feature: "Custom metric goals (hydration, sleep, steps)", free: true, plus: true },
  { type: "feature", feature: "Trend charts", free: "7-day", plus: "Unlimited + month view" },
  { type: "feature", feature: "Browse past days in detail", free: false, plus: true },
  { type: "feature", feature: "AI health insights", free: false, plus: true },
  { type: "feature", feature: "PDF health reports", free: false, plus: true },

  { type: "category", label: "Care Coordination" },
  { type: "feature", feature: "Crisis plan", free: "1 basic plan", plus: "Multiple scenarios, shareable + PDF export" },
  { type: "feature", feature: "Care team members", free: "1", plus: "Unlimited + appointment coordination" },
  { type: "feature", feature: "Hospital & facility finder", free: false, plus: true },
  { type: "feature", feature: "Medications you can add", free: "Up to 2", plus: "Unlimited" },
  { type: "feature", feature: "SCD drug safety warnings", free: true, plus: true },
  { type: "feature", feature: "Daily dose check-off", free: true, plus: true },
  { type: "feature", feature: "Adherence history", free: "7-day", plus: "Full history (M / 6M / Y)" },
  { type: "feature", feature: "Specific Days scheduling (e.g. Mon / Wed / Fri)", free: false, plus: true },
  { type: "feature", feature: "Multiple daily dose times (up to 6)", free: false, plus: true },
  { type: "feature", feature: "Dose reminders & missed-dose alerts", free: false, plus: true },
  { type: "feature", feature: "Upcoming appointments", free: "Up to 3", plus: "Unlimited" },
  { type: "feature", feature: "Appointment history", free: "Last 3", plus: "Full history" },
  { type: "feature", feature: "Appointment push reminders (5 min – 2 days before)", free: false, plus: true },
  { type: "feature", feature: "Sync to device calendar", free: false, plus: true },

  { type: "category", label: "Smarter Support" },
  { type: "feature", feature: "Drug info cards (uses, side effects, interactions)", free: false, plus: true },
  { type: "feature", feature: "Barcode scanner for instant drug lookup", free: false, plus: true },
  { type: "feature", feature: "Identify a pill from a photo (Photo AI)", free: false, plus: true },

  { type: "category", label: "Community" },
  { type: "feature", feature: "General community access", free: true, plus: true },
  { type: "feature", feature: "Expert forum & verified Q&A", free: false, plus: true },

  { type: "category", label: "Streak & Rewards" },
  { type: "feature", feature: "Health streak, milestones & rewards", free: true, plus: true },
  { type: "feature", feature: "Streak repairs", free: "2 / month", plus: "Unlimited" },

  { type: "category", label: "Support" },
  { type: "feature", feature: "Support channel", free: "Community", plus: "Priority email" },
];

const FAQS = [
  {
    question: "Is the Free plan actually free forever?",
    answer:
      "Yes. Symptom logging, 7-day health stats, Emergency SOS, community access, and the core care hub stay free with no time limit.",
  },
  {
    question: "Is there a free trial for Hemo+?",
    answer:
      "Yes — Hemo+ includes a 7-day free trial. No credit card required to start.",
  },
  {
    question: "Can I switch between monthly and annual billing?",
    answer:
      "Yes. You can upgrade to annual at any time and the remaining monthly value will be credited. Annual plans are billed upfront and are non-refundable after 14 days.",
  },
  {
    question: "What happens to my data if I cancel Hemo+?",
    answer:
      "Your logs are always yours. If you downgrade, your full health history is preserved in read-only mode and trend views return to 7 days.",
  },
  {
    question: "Is there a discount for financial hardship?",
    answer:
      "Yes. We offer an income-based discount program — 50% off Hemo+ for qualifying users. Apply through the app. We believe everyone living with SCD deserves access.",
  },
  {
    question: "Is Hemo+ free for patients under 18?",
    answer:
      "Yes. Pediatric SCD patients get Hemo+ free. Contact us through the app to verify and activate.",
  },
  {
    question: "Are prices in USD?",
    answer:
      "Yes. Prices are listed in USD. Local currency billing is available at checkout.",
  },
];

function Cell({ value }: { value: CellValue }) {
  if (value === true) return <Check className="mx-auto size-4 text-primary" />;
  if (value === false)
    return <Minus className="mx-auto size-4 text-muted-foreground/40" />;
  return <span className="text-sm text-muted-foreground">{value}</span>;
}

const PricingPage = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <Badge variant="secondary" className="px-3 py-1 text-xs">
          Pricing
        </Badge>
        <h1 className="mx-auto mt-4 max-w-2xl text-balance text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
          Free to start. More when you need it.
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          The core Hemo experience is free with no time limit. Upgrade to Hemo+
          for unlimited history, AI insights, and the full care toolkit.
        </p>
      </div>

      <Pricing34 />

      {/* Feature comparison table */}
      <section className="mt-20">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">
          Compare plans
        </h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-5 py-4 font-semibold text-foreground">
                  Feature
                </th>
                <th className="px-5 py-4 text-center font-semibold text-foreground">
                  Free
                </th>
                <th className="px-5 py-4 text-center font-semibold text-primary">
                  Hemo+
                </th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row, i) => {
                if (row.type === "category") {
                  return (
                    <tr key={`cat-${i}`} className="border-t bg-muted/20">
                      <td
                        colSpan={3}
                        className="px-5 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
                      >
                        {row.label}
                      </td>
                    </tr>
                  );
                }
                return (
                  <tr key={row.feature} className="border-t">
                    <td className="px-5 py-3.5 text-foreground">
                      {row.feature}
                    </td>
                    <td className="px-5 py-3.5 text-center">
                      <Cell value={row.free} />
                    </td>
                    <td className="bg-primary/[0.03] px-5 py-3.5 text-center">
                      <Cell value={row.plus} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-20">
        <FAQScrollAccordion title="Pricing FAQ" items={FAQS} />
      </section>

      <Separator className="my-12" />

      {/* Support */}
      <div className="flex flex-col justify-between gap-12 md:flex-row md:items-end">
        <div className="lg:col-span-2">
          <h2 className="mt-4 text-2xl font-semibold">Still have questions?</h2>
          <p className="mt-6 font-medium text-muted-foreground">
            We&apos;re here to help with anything — pricing, accessibility
            discounts, or institutional partnerships.
          </p>
        </div>
        <div className="flex md:justify-end">
          <a
            href="#"
            className="flex items-center gap-2 hover:text-primary transition-colors"
          >
            Contact Support
            <ChevronRight className="h-auto w-4" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
