import { Check, Minus } from "lucide-react";

import { Pricing34 } from "@/components/pricing34";
import { Badge } from "@/components/ui/badge";

type CellValue = string | boolean;

const COMPARISON: { feature: string; free: CellValue; pro: CellValue; plus: CellValue; family: CellValue }[] = [
  { feature: "Daily health log",                free: true,            pro: true,            plus: true,            family: true },
  { feature: "Trend history",                   free: "7 days",        pro: "90 days",       plus: "90 days",       family: "90 days" },
  { feature: "Emergency SOS",                   free: true,            pro: true,            plus: true,            family: true },
  { feature: "Care hub (meds & contacts)",      free: true,            pro: true,            plus: true,            family: true },
  { feature: "Full care hub (appts, crisis…)",  free: false,           pro: true,            plus: true,            family: true },
  { feature: "AI health insights",              free: false,           pro: true,            plus: true,            family: true },
  { feature: "AI assistant queries",            free: false,           pro: "20/month",      plus: "Unlimited",     family: "Unlimited" },
  { feature: "Streak repairs",                  free: "1/month",       pro: "Unlimited",     plus: "Unlimited",     family: "Unlimited" },
  { feature: "Custom metric goals",             free: false,           pro: false,           plus: true,            family: true },
  { feature: "PDF health export",               free: false,           pro: true,            plus: true,            family: true },
  { feature: "Advanced analytics",              free: false,           pro: false,           plus: true,            family: true },
  { feature: "Early feature access",            free: false,           pro: false,           plus: true,            family: true },
  { feature: "Member profiles",                 free: "1",             pro: "1",             plus: "1",             family: "Up to 5" },
  { feature: "Caregiver view",                  free: false,           pro: false,           plus: false,           family: true },
  { feature: "Shared emergency contacts",       free: false,           pro: false,           plus: false,           family: true },
  { feature: "Support",                         free: "Community",     pro: "Email",         plus: "Priority email", family: "Priority email" },
];

const FAQS = [
  {
    q: "Is the Free plan actually free forever?",
    a: "Yes. Core daily logging, 7-day trends, emergency SOS, and community access stay free with no time limit.",
  },
  {
    q: "Can I switch plans at any time?",
    a: "Yes. You can upgrade, downgrade, or cancel at any time. Yearly plans are billed upfront and are non-refundable after 14 days.",
  },
  {
    q: "What happens to my data if I downgrade?",
    a: "Your logs are always yours. If you downgrade from Pro, you keep access to your full history in read-only mode but trend views return to 7 days.",
  },
  {
    q: "Does the Family plan share one account or have separate profiles?",
    a: "Each family member gets their own private profile. The plan owner can view a shared overview but individual health data remains personal.",
  },
  {
    q: "Is there a free trial for paid plans?",
    a: "Pro includes a 14-day free trial. No credit card required to start the trial.",
  },
  {
    q: "Are prices in USD?",
    a: "Yes. Prices are listed in USD. Local currency billing will be available at launch.",
  },
];

function Cell({ value }: { value: CellValue }) {
  if (value === true) return <Check className="mx-auto size-4 text-primary" />;
  if (value === false) return <Minus className="mx-auto size-4 text-muted-foreground/40" />;
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
          Simple plans for every stage
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
          Start free and upgrade when you need more. All plans include the core tools that make Hemo useful every day.
        </p>
      </div>

      <Pricing34 />

      {/* Feature comparison table */}
      <section className="mt-20">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">Full feature comparison</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-muted/40">
              <tr>
                <th className="px-5 py-4 font-semibold text-foreground">Feature</th>
                <th className="px-5 py-4 text-center font-semibold text-foreground">Free</th>
                <th className="px-5 py-4 text-center font-semibold text-primary">Pro</th>
                <th className="px-5 py-4 text-center font-semibold text-foreground">Plus</th>
                <th className="px-5 py-4 text-center font-semibold text-foreground">Family</th>
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((row) => (
                <tr key={row.feature} className="border-t">
                  <td className="px-5 py-3.5 text-foreground">{row.feature}</td>
                  <td className="px-5 py-3.5 text-center"><Cell value={row.free} /></td>
                  <td className="bg-primary/[0.03] px-5 py-3.5 text-center"><Cell value={row.pro} /></td>
                  <td className="px-5 py-3.5 text-center"><Cell value={row.plus} /></td>
                  <td className="px-5 py-3.5 text-center"><Cell value={row.family} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-20">
        <h2 className="mb-6 text-2xl font-semibold tracking-tight">Pricing FAQ</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {FAQS.map((faq) => (
            <article key={faq.q} className="rounded-lg border bg-card p-6">
              <h3 className="font-semibold">{faq.q}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{faq.a}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default PricingPage;
