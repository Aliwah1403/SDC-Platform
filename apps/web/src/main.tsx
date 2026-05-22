import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import posthog from "posthog-js";
import { PostHogProvider, PostHogErrorBoundary } from "@posthog/react";

import PageLayout from "./layouts/PageLayout";
import Homepage from "./pages/Homepage/Homepage";

import "./index.css";

posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
  api_host: import.meta.env.VITE_POSTHOG_HOST,
  defaults: "2026-01-30",
});

const router = createBrowserRouter([
  {
    path: "/export-test",
    lazy: async () => ({
      Component: (await import("./pages/Export/ExportTestPage")).default,
    }),
  },
  {
    path: "/summary-test",
    lazy: async () => ({
      Component: (await import("./pages/Summary/SummaryTestPage")).default,
    }),
  },
  {
    path: "/export/:token",
    lazy: async () => ({
      Component: (await import("./pages/Export/ExportPage")).default,
    }),
  },
  {
    path: "/summary/:token",
    lazy: async () => ({
      Component: (await import("./pages/Summary/SummaryPage")).default,
    }),
  },
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
          Component: (await import("./pages/FeaturesPage/FeaturesPage"))
            .default,
        }),
      },
      // {
      //   path: "/pricing",
      //   lazy: async () => ({
      //     Component: (await import("./pages/Pricing/PricingPage")).default,
      //   }),
      // },
      {
        path: "/contact",
        lazy: async () => ({
          Component: (await import("./pages/Contact/ContactPage")).default,
        }),
      },
      // {
      //   path: "/faq",
      //   lazy: async () => ({
      //     Component: (await import("./pages/FAQ/FaqPage")).default,
      //   }),
      // },
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
    <PostHogProvider client={posthog}>
      <PostHogErrorBoundary>
        <RouterProvider router={router} />
      </PostHogErrorBoundary>
    </PostHogProvider>
  </React.StrictMode>,
);
