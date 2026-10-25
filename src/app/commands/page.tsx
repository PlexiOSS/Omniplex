"use client";

import { Terminal } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo } from "react";
import { CommandBotList } from "@/components/commands/CommandBotList";
import { CommandBotsGrid } from "@/components/commands/CommandBotsGrid";
import { CommandResults } from "@/components/commands/CommandResults";
import { CommandsCta } from "@/components/commands/CommandsCta";
import { commandLabel } from "@/components/commands/commandLabel";
import { DirectoryFilters } from "@/components/filters/DirectoryFilters";
import { Container } from "@/components/layout/Container";
import { Pagination } from "@/components/search/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { useCommandBots, useCommandSearch } from "@/hooks/useBots";

const SKELETON_KEYS = ["a", "b", "c", "d"];
const EXAMPLE_LIMIT = 6;

function CommandsView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = searchParams.get("q") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const bot = searchParams.get("bot") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const searching = !!(query || tag || bot);

  const updateParams = useCallback(
    (changes: Record<string, string>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value) params.set(key, value);
        else params.delete(key);
      }
      if (resetPage) params.delete("page");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname, searchParams],
  );

  const filters = useMemo(
    () => ({
      query: query || undefined,
      tag: tag || undefined,
      bot: bot || undefined,
    }),
    [query, tag, bot],
  );

  const { data, isLoading, error } = useCommandSearch(page, filters, searching);
  const {
    data: commandBots,
    isLoading: botsLoading,
    error: botsError,
    mutate: retryBots,
  } = useCommandBots();

  const botLabel = bot
    ? (commandBots?.find((b) => b.bot_id === bot)?.user?.username ??
      data?.results.find((r) => r.bot_id === bot)?.bot?.username ??
      "this bot")
    : null;

  const examples = useMemo(() => {
    const labels = new Map<string, string>();
    for (const b of commandBots ?? []) {
      for (const name of b.preview) {
        const label = commandLabel(name);
        const key = label.toLowerCase();
        if (!labels.has(key)) labels.set(key, label);
        if (labels.size >= EXAMPLE_LIMIT) return [...labels.values()];
      }
    }
    return [...labels.values()];
  }, [commandBots]);

  const onQueryChange = useCallback(
    (q: string) => updateParams({ q }),
    [updateParams],
  );
  const onTagChange = useCallback(
    (t: string) => updateParams({ tag: t }),
    [updateParams],
  );
  const onSelectBot = useCallback(
    (b: string) => {
      updateParams({ bot: b });
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [updateParams],
  );
  const onClearAll = useCallback(
    () => updateParams({ q: "", tag: "", bot: "" }),
    [updateParams],
  );
  const onPageChange = useCallback(
    (p: number) => {
      updateParams({ page: p > 1 ? String(p) : "" }, false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    },
    [updateParams],
  );

  const results = data?.results ?? [];

  return (
    <Container className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Command Directory
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Search every bot's documented slash commands. Find out who has a{" "}
          <code className="rounded bg-zinc-100 px-1 py-0.5 text-xs dark:bg-zinc-800">
            /giveaway
          </code>
          , for example.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <aside className="min-w-0 space-y-8 lg:sticky lg:top-24 lg:order-last lg:self-start">
          <DirectoryFilters
            query={query}
            searchPlaceholder="Search commands or descriptions"
            tag={tag}
            botLabel={botLabel}
            onQueryChange={onQueryChange}
            onTagChange={onTagChange}
            onClearBot={() => updateParams({ bot: "" })}
            onClearAll={onClearAll}
          />
          <div className="hidden space-y-8 lg:block">
            <CommandBotList
              bots={commandBots ?? []}
              activeBot={bot}
              onSelect={onSelectBot}
            />
            <CommandsCta />
          </div>
        </aside>

        <div className="min-w-0">
          {!searching ? (
            <>
              {examples.length > 0 && (
                <div className="mb-6">
                  <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                    Try searching
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {examples.map((label) => (
                      <button
                        key={label}
                        type="button"
                        onClick={() => onQueryChange(label.replace(/^\//, ""))}
                        className="rounded-full bg-zinc-100 px-2.5 py-1 font-mono text-xs text-zinc-700 transition-colors hover:bg-accent/10 hover:text-accent dark:bg-zinc-800 dark:text-zinc-300"
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                Bots with documented commands
              </p>
              {botsLoading ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {SKELETON_KEYS.map((k) => (
                    <div
                      key={k}
                      className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                    >
                      <div className="flex items-center gap-2.5">
                        <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                        <Skeleton className="h-4 w-28" />
                      </div>
                      <Skeleton className="mt-3 h-3 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : botsError ? (
                <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500 dark:text-zinc-400">
                  <p className="text-sm">
                    Couldn't load the bot list right now. You can still search
                    above.
                  </p>
                  <button
                    type="button"
                    onClick={() => retryBots()}
                    className="mt-3 text-sm font-medium text-accent hover:underline"
                  >
                    Try again
                  </button>
                </div>
              ) : commandBots && commandBots.length > 0 ? (
                <CommandBotsGrid bots={commandBots} onSelect={onSelectBot} />
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500 dark:text-zinc-400">
                  <Terminal
                    size={24}
                    className="mb-2 text-zinc-300 dark:text-zinc-700"
                  />
                  <p className="text-sm">
                    No bots have documented commands yet.
                  </p>
                </div>
              )}
            </>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 text-zinc-500 dark:text-zinc-400">
              <p className="text-sm">Failed to search commands.</p>
            </div>
          ) : isLoading && !data ? (
            <div className="space-y-4">
              {SKELETON_KEYS.map((k) => (
                <div
                  key={k}
                  className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="h-7 w-7 shrink-0 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="mt-3 h-4 w-24" />
                  <Skeleton className="mt-2 h-3 w-full" />
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500 dark:text-zinc-400">
              <Terminal
                size={24}
                className="mb-2 text-zinc-300 dark:text-zinc-700"
              />
              <p className="text-sm">No commands match these filters.</p>
              <button
                type="button"
                onClick={onClearAll}
                className="mt-3 text-sm font-medium text-accent hover:underline"
              >
                Clear filters
              </button>
            </div>
          ) : (
            <>
              <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
                {data?.count === 1
                  ? "1 command"
                  : `${data?.count ?? 0} commands`}{" "}
                matching your filters
              </p>
              <div
                className={[
                  "transition-opacity",
                  isLoading ? "opacity-60" : "",
                ].join(" ")}
              >
                <CommandResults
                  results={results}
                  activeBot={bot}
                  onFilterBot={onSelectBot}
                />
              </div>
              {data && data.count > data.per_page && (
                <div className="mt-8">
                  <Pagination
                    page={page}
                    total={data.count}
                    perPage={data.per_page}
                    onPageChange={onPageChange}
                  />
                </div>
              )}
            </>
          )}

          <div className="mt-10 lg:hidden">
            <CommandsCta />
          </div>
        </div>
      </div>
    </Container>
  );
}

export default function CommandsPage() {
  return (
    <Suspense fallback={null}>
      <CommandsView />
    </Suspense>
  );
}
