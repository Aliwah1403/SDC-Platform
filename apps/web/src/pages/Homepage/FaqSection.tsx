import { FAQScrollAccordion } from "@/components/faq-scroll-accordion";

const FAQS = [
  {
    question: "What is Hemo?",
    answer:
      "Hemo is a daily health companion for people living with Sickle Cell Disease. It helps you log symptoms, track patterns over time, manage your care details, and walk into every clinic visit with real context instead of guesswork.",
  },
  {
    question: "Who is Hemo designed for?",
    answer:
      "Patients with SCD first. Caregivers managing health on behalf of a loved one also benefit, and clinicians get clearer visit context from structured logs.",
  },
  {
    question: "How long does a daily log take?",
    answer:
      "Most check-ins take around two minutes. The log is designed to be short enough to complete even on difficult days — covering pain, mood, hydration, sleep, triggers, and notes in a single guided flow.",
  },
  {
    question: "Which SCD types does Hemo support?",
    answer:
      "All major types — HbSS, HbSC, HbS-β⁰, HbS-β⁺, HbSD, HbSE, and more. If you are unsure of your type, Hemo still works and you can update that detail later.",
  },
  {
    question: "Is Hemo a replacement for emergency care?",
    answer:
      "No. Hemo is a tracking and preparedness tool. In an emergency, contact local emergency services immediately. The in-app SOS feature is a quick way to alert your chosen contacts, not a substitute for calling 911 or your local equivalent.",
  },
  {
    question: "How does Hemo handle my health data?",
    answer:
      "Hemo is built with a privacy-first approach. Your health data is stored securely and is never sold or shared with third parties. Full details are on the Privacy page.",
  },
  {
    question: "Is Hemo free to use?",
    answer:
      "Yes. Core daily logging, trend tracking, emergency SOS, and care hub tools are free. Optional paid plans unlock deeper history, AI insights, and multi-member support for families.",
  },
  {
    question: "When is Hemo launching?",
    answer:
      "Hemo is currently pre-launch. Waitlist members get timing updates and early access news as milestones are reached.",
  },
];

const FaqSection = () => {
  return (
    <section id="faq" className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <FAQScrollAccordion items={FAQS} />
      </div>
    </section>
  );
};

export default FaqSection;
