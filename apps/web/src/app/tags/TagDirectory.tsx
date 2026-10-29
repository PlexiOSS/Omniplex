"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { ListTag } from "@/lib/api/types";
import { formatCount } from "@/lib/utils/format";

type Kind = "all" | "bots" | "servers";
type Sort = "popular" | "az";

interface TagDirectoryProps {
  tags: ListTag[];
}

const KINDS: { key: Kind; label: string }[] = [
  { key: "all", label: "All" },
  { key: "bots", label: "Bots" },
  { key: "servers", label: "Servers" },
];

function countFor(tag: ListTag, kind: Kind) {
  if (kind === "bots") return tag.bots;
  if (kind === "servers") return tag.servers;
  return tag.bots + tag.servers;
}

export function TagDirectory({ tags }: TagDirectoryProps) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<Kind>("all");
  const [sort, setSort] = useState<Sort>("popular");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return tags
      .filter((t) => countFor(t, kind) > 0)
      .filter((t) => !needle || t.tag.toLowerCase().includes(needle))
      .sort((a, b) =>
        sort === "az"
          ? a.tag.localeCompare(b.tag)
          : countFor(b, kind) - countFor(a, kind) || a.tag.localeCompare(b.tag),
      );
  }, [tags, query, kind, sort]);

  const popular = useMemo(
    () =>
      [...tags]
        .filter((t) => countFor(t, kind) > 0)
        .sort((a, b) => countFor(b, kind) - countFor(a, kind))
        .slice(0, 8),
    [tags, kind],
  );

  const showPopular = !query.trim() && sort === "popular";
  const rest = showPopular ? visible.slice(popular.length) : visible;

  return (
    <div className="mx-auto mt-8 max-w-5xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-900">
          <Search size={15} className="shrink-0 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter tags"
            aria-label="Filter tags"
            className="h-10 w-full bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-zinc-50"
          />
        </label>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg bg-zinc-100 p-0.5 text-sm dark:bg-zinc-800">
            {KINDS.map((k) => (
              <button
                key={k.key}
                type="button"
                onClick={() => setKind(k.key)}
                aria-pressed={kind === k.key}
                className={[
                  "rounded-md px-3 py-1.5 font-medium transition-colors",
                  kind === k.key
                    ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
                ].join(" ")}
              >
                {k.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setSort((s) => (s === "popular" ? "az" : "popular"))}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-600 transition-colors hover:border-accent/40 hover:text-accent dark:border-zinc-800 dark:text-zinc-300"
          >
            {sort === "popular" ? "Most used" : "A–Z"}
          </button>
        </div>
      </div>

      {showPopular && popular.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {popular.map((t) => (
            <Link
              key={t.tag}
              href={`/tags/${encodeURIComponent(t.tag)}`}
              className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 transition-colors hover:border-accent/40 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <p className="truncate font-semibold text-zinc-950 dark:text-zinc-50">
                {t.tag}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                {formatCount(countFor(t, kind))} listings
              </p>
            </Link>
          ))}
        </div>
      )}

      {visible.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No tags match &ldquo;{query}&rdquo;.
        </p>
      ) : (
        <div className="mt-6 flex min-w-0 flex-wrap gap-2">
          {rest.map((t) => (
            <Link
              key={t.tag}
              href={`/tags/${encodeURIComponent(t.tag)}`}
              className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-3 py-1 text-sm text-zinc-700 transition-colors hover:border-accent/40 hover:text-accent dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <span className="truncate">{t.tag}</span>
              <span className="text-xs tabular-nums text-zinc-400 dark:text-zinc-500">
                {formatCount(countFor(t, kind))}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
