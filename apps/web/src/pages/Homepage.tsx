import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Flame, HeartPulse, Sparkles } from "lucide-react";
import { Iphone } from "@/components/ui/iphone";
import WaitlistCTAButton from "@/components/WaitlistCTAButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

const LAST_UPDATED = "April 13, 2026";

const LOGOS = ["Evernote", "Airtable", "Notion", "Gumroad", "Amazon"] as const;

const FEATURE_STORIES = [
  {
    title: "Daily Health Log",
    headline: "Know your body in under two minutes.",
    description:
      "Capture pain, symptoms, hydration, mood, triggers, and notes in one guided check-in. It is short enough to complete on difficult days.",
    result: "Two minutes today gives you answers later.",
  },
  {
    title: "Health Trends",
    headline: "See patterns before they become surprises.",
    description:
      "Track pain, mood, hydration, sleep, steps, and heart rate over 7 and 30 days with clear visual history.",
    result: "You stop guessing and start spotting what helps.",
  },
  {
    title: "Insights",
    headline: "Your week, scored and explained.",
    description:
      "Hemo compares this week to last week and calls out meaningful changes in plain language.",
    result: "Context, not just numbers.",
  },
  {
    title: "Streak System",
    headline: "Build the habit. Protect your streak.",
    description:
      "Streak repairs and milestone badges reward consistency without making missed days feel like failure.",
    result: "Better routine, less pressure.",
  },
  {
    title: "Care Hub",
    headline: "Everything for your care in one place.",
    description:
      "Medication details, appointments, contacts, crisis plan, and emergency profile stay organized and easy to reach.",
    result: "Less scrambling when you need clarity.",
  },
  {
    title: "Emergency + Assistant + Community",
    headline: "Fast support, clear answers, shared experience.",
    description:
      "Use one-tap SOS, ask the AI assistant in plain language, and connect with a community that understands SCD.",
    result: "Support that feels practical and human.",
  },
] as const;

const FAQS = [
  {
    q: "What is Hemo?",
    a: "Hemo is a daily health companion for people with Sickle Cell Disease to log symptoms, spot patterns, and prepare for appointments.",
  },
  {
    q: "How long does logging take?",
    a: "Most check-ins are designed to take around two minutes.",
  },
  {
    q: "Who is Hemo for?",
    a: "Patients first, with support for caregivers and clearer visit context for clinicians.",
  },
  {
    q: "Is Hemo emergency care?",
    a: "No. Hemo helps with preparation and tracking, but does not replace emergency services or medical care.",
  },
] as const;

const TESTIMONIALS = [
  {
    quote: "For the first time, I walked into my appointment with answers.",
    name: "Amara O.",
    role: "Living with SCD",
  },
  {
    quote:
      "We finally had one clear place for meds, symptoms, and appointments.",
    name: "Jordan T.",
    role: "Caregiver",
  },
  {
    quote: "Structured logs changed the quality of our clinic conversations.",
    name: "Dr. M. Osei",
    role: "Haematology Consultant",
  },
] as const;

const STATS = [
  { value: "90", unit: "days", label: "of trend visibility" },
  { value: "7", unit: "metrics", label: "logged daily" },
  { value: "6", unit: "tools", label: "inside care hub" },
] as const;

type SubmitStatus = "idle" | "submitting" | "success" | "error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function PhoneShell({ className = "" }: { className?: string }) {
  return (
    <div
      className={`relative overflow-hidden rounded-[2.2rem] border-4 border-[#1e2322] bg-white shadow-[0_24px_60px_-35px_rgba(0,0,0,0.5)] ${className}`}
    >
      <div className="mx-auto mt-2 h-5 w-20 rounded-full bg-[#1e2322]" />
      <div className="p-4">
        <div className="rounded-2xl bg-[#f8f4f1] p-3">
          <div className="h-2 w-24 rounded-full bg-[#d8cec9]" />
          <div className="mt-2 h-2 w-36 rounded-full bg-[#e2d8d2]" />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="h-12 rounded-xl bg-white" />
            <div className="h-12 rounded-xl bg-white" />
          </div>
        </div>
        <div className="mt-3 space-y-2">
          <div className="h-10 rounded-xl bg-[#f5efeb]" />
          <div className="h-10 rounded-xl bg-[#f5efeb]" />
          <div className="h-10 rounded-xl bg-[#f5efeb]" />
        </div>
      </div>
    </div>
  );
}

function HomeJsonLd() {
  const data = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          name: "Hemo",
          applicationCategory: "HealthApplication",
          operatingSystem: "iOS, Android",
          description:
            "Hemo is a daily health companion for people with Sickle Cell Disease to log symptoms, spot patterns, manage care, and prepare for clinic appointments.",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            availability: "https://schema.org/PreOrder",
          },
        },
        {
          "@type": "FAQPage",
          mainEntity: FAQS.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.a,
            },
          })),
        },
      ],
    }),
    [],
  );

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const Homepage = () => {
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [waitlistStatus, setWaitlistStatus] = useState<SubmitStatus>("idle");
  const [waitlistMessage, setWaitlistMessage] = useState("");

  const handleWaitlist = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = waitlistEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setWaitlistStatus("error");
      setWaitlistMessage("Please enter a valid email address.");
      return;
    }

    if (!supabase) {
      setWaitlistStatus("error");
      setWaitlistMessage(
        "Waitlist is not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      );
      return;
    }

    setWaitlistStatus("submitting");
    const { error } = await supabase.from("waitlist_signups").insert({
      email: normalizedEmail,
      source: "homepage-modern-white-v1",
    });

    if (error) {
      setWaitlistStatus("error");
      setWaitlistMessage(error.message || "Please try again in a moment.");
      return;
    }

    setWaitlistStatus("success");
    setWaitlistMessage(
      "You are on the waitlist. We will share launch updates soon.",
    );
    setWaitlistEmail("");
  };

  return (
    <>
      <HomeJsonLd />

      <div className="relative page-grid-lines overflow-hidden">
        <section className="mx-auto max-w-7xl px-4 pb-12 pt-18 text-center sm:px-6 lg:px-8 lg:pt-24">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge
              variant="secondary"
              className="rounded-full px-3 py-1 text-xs"
            >
              #1 Sickle Cell Companion App
            </Badge>
            <h1 className="mx-auto mt-6 max-w-4xl text-balance text-5xl font-semibold tracking-[-0.03em] sm:text-6xl lg:text-7xl">
              Daily clarity for life with Sickle Cell
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">
              Log symptoms, spot patterns, and show up to every clinic visit
              prepared with real health context.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <WaitlistCTAButton size="lg" className="rounded-full px-8" />
              <Button
                variant="outline"
                size="lg"
                className="rounded-full px-8"
                render={<a href="#story" />}
              >
                See how it works
              </Button>
            </div>

            <p className="mt-4 text-sm text-muted-foreground">
              Last updated: {LAST_UPDATED}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="relative mt-16 grid items-end justify-center gap-4 sm:grid-cols-3"
          >
            <PhoneShell className="mx-auto hidden w-full max-w-[220px] sm:block" />
            <PhoneShell className="mx-auto w-full max-w-[240px] sm:max-w-[260px]" />
            <PhoneShell className="mx-auto hidden w-full max-w-[220px] sm:block" />
            <div className="pointer-events-none absolute bottom-[-2px] left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
          </motion.div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-muted-foreground">
            Trusted by teams and communities worldwide
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-3 text-sm font-semibold text-[#b2aba6]">
            {LOGOS.map((logo) => (
              <span key={logo}>{logo}</span>
            ))}
          </div>
        </section>

        <section id="story" className="bg-[#fffaf8] py-18">
          <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-[1.2fr_0.8fr] lg:px-8">
            <div>
              <Badge
                variant="secondary"
                className="rounded-full px-3 py-1 text-xs"
              >
                Why Hemo
              </Badge>
              <h2 className="mt-4 max-w-xl text-balance text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
                Connecting daily logs to better clinic visits
              </h2>
              <p className="mt-4 max-w-xl text-muted-foreground">
                SCD management can feel fragmented. Hemo gives one calm daily
                flow that turns scattered symptoms into useful long-term
                context.
              </p>
              <Button
                variant="outline"
                className="mt-6 rounded-full px-6"
                render={<a href="#features" />}
              >
                Learn more
              </Button>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <article className="rounded-2xl bg-white p-5">
                <p className="text-4xl font-semibold tracking-tight">250K</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Health logs guiding safer weekly decisions
                </p>
              </article>
              <article className="rounded-2xl bg-white p-5">
                <p className="text-4xl font-semibold tracking-tight">350K</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Moments where critical care details stayed accessible
                </p>
              </article>
              <article className="col-span-full rounded-2xl bg-white p-5 text-sm text-muted-foreground">
                Designed for all major SCD types, with patient-first language
                and emergency-aware workflows.
              </article>
            </div>
          </div>
        </section>

        <section
          id="features"
          className="mx-auto max-w-7xl px-4 py-18 sm:px-6 lg:px-8"
        >
          <div className="space-y-14">
            {FEATURE_STORIES.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.55 }}
                className="grid items-center gap-10 lg:grid-cols-2"
              >
                <div className={index % 2 === 1 ? "lg:order-2" : ""}>
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    {feature.title}
                  </p>
                  <h3 className="mt-3 max-w-xl text-balance text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
                    {feature.headline}
                  </h3>
                  <p className="mt-4 max-w-xl text-muted-foreground">
                    {feature.description}
                  </p>
                  <p className="mt-3 text-base font-medium">{feature.result}</p>
                </div>
                <div className={index % 2 === 1 ? "lg:order-1" : ""}>
                  {/* <PhoneShell className="mx-auto w-full max-w-[280px]" /> */}
                  <Iphone className="max-w-84"/>
                </div>
              </motion.article>
            ))}
          </div>
        </section>

        <section className="bg-[#fffaf8] py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
              Build the habit. Protect your streak.
            </h2>
            <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
              <div className="rounded-2xl bg-white p-5">
                <Flame className="size-5 text-primary" />
                <p className="mt-4 text-3xl font-semibold">36</p>
                <p className="text-sm text-muted-foreground">
                  Current streak days
                </p>
              </div>
              <div className="rounded-2xl bg-white p-5">
                <Sparkles className="size-5 text-primary" />
                <p className="mt-4 text-3xl font-semibold">15+</p>
                <p className="text-sm text-muted-foreground">
                  Milestone badges
                </p>
              </div>
              <div className="rounded-2xl bg-white p-5">
                <HeartPulse className="size-5 text-primary" />
                <p className="mt-4 text-3xl font-semibold">7/7</p>
                <p className="text-sm text-muted-foreground">
                  Weekly check-ins complete
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-5 lg:grid-cols-3">
            {TESTIMONIALS.map((item) => (
              <figure key={item.name} className="py-2">
                <blockquote className="text-2xl font-medium leading-tight tracking-[-0.01em]">
                  “{item.quote}”
                </blockquote>
                <figcaption className="mt-5 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">
                    {item.name}
                  </span>{" "}
                  · {item.role}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        <section className="bg-[#fffaf8] py-18">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-5xl font-semibold tracking-[-0.03em] sm:text-6xl">
              What this adds up to
            </h2>
            <div className="mt-8 grid gap-6 border-t border-border pt-8 sm:grid-cols-3">
              {STATS.map((item) => (
                <div key={item.label}>
                  <p className="text-6xl font-semibold tracking-tight">
                    {item.value}
                    <span className="ml-1 text-2xl text-muted-foreground">
                      {item.unit}
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section
          id="waitlist"
          className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
        >
          <div className="rounded-[2rem] border bg-[#fffaf8] p-8 sm:p-12">
            <div className="grid gap-8 lg:grid-cols-[1fr_0.9fr]">
              <div>
                <h2 className="max-w-xl text-balance text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
                  Be among the first to try Hemo.
                </h2>
                <p className="mt-4 max-w-xl text-muted-foreground">
                  Join the waitlist for launch updates and early access.
                </p>
                <p className="mt-5 text-sm text-muted-foreground">
                  1,200+ people already waiting
                </p>
              </div>

              <form onSubmit={handleWaitlist} className="space-y-3">
                <Label htmlFor="waitlist-email" className="text-sm">
                  Email address
                </Label>
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Input
                    id="waitlist-email"
                    type="email"
                    value={waitlistEmail}
                    onChange={(event) => setWaitlistEmail(event.target.value)}
                    placeholder="you@example.com"
                    className="h-11 rounded-full bg-white"
                    disabled={waitlistStatus === "submitting"}
                  />
                  <Button type="submit" className="h-11 rounded-full px-6">
                    {waitlistStatus === "submitting"
                      ? "Joining..."
                      : "Join waitlist"}
                    <ArrowRight className="size-4" />
                  </Button>
                </div>
                <AnimatePresence>
                  {waitlistStatus !== "idle" && (
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className={`text-sm ${waitlistStatus === "error" ? "text-red-600" : "text-[#0d2e29]"}`}
                    >
                      {waitlistMessage}
                    </motion.p>
                  )}
                </AnimatePresence>
              </form>
            </div>
          </div>
        </section>

        <section
          id="about"
          className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="grid gap-8 border-t border-border pt-10 lg:grid-cols-[1fr_1fr]">
            <div>
              <h2 className="text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
                Why this app exists
              </h2>
            </div>
            <div className="space-y-4 text-muted-foreground">
              <p>
                Hemo exists because people living with SCD deserve tools
                designed for real life, not ideal conditions.
              </p>
              <p>
                It is built for patients first, with support for caregivers and
                clearer context for clinicians.
              </p>
            </div>
          </div>
        </section>

        <section id="faq" className="bg-[#fffaf8] py-16">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
              FAQ
            </h2>
            <div className="mt-7 grid gap-3">
              {FAQS.map((item) => (
                <details
                  key={item.q}
                  className="rounded-2xl border bg-white p-5"
                >
                  <summary className="cursor-pointer list-none text-base font-semibold">
                    {item.q}
                  </summary>
                  <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 lg:px-8">
          <div className="rounded-3xl border bg-white p-7 text-center sm:p-10">
            <h2 className="text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
              Need to contact us directly?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Support, partnerships, clinician interest, and press requests are
              handled on our dedicated contact page.
            </p>
            <Button
              className="mt-6 rounded-full px-7"
              render={<a href="/contact" />}
            >
              Go to Contact Page
            </Button>
          </div>
        </section>
      </div>
    </>
  );
};

export default Homepage;
