"use client";

import { Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { BotCard } from "@/components/cards/BotCard";
import { ServerCard } from "@/components/cards/ServerCard";
import { Container } from "@/components/layout/Container";
import { Pagination } from "@/components/search/Pagination";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BotCardSkeleton } from "@/components/ui/Skeleton";
import { useSearch } from "@/hooks/useSearch";
import { bots, servers } from "@/lib/api";
import type { IndexBot, IndexServer, PagedResult } from "@/lib/api/types";

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

const PAGE_SIZE = 12;

function SearchPageInner() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") ?? "";

  const { query, setQuery, results, isLoading, hasResults, run } = useSearch();

  // Browse mode (no active search yet) — real backend pagination, since
  // /list/search has none and returns the whole matching set at once.
  const [browseBots, setBrowseBots] = useState<PagedResult<IndexBot[]> | null>(
    null,
  );
  const [browseServers, setBrowseServers] = useState<PagedResult<
    IndexServer[]
  > | null>(null);
  const [botsPage, setBotsPage] = useState(1);
  const [serversPage, setServersPage] = useState(1);

  useEffect(() => {
    if (initialQuery) {
      run({ query: initialQuery, target_types: ["bot", "server"] });
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hasResults) return;
    bots.getAll(botsPage).then(setBrowseBots);
  }, [hasResults, botsPage]);

  useEffect(() => {
    if (hasResults) return;
    servers.getAll(serversPage).then(setBrowseServers);
  }, [hasResults, serversPage]);

  // Active search results have no server-side pagination, so it's sliced
  // client-side instead — same approach the admin search page uses.
  const [resultsBotsPage, setResultsBotsPage] = useState(1);
  const [resultsServersPage, setResultsServersPage] = useState(1);

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
    setResultsBotsPage(1);
    setResultsServersPage(1);
    run({
      ...query,
      target_types: query.target_types?.length
        ? query.target_types
        : ["bot", "server"],
    });
  };

  const resultBots = results?.bots ?? [];
  const resultServers = results?.servers ?? [];
  const pagedResultBots = resultBots.slice(
    (resultsBotsPage - 1) * PAGE_SIZE,
    resultsBotsPage * PAGE_SIZE,
  );
  const pagedResultServers = resultServers.slice(
    (resultsServersPage - 1) * PAGE_SIZE,
    resultsServersPage * PAGE_SIZE,
  );
  const totalResults = resultBots.length + resultServers.length;

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

          {resultBots.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                Bots
                <Badge>{resultBots.length}</Badge>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pagedResultBots.map((bot) => (
                  <BotCard key={bot.bot_id} bot={bot} />
                ))}
              </div>
              {resultBots.length > PAGE_SIZE && (
                <div className="mt-6">
                  <Pagination
                    page={resultsBotsPage}
                    total={resultBots.length}
                    perPage={PAGE_SIZE}
                    onPageChange={setResultsBotsPage}
                  />
                </div>
              )}
            </section>
          )}

          {resultServers.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                Servers
                <Badge>{resultServers.length}</Badge>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {pagedResultServers.map((server) => (
                  <ServerCard key={server.server_id} server={server} />
                ))}
              </div>
              {resultServers.length > PAGE_SIZE && (
                <div className="mt-6">
                  <Pagination
                    page={resultsServersPage}
                    total={resultServers.length}
                    perPage={PAGE_SIZE}
                    onPageChange={setResultsServersPage}
                  />
                </div>
              )}
            </section>
          )}

          {totalResults === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500 dark:text-zinc-400">
              <p className="text-sm">
                No results found. Try different keywords or tags.
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-10 space-y-10">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Browsing everything search or pick a tag to narrow it down.
          </p>

          {browseBots && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                Bots
                <Badge>{browseBots.count}</Badge>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {browseBots.results.map((bot) => (
                  <BotCard key={bot.bot_id} bot={bot} />
                ))}
              </div>
              <div className="mt-6">
                <Pagination
                  page={botsPage}
                  total={browseBots.count}
                  perPage={browseBots.per_page}
                  onPageChange={setBotsPage}
                />
              </div>
            </section>
          )}

          {browseServers && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-base font-semibold text-zinc-950 dark:text-zinc-50">
                Servers
                <Badge>{browseServers.count}</Badge>
              </h2>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {browseServers.results.map((server) => (
                  <ServerCard key={server.server_id} server={server} />
                ))}
              </div>
              <div className="mt-6">
                <Pagination
                  page={serversPage}
                  total={browseServers.count}
                  perPage={browseServers.per_page}
                  onPageChange={setServersPage}
                />
              </div>
            </section>
          )}
        </div>
      )}
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
