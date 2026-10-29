import type { ReactNode } from "react";
import { badgeColor, badgeIcon } from "@/lib/constants/badgeIcons";

const TILE: Record<ReturnType<typeof badgeColor>, string> = {
  default:
    "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
  success:
    "bg-green-50 text-green-600 ring-green-200 dark:bg-green-950 dark:text-green-400 dark:ring-green-900",
  warning:
    "bg-yellow-50 text-yellow-600 ring-yellow-200 dark:bg-yellow-950 dark:text-yellow-400 dark:ring-yellow-900",
  danger:
    "bg-red-50 text-red-600 ring-red-200 dark:bg-red-950 dark:text-red-400 dark:ring-red-900",
  info: "bg-accent/10 text-accent ring-accent/20",
  premium:
    "bg-linear-to-br from-amber-500 to-yellow-400 text-white ring-amber-300/50",
};

interface BadgeTileProps {
  icon: string;
  color: string;
  size?: "sm" | "md";
}

export function BadgeTile({ icon, color, size = "sm" }: BadgeTileProps) {
  const Icon = badgeIcon(icon);
  return (
    <span
      className={[
        "flex shrink-0 items-center justify-center rounded-xl ring-1",
        size === "md" ? "h-11 w-11" : "h-9 w-9",
        TILE[badgeColor(color)],
      ].join(" ")}
    >
      <Icon size={size === "md" ? 20 : 16} />
    </span>
  );
}

interface BadgeRowProps {
  name: string;
  description?: string;
  icon: string;
  color: string;
  children?: ReactNode;
}

export function BadgeRow({
  name,
  description,
  icon,
  color,
  children,
}: BadgeRowProps) {
  return (
    <div className="flex min-w-0 items-start gap-3">
      <BadgeTile icon={icon} color={color} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          {name}
        </p>
        {description && (
          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
