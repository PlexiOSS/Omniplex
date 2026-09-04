import type { ReactNode } from "react";

interface StatRowProps {
  icon: ReactNode;
  label: string;
  value: string;
}

/** A single "label ... value" row inside a stats `dl` — used on bot/server
 * detail pages and the compare pages. */
export function StatRow({ icon, label, value }: StatRowProps) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
        {icon}
        {label}
      </span>
      <span className="font-medium text-zinc-950 dark:text-zinc-50">
        {value}
      </span>
    </div>
  );
}
