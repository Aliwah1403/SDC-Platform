"use client";

import React, { useRef } from "react";
import { motion } from "motion/react";
import {
  Activity,
  ClipboardList,
  HeartPulse,
  Phone,
  Sparkles,
} from "lucide-react";

import { AnimatedBeam } from "@/components/ui/animated-beam";
import { AnimatedList } from "@/components/ui/animated-list";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const BEAM_START = "#D09F9A";
const BEAM_END = "#A9334D";

// Icon node — replaces feature251's external-image IconCard with Lucide icons
const IconNode = React.forwardRef<
  HTMLDivElement,
  { icon: React.ElementType; className?: string }
>(({ icon: Icon, className }, ref) => (
  <div
    ref={ref}
    className={cn(
      "relative z-10 flex size-14 items-center justify-center rounded-xl bg-muted",
      className,
    )}
  >
    <Icon className="size-5 text-primary" />
    <HandleIcon className="absolute -top-3 left-1/2 size-6 -translate-x-1/2" />
    <HandleIcon className="absolute -bottom-3 left-1/2 size-6 -translate-x-1/2" />
    <HandleIcon className="absolute top-1/2 -left-3 size-6 -translate-y-1/2 rotate-90" />
    <HandleIcon className="absolute top-1/2 -right-3 size-6 -translate-y-1/2 rotate-90" />
  </div>
));
IconNode.displayName = "IconNode";

const HandleIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg {...props} width="14" height="5" viewBox="0 0 14 5" fill="none">
    {[0.54, 4.54, 8.54, 12.54].map((x) => (
      <line
        key={x}
        x1={x}
        y1="0.97"
        x2={x}
        y2="4.63"
        stroke="black"
        strokeOpacity="0.2"
      />
    ))}
  </svg>
);

const NOTIFICATIONS = [
  {
    name: "Hemo SCD",
    message: "Time for your daily check-in.",
    timeAgo: "now",
    icon: "/logo.png",
  },
  {
    name: "Hemo SCD",
    message: "Pain log saved. Streak protected.",
    timeAgo: "just now",
    icon: "/logo.png",
  },
  {
    name: "Hemo SCD",
    message: "7-day streak achieved!",
    timeAgo: "2m ago",
    icon: "/logo.png",
  },
  {
    name: "Hemo SCD",
    message: "Your AI insight is ready.",
    timeAgo: "10m ago",
    icon: "/logo.png",
  },
  {
    name: "Hemo SCD",
    message: "Appointment tomorrow at 9:30 AM.",
    timeAgo: "1h ago",
    icon: "/logo.png",
  },
  {
    name: "Hemo SCD",
    message: "You're 2 glasses behind on water.",
    timeAgo: "3h ago",
    icon: "/logo.png",
  },
];

function NotificationItem({
  name,
  message,
  timeAgo,
  icon,
}: (typeof NOTIFICATIONS)[number]) {
  return (
    <div className="flex h-[60px] w-full items-center gap-3 rounded-2xl border border-neutral-100 bg-white px-3.5 shadow-xl shadow-neutral-200">
      <img src={icon} alt={name} className="size-9 shrink-0 rounded-xl" />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex w-full items-center justify-between gap-2">
          <span className="text-xs font-semibold">{name}</span>
          <span className="shrink-0 text-[10px] text-neutral-400">
            {timeAgo}
          </span>
        </div>
        <span className="truncate text-xs text-neutral-500">{message}</span>
      </div>
    </div>
  );
}

// Each avatar: initials, background colour, position (% from top-left), location label
const BASE = "https://api.dicebear.com/9.x/notionists/svg?seed=";

const MEMBERS = [
  {
    src: `${BASE}Amara&backgroundColor=ffd5dc`,
    top: "18%",
    left: "12%",
    location: "Lagos",
  },
  {
    src: `${BASE}Kwame&backgroundColor=d1d4f9`,
    top: "10%",
    left: "38%",
    location: "Nairobi",
  },
  {
    src: `${BASE}James&backgroundColor=b6e3f4`,
    top: "14%",
    left: "60%",
    location: "London",
  },
  {
    src: `${BASE}Fatima&backgroundColor=c0aede`,
    top: "10%",
    left: "80%",
    location: null,
  },
  {
    src: `${BASE}Esi&backgroundColor=ffdfbf`,
    top: "44%",
    left: "4%",
    location: "Samsun",
  },
  {
    src: `${BASE}Marcus&backgroundColor=d1d4f9`,
    top: "42%",
    left: "28%",
    location: null,
  },
  {
    src: `${BASE}Renee&backgroundColor=ffd5dc`,
    top: "40%",
    left: "52%",
    location: "New York",
  },
  {
    src: `${BASE}Adaeze&backgroundColor=b6e3f4`,
    top: "44%",
    left: "76%",
    location: "Paris",
  },
  {
    src: `${BASE}Kofi&backgroundColor=c0aede`,
    top: "70%",
    left: "16%",
    location: null,
  },
  {
    src: `${BASE}Patricia&backgroundColor=ffdfbf`,
    top: "68%",
    left: "42%",
    location: "Toronto",
  },
  {
    src: `${BASE}Samuel&backgroundColor=ffd5dc`,
    top: "72%",
    left: "68%",
    location: null,
  },
] as const;

function CommunityCluster() {
  return (
    <div className="relative h-full w-full">
      {MEMBERS.map((m, i) => (
        <motion.div
          key={i}
          className="absolute flex flex-col items-center gap-1"
          style={{ top: m.top, left: m.left }}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            duration: 0.4,
            delay: i * 0.07,
            ease: [0.215, 0.61, 0.355, 1],
          }}
        >
          <img
            src={m.src}
            alt="Community member"
            className="size-10 rounded-full object-cover shadow-md ring-2 ring-background"
          />
          {m.location && (
            <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-foreground shadow-sm">
              {m.location}
            </span>
          )}
        </motion.div>
      ))}

      <motion.div
        className="absolute bottom-3 right-4 flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.9 }}
      >
        <span className="size-1.5 rounded-full bg-primary" />
        <span className="text-xs font-semibold text-primary">
          1,200+ on the waitlist
        </span>
      </motion.div>
    </div>
  );
}

const Benefits = () => {
  const c1 = useRef<HTMLDivElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const moodRef = useRef<HTMLDivElement>(null);
  const hydRef = useRef<HTMLDivElement>(null);
  const hubRef = useRef<HTMLDivElement>(null);
  const outRef = useRef<HTMLDivElement>(null);

  return (
    <section className="py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
            Built in
          </p>
          <h2 className="mx-auto mt-2 max-w-xl text-balance text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
            Everything you need, nothing you don't.
          </h2>
          <p className="mx-auto Canmt-3 max-w-lg text-muted-foreground">
            The tools that matter, always close. Out of the way when you don't
            need them.
          </p>
        </div>

        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-center gap-5">
          {/* Card 1 — connected care with animated beams */}
          <Card className="relative h-96 w-full rounded-lg border lg:w-[560px]">
            <CardHeader>
              <h3 className="text-xl font-semibold tracking-tight">
                Your care, connected.
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Daily logs flow into AI insights, trends, and your care hub —
                all talking to each other so you don't have to.
              </p>
            </CardHeader>
            <CardContent ref={c1} className="relative ml-5">
              <IconNode icon={ClipboardList} ref={logRef} className="mb-3" />
              <IconNode
                icon={Activity}
                ref={moodRef}
                className="translate-x-32"
              />
              <IconNode icon={HeartPulse} ref={hydRef} className="mt-3" />

              <div
                ref={hubRef}
                className="absolute top-1/2 left-1/2 z-20 flex size-10 -translate-y-1/2 items-center justify-center rounded-full border-2 border-primary bg-primary/10"
              >
                <Sparkles className="size-4 text-primary" />
              </div>

              <IconNode
                icon={Sparkles}
                ref={outRef}
                className="absolute top-1/2 right-10 -translate-y-1/2"
              />

              <AnimatedBeam
                containerRef={c1}
                fromRef={logRef}
                toRef={hubRef}
                curvature={40}
                duration={3}
                gradientStartColor={BEAM_START}
                gradientStopColor={BEAM_END}
              />
              <AnimatedBeam
                containerRef={c1}
                fromRef={moodRef}
                toRef={hubRef}
                duration={3}
                gradientStartColor={BEAM_START}
                gradientStopColor={BEAM_END}
              />
              <AnimatedBeam
                containerRef={c1}
                fromRef={hydRef}
                toRef={hubRef}
                curvature={-40}
                duration={3}
                gradientStartColor={BEAM_START}
                gradientStopColor={BEAM_END}
              />
              <AnimatedBeam
                containerRef={c1}
                fromRef={hubRef}
                toRef={outRef}
                duration={3}
                gradientStartColor={BEAM_START}
                gradientStopColor={BEAM_END}
              />
            </CardContent>
          </Card>

          {/* Card 2 — reminders with animated list */}
          <Card className="h-96 w-full overflow-hidden rounded-lg border md:w-[420px]">
            <CardHeader>
              <h3 className="text-xl font-semibold tracking-tight">
                Never miss a check-in.
              </h3>
              <p className="text-sm text-muted-foreground">
                Smart reminders keep you consistent without the pressure.
              </p>
            </CardHeader>
            <CardContent className="relative h-44">
              <AnimatedList
                columnGap={85}
                stackGap={20}
                scaleFactor={0.04}
                scrollDownDuration={5}
                formationDuration={1}
              >
                {NOTIFICATIONS.map((n) => (
                  <NotificationItem key={n.message} {...n} />
                ))}
              </AnimatedList>
            </CardContent>
          </Card>

          {/* Card 3 — emergency SOS */}
          <Card className="relative flex h-96 w-full flex-col rounded-lg border md:w-[330px]">
            <CardContent className="flex flex-1 items-center justify-center">
              <div className="relative flex items-center justify-center">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    className="absolute rounded-full bg-destructive/20"
                    style={{ width: 48 + i * 28, height: 48 + i * 28 }}
                    animate={{ opacity: [0.5, 0, 0.5], scale: [1, 1.15, 1] }}
                    transition={{
                      duration: 2,
                      delay: i * 0.35,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                  />
                ))}
                <div className="relative z-10 flex size-14 items-center justify-center rounded-full bg-destructive shadow-lg">
                  <Phone className="size-6 fill-white text-white" />
                </div>
              </div>
            </CardContent>
            <CardHeader className="mt-auto">
              <h3 className="text-xl font-semibold tracking-tight">
                Help is one tap away.
              </h3>
              <p className="text-sm text-muted-foreground">
                Alert emergency contacts or call emergency services instantly,
                even from the lock screen.
              </p>
            </CardHeader>
          </Card>

          {/* Card 4 — community avatar cluster */}
          <Card className="h-96 w-full overflow-hidden rounded-lg border lg:w-166">
            <CardHeader>
              <h3 className="text-xl font-semibold tracking-tight">
                Built for a global community.
              </h3>
              <p className="text-sm text-muted-foreground">
                Sickle Cell Disease affects millions across Africa, the
                Caribbean, the UK, and beyond. Hemo is built for all of them.
              </p>
            </CardHeader>
            <CardContent className="relative flex-1">
              <CommunityCluster />
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default Benefits;
