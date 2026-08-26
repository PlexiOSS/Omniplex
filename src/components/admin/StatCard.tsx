import type { ReactNode } from "react";
import { formatCount } from "@/lib/utils/format";

function CountBreakdown({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return (
      <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-600">No data.</p>
    );
  }
  return (
    <dl className="mt-3 space-y-1.5">
      {entries.map(([type, count]) => (
        <div
          key={type}
          className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400"
        >
          <dt className="capitalize">{type}</dt>
          <dd className="font-medium text-zinc-700 dark:text-zinc-300">
            {formatCount(count)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function StatCard({
  icon,
  label,
  value,
  counts,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  counts?: Record<string, number>;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-600">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        {formatCount(value)}
      </p>
      {counts && <CountBreakdown counts={counts} />}
    </div>
  );
}
