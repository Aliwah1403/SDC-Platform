import { useState } from "react";
import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  type LinksFunction,
  type MetaFunction,
} from "react-router";
import posthog from "posthog-js";
import { PostHogProvider, PostHogErrorBoundary } from "@posthog/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

import { TooltipProvider } from "@/components/ui/tooltip";
import stylesheet from "@/index.css?url";

const SITE_URL = "https://www.hemo-scd.com";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

// PostHog reads from window on init, so only initialise in the browser. During
// the build-time prerender this module also runs in Node, where we skip it.
if (typeof window !== "undefined" && import.meta.env.VITE_POSTHOG_KEY) {
  posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
    api_host: import.meta.env.VITE_POSTHOG_HOST,
    defaults: "2026-01-30",
  });
}

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
  { rel: "apple-touch-icon", sizes: "180x180", href: "/apple-touch-icon.png" },
  { rel: "icon", type: "image/png", sizes: "32x32", href: "/favicon-32x32.png" },
  { rel: "icon", type: "image/png", sizes: "16x16", href: "/favicon-16x16.png" },
  { rel: "manifest", href: "/site.webmanifest" },
];

// Site-wide default meta. Individual routes export their own `meta` (unique title,
// description, canonical, OG) which fully replaces this set for that route.
export const meta: MetaFunction = () => [
  { title: "Hemo — Your Sickle Cell Companion" },
  {
    name: "description",
    content:
      "Log symptoms in under 2 minutes, spot patterns over time, and walk into every appointment prepared. Join the Hemo waitlist for early access.",
  },
  { property: "og:type", content: "website" },
  { property: "og:site_name", content: "Hemo" },
  { property: "og:image", content: OG_IMAGE },
  { property: "og:image:width", content: "1200" },
  { property: "og:image:height", content: "630" },
  { name: "twitter:card", content: "summary_large_image" },
  { name: "twitter:image", content: OG_IMAGE },
];

// Sitewide JSON-LD: Organization + WebSite. Emitted into every prerendered page.
const ORGANIZATION_JSONLD = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: "Hemo",
      url: SITE_URL,
      logo: `${SITE_URL}/logo.png`,
      description:
        "Hemo is a mobile app for people with sickle cell disease to track pain, hydration, mood and medications and prepare for appointments.",
    },
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: SITE_URL,
      name: "Hemo",
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ],
};

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <Meta />
        <Links />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(ORGANIZATION_JSONLD) }}
        />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <PostHogProvider client={posthog}>
      <PostHogErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Outlet />
          </TooltipProvider>
        </QueryClientProvider>
      </PostHogErrorBoundary>
    </PostHogProvider>
  );
}
