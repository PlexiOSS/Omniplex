"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { BotCard } from "@/components/cards/BotCard";
import { ServerCard } from "@/components/cards/ServerCard";
import { BotCardSkeleton } from "@/components/ui/Skeleton";
import { useBotIndex } from "@/hooks/useBots";
import { useServerIndex } from "@/hooks/useServers";

type Kind = "bots" | "servers";
type Shelf = "most_viewed" | "top_voted" | "recently_added" | "certified";

const SHELVES: { key: Shelf; label: string }[] = [
  { key: "most_viewed", label: "Popular" },
  { key: "top_voted", label: "Top voted" },
  { key: "certified", label: "Certified" },
  { key: "recently_added", label: "New" },
];

const pill = (active: boolean) =>
  [
    "h-8 rounded-lg px-3 text-sm font-medium transition-colors",
    active
      ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
  ].join(" ");

export function SearchDiscover() {
  const [kind, setKind] = useState<Kind>("bots");
  const [shelf, setShelf] = useState<Shelf>("most_viewed");
  const botIndex = useBotIndex();
  const serverIndex = useServerIndex();

  const loading = kind === "bots" ? botIndex.isLoading : serverIndex.isLoading;
  const bots = (botIndex.data?.[shelf] ?? [])
    .filter((b) => shelf !== "top_voted" || b.approximate_votes > 0)
    .slice(0, 6);
  const servers = (serverIndex.data?.[shelf] ?? [])
    .filter((sv) => shelf !== "top_voted" || sv.approximate_votes > 0)
    .slice(0, 6);
  const empty = kind === "bots" ? bots.length === 0 : servers.length === 0;

  return (
    <section className="mx-auto mt-14 max-w-4xl">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Discover
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-950">
            {SHELVES.map((s) => (
              <button
                key={s.key}
                type="button"
                aria-pressed={shelf === s.key}
                onClick={() => setShelf(s.key)}
                className={pill(shelf === s.key)}
              >
                {s.label}
              </button>
            ))}
          </div>
          <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-950">
            {(["bots", "servers"] as const).map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={kind === k}
                onClick={() => setKind(k)}
                className={pill(kind === k)}
              >
                {k === "bots" ? "Bots" : "Servers"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {["a", "b", "c"].map((k) => (
            <BotCardSkeleton key={k} />
          ))}
        </div>
      ) : empty ? (
        <p className="rounded-2xl border border-dashed border-zinc-200 px-4 py-10 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          {shelf === "top_voted"
            ? "Nothing has been voted for yet this month."
            : "Nothing here yet."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {kind === "bots"
            ? bots.map((bot) => <BotCard key={bot.bot_id} bot={bot} />)
            : servers.map((server) => (
                <ServerCard key={server.server_id} server={server} />
              ))}
        </div>
      )}

      <div className="mt-4 flex justify-center">
        <Link
          href={kind === "bots" ? "/bots" : "/servers"}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
        >
          Browse all {kind}
          <ArrowRight size={14} />
        </Link>
      </div>
    </section>
  );
}
