import { client } from "../client";
import type { Blog, BlogPost } from "../types";

export const blogsResource = {
  getAll: () => client.get<Blog>("/blogs/@all", { cache: "no-store" }),
  getPost: (slug: string) =>
    client.get<BlogPost>(`/blogs/${slug}`, { cache: "no-store" }),
};
