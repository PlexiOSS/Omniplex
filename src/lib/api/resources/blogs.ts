import { client } from "../client";
import type { Blog, BlogPost } from "../types";

export const blogsResource = {
  getAll: () => client.get<Blog>("/blogs/@all", { next: { revalidate: 300 } }),
  getPost: (slug: string) =>
    client.get<BlogPost>(`/blogs/${slug}`, { next: { revalidate: 3600 } }),
};
