"use client";

import { servers as serversApi } from "@omniplex/core/api";
import { Pagination } from "@omniplex/ui/Pagination";
import { Bot, Megaphone, Rss, Server } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo } from "react";
import useSWR from "swr";
import {
  FeedEntry,
  type FeedItem,
  fromBotEntry,
  fromServerEntry,
} from "@/components/feed/FeedEntry";
import { RecentBots } from "@/components/feed/RecentBots";
import { DirectoryFilters } from "@/components/filters/DirectoryFilters";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Skeleton } from "@/components/ui/Skeleton";
import { useBotChangelogFeed, useRecentChangelogBots } from "@/hooks/useBots";
import { SERVER_TAGS } from "@/lib/constants/tags";
import { scrollBehavior } from "@/lib/utils/motion";

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

function groupEntries(entries: FeedItem[]) {
  const now = new Date();
  const groups: { label: string; entries: FeedItem[] }[] = [];

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

  const kind = searchParams.get("type") === "servers" ? "server" : "bot";
  const query = searchParams.get("q") ?? "";
  const tag = searchParams.get("tag") ?? "";
  const bot = searchParams.get(kind === "server" ? "server" : "bot") ?? "";
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

  const botFeed = useBotChangelogFeed(page, filters);
  const serverFeed = useSWR(
    kind === "server"
      ? ["servers/changelogs/feed", page, query, tag, bot]
      : null,
    () =>
      serversApi.getChangelogFeed(page, {
        q: query || undefined,
        tag: tag || undefined,
        server: bot || undefined,
      }),
  );
  const { data: recent } = useRecentChangelogBots();

  const source = kind === "server" ? serverFeed : botFeed;
  const { isLoading, error } = source;
  const data = useMemo(() => {
    if (kind === "server") {
      return serverFeed.data
        ? {
            ...serverFeed.data,
            results: serverFeed.data.results.map(fromServerEntry),
          }
        : undefined;
    }
    return botFeed.data
      ? { ...botFeed.data, results: botFeed.data.results.map(fromBotEntry) }
      : undefined;
  }, [kind, botFeed.data, serverFeed.data]);

  const botLabel = bot
    ? (data?.results.find((e) => e.entityId === bot)?.name ??
      (kind === "bot"
        ? recent?.find((r) => r.bot_id === bot)?.user?.username
        : undefined) ??
      `this ${kind}`)
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
  const entityParam = kind === "server" ? "server" : "bot";
  const onSelectBot = useCallback(
    (b: string) => {
      updateParams({ [entityParam]: b });
      window.scrollTo({ top: 0, behavior: scrollBehavior() });
    },
    [updateParams, entityParam],
  );
  const onClearAll = useCallback(
    () => updateParams({ q: "", tag: "", bot: "", server: "" }),
    [updateParams],
  );
  const onKindChange = useCallback(
    (next: "bot" | "server") =>
      updateParams({
        type: next === "server" ? "servers" : "",
        q: "",
        tag: "",
        bot: "",
        server: "",
      }),
    [updateParams],
  );
  const onPageChange = useCallback(
    (p: number) => {
      updateParams({ page: p > 1 ? String(p) : "" }, false);
      window.scrollTo({ top: 0, behavior: scrollBehavior() });
    },
    [updateParams],
  );

  return (
    <Container className="py-10">
      <PageHeader
        icon={Rss}
        title="Feed"
        description={
          <>Updates bot and server owners have posted, newest first.</>
        }
      />

      <div className="mb-6 inline-flex rounded-xl border border-zinc-200 p-1 dark:border-zinc-800">
        {(
          [
            ["bot", "Bots", Bot],
            ["server", "Servers", Server],
          ] as const
        ).map(([value, label, Icon]) => (
          <button
            key={value}
            type="button"
            aria-pressed={kind === value}
            onClick={() => onKindChange(value)}
            className={[
              "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              kind === value
                ? "bg-accent/10 text-accent"
                : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50",
            ].join(" ")}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <aside className="min-w-0 space-y-8 lg:sticky lg:top-24 lg:order-last lg:self-start">
          <DirectoryFilters
            query={query}
            searchPlaceholder={
              kind === "server"
                ? "Search updates or servers"
                : "Search updates or bots"
            }
            tag={tag}
            botLabel={botLabel}
            onQueryChange={onQueryChange}
            onTagChange={onTagChange}
            onClearBot={() => updateParams({ [entityParam]: "" })}
            onClearAll={onClearAll}
            tags={kind === "server" ? SERVER_TAGS : undefined}
          />
          {kind === "bot" && (
            <div className="hidden lg:block">
              <RecentBots activeBot={bot} onSelect={onSelectBot} />
            </div>
          )}
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
                  className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800 bg-white dark:bg-zinc-900"
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
                          filteredToBot={bot === entry.entityId}
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
