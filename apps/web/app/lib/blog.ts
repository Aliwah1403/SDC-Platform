// Runtime blog registry. Loads compiled MDX (component + frontmatter) via Vite's
// import.meta.glob so blog routes can render without touching the filesystem.
// The build-time prerender list comes from app/lib/blog.server.ts instead.
import type { ComponentType } from "react";

import type { BlogFrontmatter } from "./blog-types";

interface MdxModule {
  frontmatter: BlogFrontmatter;
  default: ComponentType;
}

export interface BlogPost {
  slug: string;
  frontmatter: BlogFrontmatter;
  Component: ComponentType;
}

const modules = import.meta.glob<MdxModule>("../content/blog/*.mdx", {
  eager: true,
});

const posts: BlogPost[] = Object.entries(modules)
  .map(([path, mod]) => {
    const slug = path.split("/").pop()!.replace(/\.mdx$/, "");
    return { slug, frontmatter: mod.frontmatter, Component: mod.default };
  })
  // Ignore `_`-prefixed files and any post marked draft.
  .filter((p) => !p.slug.startsWith("_") && !p.frontmatter?.draft)
  .sort((a, b) =>
    a.frontmatter.publishedAt < b.frontmatter.publishedAt ? 1 : -1,
  );

export function getAllPosts(): BlogPost[] {
  return posts;
}

export function getPostBySlug(slug: string | undefined): BlogPost | undefined {
  return posts.find((p) => p.slug === slug);
}
