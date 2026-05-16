import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { ArrowRight, Mail, Smartphone } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SubmitStatus = "idle" | "submitting" | "success" | "error";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type WaitlistCTAProps = {
  source?: string;
};

const WaitlistCTA = ({ source = "landing-page" }: WaitlistCTAProps) => {
  const waitlistUrl = import.meta.env.VITE_SUPABASE_URL
    ? `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/waitlist-signup`
    : null;

  if (!waitlistUrl) {
    console.error("[WaitlistCTA] VITE_SUPABASE_URL is not set — waitlist form disabled");
  }

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [statusMessage, setStatusMessage] = useState("");

  const isSubmitting = status === "submitting";

  const statusAlert = useMemo(() => {
    if (status === "success") {
      return (
        <Alert>
          <Mail />
          <AlertTitle>You&apos;re on the waitlist</AlertTitle>
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

    if (!waitlistUrl) {
      setStatus("error");
      setStatusMessage("Waitlist is temporarily unavailable. Please try again later.");
      return;
    }

    setStatus("submitting");
    setStatusMessage("");

    try {
      const res = await fetch(waitlistUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, source }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setStatusMessage(
          typeof data.error === "string" ? data.error : "Please try again in a moment.",
        );
        return;
      }
    } catch {
      setStatus("error");
      setStatusMessage("Please try again in a moment.");
      return;
    }

    setStatus("success");
    setStatusMessage("Thanks for joining. We'll share launch updates soon.");
    setEmail("");
  };

  return (
    <section id="waitlist" className="mx-auto max-w-7xl px-4 pb-24 sm:px-6 lg:px-8">
      <div className="grid-lines rounded-3xl border bg-card p-10 text-center shadow-sm sm:p-14">
        <div className="mx-auto flex max-w-xl flex-col items-center gap-5">
          <Badge variant="secondary" className="w-fit">
            <Smartphone className="size-3" />
            Mobile app launch updates
          </Badge>
          <h2 className="text-balance text-4xl font-bold sm:text-5xl">Join the Hemo Waitlist</h2>
          <p className="text-balance text-muted-foreground">
            Be first to know when Hemo launches publicly and get product updates as we expand features.
          </p>
          <form onSubmit={handleSubmitWaitlist} className="flex w-full max-w-md flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              aria-label="Email address"
              disabled={isSubmitting || !waitlistUrl}
              className="rounded-full"
            />
            <Button
              type="submit"
              disabled={isSubmitting || !waitlistUrl}
              className="shrink-0 rounded-full bg-foreground text-background hover:bg-foreground/85"
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
