import { Link, useParams, type MetaFunction } from "react-router";

import PageWaitlistCTA from "@/components/PageWaitlistCTA";
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

  return pageMeta({
    title: fm.title,
    description: fm.description,
    path,
    ogType: "article",
    jsonLd: articleSchema,
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
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <Link to="/blog" className="text-sm text-muted-foreground hover:text-primary">
        ← All guides
      </Link>

      <article className="mt-6">
        <h1 className="text-balance text-4xl font-bold sm:text-5xl">{fm.title}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>By {fm.author}</span>
          {fm.reviewer && (
            <span>
              · Medically reviewed by {fm.reviewer}
              {fm.reviewerCredentials ? `, ${fm.reviewerCredentials}` : ""}
            </span>
          )}
        </div>
        <div className="mt-1 text-sm text-muted-foreground">
          <span>Published {formatDate(fm.publishedAt)}</span>
          {fm.updatedAt && fm.updatedAt !== fm.publishedAt && (
            <span> · Updated {formatDate(fm.updatedAt)}</span>
          )}
        </div>

        <div
          className="mt-8 text-[15px] leading-relaxed text-foreground/90 [&_a]:text-primary [&_a]:underline [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_li]:mt-1 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6"
        >
          <Component />
        </div>
      </article>

      <PageWaitlistCTA
        title="Track this with Hemo"
        description="Join the waitlist for early access to Hemo, the sickle cell companion app that turns guidance like this into daily tracking."
      />
    </div>
  );
}
