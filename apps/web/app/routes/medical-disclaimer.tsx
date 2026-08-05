import { pageMeta } from "../lib/meta";

export { default } from "@/pages/MedicalDisclaimerPage";

export const meta = () =>
  pageMeta({
    title: "Medical Disclaimer — Hemo",
    description:
      "Hemo is a tracking and preparedness tool, not medical advice or a substitute for professional care. Read our full medical disclaimer.",
    path: "/medical-disclaimer",
  });
