import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { blogs } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { isApiUnavailable } from "@/lib/utils/errors";
import { formatRelativeTime } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Blog" };

export default async function BlogPage() {
  let data = null;
  try {
    data = await blogs.getAll();
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable />;
  }

  const posts = (data?.posts ?? []).filter((p) => !p.draft);

  return (
    <Container className="py-10">
      <div className="mb-10">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Blog
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          News, updates, and guides from the Omniplex team.
        </p>
      </div>

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-zinc-500 dark:text-zinc-400">
          <p className="text-sm">No posts yet — check back soon.</p>
        </div>
      ) : (
        <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {posts.map((post) => (
            <article key={post.slug} className="group py-8 first:pt-0">
              <Link href={`/blog/${post.slug}`} className="block">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    {post.tags.length > 0 && (
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        {post.tags.map((tag) => (
                          <Badge key={tag}>{tag}</Badge>
                        ))}
                      </div>
                    )}
                    <h2 className="text-lg font-semibold text-zinc-950 transition-colors group-hover:text-accent dark:text-zinc-50">
                      {post.title}
                    </h2>
                    <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2">
                      {post.description}
                    </p>
                    <div className="mt-3 flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-600">
                      {post.author && (
                        <span className="flex items-center gap-1.5">
                          <Avatar
                            src={post.author.avatar}
                            alt={post.author.username}
                            size={16}
                          />
                          {post.author.display_name || post.author.username}
                        </span>
                      )}
                      <span>{formatRelativeTime(post.created_at)}</span>
                    </div>
                  </div>
                  <ArrowRight
                    size={16}
                    className="mt-1 shrink-0 text-zinc-300 transition-colors group-hover:text-accent dark:text-zinc-700"
                  />
                </div>
              </Link>
            </article>
          ))}
        </div>
      )}
    </Container>
  );
}
