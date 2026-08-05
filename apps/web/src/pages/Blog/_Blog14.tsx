import { Link } from "react-router";
import {
  Activity,
  BookOpen,
  Droplet,
  Smartphone,
  Stethoscope,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// shadcnblocks "blog14" block, adapted for Hemo: the original ships with a
// hardcoded `posts` array and demo <img> placeholders. We render real MDX
// posts (passed in as `posts`). Frontmatter now carries an optional
// `coverImage` URL — when set, it renders as the thumbnail; otherwise the
// card falls back to the brand-gradient + icon treatment.

export interface Blog14Post {
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  author?: string;
  tags?: string[];
  coverImage?: string;
}

interface Blog14Props {
  className?: string;
  eyebrow?: string;
  heading?: string;
  description?: string;
  posts: Blog14Post[];
  formatDate: (iso: string) => string;
  emptyMessage?: string;
}

// Pick a representative icon from a post's first tag so cards feel
// purposeful rather than decorative. Falls back to a generic book icon.
function iconForTags(tags?: string[]): LucideIcon {
  const haystack = (tags ?? []).join(" ").toLowerCase();
  if (/hydrat/.test(haystack)) return Droplet;
  if (/pain|crisis|symptom/.test(haystack)) return Activity;
  if (/appointment|haematology|hematology/.test(haystack)) return Stethoscope;
  if (/app|tool/.test(haystack)) return Smartphone;
  return BookOpen;
}

function PostThumbnail({
  tags,
  coverImage,
  title,
  size = "default",
}: {
  tags?: string[];
  coverImage?: string;
  title?: string;
  size?: "default" | "lg";
}) {
  if (coverImage) {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-lg">
        <img
          src={coverImage}
          alt={title ?? ""}
          loading="lazy"
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  const Icon = iconForTags(tags);
  return (
    <div
      className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-lg"
      style={{
        backgroundImage:
          "linear-gradient(135deg, #D09F9A 0%, #A9334D 55%, #781D11 100%)",
      }}
    >
      <div
        className="absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            "repeating-linear-gradient(45deg, rgba(255,255,255,0.6) 0, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 14px)",
        }}
      />
      <Icon
        className={cn(
          "relative",
          size === "lg" ? "size-16 sm:size-20" : "size-10",
        )}
        style={{ color: "#F8E9E7" }}
        strokeWidth={1.5}
      />
    </div>
  );
}

const Blog14 = ({
  className,
  eyebrow = "Blog",
  heading = "Sickle cell guides & resources",
  description = "Practical, sourced guidance for living well with sickle cell disease.",
  posts,
  formatDate,
  emptyMessage = "New guides are on the way — join the waitlist to hear when they land.",
}: Blog14Props) => {
  const [featured, ...rest] = posts;

  return (
    <section className={cn("py-16 sm:py-24", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div>
          <Badge variant="secondary">{eyebrow}</Badge>
          <h1 className="mt-4 max-w-3xl text-balance text-4xl font-bold sm:text-5xl">
            {heading}
          </h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">{description}</p>
        </div>

        {posts.length === 0 ? (
          <p className="mt-12 text-muted-foreground">{emptyMessage}</p>
        ) : (
          <div className="mt-12">
            <Link
              to={`/blog/${featured.slug}`}
              className="group grid grid-cols-1 items-center gap-8 rounded-2xl  bg-card p-4 transition-colors hover:border-primary/40 sm:p-6 md:grid-cols-2 lg:gap-12"
            >
              <PostThumbnail
                tags={featured.tags}
                coverImage={featured.coverImage}
                title={featured.title}
                size="lg"
              />
              <div className="flex flex-col items-start gap-3">
                {featured.tags?.[0] && (
                  <Badge variant="secondary" className="capitalize">
                    {featured.tags[0]}
                  </Badge>
                )}
                <h2 className="text-2xl font-semibold text-balance group-hover:text-primary md:max-w-lg lg:text-3xl">
                  {featured.title}
                </h2>
                <p className="text-muted-foreground md:max-w-lg">
                  {featured.description}
                </p>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {formatDate(featured.publishedAt)}
                  {featured.author ? ` · ${featured.author}` : ""}
                </p>
              </div>
            </Link>

            {rest.length > 0 && (
              <>
                <p className="mt-16 text-2xl font-medium md:text-3xl">
                  More guides
                </p>
                <div className="mt-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post) => (
                    <Link
                      key={post.slug}
                      to={`/blog/${post.slug}`}
                      className="group flex flex-col items-start gap-3 rounded-2xl  bg-card p-4 transition-colors hover:border-primary/40"
                    >
                      <PostThumbnail
                        tags={post.tags}
                        coverImage={post.coverImage}
                        title={post.title}
                      />
                      {post.tags?.[0] && (
                        <Badge variant="secondary" className="capitalize">
                          {post.tags[0]}
                        </Badge>
                      )}
                      <h3 className="text-lg font-semibold text-balance group-hover:text-primary">
                        {post.title}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {post.description}
                      </p>
                      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        {formatDate(post.publishedAt)}
                      </p>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
};

export { Blog14 };
