"use client";

import { ArrowLeft, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";
import { Avatar } from "@/components/ui/Avatar";
import { DashboardNav, type DashboardNavGroup } from "../DashboardNav";

interface ManageShellProps<K extends string> {
  backHref: string;
  backLabel: string;
  name: string;
  avatar: string;
  badges?: ReactNode;
  viewHref: string;
  groups: DashboardNavGroup<K>[];
  active: K;
  children: ReactNode;
}

export function useSection<K extends string>(valid: readonly K[], fallback: K) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const raw = searchParams.get("section");
  const active = (valid as readonly string[]).includes(raw ?? "")
    ? (raw as K)
    : fallback;
  const select = (key: K) => {
    router.replace(key === fallback ? pathname : `${pathname}?section=${key}`, {
      scroll: false,
    });
    window.scrollTo({ top: 0 });
  };
  return [active, select] as const;
}

export function ManageShell<K extends string>({
  backHref,
  backLabel,
  name,
  avatar,
  badges,
  viewHref,
  groups,
  active,
  children,
  onSelect,
}: ManageShellProps<K> & { onSelect: (key: K) => void }) {
  const activeLabel =
    groups.flatMap((g) => g.items).find((i) => i.key === active)?.label ?? "";

  return (
    <Container className="py-10">
      <Link
        href={backHref}
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        {backLabel}
      </Link>

      <div className="grid gap-8 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900">
            <Avatar src={avatar} alt={name} size={40} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                {name}
              </p>
              <Link
                href={viewHref}
                className="inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
              >
                View page <ArrowUpRight size={11} />
              </Link>
            </div>
          </div>
          {badges && (
            <div className="mb-4 flex flex-wrap gap-1.5">{badges}</div>
          )}
          <DashboardNav groups={groups} active={active} onSelect={onSelect} />
        </aside>

        <div className="min-w-0">
          <h1 className="mb-6 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
            {activeLabel}
          </h1>
          {children}
        </div>
      </div>
    </Container>
  );
}

export function SettingsCard({
  title,
  description,
  children,
  footer,
  tone = "default",
}: {
  title: string;
  description?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  tone?: "default" | "danger";
}) {
  return (
    <section
      className={[
        "overflow-hidden rounded-xl border bg-white dark:bg-zinc-900",
        tone === "danger"
          ? "border-red-200 dark:border-red-900/60"
          : "border-zinc-200 dark:border-zinc-800",
      ].join(" ")}
    >
      <div className="p-5">
        <h2
          className={[
            "font-semibold",
            tone === "danger"
              ? "text-red-600 dark:text-red-400"
              : "text-zinc-950 dark:text-zinc-50",
          ].join(" ")}
        >
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {description}
          </p>
        )}
        {children && <div className="mt-4 space-y-5">{children}</div>}
      </div>
      {footer && (
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-zinc-100 bg-zinc-50/60 px-5 py-3 dark:border-zinc-800 dark:bg-zinc-950/40">
          {footer}
        </div>
      )}
    </section>
  );
}

export function TextArea({
  id,
  label,
  hint,
  value,
  onChange,
  rows = 3,
  maxLength,
  required,
}: {
  id: string;
  label: string;
  hint?: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
  maxLength?: number;
  required?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
      >
        {label}
      </label>
      <textarea
        id={id}
        rows={rows}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
      />
      {(hint || maxLength) && (
        <p className="flex justify-between gap-2 text-xs text-zinc-400 dark:text-zinc-500">
          <span>{hint}</span>
          {maxLength && (
            <span className="tabular-nums">
              {value.length}/{maxLength}
            </span>
          )}
        </p>
      )}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
      />
      <span>
        <span className="block text-sm text-zinc-800 dark:text-zinc-200">
          {label}
        </span>
        {description && (
          <span className="block text-xs text-zinc-500 dark:text-zinc-400">
            {description}
          </span>
        )}
      </span>
    </label>
  );
}

export function FormMessage({
  error,
  success,
}: {
  error?: string | null;
  success?: string | null;
}) {
  if (error) {
    return (
      <p className="mr-auto text-sm text-red-600 dark:text-red-400">{error}</p>
    );
  }
  if (success) {
    return (
      <p className="mr-auto text-sm text-emerald-600 dark:text-emerald-400">
        {success}
      </p>
    );
  }
  return null;
}

export function StatGrid({
  stats,
}: {
  stats: { label: string; value: string }[];
}) {
  return (
    <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <div
          key={s.label}
          className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <dd className="text-xl font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
            {s.value}
          </dd>
          <dt className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
            {s.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}
