"use client";

import { Search } from "lucide-react";

export type OwnershipFilter = "all" | "mine" | "team";
export type StatusFilter = "all" | "live" | "review" | "denied";
export type ListingSort = "votes" | "name" | "newest";

export const LIVE_TYPES = new Set(["approved", "certified"]);
export const REVIEW_TYPES = new Set(["pending", "under_review", "claimed"]);
export const DENIED_TYPES = new Set(["denied", "banned"]);

export function matchesStatus(type: string, status: StatusFilter): boolean {
  if (status === "all") return true;
  if (status === "live") return LIVE_TYPES.has(type);
  if (status === "review") return REVIEW_TYPES.has(type);
  return DENIED_TYPES.has(type);
}

interface Chip<K extends string> {
  key: K;
  label: string;
  count: number;
}

function ChipRow<K extends string>({
  chips,
  active,
  onChange,
}: {
  chips: Chip<K>[];
  active: K;
  onChange: (key: K) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => onChange(chip.key)}
          aria-pressed={active === chip.key}
          className={[
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            active === chip.key
              ? "border-accent/40 bg-accent/10 text-accent"
              : "border-zinc-200 text-zinc-600 hover:border-accent/40 hover:text-accent dark:border-zinc-700 dark:text-zinc-300",
          ].join(" ")}
        >
          {chip.label}
          <span className="ml-1.5 tabular-nums opacity-70">{chip.count}</span>
        </button>
      ))}
    </div>
  );
}

interface ListingFiltersProps {
  query: string;
  onQuery: (q: string) => void;
  placeholder: string;
  sort: ListingSort;
  onSort: (s: ListingSort) => void;
  status: StatusFilter;
  onStatus: (s: StatusFilter) => void;
  statusCounts: Record<StatusFilter, number>;
  ownership?: OwnershipFilter;
  onOwnership?: (o: OwnershipFilter) => void;
  ownershipCounts?: Record<OwnershipFilter, number>;
}

export function ListingFilters({
  query,
  onQuery,
  placeholder,
  sort,
  onSort,
  status,
  onStatus,
  statusCounts,
  ownership,
  onOwnership,
  ownershipCounts,
}: ListingFiltersProps) {
  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            size={14}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => onQuery(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className="w-full rounded-lg border border-zinc-200 bg-white py-2 pr-3 pl-9 text-sm text-zinc-950 placeholder:text-zinc-400 focus:border-accent/50 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => onSort(e.target.value as ListingSort)}
          aria-label="Sort"
          className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-700 focus:border-accent/50 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
        >
          <option value="votes">Most votes</option>
          <option value="name">Name</option>
          <option value="newest">Newest</option>
        </select>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {ownership && onOwnership && ownershipCounts && (
          <ChipRow
            active={ownership}
            onChange={onOwnership}
            chips={[
              { key: "all", label: "All", count: ownershipCounts.all },
              { key: "mine", label: "Yours", count: ownershipCounts.mine },
              {
                key: "team",
                label: "Through teams",
                count: ownershipCounts.team,
              },
            ]}
          />
        )}
        <ChipRow
          active={status}
          onChange={onStatus}
          chips={(
            [
              { key: "all", label: "Any status", count: statusCounts.all },
              { key: "live", label: "Live", count: statusCounts.live },
              { key: "review", label: "In review", count: statusCounts.review },
              { key: "denied", label: "Denied", count: statusCounts.denied },
            ] as Chip<StatusFilter>[]
          ).filter((c) => c.key === "all" || c.count > 0)}
        />
      </div>
    </div>
  );
}
