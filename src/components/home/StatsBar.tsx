import type { ListStats } from "@/lib/api/types";
import { formatCount } from "@/lib/utils/format";

const STAT_LABELS: { key: keyof ListStats; label: string }[] = [
  { key: "total_approved_bots", label: "Bots" },
  { key: "total_users", label: "Users" },
  { key: "total_votes", label: "Votes Cast" },
  { key: "total_packs", label: "Packs" },
];

interface StatsBarProps {
  stats: ListStats;
}

export function StatsBar({ stats }: StatsBarProps) {
  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-zinc-200 border-b border-zinc-200 sm:grid-cols-4 sm:divide-y-0 dark:divide-zinc-800 dark:border-zinc-800">
      {STAT_LABELS.map(({ key, label }) => (
        <div key={key} className="flex flex-col items-center px-6 py-5">
          <span className="text-2xl font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
            {formatCount(stats[key] as number)}
          </span>
          <span className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
