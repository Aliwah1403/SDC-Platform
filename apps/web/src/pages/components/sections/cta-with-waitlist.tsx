import { useMemo, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import type { FormEvent } from "react";
import { ArrowRight, Smartphone, Mail } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { supabase } from "@/lib/supabase";
type SubmitStatus = "idle" | "submitting" | "success" | "error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const WaitlistCTA = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const isSubmitting = status === "submitting";

  const jumpTo = (id: string) => {
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const statusAlert = useMemo(() => {
    if (status === "success") {
      return (
        <Alert>
          <Mail />
          <AlertTitle>You're on the waitlist</AlertTitle>
          <AlertDescription>{statusMessage}</AlertDescription>
        </Alert>
      );
    }
    if (status === "error") {
      return (
        <Alert variant="destructive">
          <Mail />
          <AlertTitle>Could not join waitlist</AlertTitle>
          <AlertDescription>{statusMessage}</AlertDescription>
        </Alert>
      );
    }
    return null;
  }, [status, statusMessage]);

  const handleSubmitWaitlist = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setStatus("error");
      setStatusMessage("Please enter a valid email address.");
      return;
    }
    if (!supabase) {
      setStatus("error");
      setStatusMessage(
        "Waitlist is not configured yet. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.",
      );
      return;
    }
    setStatus("submitting");
    setStatusMessage("");
    const { error } = await supabase.from("waitlist_signups").insert({
      email: normalizedEmail,
      source: "landing-page",
    });
    if (error) {
      setStatus("error");
      setStatusMessage(error.message || "Please try again in a moment.");
      return;
    }
    setStatus("success");
    setStatusMessage("Thanks for joining. We'll share launch updates soon.");
    setEmail("");
  };
  return (
    <section
      id="waitlist"
      className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8"
    >
      <div className="grid-lines rounded-3xl border bg-card p-10 shadow-sm sm:p-14 text-center">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-5">
          <Badge variant="secondary" className="w-fit">
            <Smartphone className="size-3" />
            Mobile app launch updates
          </Badge>
          <h2 className="text-balance text-4xl font-bold sm:text-5xl">
            Join the Hemo Waitlist
          </h2>
          <p className="text-balance text-muted-foreground">
            Be first to know when Hemo launches publicly and get product updates
            as we expand features.
          </p>
          <form
            onSubmit={handleSubmitWaitlist}
            className="flex w-full max-w-md flex-col gap-3 sm:flex-row"
          >
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              aria-label="Email address"
              disabled={isSubmitting}
              className="rounded-full"
            />
            <Button
              type="submit"
              disabled={isSubmitting}
              className="rounded-full shrink-0 bg-foreground text-background hover:bg-foreground/85"
            >
              {isSubmitting ? "Joining..." : "Join Waitlist"}
              <ArrowRight className="size-4" />
            </Button>
          </form>
          {statusAlert}
        </div>
      </div>
    </section>
  );
};

export default WaitlistCTA;
