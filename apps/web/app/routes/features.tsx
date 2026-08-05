import { pageMeta } from "../lib/meta";

export { default } from "@/pages/FeaturesPage/FeaturesPage";

export const meta = () =>
  pageMeta({
    title: "Hemo Features — Track Sickle Cell Pain & Patterns",
    description:
      "See what Hemo does: fast symptom logging, pain and hydration tracking, pattern insights, medication reminders, and appointment-ready health summaries.",
    path: "/features",
  });
