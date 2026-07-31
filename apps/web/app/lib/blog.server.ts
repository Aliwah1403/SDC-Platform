// Node-only blog reader. Used at build time by react-router.config.ts (prerender
// list) and by the sitemap generation script. Do NOT import this from a route
// module that runs in the browser — it uses `fs`. Runtime blog rendering loads
// the compiled MDX via import.meta.glob instead (see app/lib/blog.ts).
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import matter from "gray-matter";

import type { BlogEntry, BlogFrontmatter } from "./blog-types";

const BLOG_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "content", "blog");

/** All published (non-draft) blog posts, newest first. Files prefixed with `_` are ignored. */
export function getPublishedBlogEntries(): BlogEntry[] {
  let files: string[];
  try {
    files = readdirSync(BLOG_DIR);
  } catch {
    return [];
  }

  return files
    .filter((f) => f.endsWith(".mdx") && !f.startsWith("_"))
    .map((file) => {
      const slug = file.replace(/\.mdx$/, "");
      const raw = readFileSync(join(BLOG_DIR, file), "utf8");
      const { data } = matter(raw);
      return { slug, ...(data as BlogFrontmatter) };
    })
    .filter((entry) => !entry.draft)
    .sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

/** Prerender paths for the blog: the index plus every published post. */
export function getBlogPrerenderPaths(): string[] {
  return ["/blog", ...getPublishedBlogEntries().map((e) => `/blog/${e.slug}`)];
}
