import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router";
import posthog from "posthog-js";
import { PostHogProvider, PostHogErrorBoundary } from "@posthog/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import PageLayout from "./layouts/PageLayout";
import Homepage from "./pages/Homepage/Homepage";
import NotFoundPage from "./pages/NotFoundPage";

const ReactQueryDevtools = import.meta.env.DEV
  ? React.lazy(() =>
      import("@tanstack/react-query-devtools").then((m) => ({
        default: m.ReactQueryDevtools,
      }))
    )
  : () => null;

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
  { path: "*", element: <NotFoundPage /> },
]);

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PostHogProvider client={posthog}>
      <PostHogErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <RouterProvider router={router} />
          </TooltipProvider>
          {import.meta.env.DEV && (
            <React.Suspense fallback={null}>
              <ReactQueryDevtools initialIsOpen={false} />
            </React.Suspense>
          )}
        </QueryClientProvider>
      </PostHogErrorBoundary>
    </PostHogProvider>
  </React.StrictMode>,
);
