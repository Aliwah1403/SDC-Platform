import {
  Activity,
  BookOpen,
  CalendarCheck,
  HeartPulse,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import WaitlistCTA from "../Homepage/WaitlistCTA";
import { cn } from "@/lib/utils";

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
      <Badge variant="secondary" className="px-3 py-1 text-xs">
        Why Hemo
      </Badge>
      <h1 className="mt-4 max-w-4xl text-balance text-4xl font-semibold tracking-[-0.02em] sm:text-5xl lg:text-6xl">
        Sickle Cell Disease is already hard enough. Managing the information
        shouldn't be.
      </h1>
      <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
        Hemo exists because people living with Sickle Cell Disease deserve tools
        designed for real life — not tools built for ideal conditions and
        adapted after the fact.
      </p>

      {/* Mission */}
      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <img
          src="/logo.png"
          alt="Hemo Logo"
          className="size-72 max-h-84 rounded-2xl object-cover mx-auto"
        />
        <div className="flex flex-col justify-between gap-10 rounded-2xl bg-muted bg-[url('https://images.unsplash.com/photo-1758521541816-04a41e954e90?q=80&w=2832&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')] bg-cover bg-center p-10">
          <p className="text-sm font-semibold text-white">OUR MISSION</p>
          <p className="text-lg font-medium text-white">
            Our mission is to make Sickle Cell care easier every day by giving
            patients a simple, low-effort way to track what matters, so they can
            build meaningful health history that supports caregivers and
            improves clinic conversations.
          </p>
        </div>
      </div>

      {/* The problem */}
      <section className="mt-20">
        <h2 className="max-w-xl text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
          The problems we set out to solve
        </h2>
        <p className="mt-3 max-w-xl text-muted-foreground">
          Before building anything, we listened. These are the patterns that
          came up again and again.
        </p>
        <div className="mt-8 grid gap-10 md:grid-cols-3">
          {PROBLEMS.map((item) => (
            <div className="flex flex-col">
              <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-muted">
                {/* <Files className="size-5" /> */}
                {item.icon && <item.icon className="size-5 text-primary" />}
              </div>
              <h3 className="mt-2 mb-3 text-lg font-semibold">
                {item.heading}
              </h3>
              <p className="text-muted-foreground">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Mission / origin */}
      <section className="mt-20 grid gap-8  pt-14 lg:grid-cols-2">
        <div>
          <h2 className="text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
            Why this app exists
          </h2>
        </div>
        <div className="space-y-4 text-muted-foreground">
          <p>
            Hemo was built because the tools available to people with Sickle
            Cell Disease weren't built with them in mind. Generic symptom
            trackers, note apps, and spreadsheets all require too much effort to
            maintain, and they don't speak the language of SCD care.
          </p>
          <p>
            We wanted to build something that patients would actually use on
            their worst days — not just their best ones. Something that turns
            consistent, low-effort logging into the kind of long-term health
            context that changes clinic conversations.
          </p>
          <p>
            Hemo is for patients first, caregivers second, and clinicians third.
            That order is deliberate. The app only works if the person living
            with SCD finds value in it daily. Everything else is downstream from
            that.
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
        <div className="grid gap-8 border-y border-border py-10 md:grid-cols-3 md:gap-0 md:py-12 mt-8">
          {AUDIENCE.map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={cn(
                  "flex flex-col gap-4 px-2 text-center md:px-6",
                  index < AUDIENCE.length - 1 &&
                    "border-b border-border pb-8 md:border-r md:border-b-0 md:pb-0",
                )}
              >
                <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted">
                  <Icon className="size-6 text-primary" />
                </span>
                <h2 className="text-lg font-semibold text-foreground">
                  {item.title}
                </h2>
                <p className="text-sm text-balance text-muted-foreground">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <WaitlistCTA />
    </div>
  );
};

export default WhyHemoPage;
