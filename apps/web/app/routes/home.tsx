import { pageMeta, SITE_URL } from "../lib/meta";

export { default } from "@/pages/Homepage/Homepage";

const softwareApplication = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Hemo",
  applicationCategory: "HealthApplication",
  operatingSystem: "iOS, Android",
  url: SITE_URL,
  description:
    "Hemo is an app for people with sickle cell disease to track pain, hydration, mood and medications, spot patterns, and prepare for appointments.",
};

export const meta = () =>
  pageMeta({
    title: "Hemo — Your Sickle Cell Companion",
    description:
      "Hemo is an app for people with sickle cell disease to log symptoms in under 2 minutes, spot patterns, and prepare for every appointment. Join the waitlist.",
    path: "/",
    jsonLd: softwareApplication,
  });
