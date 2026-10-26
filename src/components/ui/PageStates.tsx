"use client";

import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function LoadingState({ label = "Loading…" }: { label?: string }) {
  return (
    <output className="flex flex-col items-center justify-center gap-3 py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-accent dark:border-zinc-800 dark:border-t-accent" />
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{label}</p>
    </output>
  );
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center py-20 text-center">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
        <AlertTriangle size={18} className="text-red-600 dark:text-red-400" />
      </div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">{message}</p>
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
