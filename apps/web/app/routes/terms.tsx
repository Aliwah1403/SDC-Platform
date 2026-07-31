import { pageMeta } from "../lib/meta";

export { default } from "@/pages/Terms/TermsPage";

export const meta = () =>
  pageMeta({
    title: "Terms of Service — Hemo",
    description:
      "The terms that govern your use of Hemo, the sickle cell companion app. Please read these terms before using the service.",
    path: "/terms",
  });
