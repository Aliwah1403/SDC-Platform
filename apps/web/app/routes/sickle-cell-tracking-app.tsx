import { pageMeta, SITE_URL } from "../lib/meta";

export { default } from "@/pages/CategoryPage/SickleCellTrackingApp";

// Same freemium AggregateOffer shape used on the homepage (see home.tsx) —
// keep in sync if pricing changes.
const softwareApplication = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Hemo",
  applicationCategory: "HealthApplication",
  operatingSystem: "iOS, Android",
  url: `${SITE_URL}/sickle-cell-tracking-app`,
  description:
    "Hemo is a sickle cell tracking app for logging pain, hydration, mood, sleep and medications, spotting patterns, and preparing for appointments.",
  offers: {
    "@type": "AggregateOffer",
    lowPrice: "0",
    highPrice: "59.99",
    priceCurrency: "USD",
    offerCount: "2",
  },
};

export const meta = () =>
  pageMeta({
    title: "The Sickle Cell Tracking App — What Hemo Does",
    description:
      "Hemo is a sickle cell tracking app for pain, hydration, mood, sleep, and medications. See how it compares to generic trackers and paper diaries.",
    path: "/sickle-cell-tracking-app",
    jsonLd: softwareApplication,
  });
