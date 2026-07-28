import type { ReactNode } from "react";

type Variant = "default" | "success" | "warning" | "danger" | "info" | "premium";

interface BadgeProps {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}

const variantClasses: Record<Variant, string> = {
  default:
    "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  success:
    "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
  warning:
    "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  danger:
    "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
  info:
    "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  premium:
    "bg-gradient-to-r from-amber-500 to-yellow-400 text-white",
};

export function Badge({
  variant = "default",
  children,
  className = "",
}: BadgeProps) {
  return (
    <span
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
