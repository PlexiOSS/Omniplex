"use client";

import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

interface DropdownProps {
  open: boolean;
  onClose: () => void;
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  /** Overrides the panel's default `w-44` sizing — for content wider than a
   * simple item list (e.g. the notification bell's alert previews). */
  panelClassName?: string;
}

/** Trigger + panel shell. Doesn't auto-close on item click — callers decide when, so a
 * multi-step item (like a delete confirmation) can keep the menu open across clicks. */
export function Dropdown({
  open,
  onClose,
  trigger,
  children,
  align = "right",
  panelClassName,
}: DropdownProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, onClose]);

  return (
    <div ref={ref} className="relative inline-block">
      {trigger}
      {open && (
        <div
          role="menu"
          className={[
            "absolute z-50 mt-1 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900",
            panelClassName ?? "w-44",
            align === "right" ? "right-0" : "left-0",
          ].join(" ")}
        >
          {children}
        </div>
      )}
    </div>
  );
}

interface DropdownItemProps {
  onClick: () => void;
  icon?: ReactNode;
  danger?: boolean;
  loading?: boolean;
  disabled?: boolean;
  children: ReactNode;
}

export function DropdownItem({
  onClick,
  icon,
  danger = false,
  loading = false,
  disabled = false,
  children,
}: DropdownItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled || loading}
      className={[
        "flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        danger
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
          : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800",
      ].join(" ")}
    >
      {icon}
      {children}
    </button>
  );
}
