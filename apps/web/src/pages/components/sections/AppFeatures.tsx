import { Sparkles, Smartphone, Activity, Bell, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const leftFeatures = [
  {
    icon: Activity,
    title: "Log Symptoms Daily",
    description:
      "Guided 7-step pain, mood, and hydration check-in — takes under 2 minutes.",
  },
  {
    icon: Sparkles,
    title: "Track Your Streaks",
    description:
      "Build healthy habits with streaks, streak repairs, and milestone rewards.",
  },
];

const rightFeatures = [
  {
    icon: Bell,
    title: "Get Timely Reminders",
    description:
      "Smart alerts for check-ins, medications, and care tasks at the right moment.",
  },
  {
    icon: Users,
    title: "Build Your Care Team",
    description:
      "Keep emergency contacts, doctors, and caregivers connected and informed.",
  },
];

function PhoneFrame({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`phone-frame ${className ?? ""}`}>
      <div className="phone-notch" />
      <div className="phone-screen">{children}</div>
    </div>
  );
}

function FeatureSpotlightPhone() {
  return (
    <PhoneFrame className="feature-phone">
      <div className="flex flex-col gap-2 p-3">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-bold text-foreground">HEMO</p>
          <div className="size-5 rounded-full bg-muted flex items-center justify-center">
            <Bell className="size-2.5 text-muted-foreground" />
          </div>
        </div>
        <div className="flex gap-2 text-[8px]">
          {["For You", "Following", "My Care"].map((tab, i) => (
            <button
              key={tab}
              className={`px-2 py-0.5 rounded-full text-[7px] font-medium ${
                i === 2
                  ? "bg-foreground text-background"
                  : "text-muted-foreground"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="rounded-xl overflow-hidden border border-border">
          <div className="hemo-gradient h-12 flex items-end p-2">
            <p className="text-[8px] font-semibold text-white">
              SCD Support Group
            </p>
          </div>
          <div className="p-2 bg-card">
            <p className="text-[7px] text-muted-foreground">
              Join others who understand your journey
            </p>
            <button className="mt-1.5 rounded-full bg-primary px-2 py-0.5">
              <p className="text-[7px] text-white font-medium">Join</p>
            </button>
          </div>
        </div>
        <div className="rounded-lg border border-border p-2 flex items-center gap-2">
          <div className="size-6 rounded-full bg-primary/20 shrink-0 flex items-center justify-center">
            <p className="text-[6px] font-bold text-primary">HC</p>
          </div>
          <div>
            <p className="text-[8px] font-medium text-foreground">
              Hydroxyurea Community
            </p>
            <p className="text-[7px] text-muted-foreground">4.2k members</p>
          </div>
        </div>
        <div className="rounded-lg bg-muted p-2 flex items-center gap-2">
          <div className="size-6 rounded-full bg-muted-foreground/20 shrink-0 flex items-center justify-center">
            <p className="text-[6px] text-muted-foreground">SH</p>
          </div>
          <div>
            <p className="text-[8px] font-medium text-foreground">Skate Hub</p>
            <p className="text-[7px] text-muted-foreground">Active community</p>
          </div>
        </div>
      </div>
    </PhoneFrame>
  );
}

const AppFeatures = () => {
  return (
    <section
      id="features"
      className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
    >
      <div className="flex flex-col items-center gap-4 text-center mb-16">
        <Badge variant="secondary" className="w-fit">
          <Smartphone className="size-3" />
          Top Features
        </Badge>
        <h2 className="max-w-2xl text-balance text-4xl font-bold sm:text-5xl">
          Managing Your Sickle Cell Health Has Never Been Easier
        </h2>
        <p className="max-w-xl text-balance text-muted-foreground">
          A welcoming space to log, track, and take action while growing your
          understanding of your own health every day.
        </p>
      </div>

      <div className="grid gap-12 lg:grid-cols-[1fr_auto_1fr] lg:gap-8 lg:items-center">
        {/* Left features */}
        <div className="flex flex-col gap-10">
          {leftFeatures.map((f) => (
            <div key={f.title} className="flex flex-col gap-2">
              <div className="size-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <f.icon className="size-4 text-primary" />
              </div>
              <p className="font-semibold text-foreground">{f.title}</p>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>

        {/* Center phone */}
        <div className="flex justify-center">
          <FeatureSpotlightPhone />
        </div>

        {/* Right features */}
        <div className="flex flex-col gap-10">
          {rightFeatures.map((f) => (
            <div key={f.title} className="flex flex-col gap-2">
              <div className="size-9 rounded-xl bg-primary/15 flex items-center justify-center">
                <f.icon className="size-4 text-primary" />
              </div>
              <p className="font-semibold text-foreground">{f.title}</p>
              <p className="text-sm text-muted-foreground">{f.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AppFeatures;
