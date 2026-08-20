import type { ReactNode } from "react";

export type BadgeVariant =
  | "default"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "premium";

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  title?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  success: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
  warning:
    "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  danger: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
  info: "bg-accent/10 text-accent",
  premium: "bg-gradient-to-r from-amber-500 to-yellow-400 text-white",
};

export function Badge({
  variant = "default",
  children,
  className = "",
  title,
}: BadgeProps) {
  return (
    <span
      title={title}
      className={[
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        variantClasses[variant],
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}
