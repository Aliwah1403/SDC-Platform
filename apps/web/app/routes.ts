import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  // Marketing + blog, wrapped in the shared page chrome (nav + footer).
  // These are the prerendered, indexable routes.
  layout("../src/layouts/PageLayout.tsx", [
    index("routes/home.tsx"),
    route("why-hemo", "routes/why-hemo.tsx"),
    route("features", "routes/features.tsx"),
    route(
      "sickle-cell-tracking-app",
      "routes/sickle-cell-tracking-app.tsx",
    ),
    // Disabled for now — re-enable alongside app/lib/site-routes.ts and the
    // mirror list in scripts/generate-sitemap.mjs.
    // route("pricing", "routes/pricing.tsx"),
    // route("faq", "routes/faq.tsx"),
    route("contact", "routes/contact.tsx"),
    route("privacy", "routes/privacy.tsx"),
    route("terms", "routes/terms.tsx"),
    route("medical-disclaimer", "routes/medical-disclaimer.tsx"),
    route("blog", "routes/blog._index.tsx"),
    route("blog/:slug", "routes/blog.$slug.tsx"),
  ]),

  // Standalone client-only app-utility screens (no chrome, noindex, not prerendered).
  route("pitch", "routes/pitch.tsx"),
  route("beta", "routes/beta.tsx"),
  route("export-test", "routes/export-test.tsx"),
  route("summary-test", "routes/summary-test.tsx"),
  route("ed-card-test", "routes/ed-card-test.tsx"),
  route("ed-card/:token", "routes/ed-card.$token.tsx"),
  route("export/:token", "routes/export.$token.tsx"),
  route("summary/:token", "routes/summary.$token.tsx"),

  // 404 catch-all.
  route("*", "routes/not-found.tsx"),
] satisfies RouteConfig;
