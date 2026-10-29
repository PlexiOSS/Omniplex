import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center rounded-xl border border-dashed border-zinc-300 px-6 py-16 text-center dark:border-zinc-700">
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-800">
        <Icon size={20} className="text-zinc-400" />
      </div>
      <p className="font-medium text-zinc-950 dark:text-zinc-50">{title}</p>
      {children && (
        <div className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {children}
        </div>
      )}
    </div>
  );
}
