// Type declarations for MDX modules imported as route/content modules.
declare module "*.mdx" {
  import type { ComponentType } from "react";

  export const frontmatter: {
    title: string;
    description: string;
    publishedAt: string;
    updatedAt?: string;
    author: string;
    reviewer?: string;
    reviewerCredentials?: string;
    tags?: string[];
    draft?: boolean;
  };

  const MDXComponent: ComponentType<{ components?: Record<string, unknown> }>;
  export default MDXComponent;
}
