import { faqs } from "@/pages/FAQ/faqData";
import { pageMeta } from "../lib/meta";

export { default } from "@/pages/FAQ/FaqPage";

const faqPageJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

export const meta = () =>
  pageMeta({
    title: "Hemo FAQ — Sickle Cell App Questions Answered",
    description:
      "Answers to common questions about Hemo, the sickle cell app: data privacy, emergency use, launch timing, and who it is built for.",
    path: "/faq",
    jsonLd: faqPageJsonLd,
  });
