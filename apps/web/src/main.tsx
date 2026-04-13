import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";

import PageLayout from "./layouts/PageLayout";
import Homepage from "./pages/Homepage";

import "./index.css";

const router = createBrowserRouter([
  {
    element: <PageLayout />,
    children: [
      { path: "/", element: <Homepage /> },
      {
        path: "/why-hemo",
        lazy: async () => ({
          Component: (await import("./pages/WhyHemoPage")).default,
        }),
      },
      {
        path: "/features",
        lazy: async () => ({
          Component: (await import("./pages/FeaturesPage")).default,
        }),
      },
      {
        path: "/pricing",
        lazy: async () => ({
          Component: (await import("./pages/PricingPage")).default,
        }),
      },
      {
        path: "/contact",
        lazy: async () => ({
          Component: (await import("./pages/ContactPage")).default,
        }),
      },
      {
        path: "/faq",
        lazy: async () => ({
          Component: (await import("./pages/FaqPage")).default,
        }),
      },
      {
        path: "/privacy",
        lazy: async () => ({
          Component: (await import("./pages/PrivacyPage")).default,
        }),
      },
      {
        path: "/terms",
        lazy: async () => ({
          Component: (await import("./pages/TermsPage")).default,
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
