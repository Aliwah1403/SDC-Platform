import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import PageLayout from "./layouts/PageLayout";
import Homepage from "./pages/Homepage/Homepage";

import "./index.css";

const router = createBrowserRouter([
  {
    element: <PageLayout />,
    children: [
      { path: "/", element: <Homepage /> },
      {
        path: "/why-hemo",
        lazy: async () => ({
          Component: (await import("./pages/About/WhyHemoPage")).default,
        }),
      },
      {
        path: "/features",
        lazy: async () => ({
          Component: (await import("./pages/FeaturesPage/FeaturesPage")).default,
        }),
      },
      {
        path: "/pricing",
        lazy: async () => ({
          Component: (await import("./pages/Pricing/PricingPage")).default,
        }),
      },
      {
        path: "/contact",
        lazy: async () => ({
          Component: (await import("./pages/Contact/ContactPage")).default,
        }),
      },
      {
        path: "/faq",
        lazy: async () => ({
          Component: (await import("./pages/FAQ/FaqPage")).default,
        }),
      },
      {
        path: "/privacy",
        lazy: async () => ({
          Component: (await import("./pages/Privacy/PrivacyPage")).default,
        }),
      },
      {
        path: "/terms",
        lazy: async () => ({
          Component: (await import("./pages/Terms/TermsPage")).default,
        }),
      },
      {
        path: "/medical-disclaimer",
        lazy: async () => ({
          Component: (await import("./pages/MedicalDisclaimerPage")).default,
        }),
      },
    ],
  },
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
