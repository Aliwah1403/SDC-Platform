// Shared blog types with no runtime/Node dependencies, so both the browser-side
// registry (blog.ts) and the Node-side reader (blog.server.ts) can import them.
export interface BlogFrontmatter {
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  reviewer?: string;
  reviewerCredentials?: string;
  tags?: string[];
  draft?: boolean;
  coverImage?: string;
}

export interface BlogEntry extends BlogFrontmatter {
  slug: string;
}
