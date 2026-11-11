import { blogs } from "@omniplex/core/api";
import type { BlogListPost } from "@omniplex/core/api/types";
import { Avatar } from "@omniplex/ui/Avatar";
import { Badge } from "@omniplex/ui/Badge";
import { ArrowRight, Newspaper } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { EmptyState } from "@/components/ui/EmptyState";
import { isApiUnavailable } from "@/lib/utils/errors";

export const metadata: Metadata = {
  title: "Blog",
  description: "News, updates and guides from the Omniplex team.",
  alternates: { canonical: "/blog" },
};

interface Props {
  searchParams: Promise<{ tag?: string }>;
}

const TOP_TAGS = 6;

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
  const tagCounts = new Map<string, { label: string; count: number }>();
  for (const post of allPosts) {
    for (const t of new Set(post.tags.map((x) => x.trim()).filter(Boolean))) {
      const key = t.toLowerCase();
      const entry = tagCounts.get(key);
      if (entry) entry.count += 1;
      else tagCounts.set(key, { label: t, count: 1 });
    }
  }
  const tags = [...tagCounts.entries()]
    .map(([key, v]) => ({ key, ...v }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const activeTag = tag ? (tagCounts.get(tag.toLowerCase()) ?? null) : null;
  const activeKey = activeTag ? tag?.toLowerCase() : null;
  const topTags = tags.slice(0, TOP_TAGS);
  if (activeKey && !topTags.some((t) => t.key === activeKey)) {
    const current = tags.find((t) => t.key === activeKey);
    if (current) topTags.push(current);
  }
  const moreTags = tags.filter((t) => !topTags.includes(t));
  const posts = activeKey
    ? allPosts.filter((p) => p.tags.some((t) => t.toLowerCase() === activeKey))
    : allPosts;
  const [featured, ...rest] = posts;

  const chip = (active: boolean) =>
    [
      "inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border px-3 text-sm font-medium transition-colors",
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
        <nav aria-label="Blog topics" className="mx-auto mb-8 max-w-4xl">
          <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
            <Link
              href="/blog"
              className={chip(!activeKey)}
              aria-current={!activeKey ? "page" : undefined}
            >
              All posts
            </Link>
            {topTags.map((t) => (
              <Link
                key={t.key}
                href={`/blog?tag=${encodeURIComponent(t.key)}`}
                className={chip(activeKey === t.key)}
                aria-current={activeKey === t.key ? "page" : undefined}
              >
                {t.label}
                <span className="text-xs tabular-nums opacity-60">
                  {t.count}
                </span>
              </Link>
            ))}
          </div>
          {moreTags.length > 0 && (
            <details className="group mt-3 text-center">
              <summary className="inline-flex cursor-pointer list-none items-center gap-1 text-sm font-medium text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50 [&::-webkit-details-marker]:hidden">
                <span className="group-open:hidden">
                  More topics ({moreTags.length})
                </span>
                <span className="hidden group-open:inline">Fewer topics</span>
              </summary>
              <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-2 rounded-2xl border border-zinc-200 bg-white p-4 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                {moreTags.map((t) => (
                  <Link
                    key={t.key}
                    href={`/blog?tag=${encodeURIComponent(t.key)}`}
                    className="text-zinc-600 hover:text-accent dark:text-zinc-300"
                  >
                    {t.label}
                    <span className="ml-1 text-xs tabular-nums text-zinc-400">
                      {t.count}
                    </span>
                  </Link>
                ))}
              </div>
            </details>
          )}
        </nav>
      )}

      {!featured ? (
        <EmptyState icon={Newspaper} title="No posts yet">
          Check back soon.
        </EmptyState>
      ) : (
        <div className="space-y-6">
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
