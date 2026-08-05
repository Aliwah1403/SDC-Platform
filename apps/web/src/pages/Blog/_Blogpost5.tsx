import { useEffect, useRef, useState } from "react";
import type { ReactNode, SVGProps } from "react";
import { Link } from "react-router";
import { Check, Copy } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// shadcnblocks "blogpost5" block, adapted for Hemo.
//
// The original ships with hardcoded lorem-ipsum sections, a sticky
// "on this page" TOC keyed to hardcoded section1/2/3 ids, share buttons
// pointing at "#", and a demo avatar image. This version keeps the block's
// breadcrumb + editorial hero treatment, but wires the TOC and share buttons
// to real data:
//   - The TOC is built from the actual rendered MDX h2/h3 elements (their
//     `id`s come from rehype-slug, added in vite.config.ts) with a
//     scrollspy IntersectionObserver highlighting the active section.
//   - Share buttons link to real X/LinkedIn/Facebook share intents plus a
//     working "copy link" button, using the post's real absolute URL.

interface TocHeading {
  id: string;
  text: string;
  level: 2 | 3;
}

// lucide-react dropped its trademarked brand-logo icons (Facebook, Linkedin,
// Twitter/X) some releases back, so these share glyphs are recreated as
// minimal inline SVGs — same sizing/color conventions as lucide icons
// (24x24 viewBox, `currentColor`, styled via `className`).
function XIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function FacebookIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12.06C22 6.48 17.52 2 11.94 2S1.88 6.48 1.88 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H7.9v-2.91h2.42V9.79c0-2.39 1.42-3.71 3.6-3.71 1.04 0 2.13.19 2.13.19v2.34h-1.2c-1.18 0-1.55.73-1.55 1.48v1.78h2.64l-.42 2.91h-2.22V22c4.78-.76 8.44-4.92 8.44-9.94z" />
    </svg>
  );
}

function LinkedinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.38-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM7.12 20.45H3.56V9h3.56v11.45z" />
    </svg>
  );
}

// Self-contained share row: derives its own share links from `shareUrl`/
// `title` and owns its own "copied" flag. Rendered twice (mobile row in the
// single-column flow, desktop row inside the sticky sidebar) so each
// placement manages its own copy-state independently — clicking "copy" on
// one instance never desyncs or overwrites the other's UI.
function ShareButtons({
  shareUrl,
  title,
  className,
}: {
  shareUrl: string;
  title: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard permission denied/unavailable — nothing to recover from.
    }
  };

  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedTitle = encodeURIComponent(title);
  const shareLinks = [
    {
      label: "Share on X",
      icon: XIcon,
      href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    },
    {
      label: "Share on LinkedIn",
      icon: LinkedinIcon,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    },
    {
      label: "Share on Facebook",
      icon: FacebookIcon,
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    },
  ] as const;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <p className="font-medium text-muted-foreground">Share this article:</p>
      <ul className="flex flex-wrap items-center gap-2">
        {shareLinks.map(({ label, icon: Icon, href }) => (
          <li key={label}>
            <Button
              variant="secondary"
              size="icon"
              className="group rounded-full"
              render={
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                />
              }
            >
              <Icon className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
            </Button>
          </li>
        ))}
        <li>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="group rounded-full"
            onClick={handleCopyLink}
            aria-label="Copy link"
          >
            {copied ? (
              <Check className="h-4 w-4 text-primary" />
            ) : (
              <Copy className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-primary" />
            )}
          </Button>
        </li>
      </ul>
      {copied && <span className="text-xs text-primary">Link copied</span>}
    </div>
  );
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return `${parts[0]![0]}${parts[parts.length - 1]![0]}`.toUpperCase();
}

export interface Blogpost5Props {
  className?: string;
  /** Current post title, shown as the non-link/active breadcrumb crumb. */
  breadcrumbTitle: string;
  title: string;
  author: string;
  reviewer?: string;
  reviewerCredentials?: string;
  /** Pre-formatted, e.g. "Published 2 August 2026". */
  publishedLabel: string;
  /** Pre-formatted, e.g. "Updated 3 August 2026". Omit if not updated. */
  updatedLabel?: string;
  /** Absolute URL of this post (SITE_URL + /blog/slug) for share/copy-link. */
  shareUrl: string;
  /** Optional hero image URL, from frontmatter `coverImage`. */
  coverImage?: string;
  /** Compiled MDX article body (rendered as `<Component />` by the caller). */
  children: ReactNode;
}

const Blogpost5 = ({
  className,
  breadcrumbTitle,
  title,
  author,
  reviewer,
  reviewerCredentials,
  publishedLabel,
  updatedLabel,
  shareUrl,
  coverImage,
  children,
}: Blogpost5Props) => {
  const articleBodyRef = useRef<HTMLDivElement>(null);
  const [headings, setHeadings] = useState<TocHeading[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  // Build the TOC from the actual rendered MDX headings instead of the
  // block's original hardcoded section ids. Re-runs when the post changes
  // (title is a stable per-post proxy since this route component doesn't
  // remount on slug-to-slug navigation).
  useEffect(() => {
    const container = articleBodyRef.current;
    if (!container) return;

    const nodes = Array.from(
      container.querySelectorAll<HTMLHeadingElement>("h2, h3"),
    );
    const items: TocHeading[] = nodes
      .filter((node) => node.id)
      .map((node) => ({
        id: node.id,
        text: node.textContent ?? "",
        level: node.tagName === "H3" ? 3 : 2,
      }));
    setHeadings(items);
    setActiveId(items[0]?.id ?? null);
  }, [title]);

  // Scrollspy: highlight whichever heading currently sits in the "reading
  // band" near the top of the viewport.
  useEffect(() => {
    if (headings.length === 0) return;

    const elements = headings
      .map((h) => document.getElementById(h.id))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length > 0) {
          setActiveId(visible[0]!.target.id);
        }
      },
      { rootMargin: "-96px 0px -70% 0px", threshold: 0 },
    );

    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [headings]);

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", `#${id}`);
    setActiveId(id);
  };

  return (
    <section className={cn("py-12 sm:py-16", className)}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/" />}>Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link to="/blog" />}>
                Blog
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="max-w-[60vw] truncate sm:max-w-xs">
                {breadcrumbTitle}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <article className="mt-6">
          <h1 className="text-balance text-4xl font-bold sm:text-5xl md:text-6xl">
            {title}
          </h1>

          <div className="mt-6 flex items-center gap-3 text-sm md:text-base">
            <Avatar>
              <AvatarFallback className="bg-primary text-primary-foreground">
                {initials(author)}
              </AvatarFallback>
            </Avatar>
            <span>
              <span className="font-medium">{author}</span>
              {reviewer && (
                <span className="text-muted-foreground">
                  {" "}
                  · Medically reviewed by {reviewer}
                  {reviewerCredentials ? `, ${reviewerCredentials}` : ""}
                </span>
              )}
            </span>
          </div>

          <div className="mt-1 text-sm text-muted-foreground">
            <span>{publishedLabel}</span>
            {updatedLabel && <span> · {updatedLabel}</span>}
          </div>

          {coverImage && (
            <div className="mt-8 aspect-[21/9] w-full overflow-hidden rounded-2xl">
              <img
                src={coverImage}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          )}

          <div className="relative mt-10 grid gap-10 lg:grid-cols-12 lg:gap-6">
            <div className="lg:col-span-8">
              <div
                ref={articleBodyRef}
                className="text-[15px] leading-relaxed text-foreground/90 [&_a]:text-primary [&_a]:underline [&_h2]:mt-10 [&_h2]:text-2xl [&_h2]:font-bold [&_h3]:mt-8 [&_h3]:text-xl [&_h3]:font-semibold [&_li]:mt-1 [&_ol]:mt-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:mt-4 [&_ul]:mt-4 [&_ul]:list-disc [&_ul]:pl-6"
              >
                {children}
              </div>

              {/* Mobile share row: the desktop sidebar (aside below) is
                  hidden below `lg`, but the user wants share buttons visible
                  on mobile too — so this row renders here, after the article
                  body, right before <PageWaitlistCTA /> in the parent route. */}
              <ShareButtons
                shareUrl={shareUrl}
                title={title}
                className="mt-10 lg:hidden"
              />
            </div>

            <aside className="hidden h-fit flex-col gap-8 text-xs lg:sticky lg:top-8 lg:col-span-3 lg:col-start-10 lg:flex">
              {headings.length > 1 && (
                <div>
                  <span className="text-xs font-medium text-muted-foreground">
                    ON THIS PAGE
                  </span>
                  <nav className="mt-3">
                    <ul className="space-y-1">
                      {headings.map((heading) => (
                        <li key={heading.id}>
                          <button
                            type="button"
                            onClick={() => handleScrollTo(heading.id)}
                            className={cn(
                              "block border-l-2 py-1 pl-3 text-left transition-colors duration-200",
                              heading.level === 3 && "pl-6",
                              activeId === heading.id
                                ? "border-primary text-primary"
                                : "border-transparent text-muted-foreground hover:text-primary",
                            )}
                          >
                            {heading.text}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </nav>
                </div>
              )}

              <ShareButtons shareUrl={shareUrl} title={title} />
            </aside>
          </div>
        </article>
      </div>
    </section>
  );
};

export { Blogpost5 };
