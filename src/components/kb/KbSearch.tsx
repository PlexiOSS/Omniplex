"use client";

import { ArrowRight, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

interface SearchableArticle {
  slug: string;
  category: string;
  categoryTitle: string;
  title: string;
  description: string;
}

interface KbSearchProps {
  articles: SearchableArticle[];
}

export function KbSearch({ articles }: KbSearchProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return articles.filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q),
    );
  }, [articles, query]);

  return (
    <div className="relative">
      <div className="relative">
        <Search
          size={16}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the knowledge base..."
          className="w-full rounded-xl border border-zinc-200 bg-white py-3 pl-10 pr-4 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 dark:focus:border-zinc-600"
        />
      </div>

      {query.trim() && (
        <div className="absolute inset-x-0 top-full z-10 mt-2 max-h-96 overflow-y-auto rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          {results.length > 0 ? (
            results.map((article) => (
              <Link
                key={`${article.category}/${article.slug}`}
                href={`/kb/${article.category}/${article.slug}`}
                className="flex items-center justify-between gap-3 border-b border-zinc-100 px-4 py-3 last:border-b-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800/50"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {article.title}
                  </p>
                  <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                    {article.categoryTitle}
                  </p>
                </div>
                <ArrowRight size={14} className="shrink-0 text-zinc-400" />
              </Link>
            ))
          ) : (
            <p className="px-4 py-3 text-sm text-zinc-500 dark:text-zinc-400">
              No articles found for &ldquo;{query}&rdquo;.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
