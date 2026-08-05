export interface HomeFaq {
  question: string;
  answer: string;
}

// Single source of truth for the homepage FAQ copy (FaqSection.tsx) AND the
// FAQPage JSON-LD schema (app/routes/home.tsx). Keep these in sync — the
// FAQPage schema must match what's actually visible on the page. Questions
// are phrased the way people search; answers are self-contained (~40-60
// words) so they read well as standalone AI-search snippets.
export const HOME_FAQS: HomeFaq[] = [
  {
    question: "Is there an app for sickle cell disease?",
    answer:
      "Yes — Hemo is a daily health companion built specifically for Sickle Cell Disease. It helps you log symptoms, track patterns over time, manage care details like medications and contacts, and walk into every clinic visit with real context instead of relying on memory.",
  },
  {
    question: "How do I track sickle cell pain with an app?",
    answer:
      "Hemo's guided daily log captures pain level, body location, mood, hydration, sleep, and possible triggers in one short flow. Over time those entries build a visual history, so you and your care team can see when pain crises cluster and what tends to precede them.",
  },
  {
    question: "How long does logging take?",
    answer:
      "Most check-ins take about two minutes. The guided flow covers pain, mood, hydration, sleep, triggers, and notes in a handful of quick taps, so it stays fast enough to complete even on the hardest days without adding to the burden of managing SCD.",
  },
  {
    question: "Which types of sickle cell disease does Hemo support?",
    answer:
      "Hemo supports all major types — HbSS, HbSC, HbS-β⁰, HbS-β⁺, HbSD, HbSE, and more. If you're unsure of your specific type, you can still use Hemo and update that detail later from your profile once you know it.",
  },
  {
    question: "Is Hemo a replacement for emergency care?",
    answer:
      "No. Hemo is a tracking and preparedness tool, not a medical device or emergency service. In an emergency, contact local emergency services immediately. The in-app SOS feature is a fast way to alert your chosen contacts — not a substitute for calling 911 or your local equivalent.",
  },
  {
    question: "How does Hemo handle my health data?",
    answer:
      "Hemo is built with a privacy-first approach. Your health data is stored securely and is never sold or shared with third parties for advertising. You control what you log, and full details on how your data is handled are on the Privacy page.",
  },
  {
    question: "When is Hemo launching?",
    answer:
      "Hemo is currently in private beta ahead of a public launch. Waitlist members get early access invites and timing updates first as milestones are reached, plus a heads-up before pricing and plan details go live.",
  },
];
