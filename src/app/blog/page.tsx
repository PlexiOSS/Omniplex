import { ArrowRight, Newspaper } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { blogs } from "@/lib/api";
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
      <PageHeader
        icon={Newspaper}
        title="Blog"
        description="News, updates and guides from the Omniplex team."
      />

      {posts.length === 0 ? (
        <EmptyState icon={Newspaper} title="No posts yet">
          Check back soon.
        </EmptyState>
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
