import { Check } from "lucide-react";

import PageWaitlistCTA from "@/components/PageWaitlistCTA";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const planRows = [
  {
    feature: "Daily symptom logging",
    launch: "Included",
    premium: "Included",
  },
  {
    feature: "90-day trend tracking",
    launch: "Included",
    premium: "Included",
  },
  {
    feature: "Care hub tools",
    launch: "Included",
    premium: "Included",
  },
  {
    feature: "Advanced insights",
    launch: "Basic",
    premium: "Expanded",
  },
  {
    feature: "Rewards & challenges",
    launch: "Included",
    premium: "Expanded",
  },
];

const faqs = [
  {
    question: "Will Hemo be free at launch?",
    answer:
      "Yes. Core daily tracking and care support tools are planned to be free at launch.",
  },
  {
    question: "Will there be a paid plan later?",
    answer:
      "Yes. We plan to introduce an optional premium plan for deeper insights and expanded features.",
  },
  {
    question: "Will waitlist users hear pricing updates first?",
    answer: "Yes. Waitlist members will get pricing and launch updates as soon as they are finalized.",
  },
];

const PricingPage = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Badge variant="secondary">Pricing</Badge>
      <h1 className="mt-4 max-w-3xl text-balance text-4xl font-bold sm:text-5xl">
        Pre-launch pricing is simple and transparent
      </h1>
      <p className="mt-5 max-w-3xl text-muted-foreground">
        Hemo is currently pre-launch. Our plan is free core access at launch,
        with an optional premium tier introduced later for people who want deeper support.
      </p>

      <section className="mt-12 grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl border">
          <CardContent className="p-7">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Launch Plan</p>
            <h2 className="mt-2 text-3xl font-bold">Free</h2>
            <p className="mt-2 text-sm text-muted-foreground">Core tools to help people start logging and tracking consistently.</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border bg-muted/20">
          <CardContent className="p-7">
            <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Future Premium</p>
            <h2 className="mt-2 text-3xl font-bold">Optional</h2>
            <p className="mt-2 text-sm text-muted-foreground">Expanded insights and deeper support features for advanced users.</p>
          </CardContent>
        </Card>
      </section>

      <section className="mt-10 overflow-hidden rounded-2xl border">
        <table className="w-full border-collapse text-left text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="px-5 py-4 font-semibold">Outcome Area</th>
              <th className="px-5 py-4 font-semibold">Launch (Free)</th>
              <th className="px-5 py-4 font-semibold">Future Premium</th>
            </tr>
          </thead>
          <tbody>
            {planRows.map((row) => (
              <tr key={row.feature} className="border-t">
                <td className="px-5 py-4">{row.feature}</td>
                <td className="px-5 py-4">
                  <span className="inline-flex items-center gap-1 text-foreground">
                    <Check className="size-4 text-primary" />
                    {row.launch}
                  </span>
                </td>
                <td className="px-5 py-4">{row.premium}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mt-12 space-y-5">
        <h2 className="text-2xl font-semibold">Pricing FAQ</h2>
        {faqs.map((faq) => (
          <article key={faq.question} className="rounded-2xl border bg-card p-5">
            <h3 className="font-semibold">{faq.question}</h3>
            <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
          </article>
        ))}
      </section>

      <PageWaitlistCTA
        title="Join now and get launch + pricing updates first"
        description="We&apos;ll keep waitlist members informed as release timing and premium details are finalized."
      />
    </div>
  );
};

export default PricingPage;
