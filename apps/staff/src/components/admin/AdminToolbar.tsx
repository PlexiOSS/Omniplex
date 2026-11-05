"use client";

import { Search, X } from "lucide-react";
import type { ReactNode } from "react";

export function AdminToolbar({ children }: { children: ReactNode }) {
  return (
    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
      {children}
    </div>
  );
}

interface AdminSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function AdminSearch({
  value,
  onChange,
  placeholder = "Search",
}: AdminSearchProps) {
  return (
    <label className="flex min-w-0 flex-1 items-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 transition-colors focus-within:border-accent/50 dark:border-zinc-800 dark:bg-zinc-900">
      <Search size={14} className="shrink-0 text-zinc-400" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-9 w-full bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-zinc-50"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
          className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200"
        >
          <X size={14} />
        </button>
      )}
    </label>
  );
}

interface FilterChip<K extends string> {
  key: K;
  label: string;
  count?: number;
  tone?: "default" | "danger" | "warning";
}

interface AdminFilterChipsProps<K extends string> {
  chips: FilterChip<K>[];
  value: K;
  onChange: (key: K) => void;
}

export function AdminFilterChips<K extends string>({
  chips,
  value,
  onChange,
}: AdminFilterChipsProps<K>) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => {
        const active = chip.key === value;
        const toned =
          chip.tone === "danger"
            ? "text-red-600 dark:text-red-400"
            : chip.tone === "warning"
              ? "text-amber-600 dark:text-amber-400"
              : "";
        return (
          <button
            key={chip.key}
            type="button"
            onClick={() => onChange(chip.key)}
            aria-pressed={active}
            className={[
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              active
                ? "border-accent bg-accent/10 text-accent"
                : `border-zinc-200 bg-white hover:border-accent/40 dark:border-zinc-800 dark:bg-zinc-900 ${toned || "text-zinc-600 dark:text-zinc-300"}`,
            ].join(" ")}
          >
            {chip.label}
            {chip.count !== undefined && (
              <span className="tabular-nums opacity-70">{chip.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
