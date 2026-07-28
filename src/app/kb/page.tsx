import { ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { KbSearch } from "@/components/kb/KbSearch";
import { Container } from "@/components/layout/Container";
import { getKbCategories } from "@/lib/kb/content";

export const metadata: Metadata = {
  title: "Knowledge Base",
  description:
    "Answers to commonly asked questions and information about our rules, policies, and programs.",
};

export default function KbPage() {
  const categories = getKbCategories();
  const searchableArticles = categories.flatMap((category) =>
    category.articles.map((article) => ({
      slug: article.slug,
      category: category.slug,
      categoryTitle: category.title,
      title: article.title,
      description: article.description,
    })),
  );

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-semibold text-zinc-950 dark:text-zinc-50">
          Knowledge Base
        </h1>
        <p className="mt-2 text-zinc-500 dark:text-zinc-400">
          Answers to commonly asked questions and information about our rules,
          policies, and programs.
        </p>
        <div className="mt-6">
          <KbSearch articles={searchableArticles} />
        </div>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => (
          <Link
            key={category.slug}
            href={`/kb/${category.slug}`}
            className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-5 transition-all hover:border-zinc-300 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
          >
            <div className="flex items-center justify-between gap-2">
              <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">
                {category.title}
              </h2>
              <ArrowRight
                size={16}
                className="shrink-0 text-zinc-300 transition-colors group-hover:text-zinc-500 dark:text-zinc-700 dark:group-hover:text-zinc-400"
              />
            </div>
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              {category.description}
            </p>
            <p className="mt-4 text-xs font-medium text-zinc-400 dark:text-zinc-600">
              {category.articles.length} article
              {category.articles.length === 1 ? "" : "s"}
            </p>
          </Link>
        ))}
      </div>
    </Container>
  );
}
