"use client";

import { search } from "@omniplex/core/api";
import { mirroredAvatarUrl } from "@omniplex/core/utils/assets";
import { Avatar } from "@omniplex/ui/Avatar";
import { Search, X } from "lucide-react";
import { useState } from "react";

export interface GiftTarget {
  id: string;
  name: string;
  avatar: string;
  premium: boolean;
}

interface GiftPickerProps {
  entity: "bot" | "server";
  value: GiftTarget | null;
  onChange: (target: GiftTarget | null) => void;
  message: string;
  onMessageChange: (message: string) => void;
  anonymous: boolean;
  onAnonymousChange: (anonymous: boolean) => void;
}

export function GiftPicker({
  entity,
  value,
  onChange,
  message,
  onMessageChange,
  anonymous,
  onAnonymousChange,
}: GiftPickerProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GiftTarget[] | null>(null);
  const [searching, setSearching] = useState(false);

  async function run() {
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    try {
      const res = await search.search({ query: q, target_types: [entity] });
      setResults(
        entity === "bot"
          ? (res.bots ?? []).map((b) => ({
              id: b.bot_id,
              name: b.user.username,
              avatar: mirroredAvatarUrl("bots", b.bot_id, b.user.avatar),
              premium: b.premium,
            }))
          : (res.servers ?? []).map((s) => ({
              id: s.server_id,
              name: s.name,
              avatar: mirroredAvatarUrl("servers", s.server_id, s.avatar),
              premium: s.premium,
            })),
      );
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  return (
    <div className="space-y-4">
      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-accent/40 bg-accent/5 p-3">
          <Avatar src={value.avatar} alt={value.name} size={36} />
          <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
            {value.name}
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Choose a different listing"
            className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              run();
            }}
            className="flex gap-2"
          >
            <label className="flex h-10 min-w-0 flex-1 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 dark:border-zinc-800 dark:bg-zinc-950">
              <Search size={14} className="shrink-0 text-zinc-400" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search for a ${entity} to gift`}
                aria-label={`Search for a ${entity} to gift`}
                className="w-full bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-zinc-50"
              />
            </label>
            <button
              type="submit"
              disabled={!query.trim() || searching}
              className="h-10 shrink-0 rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition-colors hover:border-accent/40 hover:text-accent disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-300"
            >
              {searching ? "Searching…" : "Search"}
            </button>
          </form>
          {results && (
            <ul className="mt-2 max-h-72 divide-y divide-zinc-100 overflow-y-auto rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
              {results.length === 0 && (
                <li className="px-3 py-4 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No {entity}s found.
                </li>
              )}
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    disabled={r.premium}
                    onClick={() => {
                      onChange(r);
                      setResults(null);
                      setQuery("");
                    }}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-zinc-800/50"
                  >
                    <Avatar src={r.avatar} alt={r.name} size={28} />
                    <span className="min-w-0 flex-1 truncate text-sm text-zinc-950 dark:text-zinc-50">
                      {r.name}
                    </span>
                    {r.premium && (
                      <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                        Already premium
                      </span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="gift-message"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Message to the owners{" "}
          <span className="font-normal text-zinc-400">(optional)</span>
        </label>
        <textarea
          id="gift-message"
          value={message}
          maxLength={300}
          rows={2}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Love the bot, keep it up!"
          className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-accent/50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
        />
      </div>

      <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={anonymous}
          onChange={(e) => onAnonymousChange(e.target.checked)}
          className="h-4 w-4 accent-accent"
        />
        Gift anonymously (the owners won&apos;t see your name)
      </label>
    </div>
  );
}
