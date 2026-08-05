import { pageMeta } from "../lib/meta";

export { default } from "@/pages/Privacy/PrivacyPage";

export const meta = () =>
  pageMeta({
    title: "Privacy Policy — Hemo",
    description:
      "How Hemo collects, uses and protects your health data. Our privacy-first approach to handling sensitive sickle cell information.",
    path: "/privacy",
  });
