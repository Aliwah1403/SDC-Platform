import { Link } from "react-router";

import PageWaitlistCTA from "@/components/PageWaitlistCTA";
import { Badge } from "@/components/ui/badge";
import { pageMeta } from "../lib/meta";
import { getAllPosts } from "../lib/blog";

export const meta = () =>
  pageMeta({
    title: "Hemo Blog — Sickle Cell Guides & Resources",
    description:
      "Practical, sourced guides on living well with sickle cell disease: hydration, pain tracking, crisis triggers, appointment prep and more.",
    path: "/blog",
  });

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

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6 lg:px-8">
      <Badge variant="secondary">Blog</Badge>
      <h1 className="mt-4 max-w-3xl text-balance text-4xl font-bold sm:text-5xl">
        Sickle cell guides &amp; resources
      </h1>
      <p className="mt-4 max-w-3xl text-muted-foreground">
        Practical, sourced guidance for living well with sickle cell disease.
      </p>

      {posts.length === 0 ? (
        <p className="mt-12 text-muted-foreground">
          New guides are on the way — join the waitlist to hear when they land.
        </p>
      ) : (
        <section className="mt-10 grid gap-4 sm:grid-cols-2">
          {posts.map((post) => (
            <Link
              key={post.slug}
              to={`/blog/${post.slug}`}
              className="group rounded-2xl border bg-card p-6 transition-colors hover:border-primary/40"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {formatDate(post.frontmatter.publishedAt)}
              </p>
              <h2 className="mt-2 text-lg font-semibold group-hover:text-primary">
                {post.frontmatter.title}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {post.frontmatter.description}
              </p>
            </Link>
          ))}
        </section>
      )}

      <PageWaitlistCTA
        title="Get new guides as they publish"
        description="Join the waitlist for early access to Hemo and a heads-up when new sickle cell guides go live."
      />
    </div>
  );
}
