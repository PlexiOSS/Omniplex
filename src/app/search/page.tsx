"use client";

import { ArrowRight, Search, X } from "lucide-react";
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
import { BotCardSkeleton } from "@/components/ui/Skeleton";
import { search } from "@/lib/api";
import type { SearchResponse } from "@/lib/api/types";
import { BOT_TAGS } from "@/lib/constants/tags";
import { formatCount, formatCountLabel } from "@/lib/utils/format";

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
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Search
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Find bots, servers, teams, and packs by name, description, or tags.
        </p>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          update({ q: input.trim() });
        }}
        className="relative"
      >
        <Search
          size={16}
          className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-zinc-400"
        />
        <input
          type="search"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Search by name, description, ID or vanity URL"
          aria-label="Search"
          // biome-ignore lint/a11y/noAutofocus: the page exists to search
          autoFocus
          className="w-full rounded-xl border border-zinc-200 bg-white py-3 pr-4 pl-11 text-base text-zinc-950 placeholder:text-zinc-400 focus:border-accent/50 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
        />
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {BOT_TAGS.map((tag) => {
          const on = tags.some((t) => t.toLowerCase() === tag.toLowerCase());
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              aria-pressed={on}
              className={[
                "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                on
                  ? "border-accent/40 bg-accent/10 text-accent"
                  : "border-zinc-200 bg-white text-zinc-600 hover:border-accent/40 hover:text-accent dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300",
              ].join(" ")}
            >
              {tag}
            </button>
          );
        })}
        {unknownTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => toggleTag(tag)}
            className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-3 py-1 text-xs font-medium text-accent"
          >
            {tag}
            <X size={12} />
          </button>
        ))}
      </div>

      {matchedQuickLinks.length > 0 && (
        <div className="mt-6 space-y-2">
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
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              href: "/bots",
              title: "Browse bots",
              body: "Sort by votes, trending, newest or size.",
            },
            {
              href: "/servers",
              title: "Browse servers",
              body: "Find a community to join.",
            },
            {
              href: "/collections",
              title: "Collections",
              body: "Best-of lists by tag, ranked by votes.",
            },
            {
              href: "/commands",
              title: "Command Directory",
              body: "Search every bot's commands at once.",
            },
          ].map((card) => (
            <Link
              key={card.href}
              href={card.href}
              className="group rounded-xl border border-zinc-200 bg-white p-5 transition-colors hover:border-accent/40 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <p className="font-semibold text-zinc-950 transition-colors group-hover:text-accent dark:text-zinc-50">
                {card.title}
              </p>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {card.body}
              </p>
            </Link>
          ))}
        </div>
      ) : (
        <div className="mt-8">
          <div className="mb-6 flex overflow-x-auto overflow-y-hidden border-b border-zinc-200 dark:border-zinc-800">
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
                  className={[
                    "-mb-px flex shrink-0 items-center gap-1.5 border-b-2 px-3 pb-3 text-sm font-medium transition-colors",
                    tab === t.key
                      ? "border-accent text-accent"
                      : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
                  ].join(" ")}
                >
                  {t.label}
                  {count !== null && data && (
                    <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
                      {formatCount(count)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {error ? (
            <p className="py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Search isn&apos;t working right now. Try again in a moment.
            </p>
          ) : isLoading && !data ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {["a", "b", "c", "d", "e", "f"].map((k) => (
                <BotCardSkeleton key={k} />
              ))}
            </div>
          ) : !data || total === 0 ? (
            <div className="py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
              <p>No results. Try different keywords or fewer tags.</p>
              {tags.length > 0 && (
                <button
                  type="button"
                  onClick={() => update({ tags: "" })}
                  className="mt-3 font-medium text-accent hover:underline"
                >
                  Clear tags
                </button>
              )}
            </div>
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
