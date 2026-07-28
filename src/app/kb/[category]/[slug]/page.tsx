import { ArrowLeft, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KbSidebar } from "@/components/kb/KbSidebar";
import { Container } from "@/components/layout/Container";
import { Markdown } from "@/components/markdown/Markdown";
import { getKbArticle, getKbCategories } from "@/lib/kb/content";

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
  };
}

export default async function KbArticlePage({ params }: Props) {
  const { category: categorySlug, slug } = await params;
  const categories = getKbCategories();
  const found = getKbArticle(categorySlug, slug);
  if (!found) notFound();
  const { category, article } = found;

  return (
    <Container className="py-10">
      <Link
        href="/kb"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        Knowledge Base
      </Link>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
        <aside className="hidden lg:block">
          <KbSidebar
            categories={categories}
            activeCategory={category.slug}
            activeSlug={article.slug}
          />
        </aside>

        <div className="min-w-0 max-w-3xl">
          <div className="flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            <Link
              href={`/kb/${category.slug}`}
              className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
            >
              {category.title}
            </Link>
            <ChevronRight size={13} />
            <span className="text-zinc-950 dark:text-zinc-50">
              {article.title}
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            {article.title}
          </h1>
          <p className="mt-2 text-zinc-500 dark:text-zinc-400">
            {article.description}
          </p>

          <div className="mt-8 border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <Markdown
              content={article.content}
              className="text-sm text-zinc-700 dark:text-zinc-300"
            />
          </div>
        </div>
      </div>
    </Container>
  );
}
