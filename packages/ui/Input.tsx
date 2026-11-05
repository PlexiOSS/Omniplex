import type { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: ReactNode;
}

export function Input({
  label,
  error,
  icon,
  id,
  className = "",
  ...props
}: InputProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label
          htmlFor={id}
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
        </label>
      ) : null}
      <div className="relative">
        {icon ? (
          <div className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
            {icon}
          </div>
        ) : null}
        <input
          id={id}
          className={[
            "h-10 w-full rounded-xl border bg-white px-3 text-sm text-zinc-950 placeholder:text-zinc-400",
            "transition-colors outline-none",
            "border-zinc-200 focus:border-zinc-400",
            "dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600",
            "disabled:cursor-not-allowed disabled:opacity-50",
            icon ? "pl-9" : "",
            error ? "border-red-500 dark:border-red-500" : "",
            className,
          ].join(" ")}
          {...props}
        />
      </div>
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
