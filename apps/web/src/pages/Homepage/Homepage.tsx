import { useMemo } from "react";

import HeroSection from "./HeroSection";
import TrustLogoSection from "./TrustLogoSection";
import AppFeatures from "./AppFeatures";
import Testimonials from "./Testimonials";
import WaitlistCTA from "./WaitlistCTA";
import FaqSection from "./FaqSection";
import PricingSection from "./PricingSection";
import Benefits from "./Benefits";

const FAQS = [
  {
    q: "What is Hemo?",
    a: "Hemo is a daily health companion for people living with Sickle Cell Disease. It helps you log symptoms, track patterns over time, manage your care details, and walk into every clinic visit with real context instead of guesswork.",
  },
  {
    q: "How long does a daily log take?",
    a: "Most check-ins take around two minutes. The log is designed to be short enough to complete even on difficult days.",
  },
  {
    q: "Is Hemo a replacement for emergency care?",
    a: "No. Hemo is a tracking and preparedness tool. In an emergency, contact local emergency services immediately.",
  },
  {
    q: "Is Hemo free to use?",
    a: "Yes. Core daily logging, trend tracking, emergency SOS, and care hub tools are free. Optional paid plans unlock deeper history, AI insights, and multi-member support.",
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
          mainEntity: FAQS.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: faq.a,
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
        <AppFeatures />
        <Benefits />
        <Testimonials />
        <PricingSection />
        <FaqSection />
        <WaitlistCTA />
      </div>
    </>
  );
};

export default Homepage;
