import type { ReactNode } from "react";

interface AdminListRowProps {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function AdminListRow({ children, actions, className }: AdminListRowProps) {
  return (
    <div
      className={[
        "flex items-center gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="min-w-0 flex-1">{children}</div>
      {actions && (
        <div className="flex shrink-0 items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export function AdminEmptyState({ message }: { message: string }) {
  return <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>;
}
