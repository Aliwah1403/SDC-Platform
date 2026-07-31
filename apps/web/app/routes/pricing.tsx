import { pageMeta } from "../lib/meta";

export { default } from "@/pages/Pricing/PricingPage";

export const meta = () =>
  pageMeta({
    title: "Hemo Pricing — Plans for the Sickle Cell App",
    description:
      "Hemo pricing and plans. The app is in private beta today; join the waitlist for early access and be the first to know when plans go live.",
    path: "/pricing",
  });
