// Generates dist/client/sitemap.xml from the same sources the prerender uses:
// the static marketing routes plus every published blog post. Runs as a post-build
// step (see the "build" script in package.json). Kept as dependency-light pure JS
// (no .ts imports) so it runs on any Node version, including Vercel's build image.
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import matter from "gray-matter";

const SITE_URL = "https://www.hemo-scd.com";
const here = dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = join(here, "..", "app", "content", "blog");
const OUT = join(here, "..", "dist", "client", "sitemap.xml");

// Keep in sync with app/lib/site-routes.ts (STATIC_ROUTES). These two lists must
// match; they are duplicated only so this script stays free of .ts imports.
const STATIC_ROUTES = [
  "/",
  "/features",
  "/sickle-cell-tracking-app",
  // Disabled for now — re-enable alongside app/routes.ts and app/lib/site-routes.ts.
  // "/pricing",
  // "/faq",
  "/why-hemo",
  "/contact",
  "/privacy",
  "/terms",
  "/medical-disclaimer",
  "/blog",
];

function getPublishedPosts() {
  let files;
  try {
    files = readdirSync(BLOG_DIR);
  } catch {
    return [];
  }
  return files
    .filter((f) => f.endsWith(".mdx") && !f.startsWith("_"))
    .map((file) => {
      const { data } = matter(readFileSync(join(BLOG_DIR, file), "utf8"));
      return { slug: file.replace(/\.mdx$/, ""), ...data };
    })
    .filter((post) => !post.draft);
}

function urlEntry(path, lastmod) {
  const loc = `${SITE_URL}${path === "/" ? "" : path}`;
  const lastmodTag = lastmod ? `\n    <lastmod>${lastmod}</lastmod>` : "";
  return `  <url>\n    <loc>${loc}</loc>${lastmodTag}\n  </url>`;
}

const entries = [
  ...STATIC_ROUTES.map((path) => urlEntry(path)),
  ...getPublishedPosts().map((post) =>
    urlEntry(`/blog/${post.slug}`, post.updatedAt ?? post.publishedAt),
  ),
];

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.join("\n")}
</urlset>
`;

writeFileSync(OUT, xml, "utf8");
console.log(`Wrote ${OUT} (${entries.length} URLs)`);
