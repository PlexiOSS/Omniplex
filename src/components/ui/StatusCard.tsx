import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type Tone = "accent" | "success" | "warning" | "danger" | "neutral";

const TONES: Record<Tone, string> = {
  accent: "bg-accent/10 text-accent ring-accent/15",
  success:
    "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
  warning:
    "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400",
  danger: "bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-400",
  neutral:
    "bg-zinc-100 text-zinc-500 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:ring-zinc-700",
};

interface StatusCardProps {
  icon: LucideIcon;
  tone?: Tone;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  children?: ReactNode;
}

export function StatusCard({
  icon: Icon,
  tone = "accent",
  title,
  description,
  actions,
  children,
}: StatusCardProps) {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
      <div
        className={`mx-auto flex h-12 w-12 items-center justify-center rounded-xl ring-1 ${TONES[tone]}`}
      >
        <Icon size={22} />
      </div>
      <h1 className="mt-4 text-xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
        {title}
      </h1>
      {description && (
        <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </div>
      )}
      {children}
      {actions && (
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
