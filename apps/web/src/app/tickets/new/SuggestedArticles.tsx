import { ArrowUpRight, Lightbulb } from "lucide-react";
import type { SearchableArticle } from "@/lib/kb/search";

export function SuggestedArticles({
  articles,
}: {
  articles: SearchableArticle[];
}) {
  if (articles.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="rounded-xl border border-accent/20 bg-accent/5 p-3"
    >
      <p className="flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300">
        <Lightbulb size={13} className="text-accent" />
        These might answer your question
      </p>
      <ul className="mt-2 space-y-1">
        {articles.map((article) => (
          <li key={`${article.category}/${article.slug}`}>
            <a
              href={`/kb/${article.category}/${article.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start justify-between gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-white dark:hover:bg-zinc-900"
            >
              <span className="min-w-0">
                <span className="block font-medium text-zinc-950 group-hover:text-accent dark:text-zinc-50">
                  {article.title}
                </span>
                <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {article.description}
                </span>
              </span>
              <ArrowUpRight
                size={14}
                className="mt-0.5 shrink-0 text-zinc-400"
              />
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
        Found your answer? You don&apos;t need to open a ticket. Otherwise,
        carry on below.
      </p>
    </div>
  );
}
