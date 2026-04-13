import { Award, Flame, Wrench } from "lucide-react";

import { Badge } from "@/components/ui/badge";

const items = [
  {
    icon: Flame,
    title: "Daily streaks",
    text: "Build momentum with a streak that reflects real consistency.",
  },
  {
    icon: Wrench,
    title: "Streak repairs",
    text: "Use limited repair tokens to recover a missed day without giving up.",
  },
  {
    icon: Award,
    title: "Milestone badges",
    text: "Earn badges at key streak and progress milestones to keep motivation high.",
  },
];

const HabitRewards = () => {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="grid-lines rounded-3xl border bg-card p-8 sm:p-12">
        <Badge variant="secondary">Habit & Rewards</Badge>
        <h2 className="mt-4 max-w-3xl text-balance text-3xl font-bold sm:text-4xl">
          Staying consistent is hard. Hemo makes it feel worth it.
        </h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Most health apps stop at data entry. Hemo adds motivation systems that
          help people come back daily, especially when symptoms fluctuate.
        </p>
        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {items.map((item) => (
            <article key={item.title} className="rounded-2xl border bg-background p-5">
              <div className="flex size-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground">
                <item.icon className="size-4" />
              </div>
              <h3 className="mt-3 font-semibold">{item.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HabitRewards;
