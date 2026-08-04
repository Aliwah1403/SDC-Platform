import { Link, useParams, type MetaFunction } from "react-router";

import BlogPostPage from "@/pages/Blog/BlogPostPage";
import { noindexMeta, pageMeta, SITE_URL } from "../lib/meta";
import { getPostBySlug } from "../lib/blog";

export const meta: MetaFunction = ({ params }) => {
  const post = getPostBySlug(params.slug);
  if (!post) {
    return [{ title: "Guide not found — Hemo" }, ...noindexMeta()];
  }

  const fm = post.frontmatter;
  const path = `/blog/${post.slug}`;
  const articleSchema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: fm.title,
    description: fm.description,
    author: { "@type": "Person", name: fm.author },
    datePublished: fm.publishedAt,
    dateModified: fm.updatedAt ?? fm.publishedAt,
    mainEntityOfPage: `${SITE_URL}${path}`,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
  if (fm.reviewer) {
    articleSchema.reviewedBy = {
      "@type": "Person",
      name: fm.reviewer,
      ...(fm.reviewerCredentials ? { jobTitle: fm.reviewerCredentials } : {}),
    };
  }

  // BreadcrumbList structured data, matching the on-page Home › Blog › post
  // breadcrumb. Kept as a second JSON-LD block alongside the Article schema
  // (pageMeta emits one <script type="application/ld+json"> per array item).
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${SITE_URL}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: fm.title,
        item: `${SITE_URL}${path}`,
      },
    ],
  };

  return pageMeta({
    title: fm.title,
    description: fm.description,
    path,
    ogType: "article",
    jsonLd: [articleSchema, breadcrumbSchema],
  });
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString("en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
}

export default function BlogPostRoute() {
  const { slug } = useParams();
  const post = getPostBySlug(slug);

  if (!post) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center sm:px-6">
        <h1 className="text-3xl font-bold">Guide not found</h1>
        <p className="mt-4 text-muted-foreground">
          This guide may have moved.{" "}
          <Link to="/blog" className="text-primary underline">
            Browse all guides
          </Link>
          .
        </p>
      </div>
    );
  }

  const { Component, frontmatter: fm } = post;

  return (
    <BlogPostPage
      breadcrumbTitle={fm.title}
      title={fm.title}
      author={fm.author}
      reviewer={fm.reviewer}
      reviewerCredentials={fm.reviewerCredentials}
      publishedLabel={`Published ${formatDate(fm.publishedAt)}`}
      updatedLabel={
        fm.updatedAt && fm.updatedAt !== fm.publishedAt
          ? `Updated ${formatDate(fm.updatedAt)}`
          : undefined
      }
      shareUrl={`${SITE_URL}/blog/${post.slug}`}
    >
      <Component />
    </BlogPostPage>
  );
}
