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
import type { BlogListPost } from "@/lib/api/types";
import { isApiUnavailable } from "@/lib/utils/errors";

export const metadata: Metadata = {
  title: "Blog",
  description: "News, updates and guides from the Omniplex team.",
  alternates: { canonical: "/blog" },
};

interface Props {
  searchParams: Promise<{ tag?: string }>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function Byline({ post }: { post: BlogListPost }) {
  return (
    <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
      {post.author && (
        <>
          <Avatar
            src={post.author.avatar}
            alt={post.author.username}
            size={20}
          />
          <span className="font-medium text-zinc-700 dark:text-zinc-300">
            {post.author.display_name || post.author.username}
          </span>
          <span aria-hidden>·</span>
        </>
      )}
      <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
    </div>
  );
}

export default async function BlogPage({ searchParams }: Props) {
  const { tag } = await searchParams;
  let data = null;
  try {
    data = await blogs.getAll();
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable />;
  }

  const allPosts = (data?.posts ?? [])
    .filter((p) => !p.draft)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );
  const tags = [...new Set(allPosts.flatMap((p) => p.tags))].sort((a, b) =>
    a.localeCompare(b),
  );
  const activeTag =
    tag && tags.some((t) => t.toLowerCase() === tag.toLowerCase()) ? tag : null;
  const posts = activeTag
    ? allPosts.filter((p) =>
        p.tags.some((t) => t.toLowerCase() === activeTag.toLowerCase()),
      )
    : allPosts;
  const [featured, ...rest] = posts;

  const chip = (active: boolean) =>
    [
      "inline-flex h-8 items-center rounded-lg border px-3 text-sm font-medium transition-colors",
      active
        ? "border-accent/40 bg-accent/10 text-accent"
        : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-50",
    ].join(" ");

  return (
    <Container className="py-10">
      <PageHeader
        centered
        icon={Newspaper}
        title="Blog"
        description="News, updates and guides from the Omniplex team."
      />

      {tags.length > 1 && (
        <div className="mx-auto mb-8 flex max-w-4xl flex-wrap justify-center gap-2">
          <Link href="/blog" className={chip(!activeTag)}>
            All posts
          </Link>
          {tags.map((t) => (
            <Link
              key={t}
              href={`/blog?tag=${encodeURIComponent(t)}`}
              className={chip(activeTag?.toLowerCase() === t.toLowerCase())}
            >
              {t}
            </Link>
          ))}
        </div>
      )}

      {!featured ? (
        <EmptyState icon={Newspaper} title="No posts yet">
          Check back soon.
        </EmptyState>
      ) : (
        <div className="mx-auto max-w-5xl space-y-6">
          <Link
            href={`/blog/${featured.slug}`}
            className="group relative block overflow-hidden rounded-3xl border border-accent/20 bg-linear-to-br from-accent/15 via-white to-white p-6 transition-colors hover:border-accent/40 sm:p-10 dark:via-zinc-900 dark:to-zinc-900"
          >
            <span className="text-xs font-semibold tracking-wide text-accent uppercase">
              Latest post
            </span>
            <h2 className="mt-3 max-w-3xl text-2xl font-semibold tracking-tight text-zinc-950 transition-colors group-hover:text-accent sm:text-3xl dark:text-zinc-50">
              {featured.title}
            </h2>
            <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-300">
              {featured.description}
            </p>
            {featured.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {featured.tags.map((t) => (
                  <Badge key={t}>{t}</Badge>
                ))}
              </div>
            )}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <Byline post={featured} />
              <span className="inline-flex items-center gap-1 text-sm font-medium text-accent">
                Read post
                <ArrowRight
                  size={14}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              </span>
            </div>
          </Link>

          {rest.length > 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {rest.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group flex min-w-0 flex-col rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-accent/40 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  {post.tags.length > 0 && (
                    <div className="mb-3 flex flex-wrap gap-1.5">
                      {post.tags.slice(0, 3).map((t) => (
                        <Badge key={t}>{t}</Badge>
                      ))}
                      {post.tags.length > 3 && (
                        <Badge>+{post.tags.length - 3}</Badge>
                      )}
                    </div>
                  )}
                  <h2 className="font-semibold text-zinc-950 transition-colors group-hover:text-accent dark:text-zinc-50">
                    {post.title}
                  </h2>
                  <p className="mt-1.5 line-clamp-3 text-sm text-zinc-500 dark:text-zinc-400">
                    {post.description}
                  </p>
                  <div className="mt-auto pt-4">
                    <Byline post={post} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </Container>
  );
}
