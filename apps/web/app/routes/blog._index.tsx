import BlogIndexPage from "@/pages/Blog/BlogIndexPage";
import { pageMeta } from "../lib/meta";
import { getAllPosts } from "../lib/blog";

export const meta = () =>
  pageMeta({
    title: "Hemo Blog — Sickle Cell Guides & Resources",
    description:
      "Practical, sourced guides on living well with sickle cell disease: hydration, pain tracking, crisis triggers, appointment prep and more.",
    path: "/blog",
  });

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <BlogIndexPage
      posts={posts.map((post) => ({
        slug: post.slug,
        title: post.frontmatter.title,
        description: post.frontmatter.description,
        publishedAt: post.frontmatter.publishedAt,
        author: post.frontmatter.author,
        tags: post.frontmatter.tags,
        coverImage: post.frontmatter.coverImage,
      }))}
    />
  );
}
