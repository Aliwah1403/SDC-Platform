import { Activity, Brain, CalendarCheck, Flame, LifeBuoy, MessageSquareText, Siren, Users } from "lucide-react";

import PageWaitlistCTA from "@/components/PageWaitlistCTA";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const featureRows = [
  {
    title: "Daily Health Log",
    icon: Activity,
    what: "A guided 7-step check-in for pain, body location, symptoms, mood, hydration, triggers, and notes.",
    why: "It captures meaningful context in under two minutes.",
    outcome: "You build reliable trend data without adding heavy daily effort.",
  },
  {
    title: "Health Trends & Tracking",
    icon: CalendarCheck,
    what: "Calendar views and metric charts across pain, hydration, mood, sleep, steps, and heart rate.",
    why: "SCD patterns are hard to spot from memory alone.",
    outcome: "You can identify what improves or worsens your week sooner.",
  },
  {
    title: "Health Insights",
    icon: Brain,
    what: "Weekly wellbeing scoring and trend callouts comparing this week versus last week.",
    why: "Raw data can be hard to interpret in the moment.",
    outcome: "You get understandable context, not just numbers.",
  },
  {
    title: "Streaks & Rewards",
    icon: Flame,
    what: "Daily streaks, limited streak repairs, badges, challenges, and leaderboard signals.",
    why: "Consistency is the hardest part of long-term self-management.",
    outcome: "Habit-building feels more rewarding and sustainable.",
  },
  {
    title: "Care Hub",
    icon: LifeBuoy,
    what: "Medication, care team, appointments, crisis plan, nearby facilities, and emergency profile.",
    why: "Care coordination often lives in too many disconnected places.",
    outcome: "Essential care information stays organized and accessible.",
  },
  {
    title: "Emergency SOS",
    icon: Siren,
    what: "A one-tap SOS flow with countdown and emergency dialing/contact options.",
    why: "During a crisis, speed and clarity matter.",
    outcome: "Help is easier to reach without searching through menus.",
  },
  {
    title: "AI Health Assistant",
    icon: MessageSquareText,
    what: "Plain-language SCD Q&A with persistent chat history and educational support content.",
    why: "Reliable SCD information can be hard to interpret quickly.",
    outcome: "You get understandable guidance in one place.",
  },
  {
    title: "Community Feed",
    icon: Users,
    what: "A peer-support feed for experiences, tips, questions, and encouragement.",
    why: "SCD can be isolating without shared community context.",
    outcome: "People feel less alone and more supported.",
  },
];

const FeaturesPage = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Badge variant="secondary">Features</Badge>
      <h1 className="mt-4 max-w-4xl text-balance text-4xl font-bold sm:text-5xl">
        Everything Hemo includes for day-to-day SCD management
      </h1>
      <p className="mt-5 max-w-3xl text-muted-foreground">
        Each feature is built around one principle: give people with SCD clearer control,
        better context, and faster access to support when needed.
      </p>

      <section className="mt-12 grid gap-4">
        {featureRows.map((feature) => (
          <Card key={feature.title} className="rounded-2xl border">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <feature.icon className="size-5" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{feature.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">What it does:</span> {feature.what}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Why it matters:</span> {feature.why}
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Outcome:</span> {feature.outcome}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-14 grid gap-4 md:grid-cols-2">
        <Card className="rounded-2xl border bg-muted/30">
          <CardContent className="p-6">
            <h3 className="text-2xl font-semibold">Clinic-ready in 90 days</h3>
            <p className="mt-3 text-muted-foreground">
              Hemo helps patients arrive with structured symptom, mood, hydration,
              and medication context that improves the quality of appointment conversations.
            </p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border bg-muted/30">
          <CardContent className="p-6">
            <h3 className="text-2xl font-semibold">Crisis confidence</h3>
            <p className="mt-3 text-muted-foreground">
              From SOS to crisis planning and emergency profile access, critical information stays ready for moments when speed matters.
            </p>
          </CardContent>
        </Card>
      </section>

      <PageWaitlistCTA
        title="Want early access to the full feature set?"
        description="Join the waitlist and get updates as new capabilities roll out."
      />
    </div>
  );
};

export default FeaturesPage;
