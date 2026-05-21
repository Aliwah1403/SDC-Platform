import { useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const _supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const WAITLIST_URL = _supabaseUrl
  ? `${_supabaseUrl}/functions/v1/waitlist-signup`
  : null;

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
type SubmitStatus = "idle" | "submitting" | "success" | "error";

type PageWaitlistCTAProps = {
  title: string;
  description: string;
};

const PageWaitlistCTA = ({ title, description }: PageWaitlistCTAProps) => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    if (!WAITLIST_URL) {
      setStatus("error");
      setMessage("Waitlist is temporarily unavailable. Please try again later.");
      return;
    }

    setStatus("submitting");
    setMessage("");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    try {
      const res = await fetch(WAITLIST_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail, source: "features-page-cta" }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatus("error");
        setMessage(
          typeof data.error === "string" ? data.error : "Please try again in a moment.",
        );
        return;
      }
    } catch (err) {
      const msg =
        err instanceof Error && err.name === "AbortError"
          ? "Request timed out. Please try again."
          : "Please try again in a moment.";
      setStatus("error");
      setMessage(msg);
      return;
    } finally {
      clearTimeout(timeoutId);
    }

    setStatus("success");
    setMessage("You are on the waitlist. We will share launch updates soon.");
    setEmail("");
  };

  return (
    <section className="mx-auto mt-16 w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      <div className="grid-lines rounded-3xl border bg-card p-8 text-center shadow-sm sm:p-12">
        <h2 className="mx-auto max-w-3xl text-balance text-3xl font-bold sm:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
          {description}
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-7 max-w-md space-y-3"
        >
          <Label htmlFor="page-cta-email" className="sr-only">
            Email address
          </Label>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              id="page-cta-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="h-11"
              disabled={status === "submitting"}
            />
            <Button
              type="submit"
              className="h-11 shrink-0 px-6"
              disabled={status === "submitting"}
            >
              {status === "submitting" ? "Joining..." : "Join waitlist"}
              <ArrowRight className="size-4" />
            </Button>
          </div>
          <AnimatePresence>
            {status !== "idle" && message && (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className={`text-sm ${status === "error" ? "text-destructive" : "text-foreground"}`}
              >
                {message}
              </motion.p>
            )}
          </AnimatePresence>
        </form>
      </div>
    </section>
  );
};

export default PageWaitlistCTA;
