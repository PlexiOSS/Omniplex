"use client";

import { SITE_URL } from "@omniplex/core/api/config";
import { Button } from "@omniplex/ui/Button";
import { Omi, type OmiMood } from "@omniplex/ui/Omi";
import { AlertTriangle, Lock, type LucideIcon, RefreshCw } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function AdminLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <output className="mx-auto flex max-w-5xl flex-col items-center justify-center gap-3 px-4 py-24">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-accent dark:border-zinc-800 dark:border-t-accent" />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
    </output>
  );
}

interface AdminErrorProps {
  message: string;
  onRetry?: () => void;
}

export function AdminError({ message, onRetry }: AdminErrorProps) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
        <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
      </div>
      <p className="font-medium text-zinc-950 dark:text-zinc-50">
        Something went wrong
      </p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
      <Button
        variant="secondary"
        size="sm"
        className="mt-4"
        onClick={onRetry ?? (() => window.location.reload())}
      >
        <RefreshCw size={14} />
        Try again
      </Button>
    </div>
  );
}

export function AdminNoAccess({ perm }: { perm: string }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-4 py-24 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
        <Lock size={18} className="text-zinc-500 dark:text-zinc-400" />
      </div>
      <p className="font-medium text-zinc-950 dark:text-zinc-50">
        You don't have access to this page
      </p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        It needs the{" "}
        <code className="rounded bg-zinc-100 px-1 py-0.5 font-mono text-xs dark:bg-zinc-800">
          {perm}
        </code>{" "}
        permission. Ask a manager if you think you should have it.
      </p>
      <Link
        href="/"
        className="mt-4 text-sm font-medium text-accent hover:underline"
      >
        Back to the overview
      </Link>
    </div>
  );
}

interface AdminEmptyProps {
  icon: LucideIcon;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  mascot?: OmiMood;
}

export function AdminEmpty({
  icon: Icon,
  title,
  description,
  action,
  mascot,
}: AdminEmptyProps) {
  return (
    <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-zinc-200 px-4 py-20 text-center dark:border-zinc-800">
      {mascot ? (
        <a
          href={`${SITE_URL}/about/omi`}
          target="_blank"
          rel="noopener noreferrer"
          title="Meet Omi"
          aria-label="Meet Omi"
          className="inline-flex rounded-2xl transition-transform hover:-rotate-3 hover:scale-105"
        >
          <Omi mood={mascot} size={120} />
        </a>
      ) : (
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
          <Icon size={19} className="text-zinc-400" />
        </div>
      )}
      <p className="mt-4 text-sm font-medium text-zinc-950 dark:text-zinc-50">
        {title}
      </p>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
