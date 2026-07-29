import type { ListStats } from "@/lib/api/types";
import { formatCount } from "@/lib/utils/format";
import { totalListedBots } from "@/lib/utils/stats";

interface StatsBarProps {
  stats: ListStats;
}

export function StatsBar({ stats }: StatsBarProps) {
  const entries = [
    { label: "Bots", value: totalListedBots(stats) },
    { label: "Users", value: stats.total_users },
    { label: "Votes Cast", value: stats.total_votes },
    { label: "Packs", value: stats.total_packs },
  ];

  return (
    <div className="grid grid-cols-2 divide-x divide-y divide-zinc-200 border-b border-zinc-200 sm:grid-cols-4 sm:divide-y-0 dark:divide-zinc-800 dark:border-zinc-800">
      {entries.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center px-6 py-5">
          <span className="text-2xl font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
            {formatCount(value)}
          </span>
          <span className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
