import { pageMeta } from "../lib/meta";

export { default } from "@/pages/Contact/ContactPage";

export const meta = () =>
  pageMeta({
    title: "Contact Hemo",
    description:
      "Get in touch with the Hemo team. Questions, feedback, partnership and press enquiries about the sickle cell companion app are welcome.",
    path: "/contact",
  });
