import { Activity, BookOpen, CalendarCheck, HeartPulse, ShieldCheck, Users } from "lucide-react";

import PageWaitlistCTA from "@/components/PageWaitlistCTA";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import WaitlistCTAButton from "@/components/WaitlistCTAButton";

const PROBLEMS = [
  {
    icon: BookOpen,
    heading: "Appointments feel like starting from scratch",
    body: "Most people walk into clinic visits relying on memory. Weeks of symptoms, triggers, and patterns get compressed into a few rushed sentences — and the details that matter most often get left out.",
  },
  {
    icon: Activity,
    heading: "Patterns are invisible without consistent data",
    body: "SCD symptoms fluctuate. A single bad day looks different from a trend of bad days. Without a record, it's nearly impossible to tell whether things are improving, worsening, or just varying.",
  },
  {
    icon: CalendarCheck,
    heading: "Care details live in too many places",
    body: "Medications, emergency contacts, crisis plans, appointments — they end up scattered across notes apps, texts, and memory. When something urgent happens, scrambling for that information costs time you don't have.",
  },
];

const AUDIENCE = [
  {
    icon: HeartPulse,
    title: "Patients",
    description:
      "A two-minute daily log builds a health record you actually own. Walk into every appointment with 90 days of patterns, not just what you can recall on the spot. Hemo helps you say exactly what your care team needs to hear.",
  },
  {
    icon: Users,
    title: "Caregivers",
    description:
      "Supporting someone with SCD means staying on top of medications, contacts, and warning signs — often without a clear picture of what's changing. Hemo keeps the important details in one place and makes it easier to help without overstepping.",
  },
  {
    icon: ShieldCheck,
    title: "Clinicians",
    description:
      "Structured symptom logs change the quality of a clinic visit. Instead of reconstructing history from memory, patients arrive with timestamped data across pain, mood, hydration, sleep, and triggers — giving you clearer context in less time.",
  },
];

const WhyHemoPage = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">

      {/* Page header */}
      <Badge variant="secondary" className="px-3 py-1 text-xs">Why Hemo</Badge>
      <h1 className="mt-4 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.02em] sm:text-5xl lg:text-6xl">
        SCD is already hard enough. Managing the information shouldn't be.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
        Hemo exists because people living with Sickle Cell Disease deserve tools
        designed for real life — not tools built for ideal conditions and adapted after the fact.
      </p>
      <div className="mt-8">
        <WaitlistCTAButton label="Join the waitlist — it's free" size="lg" className="px-8" />
      </div>

      {/* The problem */}
      <section className="mt-20">
        <h2 className="max-w-xl text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
          The problems we set out to solve
        </h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Before building anything, we listened. These are the patterns that came up again and again.
        </p>
        <div className="mt-8 grid gap-5 sm:grid-cols-3">
          {PROBLEMS.map((item) => (
            <div key={item.heading} className="rounded-lg border bg-card p-6">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <item.icon className="size-5" />
              </div>
              <h3 className="mt-4 font-semibold leading-snug">{item.heading}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Our approach */}
      <section className="mt-20 grid gap-0 overflow-hidden rounded-lg border lg:grid-cols-2">
        <div className="border-b bg-secondary p-8 lg:border-b-0 lg:border-r sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight">Two minutes. Every day.</h2>
          <p className="mt-3 text-muted-foreground">
            The core log is intentionally short — pain, mood, hydration, sleep, triggers, notes.
            That's it. On difficult days the goal is still achievable, because missing a day
            shouldn't mean losing your streak or your data. Hemo includes streak repairs
            specifically because we know some days are just too hard.
          </p>
        </div>
        <div className="bg-secondary p-8 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-tight">Context, not just numbers.</h2>
          <p className="mt-3 text-muted-foreground">
            Raw logs are only useful if they're readable. Hemo turns daily entries into
            7 and 30-day trend views, weekly summaries, and AI-generated insights that
            surface what changed and why it might matter — in plain language, not clinical
            jargon. The goal is always the same: help you have a better conversation
            with your care team.
          </p>
        </div>
      </section>

      {/* Who we're building for */}
      <section className="mt-20">
        <h2 className="text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
          Who we're building for
        </h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Hemo is built for patients first. Everything else follows from that.
        </p>
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {AUDIENCE.map((item) => (
            <Card key={item.title}>
              <CardContent className="p-6">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="size-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Mission / origin */}
      <section className="mt-20 grid gap-8 border-t border-border pt-14 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
            Why this app exists
          </h2>
        </div>
        <div className="space-y-4 text-muted-foreground">
          <p>
            Hemo was built because the tools available to people with Sickle Cell Disease
            weren't built with them in mind. Generic symptom trackers, note apps, and
            spreadsheets all require too much effort to maintain, and they don't speak the
            language of SCD care.
          </p>
          <p>
            We wanted to build something that patients would actually use on their worst days —
            not just their best ones. Something that turns consistent, low-effort logging into
            the kind of long-term health context that changes clinic conversations.
          </p>
          <p>
            Hemo is for patients first, caregivers second, and clinicians third.
            That order is deliberate. The app only works if the person living with SCD
            finds value in it daily. Everything else is downstream from that.
          </p>
        </div>
      </section>

      <PageWaitlistCTA
        title="Be among the first to use Hemo."
        description="Join the waitlist for early access and launch updates."
      />
    </div>
  );
};

export default WhyHemoPage;
