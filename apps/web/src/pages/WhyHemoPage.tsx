import { HeartPulse, ShieldCheck, Users } from "lucide-react";

import PageWaitlistCTA from "@/components/PageWaitlistCTA";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import WaitlistCTAButton from "@/components/WaitlistCTAButton";

const audience = [
  {
    title: "Patients",
    description:
      "Log how you feel in minutes and build data that helps you advocate for your care.",
    icon: HeartPulse,
  },
  {
    title: "Caregivers",
    description:
      "Stay informed on patterns, reminders, and emergency planning without being intrusive.",
    icon: Users,
  },
  {
    title: "Clinicians",
    description:
      "Review clearer trends and spend less time reconstructing history during appointments.",
    icon: ShieldCheck,
  },
];

const WhyHemoPage = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Badge variant="secondary">Why Hemo</Badge>
      <h1 className="mt-4 max-w-4xl text-balance text-4xl font-bold sm:text-5xl">
        SCD care can feel fragmented. Hemo brings the right details together.
      </h1>
      <p className="mt-5 max-w-3xl text-muted-foreground">
        Most people are forced to piece together symptoms, medications, appointments,
        and emergency plans across notes, memory, and multiple apps. Hemo was designed to
        reduce that burden with plain-language workflows that remain usable even on bad pain days.
      </p>
      <div className="mt-7">
        <WaitlistCTAButton size="lg" className="rounded-full" />
      </div>

      <section className="mt-14 grid gap-5 rounded-3xl border bg-card p-7 sm:p-10 lg:grid-cols-2">
        <div>
          <h2 className="text-2xl font-semibold">Our approach</h2>
          <p className="mt-3 text-muted-foreground">
            Hemo is built for empowerment, not overload. We avoid jargon, prioritize
            fast daily check-ins, and turn raw logs into context that helps people make
            better decisions with their care teams.
          </p>
        </div>
        <div>
          <h2 className="text-2xl font-semibold">Built for bad pain days</h2>
          <p className="mt-3 text-muted-foreground">
            The core logging flow is intentionally short. On hard days, the goal is still
            achievable: capture enough signal to protect long-term trend visibility.
          </p>
        </div>
      </section>

      <section className="mt-14">
        <h2 className="text-3xl font-bold">Who we&apos;re building for</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {audience.map((item) => (
            <Card key={item.title} className="rounded-2xl border">
              <CardContent className="p-6">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="size-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <PageWaitlistCTA
        title="Ready to track with more confidence?"
        description="Join the waitlist and get first access to Hemo at launch."
      />
    </div>
  );
};

export default WhyHemoPage;
