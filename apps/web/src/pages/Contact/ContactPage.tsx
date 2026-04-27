import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import PageWaitlistCTA from "@/components/PageWaitlistCTA";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ContactStatus = "idle" | "submitting" | "success" | "error";

type ContactReason = "support" | "partnership" | "clinician" | "press";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ContactPage = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [reason, setReason] = useState<ContactReason>("support");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<ContactStatus>("idle");

  const alert = useMemo(() => {
    if (status === "success") {
      return (
        <Alert>
          <AlertTitle>Message prepared</AlertTitle>
          <AlertDescription>
            Your email client should have opened with your message draft. If not, email us at hello@hemo.health.
          </AlertDescription>
        </Alert>
      );
    }
    if (status === "error") {
      return (
        <Alert variant="destructive">
          <AlertTitle>Could not submit</AlertTitle>
          <AlertDescription>Please complete all fields with a valid email before submitting.</AlertDescription>
        </Alert>
      );
    }
    return null;
  }, [status]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedMessage = message.trim();

    if (!normalizedName || !EMAIL_REGEX.test(normalizedEmail) || !normalizedMessage) {
      setStatus("error");
      return;
    }

    setStatus("submitting");

    const subject = encodeURIComponent(`Hemo Contact: ${reason}`);
    const body = encodeURIComponent(
      `Name: ${normalizedName}\nEmail: ${normalizedEmail}\nReason: ${reason}\n\nMessage:\n${normalizedMessage}`,
    );

    window.location.href = `mailto:hello@hemo.health?subject=${subject}&body=${body}`;
    setStatus("success");
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Badge variant="secondary">Contact</Badge>
      <h1 className="mt-4 max-w-3xl text-balance text-4xl font-bold sm:text-5xl">Talk to the Hemo team</h1>
      <p className="mt-4 max-w-3xl text-muted-foreground">
        For support, partnerships, clinician interest, or press requests, send us a message.
        We typically respond within 1-2 business days.
      </p>

      <section className="mt-10 grid gap-8 lg:grid-cols-[1.3fr_1fr]">
        <form onSubmit={handleSubmit} className="rounded-2xl border bg-card p-6 sm:p-8">
          <div className="grid gap-5">
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input id="name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="reason">Reason</Label>
              <select
                id="reason"
                value={reason}
                onChange={(event) => setReason(event.target.value as ContactReason)}
                className="h-10 rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="support">Support</option>
                <option value="partnership">Partnerships</option>
                <option value="clinician">Clinician Interest</option>
                <option value="press">Press</option>
              </select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="message">Message</Label>
              <textarea
                id="message"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="How can we help?"
                rows={6}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <Button type="submit" disabled={status === "submitting"} className="w-fit rounded-full px-7">
              {status === "submitting" ? "Submitting..." : "Send message"}
            </Button>
          </div>
        </form>

        <aside className="rounded-2xl border bg-muted/20 p-6 sm:p-8">
          <h2 className="text-xl font-semibold">Direct contact</h2>
          <p className="mt-2 text-sm text-muted-foreground">Fallback email: hello@hemo.health</p>
          <p className="mt-2 text-sm text-muted-foreground">Response time: 1-2 business days</p>
        </aside>
      </section>

      <div className="mt-6">{alert}</div>

      <PageWaitlistCTA
        title="Want launch updates while we reply?"
        description="Join the waitlist to get release news and feature updates first."
      />
    </div>
  );
};

export default ContactPage;
