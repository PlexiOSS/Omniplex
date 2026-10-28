"use client";

import {
  ArrowRight,
  Bot,
  Check,
  LayoutList,
  Package,
  Search,
  SearchX,
  Server,
  SquareTerminal,
  Tag,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import useSWR from "swr";
import { BotCard } from "@/components/cards/BotCard";
import { PackCard } from "@/components/cards/PackCard";
import { ServerCard } from "@/components/cards/ServerCard";
import { TeamCard } from "@/components/cards/TeamCard";
import { Container } from "@/components/layout/Container";
import { Pagination } from "@/components/search/Pagination";
import { SearchDiscover } from "@/components/search/SearchDiscover";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/PageStates";
import { BotCardSkeleton } from "@/components/ui/Skeleton";
import { search } from "@/lib/api";
import type { SearchResponse } from "@/lib/api/types";
import { BOT_TAGS } from "@/lib/constants/tags";
import { formatCount, formatCountLabel } from "@/lib/utils/format";

const EXAMPLES = ["moderation", "music", "giveaways", "economy"];

const EXPLORE = [
  {
    href: "/bots",
    title: "Browse bots",
    body: "Sort by votes, trending, newest or size.",
    icon: Bot,
  },
  {
    href: "/servers",
    title: "Browse servers",
    body: "Find a community to join.",
    icon: Server,
  },
  {
    href: "/packs",
    title: "Packs",
    body: "Bundles of bots, servers, emojis and more.",
    icon: Package,
  },
  {
    href: "/collections",
    title: "Collections",
    body: "Best-of lists by tag, ranked by votes.",
    icon: LayoutList,
  },
  {
    href: "/commands",
    title: "Command Directory",
    body: "Search every bot's commands at once.",
    icon: SquareTerminal,
  },
  {
    href: "/tags",
    title: "All tags",
    body: "Every tag in use and how popular it is.",
    icon: Tag,
  },
];

const QUICK_LINKS: {
  keywords: string[];
  href: string;
  label: string;
  description: string;
}[] = [
  {
    keywords: [
      "premium",
      "upgrade",
      "subscription",
      "plan",
      "paypal",
      "stripe",
    ],
    href: "/premium",
    label: "Premium",
    description:
      "Buy premium for one of your bots with card, PayPal, or vote credits.",
  },
  {
    keywords: ["shop", "credit", "boost", "featured", "badge", "blitz"],
    href: "/shop",
    label: "Shop",
    description:
      "Spend a bot's earned vote credits on boosts, badges, and more.",
  },
  {
    keywords: [
      "apply",
      "application",
      "staff team",
      "dev team",
      "partner",
      "certification",
    ],
    href: "/apps",
    label: "Apply",
    description:
      "Staff, dev team, partnership, and certification applications.",
  },
  {
    keywords: ["ticket", "support", "help", "issue", "bug", "problem"],
    href: "/tickets",
    label: "Support Tickets",
    description:
      "Get help from staff with your account, a payment, or a listing.",
  },
  {
    keywords: ["command", "slash", "/"],
    href: "/commands",
    label: "the Command Directory",
    description: "Search every bot's documented commands at once.",
  },
];

type ResultType = "bot" | "server" | "team" | "pack";
type Tab = "all" | ResultType;

const TYPES: { key: ResultType; label: string }[] = [
  { key: "bot", label: "Bots" },
  { key: "server", label: "Servers" },
  { key: "team", label: "Teams" },
  { key: "pack", label: "Packs" },
];

const ALL_PREVIEW = 6;
const DEBOUNCE_MS = 300;

function resultsFor(data: SearchResponse | undefined, type: ResultType) {
  if (!data) return 0;
  return (
    {
      bot: data.bots,
      server: data.servers,
      team: data.teams,
      pack: data.packs,
    }[type]?.length ?? 0
  );
}

function countFor(data: SearchResponse | undefined, type: ResultType) {
  return data?.counts?.[type] ?? resultsFor(data, type);
}

function ResultGrid({
  data,
  type,
  limit,
}: {
  data: SearchResponse;
  type: ResultType;
  limit?: number;
}) {
  const take = <T,>(items: T[] | undefined) =>
    (items ?? []).slice(0, limit ?? Number.MAX_SAFE_INTEGER);
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {type === "bot" &&
        take(data.bots).map((bot) => <BotCard key={bot.bot_id} bot={bot} />)}
      {type === "server" &&
        take(data.servers).map((server) => (
          <ServerCard key={server.server_id} server={server} />
        ))}
      {type === "team" &&
        take(data.teams).map((team) => <TeamCard key={team.id} team={team} />)}
      {type === "pack" &&
        take(data.packs).map((pack) => <PackCard key={pack.url} pack={pack} />)}
    </div>
  );
}

function SearchPageInner() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") ?? "";
  const tags = (searchParams.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const typeParam = searchParams.get("type");
  const tab: Tab = TYPES.some((t) => t.key === typeParam)
    ? (typeParam as ResultType)
    : "all";
  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const active = q.trim() !== "" || tags.length > 0;

  const update = useCallback(
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

  const [input, setInput] = useState(q);
  const [lastQ, setLastQ] = useState(q);
  if (q !== lastQ) {
    setLastQ(q);
    if (q !== input.trim()) setInput(q);
  }

  useEffect(() => {
    if (input.trim() === q) return;
    const timer = setTimeout(() => update({ q: input.trim() }), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [input, q, update]);

  const targetTypes = tab === "all" ? TYPES.map((t) => t.key) : [tab];
  const { data, error, isLoading } = useSWR(
    active ? ["search", q.trim(), tags.join(","), tab, page] : null,
    () =>
      search.search({
        query: q.trim(),
        target_types: targetTypes,
        tags: tags.length > 0 ? { tags, tag_mode: "&&" } : undefined,
        page: tab === "all" ? 1 : page,
      }),
    { keepPreviousData: true },
  );

  const toggleTag = (tag: string) => {
    const lower = tag.toLowerCase();
    const next = tags.some((t) => t.toLowerCase() === lower)
      ? tags.filter((t) => t.toLowerCase() !== lower)
      : [...tags, tag];
    update({ tags: next.join(",") });
  };

  const total = TYPES.reduce((sum, t) => sum + countFor(data, t.key), 0);
  const matchedQuickLinks = q
    ? QUICK_LINKS.filter((link) =>
        link.keywords.some((k) => q.toLowerCase().includes(k)),
      )
    : [];
  const unknownTags = tags.filter(
    (t) => !BOT_TAGS.some((b) => b.toLowerCase() === t.toLowerCase()),
  );

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
          Search Omniplex
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Bots, servers, teams and packs by name, description, ID or tag.
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            update({ q: input.trim() });
          }}
          className="relative mt-6"
        >
          <Search
            size={18}
            className="pointer-events-none absolute top-1/2 left-5 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="search"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Search by name, description, ID or vanity URL"
            aria-label="Search"
            // biome-ignore lint/a11y/noAutofocus: the page exists to search
            autoFocus
            className="h-14 w-full rounded-2xl border border-zinc-200 bg-white pr-28 pl-13 text-base text-zinc-950 shadow-sm transition-colors placeholder:text-zinc-400 focus:border-accent/50 focus:ring-4 focus:ring-accent/10 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50 [&::-webkit-search-cancel-button]:hidden"
          />
          <div className="absolute top-1/2 right-2 flex -translate-y-1/2 items-center gap-1">
            {input && (
              <button
                type="button"
                onClick={() => {
                  setInput("");
                  update({ q: "" });
                }}
                aria-label="Clear search"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X size={16} />
              </button>
            )}
            <button
              type="submit"
              className="h-10 rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
            >
              Search
            </button>
          </div>
        </form>

        {!active && (
          <div className="mt-4 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm">
            <span className="text-zinc-400 dark:text-zinc-500">Try</span>
            {EXAMPLES.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setInput(ex);
                  update({ q: ex });
                }}
                className="text-zinc-600 underline decoration-zinc-300 underline-offset-4 transition-colors hover:text-accent hover:decoration-accent dark:text-zinc-300 dark:decoration-zinc-700"
              >
                {ex}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto mt-8 max-w-4xl">
        <div className="mb-2 flex items-center justify-between gap-3">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Filter by tag
          </p>
          <Link
            href="/tags"
            className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
          >
            All tags <ArrowRight size={12} />
          </Link>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {BOT_TAGS.map((tag) => {
            const on = tags.some((t) => t.toLowerCase() === tag.toLowerCase());
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                aria-pressed={on}
                className={[
                  "inline-flex h-8 items-center gap-1 rounded-lg border px-3 text-xs font-medium transition-colors",
                  on
                    ? "border-accent/40 bg-accent/10 text-accent"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-50",
                ].join(" ")}
              >
                {on && <Check size={12} />}
                {tag}
              </button>
            );
          })}
          {unknownTags.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className="inline-flex h-8 items-center gap-1 rounded-lg border border-accent/40 bg-accent/10 px-3 text-xs font-medium text-accent"
            >
              {tag}
              <X size={12} />
            </button>
          ))}
        </div>
      </div>

      {matchedQuickLinks.length > 0 && (
        <div className="mx-auto mt-6 max-w-4xl space-y-2">
          {matchedQuickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex items-center justify-between gap-4 rounded-xl border border-accent/20 bg-accent/5 px-4 py-3 transition-colors hover:border-accent/40"
            >
              <div>
                <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  Looking for {link.label}?
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {link.description}
                </p>
              </div>
              <ArrowRight size={16} className="shrink-0 text-accent" />
            </Link>
          ))}
        </div>
      )}

      {!active ? (
        <>
          <SearchDiscover />
          <section className="mx-auto mt-14 max-w-4xl">
            <h2 className="mb-4 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Explore
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {EXPLORE.map(({ href, title, body, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex items-start gap-3.5 rounded-2xl border border-zinc-200 bg-white p-4 transition-colors hover:border-accent/40 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/15">
                    <Icon size={18} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                      {title}
                      <ArrowRight
                        size={14}
                        className="shrink-0 text-zinc-300 transition-all group-hover:translate-x-0.5 group-hover:text-accent dark:text-zinc-600"
                      />
                    </span>
                    <span className="mt-0.5 block text-sm text-zinc-500 dark:text-zinc-400">
                      {body}
                    </span>
                  </span>
                </Link>
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="mt-8">
          <div className="mb-6 flex gap-1.5 overflow-x-auto overflow-y-hidden pb-1">
            {[{ key: "all" as Tab, label: "All" }, ...TYPES].map((t) => {
              const count =
                t.key === "all"
                  ? tab === "all"
                    ? total
                    : null
                  : tab === "all" || tab === t.key
                    ? countFor(data, t.key as ResultType)
                    : null;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => update({ type: t.key === "all" ? "" : t.key })}
                  aria-pressed={tab === t.key}
                  className={[
                    "flex h-9 shrink-0 items-center gap-1.5 rounded-xl border px-3.5 text-sm font-medium transition-colors",
                    tab === t.key
                      ? "border-accent/40 bg-accent/10 text-accent"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-50",
                  ].join(" ")}
                >
                  {t.label}
                  {count !== null && data && (
                    <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      {formatCount(count)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {error ? (
            <ErrorState message="Search isn't working right now. Try again in a moment." />
          ) : isLoading && !data ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {["a", "b", "c", "d", "e", "f"].map((k) => (
                <BotCardSkeleton key={k} />
              ))}
            </div>
          ) : !data || total === 0 ? (
            <EmptyState icon={SearchX} title="No results">
              Try different keywords or fewer tags.
              {tags.length > 0 && (
                <button
                  type="button"
                  onClick={() => update({ tags: "" })}
                  className="mt-3 block w-full font-medium text-accent hover:underline"
                >
                  Clear tags
                </button>
              )}
            </EmptyState>
          ) : tab === "all" ? (
            <div
              className={[
                "space-y-10 transition-opacity",
                isLoading ? "opacity-60" : "",
              ].join(" ")}
            >
              {TYPES.filter((t) => resultsFor(data, t.key) > 0).map((t) => (
                <section key={t.key}>
                  <div className="mb-4 flex items-center justify-between gap-4">
                    <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                      {t.label}
                    </h2>
                    {countFor(data, t.key) > ALL_PREVIEW && (
                      <button
                        type="button"
                        onClick={() => update({ type: t.key })}
                        className="flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                      >
                        See all {formatCount(countFor(data, t.key))}{" "}
                        <ArrowRight size={14} />
                      </button>
                    )}
                  </div>
                  <ResultGrid data={data} type={t.key} limit={ALL_PREVIEW} />
                </section>
              ))}
            </div>
          ) : (
            <div
              className={[
                "transition-opacity",
                isLoading ? "opacity-60" : "",
              ].join(" ")}
            >
              <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
                {formatCountLabel(countFor(data, tab), "result")}
              </p>
              <ResultGrid data={data} type={tab} />
              {countFor(data, tab) > (data.per_page ?? 12) && (
                <div className="mt-8">
                  <Pagination
                    page={page}
                    total={countFor(data, tab)}
                    perPage={data.per_page ?? 12}
                    onPageChange={(p) => {
                      update({ page: p > 1 ? String(p) : "" }, false);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                  />
                </div>
              )}
            </div>
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
