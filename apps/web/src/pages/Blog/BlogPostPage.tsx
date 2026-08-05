import type { ReactNode } from "react";

import PageWaitlistCTA from "@/components/PageWaitlistCTA";
import { Blogpost5 } from "./_Blogpost5";

interface BlogPostPageProps {
  breadcrumbTitle: string;
  title: string;
  author: string;
  reviewer?: string;
  reviewerCredentials?: string;
  publishedLabel: string;
  updatedLabel?: string;
  shareUrl: string;
  coverImage?: string;
  children: ReactNode;
}

export default function BlogPostPage({
  children,
  ...blogpost5Props
}: BlogPostPageProps) {
  return (
    <div>
      <Blogpost5 {...blogpost5Props}>{children}</Blogpost5>

      <PageWaitlistCTA
        title="Track this with Hemo"
        description="Join the waitlist for early access to Hemo, the sickle cell companion app that turns guidance like this into daily tracking."
      />
    </div>
  );
}
