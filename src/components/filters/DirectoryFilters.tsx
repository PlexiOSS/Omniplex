"use client";

import { Search, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/Input";
import { BOT_TAGS } from "@/lib/constants/tags";

interface DirectoryFiltersProps {
  query: string;
  searchPlaceholder: string;
  tag: string;
  botLabel: string | null;
  onQueryChange: (query: string) => void;
  onTagChange: (tag: string) => void;
  onClearBot: () => void;
  onClearAll: () => void;
}

const chip =
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors";
const chipIdle =
  "bg-zinc-100 text-zinc-700 hover:bg-accent/10 hover:text-accent dark:bg-zinc-800 dark:text-zinc-300";
const chipActive =
  "bg-accent/10 text-accent ring-1 ring-accent/30 hover:bg-accent/20";

export function DirectoryFilters({
  query,
  searchPlaceholder,
  tag,
  botLabel,
  onQueryChange,
  onTagChange,
  onClearBot,
  onClearAll,
}: DirectoryFiltersProps) {
  const [draft, setDraft] = useState(query);

  useEffect(() => {
    setDraft(query);
  }, [query]);

  useEffect(() => {
    if (draft.trim() === query) return;
    const timer = setTimeout(() => onQueryChange(draft.trim()), 300);
    return () => clearTimeout(timer);
  }, [draft, query, onQueryChange]);

  const hasFilters = !!query || !!tag || !!botLabel;

  return (
    <div className="space-y-4">
      <Input
        type="search"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        placeholder={searchPlaceholder}
        maxLength={100}
        icon={<Search size={15} />}
        aria-label={searchPlaceholder}
      />

      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2">
          {botLabel && (
            <button
              type="button"
              onClick={onClearBot}
              className={[chip, chipActive].join(" ")}
            >
              From {botLabel}
              <X size={12} />
            </button>
          )}
          <button
            type="button"
            onClick={onClearAll}
            className="text-xs text-zinc-500 underline-offset-2 hover:text-zinc-900 hover:underline dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Clear all
          </button>
        </div>
      )}

      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
          Tags
        </p>
        <div className="flex flex-wrap gap-1.5">
          {BOT_TAGS.map((t) => {
            const active = tag.toLowerCase() === t.toLowerCase();
            return (
              <button
                key={t}
                type="button"
                aria-pressed={active}
                onClick={() => onTagChange(active ? "" : t)}
                className={[chip, active ? chipActive : chipIdle].join(" ")}
              >
                {t}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
