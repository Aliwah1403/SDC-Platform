import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation } from "react-router";
import {
  ArrowLeft,
  ArrowRight,
  BellOff,
  Check,
  Clock,
  HeartPulse,
  Images,
  LoaderCircle,
  MailCheck,
  TriangleAlert,
  Trash2,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { getPublicTokenSupabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";

const REQUEST_SUCCESS =
  "If an account exists for that email address, we’ve sent a confirmation link.";
const GENERIC_REQUEST_ERROR =
  "Could not submit your request. Please try again.";
const INVALID_TOKEN_ERROR = "This deletion link is invalid or has expired.";
const UNAVAILABLE_ERROR =
  "Account deletion is temporarily unavailable. Please try again later.";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Mirrors what deleteAccountForUser() actually removes in
// supabase/functions/_shared/account-deletion.ts — keep the two in sync.
const REMOVED = [
  {
    icon: UserRound,
    title: "Account and profile",
    body: "Your sign-in, profile, onboarding answers, and app settings.",
  },
  {
    icon: HeartPulse,
    title: "Health data",
    body: "Symptom logs, pain scores, medications, appointments, care team, and crisis plan.",
  },
  {
    icon: Images,
    title: "Files you uploaded",
    body: "Avatars, contact photos, community images, and medical documents.",
  },
];

const STEPS = [
  {
    title: "Tell us your email",
    body: "Enter the address on your Hemo account. Nothing is deleted at this point.",
  },
  {
    title: "Confirm it's you",
    body: "We email you a one-time link. It's valid for 24 hours, and ignoring it leaves your account untouched.",
  },
  {
    title: "Everything is erased",
    body: "Open the link and your account and health data are permanently removed.",
  },
];

const fadeIn = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

/** Edge functions return `{ error }` on non-2xx — surface it instead of a generic message. */
async function readInvokeError(invokeError: unknown, fallback: string) {
  const context = (invokeError as { context?: Response })?.context;
  if (!context || typeof context.json !== "function") return fallback;
  try {
    const body = await context.json();
    return typeof body?.error === "string" ? body.error : fallback;
  } catch {
    return fallback;
  }
}

function ErrorNotice({
  children,
  className,
}: {
  children: string;
  className?: string;
}) {
  return (
    <motion.p
      {...fadeIn}
      role="alert"
      className={cn(
        "flex items-start gap-2.5 rounded-xl border border-destructive/25 bg-destructive/5 px-4 py-3 text-sm text-destructive",
        className,
      )}
    >
      <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      {children}
    </motion.p>
  );
}

function RemovedList({ compact = false }: { compact?: boolean }) {
  return (
    <ul
      className={
        compact ? "space-y-3.5" : "grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      }
    >
      {REMOVED.map(({ icon: Icon, title, body }) => (
        <li key={title} className={compact ? "flex gap-3" : ""}>
          <span
            className={
              compact
                ? "mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary"
                : "flex size-10 items-center justify-center rounded-xl bg-secondary"
            }
          >
            <Icon
              className={
                compact
                  ? "size-4 text-secondary-foreground"
                  : "size-5 text-secondary-foreground"
              }
              aria-hidden="true"
            />
          </span>
          <div className={compact ? "" : "mt-4"}>
            <p className="text-sm font-semibold">{title}</p>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              {body}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}

function SuccessBadge({ icon: Icon }: { icon: typeof Check }) {
  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 0.05, type: "spring", stiffness: 200, damping: 15 }}
      className="flex size-14 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/25"
    >
      <Icon
        className="size-7 text-primary-foreground"
        strokeWidth={2.5}
        aria-hidden="true"
      />
    </motion.div>
  );
}

// ── Request flow (no token) ───────────────────────────────────────────────────

function RequestDeletion({ search }: { search: string }) {
  const [email, setEmail] = useState("");
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function requestDeletion(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    const client = getPublicTokenSupabase(search);
    if (!client) {
      setError(UNAVAILABLE_ERROR);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const { error: invokeError } = await client.functions.invoke(
        "request-account-deletion",
        { body: { email: normalizedEmail } },
      );
      if (invokeError) {
        setError(await readInvokeError(invokeError, GENERIC_REQUEST_ERROR));
        return;
      }
      setSentTo(normalizedEmail);
    } catch {
      setError(GENERIC_REQUEST_ERROR);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="grid items-start gap-12 lg:grid-cols-2 lg:gap-16">
        {/* Narrative column */}
        <div className="max-w-xl">
          <p className="text-sm font-medium text-primary">Account deletion</p>
          <h1 className="mt-3 text-balance text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
            Delete your Hemo account
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">
            You can remove your Hemo account and everything stored with it at
            any time, without asking us first. We only ask you to confirm by
            email so nobody else can delete your health record.
          </p>

          <ol className="mt-10 space-y-6">
            {STEPS.map((step, index) => (
              <li key={step.title} className="flex gap-4">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                  {index + 1}
                </span>
                <div className="pt-0.5">
                  <p className="font-medium">{step.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        {/* Action column */}
        <div className="lg:sticky lg:top-24">
          <AnimatePresence mode="wait">
            {sentTo ? (
              <motion.div
                key="sent"
                {...fadeIn}
                className="rounded-2xl border bg-card p-6 shadow-sm sm:p-8"
              >
                <SuccessBadge icon={MailCheck} />
                <h2 className="mt-6 text-2xl font-semibold tracking-[-0.02em]">
                  Check your inbox
                </h2>
                <p className="mt-3 text-muted-foreground">{REQUEST_SUCCESS}</p>
                <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                  We sent it to{" "}
                  <span className="font-medium text-foreground">{sentTo}</span>.
                  The link expires in 24 hours — if it doesn&apos;t arrive
                  within a few minutes, check your spam folder.
                </p>
                <Button
                  variant="outline"
                  className="mt-6 h-11 w-full"
                  onClick={() => {
                    setSentTo(null);
                    setError(null);
                  }}
                >
                  <ArrowLeft className="size-4" />
                  Use a different email
                </Button>
              </motion.div>
            ) : (
              <motion.div key="form" {...fadeIn}>
                <form
                  onSubmit={requestDeletion}
                  className="space-y-5 rounded-2xl border bg-card p-6 shadow-sm sm:p-8"
                >
                  <div>
                    <h2 className="text-xl font-semibold tracking-[-0.02em]">
                      Start the deletion request
                    </h2>
                    <p className="mt-1.5 text-sm text-muted-foreground">
                      We&apos;ll send a verification link before deleting
                      anything.
                    </p>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="delete-email">
                      Email address
                    </FieldLabel>
                    <Input
                      id="delete-email"
                      type="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                      autoComplete="email"
                      maxLength={320}
                      disabled={isSubmitting}
                      required
                    />
                  </Field>

                  <Button
                    type="submit"
                    className="h-11 w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <LoaderCircle
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                    ) : null}
                    {isSubmitting ? "Sending…" : "Send verification link"}
                    {isSubmitting ? null : <ArrowRight className="size-4" />}
                  </Button>

                  <AnimatePresence>
                    {error && <ErrorNotice key="error">{error}</ErrorNotice>}
                  </AnimatePresence>
                </form>

                <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-muted px-4 py-3.5 text-sm leading-relaxed text-muted-foreground">
                  <Clock
                    className="mt-0.5 size-4 shrink-0"
                    aria-hidden="true"
                  />
                  <p>
                    Already signed in on your phone? You can delete your account
                    straight from{" "}
                    <span className="font-medium text-foreground">
                      Profile → Password &amp; Security
                    </span>{" "}
                    in the Hemo app.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* What gets removed */}
      <section className="mt-20 border-t pt-12">
        <h2 className="text-2xl font-semibold tracking-[-0.02em]">
          What gets removed
        </h2>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          Deletion is permanent and immediate — there is no grace period and no
          way for us to restore any of it afterwards.
        </p>
        <div className="mt-8">
          <RemovedList />
        </div>
        <p className="mt-10 text-sm text-muted-foreground">
          Questions before you go? Read our{" "}
          <a href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </a>{" "}
          or{" "}
          <a href="/contact" className="text-primary hover:underline">
            contact the team
          </a>
          .
        </p>
      </section>
    </div>
  );
}

// ── Confirm flow (token in URL) ───────────────────────────────────────────────

function ConfirmDeletion({ token, search }: { token: string; search: string }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function confirmDeletion() {
    const client = getPublicTokenSupabase(search);
    if (!client) {
      setError(UNAVAILABLE_ERROR);
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const { data, error: invokeError } = await client.functions.invoke(
        "confirm-account-deletion",
        { body: { token } },
      );
      if (invokeError) {
        setError(await readInvokeError(invokeError, INVALID_TOKEN_ERROR));
        return;
      }
      if (!data?.deleted) {
        setError(
          typeof data?.error === "string" ? data.error : INVALID_TOKEN_ERROR,
        );
        return;
      }
      setIsConfirmed(true);
    } catch {
      setError("Could not delete the account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <AnimatePresence mode="wait">
        {isConfirmed ? (
          <motion.div key="deleted" {...fadeIn} className="text-center">
            <div className="flex justify-center">
              <SuccessBadge icon={Check} />
            </div>
            <h1 className="mt-6 text-balance text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
              Your account has been deleted
            </h1>
            <p className="mx-auto mt-4 max-w-md text-pretty leading-relaxed text-muted-foreground">
              Your Hemo account, health data, uploaded files, and notification
              profile have been permanently removed. We&apos;ve sent a final
              email confirming this — after that, we won&apos;t contact you
              again.
            </p>
            <p className="mx-auto mt-4 max-w-md text-pretty text-sm leading-relaxed text-muted-foreground">
              If Hemo fell short, we&apos;d genuinely like to know why. Replying
              to that email reaches us directly.
            </p>
            <Button className="mt-8 h-11" render={<a href="/" />}>
              Back to hemo-scd.com
            </Button>
          </motion.div>
        ) : (
          <motion.div key="confirm" {...fadeIn}>
            <div className="rounded-2xl border border-destructive/25 bg-card p-6 shadow-sm sm:p-8">
              <span className="flex size-12 items-center justify-center rounded-xl bg-destructive/10">
                <Trash2
                  className="size-6 text-destructive"
                  aria-hidden="true"
                />
              </span>
              <h1 className="mt-6 text-balance text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
                Confirm account deletion
              </h1>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                This permanently deletes your Hemo account and everything stored
                with it. It happens immediately and cannot be undone.
              </p>

              <div className="mt-8 rounded-xl bg-muted p-5">
                <p className="text-sm font-semibold">
                  The following will be erased
                </p>
                <div className="mt-4">
                  <RemovedList compact />
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row-reverse">
                <Button
                  className="h-11 flex-1 bg-destructive text-white hover:bg-destructive/90"
                  disabled={isSubmitting}
                  onClick={confirmDeletion}
                >
                  {isSubmitting ? (
                    <LoaderCircle
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Trash2 className="size-4" />
                  )}
                  {isSubmitting ? "Deleting…" : "Permanently delete my account"}
                </Button>
                <Button
                  variant="outline"
                  className="h-11 flex-1"
                  render={<a href="/" />}
                >
                  Cancel, keep my account
                </Button>
              </div>

              <AnimatePresence>
                {error && (
                  <ErrorNotice key="error" className="mt-5">
                    {error}
                  </ErrorNotice>
                )}
              </AnimatePresence>
            </div>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              Didn&apos;t request this? Close this page and ignore the email —
              your account stays exactly as it is.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function AccountDeletionPage() {
  const { search } = useLocation();
  // The confirmation token permanently deletes an account in a single use.
  // Capture it once on mount, then strip it from the address bar so it can't
  // leak through browser history, Referer headers on later resource loads, or
  // PostHog pageviews / session replay.
  const [token] = useState(() => new URLSearchParams(search).get("token"));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    if (!url.searchParams.has("token")) return;
    url.searchParams.delete("token");
    window.history.replaceState(
      window.history.state,
      "",
      `${url.pathname}${url.search}${url.hash}`,
    );
  }, []);

  return token ? (
    <ConfirmDeletion token={token} search={search} />
  ) : (
    <RequestDeletion search={search} />
  );
}
