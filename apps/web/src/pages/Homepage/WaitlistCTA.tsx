import { useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const WaitlistCTA = () => {
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
    <section
      id="waitlist"
      className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8"
    >
      <div className="rounded-lg border bg-secondary p-8 sm:p-12">
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
                className="h-11 bg-white"
                disabled={waitlistStatus === "submitting"}
              />
              <Button type="submit" className="h-11 px-6">
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
                  className={`text-sm ${waitlistStatus === "error" ? "text-destructive" : "text-foreground"}`}
                >
                  {waitlistMessage}
                </motion.p>
              )}
            </AnimatePresence>
          </form>
        </div>
      </div>
    </section>
  );
};

export default WaitlistCTA;
