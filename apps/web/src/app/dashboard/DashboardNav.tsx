"use client";

import { ChevronDown, type LucideIcon } from "lucide-react";
import { useState } from "react";

export interface DashboardNavItem<K extends string> {
  key: K;
  label: string;
  icon: LucideIcon;
  count?: number | null;
}

export interface DashboardNavGroup<K extends string> {
  label: string;
  items: DashboardNavItem<K>[];
}

interface DashboardNavProps<K extends string> {
  groups: DashboardNavGroup<K>[];
  active: K;
  onSelect: (key: K) => void;
}

function NavList<K extends string>({
  groups,
  active,
  onSelect,
}: DashboardNavProps<K>) {
  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="mb-1 px-2.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.items.map(({ key, label, icon: Icon, count }) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={() => onSelect(key)}
                  aria-current={active === key ? "page" : undefined}
                  className={[
                    "relative flex w-full items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-left text-sm transition-colors",
                    active === key
                      ? "bg-accent/10 font-medium text-accent before:absolute before:inset-y-1.5 before:left-0 before:w-0.5 before:rounded-full before:bg-accent"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
                  ].join(" ")}
                >
                  <Icon size={15} className="shrink-0" />
                  <span className="min-w-0 flex-1 truncate">{label}</span>
                  {!!count && (
                    <span
                      className={[
                        "rounded-full px-1.5 py-0.5 text-[11px] font-medium tabular-nums",
                        active === key
                          ? "bg-accent/15 text-accent"
                          : "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                      ].join(" ")}
                    >
                      {count}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

export function DashboardNav<K extends string>({
  groups,
  active,
  onSelect,
}: DashboardNavProps<K>) {
  const [open, setOpen] = useState(false);
  const current = groups
    .flatMap((g) => g.items)
    .find((item) => item.key === active);
  const CurrentIcon = current?.icon;

  return (
    <>
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          className="flex w-full items-center gap-2.5 rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm font-medium text-zinc-950 transition-colors hover:border-accent/40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50"
        >
          {CurrentIcon && <CurrentIcon size={15} className="text-accent" />}
          <span className="flex-1 text-left">{current?.label}</span>
          <ChevronDown
            size={15}
            className={[
              "text-zinc-400 transition-transform",
              open ? "rotate-180" : "",
            ].join(" ")}
          />
        </button>
        {open && (
          <div className="mt-2 rounded-xl border border-zinc-200 bg-white p-2 dark:border-zinc-800 dark:bg-zinc-900">
            <NavList
              groups={groups}
              active={active}
              onSelect={(key) => {
                setOpen(false);
                onSelect(key);
              }}
            />
          </div>
        )}
      </div>

      <nav className="hidden rounded-xl border border-zinc-200 bg-white p-2 lg:block dark:border-zinc-800 dark:bg-zinc-900">
        <NavList groups={groups} active={active} onSelect={onSelect} />
      </nav>
    </>
  );
}
