import type { MetaDescriptor } from "react-router";

export const SITE_URL = "https://www.hemo-scd.com";
const OG_IMAGE = `${SITE_URL}/og-image.png`;

interface PageMetaInput {
  /** <= 60 chars. Must be unique across routes. */
  title: string;
  /** <= 155 chars. */
  description: string;
  /** Route path beginning with "/", e.g. "/faq". */
  path: string;
  ogType?: "website" | "article";
  /** Optional JSON-LD object(s) appended as <script type="application/ld+json">. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

/** Builds a full, self-contained meta descriptor set for a prerendered page. */
export function pageMeta({
  title,
  description,
  path,
  ogType = "website",
  jsonLd,
}: PageMetaInput): MetaDescriptor[] {
  const url = `${SITE_URL}${path === "/" ? "" : path}`;
  const descriptors: MetaDescriptor[] = [
    { title },
    { name: "description", content: description },
    { tagName: "link", rel: "canonical", href: url },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: ogType },
    { property: "og:url", content: url },
    { property: "og:image", content: OG_IMAGE },
    { property: "og:site_name", content: "Hemo" },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: OG_IMAGE },
  ];

  if (jsonLd) {
    for (const block of Array.isArray(jsonLd) ? jsonLd : [jsonLd]) {
      descriptors.push({ "script:ld+json": block });
    }
  }

  return descriptors;
}

/** Meta for client-only utility routes that must not be indexed. */
export const noindexMeta = (): MetaDescriptor[] => [
  { name: "robots", content: "noindex, nofollow" },
];
