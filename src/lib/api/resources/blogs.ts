import { client } from "../client";
import type { Blog, BlogPost, SEO } from "../types";

export const blogsResource = {
  getAll: () => client.get<Blog>("/blogs/@all", { cache: "no-store" }),
  getPost: (slug: string) =>
    client.get<BlogPost>(`/blogs/${slug}`, { cache: "no-store" }),

  /** Minimal metadata for generateMetadata() — avoids a full getPost() fetch. */
  getSeo: (slug: string) =>
    client.get<SEO>(`/blogs/${slug}/seo`, { cache: "no-store" }),
};
