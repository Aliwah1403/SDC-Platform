import type { Config } from "@react-router/dev/config";

import { getBlogPrerenderPaths } from "./app/lib/blog.server";
import { STATIC_ROUTES } from "./app/lib/site-routes";

// STATIC_ROUTES are the marketing routes that must exist as static HTML for
// crawlers (incl. AI search, which does not execute JS). App-utility routes
// (EmergencyCard, Export, Summary, link-gate, test/pitch/beta) are intentionally
// excluded — they stay client-only and carry `noindex` (see app/routes.ts).
export default {
  ssr: false,
  // Output lands in dist/client (static prerendered site) and dist/server (used
  // only during the prerender build). Vercel serves dist/client.
  buildDirectory: "dist",
  async prerender() {
    return [...STATIC_ROUTES, ...getBlogPrerenderPaths()];
  },
} satisfies Config;
