"use client";

import { Search, Terminal } from "lucide-react";
import Link from "next/link";
import { Suspense, useState } from "react";
import useSWR from "swr";
import { Container } from "@/components/layout/Container";
import { Pagination } from "@/components/search/Pagination";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { bots } from "@/lib/api";
import { mirroredAvatarUrl } from "@/lib/utils/assets";

function CommandsPageInner() {
  const [query, setQuery] = useState("");
  const [committed, setCommitted] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useSWR(
    committed ? `commands/search/${committed}/${page}` : null,
    () => bots.searchCommands(committed, page),
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setCommitted(query.trim());
  }

  const results = data?.results ?? [];

  return (
    <Container className="py-10" narrow>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Command Directory
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Search every bot's documented slash commands — find out who has a{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">
            /giveaway
          </code>
          , for example.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Input
          icon={<Search size={14} />}
          placeholder="Search command names…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="flex-1"
        />
      </form>

      {error ? (
        <div className="mt-10 flex flex-col items-center justify-center py-16 text-zinc-500 dark:text-zinc-400">
          <p className="text-sm">Failed to search commands.</p>
        </div>
      ) : isLoading ? (
        <div className="mt-10 flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
        </div>
      ) : !committed ? (
        <div className="mt-10 flex flex-col items-center justify-center py-16 text-center text-zinc-500 dark:text-zinc-400">
          <Terminal
            size={24}
            className="mb-2 text-zinc-300 dark:text-zinc-700"
          />
          <p className="text-sm">
            Enter a command name above to search across every bot.
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="mt-10 flex flex-col items-center justify-center py-16 text-center text-zinc-500 dark:text-zinc-400">
          <p className="text-sm">
            No commands matching &quot;{committed}&quot; found.
          </p>
        </div>
      ) : (
        <>
          <div className="mt-8 space-y-3">
            {results.map((result) => (
              <Link
                key={result.id}
                href={`/bots/${result.bot_id}?tab=commands`}
                className="flex items-start gap-3 rounded-xl border border-zinc-200 p-4 transition-colors hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800"
              >
                <Avatar
                  src={mirroredAvatarUrl(
                    "bots",
                    result.bot_id,
                    result.bot.avatar,
                  )}
                  alt={result.bot.username}
                  size={36}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm font-medium text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50">
                      /{result.name}
                    </code>
                    {result.category && (
                      <Badge variant="default">{result.category}</Badge>
                    )}
                  </div>
                  {result.description && (
                    <p className="mt-1 truncate text-sm text-zinc-500 dark:text-zinc-400">
                      {result.description}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-600">
                    {result.bot.username}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {data && data.count > data.per_page && (
            <div className="mt-8">
              <Pagination
                page={page}
                total={data.count}
                perPage={data.per_page}
                onPageChange={setPage}
              />
            </div>
          )}
        </>
      )}
    </Container>
  );
}

export default function CommandsPage() {
  return (
    <Suspense fallback={null}>
      <CommandsPageInner />
    </Suspense>
  );
}
