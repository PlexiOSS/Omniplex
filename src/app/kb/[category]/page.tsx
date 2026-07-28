import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KbSidebar } from "@/components/kb/KbSidebar";
import { Container } from "@/components/layout/Container";
import { getKbCategories, getKbCategory } from "@/lib/kb/content";

interface Props {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return getKbCategories().map((category) => ({ category: category.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category: categorySlug } = await params;
  const category = getKbCategory(categorySlug);
  if (!category) return {};
  return { title: category.title, description: category.description };
}

export default async function KbCategoryPage({ params }: Props) {
  const { category: categorySlug } = await params;
  const categories = getKbCategories();
  const category = categories.find((c) => c.slug === categorySlug);
  if (!category) notFound();

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
          <KbSidebar categories={categories} activeCategory={category.slug} />
        </aside>

        <div className="min-w-0">
          <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            {category.title}
          </h1>
          <p className="mt-1 text-zinc-500 dark:text-zinc-400">
            {category.description}
          </p>

          <div className="mt-6 space-y-3">
            {category.articles.map((article) => (
              <Link
                key={article.slug}
                href={`/kb/${category.slug}/${article.slug}`}
                className="group flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
              >
                <div className="min-w-0">
                  <p className="font-medium text-zinc-950 dark:text-zinc-50">
                    {article.title}
                  </p>
                  <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {article.description}
                  </p>
                </div>
                <ArrowRight
                  size={16}
                  className="shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500 dark:text-zinc-700 dark:group-hover:text-zinc-400"
                />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Container>
  );
}
