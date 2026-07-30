import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { IconBrandAndroid } from "@tabler/icons-react";
import { usePostHog } from "@posthog/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field, FieldLabel } from "@/components/ui/field";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Iphone } from "@/components/ui/iphone";
import HomeScreen from "@/assets/screenshots/home-screen.png";
import HealthTrends from "@/assets/screenshots/health-trends.png";

const _supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
if (!_supabaseUrl) {
  console.error(
    "VITE_SUPABASE_URL is not defined — cannot build beta-signup endpoint",
  );
}
const BETA_URL = _supabaseUrl
  ? `${_supabaseUrl}/functions/v1/beta-signup`
  : null;

type SubmitStatus = "idle" | "submitting" | "success" | "error";
type Platform = "ios" | "android" | "";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Apple mark — same silhouette used on the app's Apple sign-in button.
function AppleIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
    </svg>
  );
}

// Private intake page — keep it out of search indexes even though nothing links here.
function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    const previousTitle = document.title;
    document.title = "Join the Hemo beta";
    return () => {
      document.head.removeChild(meta);
      document.title = previousTitle;
    };
  }, []);
}

const BetaPage = () => {
  useNoIndex();
  const posthog = usePostHog();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [platform, setPlatform] = useState<Platform>("");
  const [googleEmail, setGoogleEmail] = useState("");
  const [deviceModel, setDeviceModel] = useState("");
  const [wishes, setWishes] = useState("");

  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [message, setMessage] = useState("");

  const submitting = status === "submitting";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const trimmedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedGoogle = googleEmail.trim().toLowerCase();

    if (!trimmedName) {
      setStatus("error");
      setMessage("Please enter your name.");
      return;
    }
    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }
    if (platform !== "ios" && platform !== "android") {
      setStatus("error");
      setMessage("Please choose which phone you use.");
      return;
    }
    if (platform === "android" && !EMAIL_REGEX.test(normalizedGoogle)) {
      setStatus("error");
      setMessage("Please enter the Google account you use on the Play Store.");
      return;
    }

    if (!BETA_URL) {
      setStatus("error");
      setMessage("The form is temporarily unavailable. Please try again later.");
      return;
    }

    posthog?.capture("beta_signup_submitted", { source: "beta-page", platform });
    setStatus("submitting");
    setMessage("");

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10_000);

    try {
      const res = await fetch(BETA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: trimmedName,
          email: normalizedEmail,
          platform,
          google_email: platform === "android" ? normalizedGoogle : undefined,
          device_model:
            platform === "android" && deviceModel.trim()
              ? deviceModel.trim()
              : undefined,
          wishes: wishes.trim() || undefined,
        }),
        signal: controller.signal,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errorMsg =
          typeof data.error === "string"
            ? data.error
            : "Please try again in a moment.";
        posthog?.capture("beta_signup_error", {
          source: "beta-page",
          errorCode: res.status >= 500 ? "server_error" : "request_failed",
        });
        setStatus("error");
        setMessage(errorMsg);
        return;
      }
    } catch (err) {
      const timedOut = err instanceof Error && err.name === "AbortError";
      setStatus("error");
      setMessage(
        timedOut
          ? "Request timed out. Please try again."
          : "Please try again in a moment.",
      );
      return;
    } finally {
      clearTimeout(timeoutId);
    }

    posthog?.capture("beta_signup_success", { source: "beta-page", platform });
    setStatus("success");
  };

  return (
    <main className="min-h-dvh bg-gradient-to-b from-secondary to-background px-4 py-12 sm:py-16">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:min-h-[calc(100dvh-8rem)] lg:grid-cols-2 lg:gap-16">
        <div className="mx-auto flex w-full max-w-lg flex-col">
          <img src="/logo.png" alt="Hemo" className="size-14" />

        <AnimatePresence mode="wait">
          {status === "success" ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-10 w-full px-2 text-center"
            >
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.05, type: "spring", stiffness: 200, damping: 15 }}
                className="mx-auto flex size-16 items-center justify-center rounded-full bg-primary shadow-lg shadow-primary/25"
              >
                <Check className="size-8 text-primary-foreground" strokeWidth={2.5} />
              </motion.div>
              <h1 className="mt-6 text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
                You&apos;re on the list.
              </h1>
              <p className="mx-auto mt-4 max-w-md text-balance text-muted-foreground">
                We&apos;ll send your install link within a few days — keep an eye
                on{" "}
                <span className="font-medium text-foreground">
                  {email.trim().toLowerCase()}
                </span>
                .
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-8 w-full"
            >
              <div className="text-center lg:text-left">
                <h1 className="text-balance text-3xl font-semibold tracking-[-0.02em] sm:text-4xl">
                  You&apos;re one of the first.
                </h1>
                <p className="mt-3 text-muted-foreground">
                  Tell us which phone you use so we can send the right install
                  link. Two minutes, and you&apos;re in.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-5 rounded-2xl border bg-white p-6 shadow-sm sm:p-8"
              >
                <Field>
                  <FieldLabel htmlFor="beta-name">Name</FieldLabel>
                  <Input
                    id="beta-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    autoComplete="name"
                    maxLength={100}
                    disabled={submitting}
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="beta-email">Email address</FieldLabel>
                  <Input
                    id="beta-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    disabled={submitting}
                  />
                </Field>

                <Field>
                  <FieldLabel>Which phone do you use?</FieldLabel>
                  <ToggleGroup
                    type="single"
                    variant="outline"
                    value={platform}
                    onValueChange={(value) =>
                      setPlatform((value as Platform) || "")
                    }
                    spacing={2}
                    className="w-full"
                  >
                    <ToggleGroupItem
                      value="ios"
                      disabled={submitting}
                      aria-label="iPhone"
                      className="h-11 flex-1 gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      <AppleIcon className="size-4" />
                      iPhone
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="android"
                      disabled={submitting}
                      aria-label="Android"
                      className="h-11 flex-1 gap-2 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    >
                      <IconBrandAndroid className="size-4" />
                      Android
                    </ToggleGroupItem>
                  </ToggleGroup>
                </Field>

                <AnimatePresence initial={false}>
                  {platform === "ios" && (
                    <motion.p
                      key="ios-note"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden rounded-lg  px-4 py-3 text-sm text-secondary-foreground"
                    >
                      You&apos;ll get a TestFlight invite link — nothing else
                      needed.
                    </motion.p>
                  )}

                  {platform === "android" && (
                    <motion.div
                      key="android-fields"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-5 overflow-hidden"
                    >
                      <Field>
                        <FieldLabel htmlFor="beta-google">
                          Google account email
                        </FieldLabel>
                        <Input
                          id="beta-google"
                          type="email"
                          value={googleEmail}
                          onChange={(e) => setGoogleEmail(e.target.value)}
                          placeholder="you@gmail.com"
                          autoComplete="email"
                          disabled={submitting}
                        />
                        <p className="text-sm text-muted-foreground">
                          Must be the exact Google account you use on the Play
                          Store — this is how we grant you access.
                        </p>
                      </Field>

                      <Field>
                        <FieldLabel htmlFor="beta-model">
                          Phone model{" "}
                          <span className="text-muted-foreground">
                            (optional)
                          </span>
                        </FieldLabel>
                        <Input
                          id="beta-model"
                          value={deviceModel}
                          onChange={(e) => setDeviceModel(e.target.value)}
                          placeholder="e.g. Pixel 8, Samsung Galaxy S23"
                          maxLength={100}
                          disabled={submitting}
                        />
                      </Field>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Field>
                  <FieldLabel htmlFor="beta-wishes">
                    What&apos;s the one thing you&apos;d want Hemo to do for you?{" "}
                    <span className="text-muted-foreground">(optional)</span>
                  </FieldLabel>
                  <Textarea
                    id="beta-wishes"
                    value={wishes}
                    onChange={(e) => setWishes(e.target.value)}
                    placeholder="I read every answer — it genuinely shapes what we build next."
                    maxLength={1000}
                    disabled={submitting}
                  />
                </Field>

                <Button
                  type="submit"
                  className="h-11 w-full"
                  disabled={submitting}
                >
                  {submitting ? "Submitting..." : "Join the beta"}
                  <ArrowRight className="size-4" />
                </Button>

                <AnimatePresence>
                  {status === "error" && message && (
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      className="text-center text-sm text-destructive"
                    >
                      {message}
                    </motion.p>
                  )}
                </AnimatePresence>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
        </div>

        <div
          aria-hidden
          className="relative hidden items-center justify-center lg:flex"
        >
          <div className="pointer-events-none absolute -z-10 size-[420px] rounded-full bg-primary/15 blur-3xl" />
          <div className="relative w-full max-w-[320px]">
            <motion.div
              initial={{ opacity: 0, y: 24, rotate: 10 }}
              animate={{ opacity: 1, y: 0, rotate: 6 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="absolute -right-8 top-12 w-[68%]"
            >
              <Iphone
                src={HealthTrends}
                alt="Hemo health trends"
                className="drop-shadow-2xl"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 24, rotate: -8 }}
              animate={{ opacity: 1, y: 0, rotate: -3 }}
              transition={{ duration: 0.6 }}
              className="relative w-full"
            >
              <Iphone
                src={HomeScreen}
                alt="Hemo home screen"
                className="drop-shadow-2xl"
              />
            </motion.div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default BetaPage;
