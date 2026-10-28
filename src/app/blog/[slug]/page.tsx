import { ArrowLeft, ArrowRight, Clock } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { Markdown } from "@/components/markdown/Markdown";
import { TableOfContents } from "@/components/markdown/TableOfContents";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { blogs } from "@/lib/api";
import { markdownOutline, readingMinutes } from "@/lib/markdown/outline";
import { isApiUnavailable, isNotFoundError } from "@/lib/utils/errors";

interface Props {
  params: Promise<{ slug: string }>;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seo = await blogs.getSeo(slug).catch(() => null);
  if (!seo) return {};
  return {
    title: seo.name,
    description: seo.short,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: { type: "article" },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  let post = null;
  try {
    post = await blogs.getPost(slug);
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable inline />;
    if (isNotFoundError(err)) notFound();
    throw err;
  }
  if (!post) notFound();

  const all = await blogs.getAll().catch(() => null);
  const more = (all?.posts ?? [])
    .filter((p) => !p.draft && p.slug !== post.slug)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )
    .slice(0, 3);
  const outline = post.content ? markdownOutline(post.content) : [];
  const minutes = post.content ? readingMinutes(post.content) : 1;
  const authorName = post.author
    ? post.author.display_name || post.author.username
    : null;

  return (
    <Container className="py-10">
      <Link
        href="/blog"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        Blog
      </Link>

      <header className="mx-auto max-w-3xl text-center">
        {post.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap justify-center gap-1.5">
            {post.tags.map((tag) => (
              <Link key={tag} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                <Badge>{tag}</Badge>
              </Link>
            ))}
          </div>
        )}
        <h1 className="text-3xl font-semibold tracking-tight text-balance text-zinc-950 sm:text-4xl dark:text-zinc-50">
          {post.title}
        </h1>
        <p className="mt-4 text-lg text-pretty text-zinc-500 dark:text-zinc-400">
          {post.description}
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 text-sm text-zinc-500 dark:text-zinc-400">
          {post.author && (
            <Link
              href={`/user/${post.author.id}`}
              className="flex items-center gap-2 font-medium text-zinc-800 transition-colors hover:text-accent dark:text-zinc-200"
            >
              <Avatar
                src={post.author.avatar}
                alt={post.author.username}
                size={28}
              />
              {authorName}
            </Link>
          )}
          <span aria-hidden>·</span>
          <time dateTime={post.created_at}>{formatDate(post.created_at)}</time>
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <Clock size={13} />
            {minutes} min read
          </span>
        </div>
      </header>

      <div className="mx-auto mt-10 grid max-w-5xl gap-10 border-t border-zinc-200 pt-10 lg:grid-cols-[minmax(0,1fr)_200px] dark:border-zinc-800">
        <article className="min-w-0">
          {post.content ? (
            <Markdown
              content={post.content}
              headingIds
              className="mx-auto max-w-2xl text-[15px] leading-7"
            />
          ) : (
            <p className="text-zinc-500 dark:text-zinc-400">
              {post.description}
            </p>
          )}
        </article>
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <TableOfContents headings={outline} />
          </div>
        </aside>
      </div>

      {more.length > 0 && (
        <section className="mx-auto mt-16 max-w-5xl border-t border-zinc-200 pt-10 dark:border-zinc-800">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              More from the blog
            </h2>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
            >
              All posts
              <ArrowRight size={13} />
            </Link>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {more.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="group flex min-w-0 flex-col rounded-2xl border border-zinc-200 bg-white p-5 transition-colors hover:border-accent/40 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <h3 className="font-semibold text-zinc-950 transition-colors group-hover:text-accent dark:text-zinc-50">
                  {p.title}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {p.description}
                </p>
                <time
                  dateTime={p.created_at}
                  className="mt-auto pt-3 text-xs text-zinc-400 dark:text-zinc-500"
                >
                  {formatDate(p.created_at)}
                </time>
              </Link>
            ))}
          </div>
        </section>
      )}
    </Container>
  );
}
