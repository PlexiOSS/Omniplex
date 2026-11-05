import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-accent text-accent-fg hover:bg-accent-muted",
  secondary:
    "border border-zinc-200 text-zinc-900 hover:border-accent/40 hover:bg-accent/5 hover:text-accent dark:border-zinc-800 dark:text-zinc-50 dark:hover:border-accent/40 dark:hover:bg-accent/10",
  ghost:
    "text-zinc-600 hover:text-accent hover:bg-accent/5 dark:text-zinc-400 dark:hover:text-accent dark:hover:bg-accent/10",
  danger:
    "bg-red-600 text-white hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-8 px-3 text-sm rounded-lg",
  md: "h-10 px-4 text-sm rounded-xl",
  lg: "h-12 px-6 text-base rounded-xl",
};

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  disabled,
  className = "",
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={[
        "inline-flex items-center justify-center gap-2 font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
        "disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
      {...props}
    >
      {loading ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      ) : null}
      {children}
    </button>
  );
}
