// Canonical list of prerendered marketing routes. Shared by the prerender config
// (react-router.config.ts) and the sitemap generator (scripts/generate-sitemap.mjs)
// so the two never drift. Blog routes are appended separately from the content dir.
export const STATIC_ROUTES = [
  "/",
  "/features",
  "/sickle-cell-tracking-app",
  // Disabled for now — re-enable alongside app/routes.ts and the mirror list
  // in scripts/generate-sitemap.mjs.
  // "/pricing",
  // "/faq",
  "/why-hemo",
  "/contact",
  "/privacy",
  "/terms",
  "/medical-disclaimer",
];
