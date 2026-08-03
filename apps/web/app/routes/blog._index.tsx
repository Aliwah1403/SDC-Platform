import PageWaitlistCTA from "@/components/PageWaitlistCTA";
import { Blog14 } from "@/components/blog14";
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

  const blogPosts = posts.map((post) => ({
    slug: post.slug,
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    publishedAt: post.frontmatter.publishedAt,
    author: post.frontmatter.author,
    tags: post.frontmatter.tags,
  }));

  return (
    <div>
      <Blog14
        heading="Sickle cell guides & resources"
        description="Practical, sourced guidance for living well with sickle cell disease."
        posts={blogPosts}
        formatDate={formatDate}
        emptyMessage="New guides are on the way — join the waitlist to hear when they land."
      />

      <PageWaitlistCTA
        title="Get new guides as they publish"
        description="Join the waitlist for early access to Hemo and a heads-up when new sickle cell guides go live."
      />
    </div>
  );
}
