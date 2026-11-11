import { Activity, ArrowRight, BookOpen, FileCode } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { KbSearch } from "@/components/kb/KbSearch";
import { kbCategoryIcon } from "@/components/kb/kbIcons";
import { YourTickets } from "@/components/kb/YourTickets";
import { Container } from "@/components/layout/Container";
import { KB_COMMON_QUESTIONS } from "@/lib/kb/categories";
import { getKbCategories, getKbSearchIndex } from "@/lib/kb/content";

export const metadata: Metadata = {
  title: "Knowledge Base",
  description:
    "Answers to commonly asked questions and information about our rules, policies, and programs.",
};

export default function KbPage() {
  const categories = getKbCategories();
  const searchableArticles = getKbSearchIndex();
  const common = KB_COMMON_QUESTIONS.map(({ category, slug }) =>
    searchableArticles.find((a) => a.category === category && a.slug === slug),
  ).filter((a) => a !== undefined);
  const articleCount = searchableArticles.length;

  return (
    <Container className="py-10">
      <section className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-linear-to-b from-accent/10 via-white to-white px-5 py-12 text-center sm:px-10 dark:border-zinc-800 dark:via-zinc-950 dark:to-zinc-950">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/15">
          <BookOpen size={22} />
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
          How can we help?
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-zinc-500 dark:text-zinc-400">
          Guides, rules and answers for listing bots and servers, voting,
          premium and everything else on Omniplex.
        </p>
        <div className="mx-auto mt-6 max-w-xl text-left">
          <KbSearch articles={searchableArticles} />
        </div>
        <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
          {articleCount} articles in {categories.length} categories
        </p>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <section className="rounded-2xl border border-zinc-200 bg-white p-5 lg:col-span-2 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">
            Common questions
          </h2>
          <ul className="mt-3 grid gap-x-6 gap-y-0.5 sm:grid-cols-2">
            {common.map((article) => (
              <li key={`${article.category}/${article.slug}`}>
                <Link
                  href={`/kb/${article.category}/${article.slug}`}
                  className="group -mx-2 flex items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-50"
                >
                  <span className="min-w-0 truncate">{article.title}</span>
                  <ArrowRight
                    size={14}
                    className="shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 dark:text-zinc-600"
                  />
                </Link>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-zinc-100 pt-3 text-sm dark:border-zinc-800">
            <a
              href="https://docs.omniplex.gg"
              className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-accent dark:text-zinc-300"
            >
              <FileCode size={14} />
              Developer docs
            </a>
            <a
              href="https://status.omniplex.gg"
              className="inline-flex items-center gap-1.5 text-zinc-600 hover:text-accent dark:text-zinc-300"
            >
              <Activity size={14} />
              System status
            </a>
          </div>
        </section>
        <YourTickets />
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const Icon = kbCategoryIcon(category.slug);
          return (
            <section
              key={category.slug}
              className="flex min-w-0 flex-col rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <Link
                href={`/kb/${category.slug}`}
                className="group flex items-start gap-3"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/15">
                  <Icon size={18} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2 font-semibold text-zinc-950 transition-colors group-hover:text-accent dark:text-zinc-50">
                    {category.title}
                    <ArrowRight
                      size={15}
                      className="shrink-0 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:text-accent dark:text-zinc-600"
                    />
                  </span>
                  <span className="mt-0.5 line-clamp-2 block text-sm text-zinc-500 dark:text-zinc-400">
                    {category.description}
                  </span>
                </span>
              </Link>
              <ul className="mt-4 space-y-0.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                {category.articles.slice(0, 4).map((article) => (
                  <li key={article.slug}>
                    <Link
                      href={`/kb/${category.slug}/${article.slug}`}
                      className="-mx-2 block truncate rounded-lg px-2 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-50"
                    >
                      {article.title}
                    </Link>
                  </li>
                ))}
              </ul>
              {category.articles.length > 4 && (
                <Link
                  href={`/kb/${category.slug}`}
                  className="mt-auto pt-2 text-xs font-medium text-accent hover:underline"
                >
                  View all {category.articles.length} articles
                </Link>
              )}
            </section>
          );
        })}
      </div>
    </Container>
  );
}
