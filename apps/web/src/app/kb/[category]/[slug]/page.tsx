import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  Clock,
  LifeBuoy,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KbSidebar } from "@/components/kb/KbSidebar";
import { Container } from "@/components/layout/Container";
import { Markdown } from "@/components/markdown/Markdown";
import { TableOfContents } from "@/components/markdown/TableOfContents";
import { getKbArticle, getKbCategories } from "@/lib/kb/content";
import { markdownOutline, readingMinutes } from "@/lib/markdown/outline";

interface Props {
  params: Promise<{ category: string; slug: string }>;
}

export function generateStaticParams() {
  return getKbCategories().flatMap((category) =>
    category.articles.map((article) => ({
      category: category.slug,
      slug: article.slug,
    })),
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category, slug } = await params;
  const found = getKbArticle(category, slug);
  if (!found) return {};
  return {
    title: found.article.title,
    description: found.article.description,
    alternates: {
      canonical: `/kb/${found.category.slug}/${found.article.slug}`,
    },
  };
}

export default async function KbArticlePage({ params }: Props) {
  const { category: categorySlug, slug } = await params;
  const categories = getKbCategories();
  const found = getKbArticle(categorySlug, slug);
  if (!found) notFound();
  const { category, article } = found;

  const outline = markdownOutline(article.content);
  const index = category.articles.findIndex((a) => a.slug === article.slug);
  const prev = index > 0 ? category.articles[index - 1] : null;
  const next =
    index >= 0 && index < category.articles.length - 1
      ? category.articles[index + 1]
      : null;

  return (
    <Container className="py-10">
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)] xl:grid-cols-[240px_minmax(0,1fr)_200px]">
        <aside className="hidden lg:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto pb-6">
            <KbSidebar
              categories={categories}
              activeCategory={category.slug}
              activeSlug={article.slug}
            />
          </div>
        </aside>

        <article className="min-w-0 max-w-3xl">
          <div className="flex flex-wrap items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            <Link
              href="/kb"
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
            >
              Knowledge Base
            </Link>
            <ChevronRight size={13} />
            <Link
              href={`/kb/${category.slug}`}
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
            >
              {category.title}
            </Link>
          </div>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {article.title}
          </h1>
          {article.description && (
            <p className="mt-2 text-lg text-zinc-500 dark:text-zinc-400">
              {article.description}
            </p>
          )}
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
            <Clock size={12} />
            {readingMinutes(article.content)} min read
          </p>

          <div className="mt-8 border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <Markdown
              content={article.content}
              headingIds
              className="text-[15px] text-zinc-700 dark:text-zinc-300"
            />
          </div>

          {(prev || next) && (
            <nav className="mt-12 grid gap-3 sm:grid-cols-2">
              {prev ? (
                <Link
                  href={`/kb/${category.slug}/${prev.slug}`}
                  className="group rounded-2xl border border-zinc-200 bg-white p-4 transition-colors hover:border-accent/40 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="flex items-center gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                    <ArrowLeft size={12} />
                    Previous
                  </span>
                  <span className="mt-1 block font-medium text-zinc-950 transition-colors group-hover:text-accent dark:text-zinc-50">
                    {prev.title}
                  </span>
                </Link>
              ) : (
                <span className="hidden sm:block" />
              )}
              {next && (
                <Link
                  href={`/kb/${category.slug}/${next.slug}`}
                  className="group rounded-2xl border border-zinc-200 bg-white p-4 text-right transition-colors hover:border-accent/40 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="flex items-center justify-end gap-1 text-xs text-zinc-500 dark:text-zinc-400">
                    Next
                    <ArrowRight size={12} />
                  </span>
                  <span className="mt-1 block font-medium text-zinc-950 transition-colors group-hover:text-accent dark:text-zinc-50">
                    {next.title}
                  </span>
                </Link>
              )}
            </nav>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-5 py-4 text-sm dark:border-zinc-800 dark:bg-zinc-900/60">
            <LifeBuoy size={16} className="shrink-0 text-accent" />
            <span className="min-w-0 flex-1 text-zinc-600 dark:text-zinc-300">
              Didn&apos;t answer your question?
            </span>
            <Link
              href="/tickets/new"
              className="font-medium text-accent hover:underline"
            >
              Open a ticket
            </Link>
          </div>
        </article>

        <aside className="hidden xl:block">
          <div className="sticky top-24">
            <TableOfContents headings={outline} />
          </div>
        </aside>
      </div>
    </Container>
  );
}
