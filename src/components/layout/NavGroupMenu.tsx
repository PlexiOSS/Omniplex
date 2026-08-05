"use client";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { LucideIcon } from "lucide-react";

interface NavGroupMenuProps {
  label: string;
  icon?: LucideIcon;
  items: { href: string; label: string }[];
  /** Highlights the trigger when the current route matches one of the group's items. */
  active?: boolean;
  onNavigate?: () => void;
}

/** Trigger + link-list panel used for both the public "Create" menu and the
 * admin nav's grouped sections (Staff, Content) — outside-click/Escape close,
 * doesn't interfere with normal Link navigation. */
export function NavGroupMenu({
  label,
  icon: Icon,
  items,
  active = false,
  onNavigate,
}: NavGroupMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative hidden md:block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={[
          "flex h-8 items-center gap-1 rounded-lg px-2.5 text-sm font-medium transition-colors",
          active || open
            ? "bg-accent/10 text-accent"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
        ].join(" ")}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        {Icon && <Icon size={14} />}
        {label}
        <ChevronDown size={12} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 z-50 mt-2 w-44 overflow-hidden rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
        >
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onNavigate?.();
              }}
              className="block px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
