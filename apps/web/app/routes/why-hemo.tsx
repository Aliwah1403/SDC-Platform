import { pageMeta } from "../lib/meta";

export { default } from "@/pages/About/WhyHemoPage";

export const meta = () =>
  pageMeta({
    title: "Why Hemo — Built for Sickle Cell Disease",
    description:
      "The story behind Hemo and why it exists: a daily companion built specifically for people living with sickle cell disease and the people who care for them.",
    path: "/why-hemo",
  });
