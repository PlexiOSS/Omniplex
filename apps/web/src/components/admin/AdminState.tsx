"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

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
