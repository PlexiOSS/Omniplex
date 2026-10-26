"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { findAdminNav } from "./AdminSidebar";

interface AdminPageHeaderProps {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
}

export function AdminPageHeader({
  title,
  description,
  action,
}: AdminPageHeaderProps) {
  const pathname = usePathname();
  const nav = findAdminNav(pathname);
  const Icon = nav?.item.icon;

  return (
    <div className="flex flex-col gap-4 border-b border-zinc-200 pb-6 sm:flex-row sm:items-end sm:justify-between dark:border-zinc-800">
      <div className="flex min-w-0 items-start gap-4">
        {Icon && (
          <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/15 sm:flex">
            <Icon size={20} />
          </div>
        )}
        <div className="min-w-0">
          {nav && nav.group !== "General" && (
            <p className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              {nav.group}
            </p>
          )}
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50">
            {title}
          </h1>
          {description && (
            <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && (
        <div className="flex shrink-0 items-center gap-2">{action}</div>
      )}
    </div>
  );
}
