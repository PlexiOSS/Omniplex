import { ArrowRight, ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { KbSidebar } from "@/components/kb/KbSidebar";
import { kbCategoryIcon } from "@/components/kb/kbIcons";
import { Container } from "@/components/layout/Container";
import { getKbCategories, getKbCategory } from "@/lib/kb/content";
import { readingMinutes } from "@/lib/markdown/outline";

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
  return {
    title: category.title,
    description: category.description,
    alternates: { canonical: `/kb/${category.slug}` },
  };
}

export default async function KbCategoryPage({ params }: Props) {
  const { category: categorySlug } = await params;
  const categories = getKbCategories();
  const category = categories.find((c) => c.slug === categorySlug);
  if (!category) notFound();
  const Icon = kbCategoryIcon(category.slug);

  return (
    <Container className="py-10">
      <div className="mb-6 flex items-center gap-1.5 text-sm text-zinc-500 dark:text-zinc-400">
        <Link
          href="/kb"
          className="transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
        >
          Knowledge Base
        </Link>
        <ChevronRight size={13} />
        <span className="text-zinc-950 dark:text-zinc-50">
          {category.title}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">
            <KbSidebar categories={categories} activeCategory={category.slug} />
          </div>
        </aside>

        <div className="min-w-0">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/15">
              <Icon size={22} />
            </span>
            <div className="min-w-0">
              <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
                {category.title}
              </h1>
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                {category.description}
              </p>
            </div>
          </div>

          <ul className="mt-8 divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
            {category.articles.map((article) => (
              <li key={article.slug}>
                <Link
                  href={`/kb/${category.slug}/${article.slug}`}
                  className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-zinc-950 transition-colors group-hover:text-accent dark:text-zinc-50">
                      {article.title}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                      {article.description}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
                    <span className="hidden sm:inline">
                      {readingMinutes(article.content)} min read
                    </span>
                    <ArrowRight
                      size={15}
                      className="text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:text-accent dark:text-zinc-600"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Container>
  );
}
