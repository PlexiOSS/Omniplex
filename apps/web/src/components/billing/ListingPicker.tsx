"use client";

import { Check, ChevronDown, Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import type { IndexBot, IndexServer } from "@/lib/api/types";
import { mirroredAvatarUrl } from "@/lib/utils/assets";

export type ListingEntity = "bot" | "server";

export interface ListingOption {
  id: string;
  name: string;
  avatar: string;
  disabledReason?: string | null;
}

export function botOption(
  bot: IndexBot,
  disabledReason?: string | null,
): ListingOption {
  return {
    id: bot.bot_id,
    name: bot.user.username,
    avatar: mirroredAvatarUrl("bots", bot.bot_id, bot.user.avatar),
    disabledReason,
  };
}

export function serverOption(
  server: IndexServer,
  disabledReason?: string | null,
): ListingOption {
  return {
    id: server.server_id,
    name: server.name,
    avatar: mirroredAvatarUrl(
      "servers",
      server.server_id,
      server.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(server.name)}&size=64&background=random`,
    ),
    disabledReason,
  };
}

export function EntityToggle({
  value,
  onChange,
}: {
  value: ListingEntity;
  onChange: (value: ListingEntity) => void;
}) {
  return (
    <div className="flex w-fit items-center rounded-lg bg-zinc-100 p-0.5 text-sm dark:bg-zinc-800">
      {(["bot", "server"] as const).map((key) => (
        <button
          key={key}
          type="button"
          onClick={() => onChange(key)}
          aria-pressed={value === key}
          className={[
            "rounded-md px-4 py-1.5 font-medium transition-colors",
            value === key
              ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-950 dark:text-zinc-50"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
          ].join(" ")}
        >
          {key === "bot" ? "Bots" : "Servers"}
        </button>
      ))}
    </div>
  );
}

export function ListingPicker({
  entity,
  options,
  value,
  onChange,
}: {
  entity: ListingEntity;
  options: ListingOption[];
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const selected = options.find((o) => o.id === value);
  const needle = query.trim().toLowerCase();
  const filtered = options.filter(
    (o) => !needle || o.name.toLowerCase().includes(needle) || o.id === needle,
  );

  useEffect(() => {
    if (!open) return;
    searchRef.current?.focus();
    function onDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-left transition-colors hover:border-accent/40 dark:border-zinc-800 dark:bg-zinc-900"
      >
        {selected ? (
          <>
            <Avatar src={selected.avatar} alt={selected.name} size={28} />
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
              {selected.name}
            </span>
          </>
        ) : (
          <span className="flex-1 text-sm text-zinc-500 dark:text-zinc-400">
            Choose a {entity}
          </span>
        )}
        <ChevronDown
          size={15}
          className={[
            "shrink-0 text-zinc-400 transition-transform",
            open ? "rotate-180" : "",
          ].join(" ")}
        />
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-20 mt-1.5 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          {options.length > 6 && (
            <div className="flex items-center gap-2 border-b border-zinc-100 px-3 dark:border-zinc-800">
              <Search size={14} className="shrink-0 text-zinc-400" />
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search your ${entity}s`}
                className="w-full bg-transparent py-2.5 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-zinc-50"
              />
            </div>
          )}
          <ul className="max-h-72 overflow-y-auto p-1">
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No {entity}s match.
              </li>
            )}
            {filtered.map((o) => (
              <li key={o.id}>
                <button
                  type="button"
                  disabled={!!o.disabledReason}
                  onClick={() => {
                    onChange(o.id);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors enabled:hover:bg-zinc-100 disabled:cursor-not-allowed dark:enabled:hover:bg-zinc-800"
                >
                  <Avatar
                    src={o.avatar}
                    alt={o.name}
                    size={24}
                    className={o.disabledReason ? "opacity-50" : undefined}
                  />
                  <span
                    className={[
                      "min-w-0 flex-1 truncate text-sm",
                      o.disabledReason
                        ? "text-zinc-400 dark:text-zinc-500"
                        : "text-zinc-950 dark:text-zinc-50",
                    ].join(" ")}
                  >
                    {o.name}
                  </span>
                  {o.disabledReason ? (
                    <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                      {o.disabledReason}
                    </span>
                  ) : (
                    o.id === value && (
                      <Check size={14} className="shrink-0 text-accent" />
                    )
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
