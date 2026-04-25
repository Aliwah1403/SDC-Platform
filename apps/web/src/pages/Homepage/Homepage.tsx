import { useMemo } from "react";

import { Button } from "@/components/ui/button";

import HeroSection from "./HeroSection";
import TrustLogoSection from "./TrustLogoSection";
import WhyHemo from "./WhyHemo";
import AppFeatures from "./AppFeatures";
import Testimonials from "./Testimonials";
import WaitlistCTA from "./WaitlistCTA";
import FaqSection from "./FaqSection";
import AboutUs from "./AboutUs";
import PricingSection from "./PricingSection";

const FAQS = [
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

function HomeJsonLd() {
  const data = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "SoftwareApplication",
          name: "Hemo",
          applicationCategory: "HealthApplication",
          operatingSystem: "iOS, Android",
          description:
            "Hemo is a daily health companion for people with Sickle Cell Disease to log symptoms, spot patterns, manage care, and prepare for clinic appointments.",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
            availability: "https://schema.org/PreOrder",
          },
        },
        {
          "@type": "FAQPage",
          mainEntity: FAQS.map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.a,
            },
          })),
        },
      ],
    }),
    [],
  );

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

const Homepage = () => {
  return (
    <>
      <HomeJsonLd />

      <div className="relative page-grid-lines overflow-hidden">
        <HeroSection />

        <TrustLogoSection />

        <WhyHemo />

        <AppFeatures />

        <Testimonials />

        <WaitlistCTA />

        {/* <section className="bg-secondary py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-center text-4xl font-semibold tracking-[-0.02em] sm:text-5xl">
              Build the habit. Protect your streak.
            </h2>
            <div className="mx-auto mt-8 grid max-w-4xl gap-4 sm:grid-cols-3">
              <div className="rounded-lg bg-white p-5">
                <Flame className="size-5 text-primary" />
                <p className="mt-4 text-3xl font-semibold">36</p>
                <p className="text-sm text-muted-foreground">
                  Current streak days
                </p>
              </div>
              <div className="rounded-lg bg-white p-5">
                <Sparkles className="size-5 text-primary" />
                <p className="mt-4 text-3xl font-semibold">15+</p>
                <p className="text-sm text-muted-foreground">
                  Milestone badges
                </p>
              </div>
              <div className="rounded-lg bg-white p-5">
                <HeartPulse className="size-5 text-primary" />
                <p className="mt-4 text-3xl font-semibold">7/7</p>
                <p className="text-sm text-muted-foreground">
                  Weekly check-ins complete
                </p>
              </div>
            </div>
          </div>
        </section> */}

        {/* <section className="bg-secondary py-18">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <h2 className="text-5xl font-semibold tracking-[-0.03em] sm:text-6xl">
              What this adds up to
            </h2>
            <div className="mt-8 grid gap-6 border-t border-border pt-8 sm:grid-cols-3">
              {STATS.map((item) => (
                <div key={item.label}>
                  <p className="text-6xl font-semibold tracking-tight">
                    {item.value}
                    <span className="ml-1 text-2xl text-muted-foreground">
                      {item.unit}
                    </span>
                  </p>
                  <p className="mt-2 text-sm text-muted-foreground">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section> */}

        <AboutUs />
        <PricingSection />

        <FaqSection />
      </div>
    </>
  );
};

export default Homepage;
