"use client";

import { Megaphone } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo } from "react";
import { FeedEntry } from "@/components/feed/FeedEntry";
import { RecentBots } from "@/components/feed/RecentBots";
import { DirectoryFilters } from "@/components/filters/DirectoryFilters";
import { Container } from "@/components/layout/Container";
import { Pagination } from "@/components/search/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { useBotChangelogFeed, useRecentChangelogBots } from "@/hooks/useBots";
import type { BotChangelogFeedEntry } from "@/lib/api/types";

const DAY_MS = 24 * 60 * 60 * 1000;
const SKELETON_KEYS = ["a", "b", "c", "d", "e"];

function groupLabel(iso: string, now: Date): string {
  const date = new Date(iso);
  const startOfDay = (d: Date) =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);

  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return "This week";
  if (days < 30) return "This month";
  return date.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

function groupEntries(entries: BotChangelogFeedEntry[]) {
  const now = new Date();
  const groups: { label: string; entries: BotChangelogFeedEntry[] }[] = [];

  for (const entry of entries) {
    const label = groupLabel(entry.created_at, now);
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.entries.push(entry);
    } else {
      groups.push({ label, entries: [entry] });
    }
  }

  return groups;
}

function FeedView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const query = searchParams.get("q") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const bot = searchParams.get("bot") ?? "";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);

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
      q: query || undefined,
      tag: tag || undefined,
      bot: bot || undefined,
    }),
    [query, tag, bot],
  );

  const { data, isLoading, error } = useBotChangelogFeed(page, filters);
  const { data: recent } = useRecentChangelogBots();

  const botLabel = bot
    ? (data?.results.find((e) => e.bot_id === bot)?.user.username ??
      recent?.find((r) => r.bot_id === bot)?.user?.username ??
      "this bot")
    : null;

  const groups = useMemo(
    () => (data ? groupEntries(data.results) : []),
    [data],
  );

  const filtered = !!(query || tag || bot);

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

  return (
    <Container className="py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Feed
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Updates bot owners have posted, newest first.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <aside className="min-w-0 space-y-8 lg:sticky lg:top-24 lg:order-last lg:self-start">
          <DirectoryFilters
            query={query}
            searchPlaceholder="Search updates or bots"
            tag={tag}
            botLabel={botLabel}
            onQueryChange={onQueryChange}
            onTagChange={onTagChange}
            onClearBot={() => updateParams({ bot: "" })}
            onClearAll={onClearAll}
          />
          <div className="hidden lg:block">
            <RecentBots activeBot={bot} onSelect={onSelectBot} />
          </div>
        </aside>

        <div className="min-w-0">
          {error ? (
            <div className="flex flex-col items-center justify-center py-24 text-zinc-500 dark:text-zinc-400">
              <p className="text-sm">Failed to load the feed.</p>
            </div>
          ) : isLoading && !data ? (
            <div className="space-y-4">
              {SKELETON_KEYS.map((k) => (
                <div
                  key={k}
                  className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-2.5">
                    <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                  <Skeleton className="mt-3 h-4 w-2/3" />
                  <Skeleton className="mt-2 h-3 w-full" />
                </div>
              ))}
            </div>
          ) : !data || data.results.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center text-zinc-500 dark:text-zinc-400">
              <Megaphone
                size={28}
                className="mb-3 text-zinc-300 dark:text-zinc-700"
              />
              <p className="text-sm">
                {filtered
                  ? "No updates match these filters."
                  : "No updates posted yet."}
              </p>
              {filtered && (
                <button
                  type="button"
                  onClick={onClearAll}
                  className="mt-3 text-sm font-medium text-accent hover:underline"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
                {data.count === 1 ? "1 update" : `${data.count} updates`}
                {filtered && " matching your filters"}
              </p>

              <div
                className={[
                  "space-y-8 transition-opacity",
                  isLoading ? "opacity-60" : "",
                ].join(" ")}
              >
                {groups.map((group) => (
                  <section key={group.label}>
                    <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
                      {group.label}
                    </h2>
                    <div className="space-y-4">
                      {group.entries.map((entry) => (
                        <FeedEntry
                          key={entry.id}
                          entry={entry}
                          filteredToBot={bot === entry.bot_id}
                          onFilterBot={onSelectBot}
                        />
                      ))}
                    </div>
                  </section>
                ))}
              </div>

              <div className="mt-10">
                <Pagination
                  page={page}
                  total={data.count}
                  perPage={data.per_page}
                  onPageChange={onPageChange}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </Container>
  );
}

export default function FeedPage() {
  return (
    <Suspense>
      <FeedView />
    </Suspense>
  );
}
