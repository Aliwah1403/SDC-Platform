export interface Faq {
  question: string;
  answer: string;
}

// Single source of truth for the FAQ page copy AND the FAQPage JSON-LD schema
// (app/routes/faq.tsx). Keep answers self-contained (~40-60 words).
export const faqs: Faq[] = [
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
