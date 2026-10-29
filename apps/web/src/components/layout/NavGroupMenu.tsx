"use client";

import { ArrowUpRight, ChevronDown, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export interface NavMenuItem {
  href: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
}

export interface NavMenuSection {
  title?: string;
  items: NavMenuItem[];
}

interface NavGroupMenuProps {
  label: string;
  icon?: LucideIcon;
  items?: NavMenuItem[];
  sections?: NavMenuSection[];
  active?: boolean;
  align?: "start" | "center" | "end";
  onNavigate?: () => void;
}

function isExternal(href: string) {
  return /^https?:\/\//.test(href);
}

export function NavGroupMenu({
  label,
  icon: Icon,
  items,
  sections,
  active = false,
  align = "end",
  onNavigate,
}: NavGroupMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const groups: NavMenuSection[] = sections ?? [{ items: items ?? [] }];
  const rich = groups.some((g) => g.items.some((i) => i.icon || i.description));
  const columns = groups.length;

  useEffect(() => {
    if (!open) return;
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node))
        setOpen(false);
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

  const position =
    align === "start"
      ? "left-0"
      : align === "center"
        ? "left-1/2 -translate-x-1/2"
        : "right-0";
  const width = !rich
    ? "w-44"
    : columns >= 3
      ? "w-[46rem]"
      : columns === 2
        ? "w-[34rem]"
        : "w-72";

  function close() {
    setOpen(false);
    onNavigate?.();
  }

  return (
    <div ref={ref} className="relative">
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
        <ChevronDown
          size={12}
          className={["transition-transform", open ? "rotate-180" : ""].join(
            " ",
          )}
        />
      </button>
      {open && (
        <div
          role="menu"
          className={[
            "absolute z-50 mt-2 max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900",
            position,
            width,
            rich ? "p-2" : "py-1",
          ].join(" ")}
        >
          {rich ? (
            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
              }}
            >
              {groups.map((group, gi) => (
                <div key={group.title ?? gi} className="min-w-0">
                  {group.title && (
                    <p className="px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-wide text-zinc-400 uppercase dark:text-zinc-500">
                      {group.title}
                    </p>
                  )}
                  {group.items.map((item) => {
                    const ItemIcon = item.icon;
                    const external = isExternal(item.href);
                    const content = (
                      <>
                        {ItemIcon && (
                          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 transition-colors group-hover/item:bg-accent/10 group-hover/item:text-accent dark:bg-zinc-800 dark:text-zinc-400">
                            <ItemIcon size={15} />
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1 text-sm font-medium text-zinc-900 dark:text-zinc-100">
                            {item.label}
                            {external && (
                              <ArrowUpRight
                                size={12}
                                className="text-zinc-400"
                              />
                            )}
                          </span>
                          {item.description && (
                            <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                              {item.description}
                            </span>
                          )}
                        </span>
                      </>
                    );
                    const className =
                      "group/item flex items-center gap-3 rounded-xl px-2.5 py-2 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60";
                    return external ? (
                      <a
                        key={item.href}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        role="menuitem"
                        onClick={close}
                        className={className}
                      >
                        {content}
                      </a>
                    ) : (
                      <Link
                        key={item.href}
                        href={item.href}
                        role="menuitem"
                        onClick={close}
                        className={className}
                      >
                        {content}
                      </Link>
                    );
                  })}
                </div>
              ))}
            </div>
          ) : (
            groups
              .flatMap((g) => g.items)
              .map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={close}
                  className="block px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  {item.label}
                </Link>
              ))
          )}
        </div>
      )}
    </div>
  );
}
