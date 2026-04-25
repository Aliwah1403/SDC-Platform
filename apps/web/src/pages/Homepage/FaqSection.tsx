const FAQS = [
  {
    q: "What is Hemo?",
    a: "Hemo is a daily health companion for people living with Sickle Cell Disease. It helps you log symptoms, track patterns over time, manage your care details, and walk into every clinic visit with real context instead of guesswork.",
  },
  {
    q: "Who is Hemo designed for?",
    a: "Patients with SCD first. Caregivers managing health on behalf of a loved one also benefit, and clinicians get clearer visit context from structured logs.",
  },
  {
    q: "How long does a daily log take?",
    a: "Most check-ins take around two minutes. The log is designed to be short enough to complete even on difficult days — covering pain, mood, hydration, sleep, triggers, and notes in a single guided flow.",
  },
  {
    q: "Which SCD types does Hemo support?",
    a: "All major types — HbSS, HbSC, HbS-β⁰, HbS-β⁺, HbSD, HbSE, and more. If you are unsure of your type, Hemo still works and you can update that detail later.",
  },
  {
    q: "Is Hemo a replacement for emergency care?",
    a: "No. Hemo is a tracking and preparedness tool. In an emergency, contact local emergency services immediately. The in-app SOS feature is a quick way to alert your chosen contacts, not a substitute for calling 911 or your local equivalent.",
  },
  {
    q: "How does Hemo handle my health data?",
    a: "Hemo is built with a privacy-first approach. Your health data is stored securely and is never sold or shared with third parties. Full details are on the Privacy page.",
  },
  {
    q: "Is Hemo free to use?",
    a: "Yes. Core daily logging, trend tracking, emergency SOS, and care hub tools are free. Optional paid plans unlock deeper history, AI insights, and multi-member support for families.",
  },
  {
    q: "When is Hemo launching?",
    a: "Hemo is currently pre-launch. Waitlist members get timing updates and early access news as milestones are reached.",
  },
];

const FaqSection = () => {
  return (
    <section id="faq" className="py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
          FAQ
        </h2>
        <div className="mt-7 grid gap-3">
          {FAQS.map((item) => (
            <details key={item.q} className="rounded-lg border bg-white p-5">
              <summary className="cursor-pointer list-none text-base font-semibold">
                {item.q}
              </summary>
              <p className="mt-2 text-sm text-muted-foreground">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
