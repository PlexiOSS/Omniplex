import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { Markdown } from "@/components/markdown/Markdown";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { blogs } from "@/lib/api";
import { isApiUnavailable } from "@/lib/utils/errors";
import { formatRelativeTime } from "@/lib/utils/format";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seo = await blogs.getSeo(slug).catch(() => null);
  if (!seo) return {};
  return {
    title: seo.name,
    description: seo.short,
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  let post = null;
  try {
    post = await blogs.getPost(slug);
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable inline />;
    notFound();
  }
  if (!post) notFound();

  return (
    <Container className="py-10">
      <Link
        href="/blog"
        className="mb-8 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        Blog
      </Link>

      <article className="mx-auto max-w-2xl">
        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
          </div>
        )}

        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
          {post.title}
        </h1>
        <p className="mt-3 text-base text-zinc-500 dark:text-zinc-400">
          {post.description}
        </p>

        {/* Author + date */}
        <div className="mt-5 flex items-center gap-3 border-b border-zinc-200 pb-6 dark:border-zinc-800">
          {post.author && (
            <Avatar
              src={post.author.avatar}
              alt={post.author.username}
              size={36}
            />
          )}
          <div>
            {post.author && (
              <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                {post.author.display_name || post.author.username}
              </p>
            )}
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              {formatRelativeTime(post.created_at)}
            </p>
          </div>
        </div>

        {/* Content */}
        {post.content ? (
          <Markdown content={post.content} className="mt-8" />
        ) : (
          <p className="mt-8 text-sm text-zinc-500 dark:text-zinc-400">
            {post.description}
          </p>
        )}
      </article>
    </Container>
  );
}
