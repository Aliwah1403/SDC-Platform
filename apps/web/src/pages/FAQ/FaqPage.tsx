import PageWaitlistCTA from "@/components/PageWaitlistCTA";
import { Badge } from "@/components/ui/badge";

const faqs = [
  {
    question: "How does Hemo protect my data?",
    answer:
      "We design Hemo with privacy-first principles and limit sensitive data exposure. More detailed policy terms are provided on the Privacy page.",
  },
  {
    question: "Is Hemo a replacement for emergency care?",
    answer:
      "No. Hemo is a support app for tracking and preparedness. In emergencies, contact local emergency services immediately.",
  },
  {
    question: "When is Hemo launching?",
    answer:
      "Hemo is currently pre-launch. Waitlist members receive timing updates as milestones are reached.",
  },
  {
    question: "Who is Hemo designed for?",
    answer:
      "Patients with SCD first, plus caregivers and clinicians who benefit from structured day-to-day health context.",
  },
];

const FaqPage = () => {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <Badge variant="secondary">FAQ</Badge>
      <h1 className="mt-4 max-w-3xl text-balance text-4xl font-bold sm:text-5xl">Frequently asked questions</h1>
      <p className="mt-4 max-w-3xl text-muted-foreground">
        Answers to common trust and launch questions about Hemo.
      </p>

      <section className="mt-10 space-y-4">
        {faqs.map((faq) => (
          <article key={faq.question} className="rounded-2xl border bg-card p-6">
            <h2 className="text-lg font-semibold">{faq.question}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{faq.answer}</p>
          </article>
        ))}
      </section>

      <PageWaitlistCTA
        title="Still deciding?"
        description="Join the waitlist and we&apos;ll share launch details as they become available."
      />
    </div>
  );
};

export default FaqPage;
