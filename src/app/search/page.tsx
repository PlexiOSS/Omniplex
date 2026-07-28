"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect } from "react";
import { useSearch } from "@/hooks/useSearch";
import { BotCard } from "@/components/cards/BotCard";
import { ServerCard } from "@/components/cards/ServerCard";
import { BotCardSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/layout/Container";
import { Search } from "lucide-react";

const AVAILABLE_TAGS = [
  "Auto-Mod",
  "Economy",
  "Fun",
  "Games",
  "Leveling",
  "Logging",
  "Moderation",
  "Music",
  "Roleplay",
  "Social",
  "Utility",
  "Welcome",
];

function SearchPageInner() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const { query, setQuery, results, isLoading, hasResults, run } = useSearch();

  useEffect(() => {
    if (initialQuery) {
      run({ query: initialQuery, target_types: ["bot", "server"] });
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleTag = (tag: string) => {
    const tags = query.tags?.tags ?? [];
    const next = tags.includes(tag)
      ? tags.filter((t) => t !== tag)
      : [...tags, tag];
    setQuery({
      ...query,
      tags: next.length > 0 ? { tags: next, tag_mode: "&&" } : undefined,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    run({ ...query, target_types: query.target_types?.length ? query.target_types : ["bot", "server"] });
  };

  const totalResults =
    (results?.bots?.length ?? 0) + (results?.servers?.length ?? 0);

  return (
    <Container className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Search
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Find bots and servers by name, tags, or description.
        </p>
      </div>

      {/* Search form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex gap-2">
          <Input
            icon={<Search size={14} />}
            placeholder="Search bots and servers..."
            defaultValue={initialQuery}
            onChange={(e) => setQuery({ ...query, query: e.target.value })}
            className="flex-1"
          />
          <Button type="submit" variant="primary" loading={isLoading}>
            Search
          </Button>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_TAGS.map((tag) => {
            const active = query.tags?.tags.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={[
                  "rounded-full px-3 py-1 text-xs font-medium transition-colors",
                  active
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-700",
                ].join(" ")}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </form>

      {/* Results */}
      {isLoading ? (
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton
            <BotCardSkeleton key={i} />
          ))}
        </div>
      ) : hasResults ? (
        <div className="mt-10 space-y-10">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {totalResults} result{totalResults !== 1 ? "s" : ""} found
          </p>

          {(results?.bots?.length ?? 0) > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                Bots
                <Badge>{results!.bots!.length}</Badge>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results!.bots!.map((bot) => (
                  <BotCard key={bot.bot_id} bot={bot} />
                ))}
              </div>
            </section>
          )}

          {(results?.servers?.length ?? 0) > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                Servers
                <Badge>{results!.servers!.length}</Badge>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {results!.servers!.map((server) => (
                  <ServerCard key={server.server_id} server={server} />
                ))}
              </div>
            </section>
          )}

          {totalResults === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500 dark:text-zinc-400">
              <p className="text-sm">No results found. Try different keywords or tags.</p>
            </div>
          )}
        </div>
      ) : null}
    </Container>
  );
}

export default function SearchPage() {
  return (
    <Suspense>
      <SearchPageInner />
    </Suspense>
  );
}
