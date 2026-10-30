import { Inbox } from "lucide-react";
import type { ReactNode } from "react";

export const ADMIN_LIST_CLASS =
  "mt-6 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900";

export const ADMIN_ROW_CLASS =
  "px-4 py-3.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40";

interface AdminListRowProps {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function AdminListRow({
  children,
  actions,
  className,
}: AdminListRowProps) {
  return (
    <div
      className={["group flex items-center gap-3", ADMIN_ROW_CLASS, className]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {actions && (
        <div className="flex shrink-0 items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
          {actions}
        </div>
      )}
    </div>
  );
}

export function AdminEmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center px-4 py-12 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <Inbox size={18} className="text-zinc-400" />
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
    </div>
  );
}
