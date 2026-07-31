import { pageMeta, SITE_URL } from "../lib/meta";
import { HOME_FAQS } from "@/pages/Homepage/faqData";

export { default } from "@/pages/Homepage/Homepage";

// Freemium offer: free tier (logging, 7-day stats, Emergency SOS, community,
// basic care hub) plus paid Hemo+ ($7.99/mo or $59.99/yr). AggregateOffer
// reflects that range instead of a single hardcoded price.
const softwareApplication = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Hemo",
  applicationCategory: "HealthApplication",
  operatingSystem: "iOS, Android",
  url: SITE_URL,
  description:
    "Hemo is an app for people with sickle cell disease to track pain, hydration, mood and medications, spot patterns, and prepare for appointments.",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "0",
    highPrice: "59.99",
    priceCurrency: "USD",
    offerCount: "2",
  },
};

// Built from the same HOME_FAQS array that <FaqSection /> renders, so the
// schema always matches what's actually visible on the page.
const faqPage = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: HOME_FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export const meta = () =>
  pageMeta({
    title: "Hemo — Your Sickle Cell Companion",
    description:
      "Hemo is an app for people with sickle cell disease to log symptoms in under 2 minutes, spot patterns, and prepare for every appointment. Join the waitlist.",
    path: "/",
    jsonLd: [softwareApplication, faqPage],
  });
