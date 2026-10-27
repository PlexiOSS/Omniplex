"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CopyColorButtonProps {
  label: string;
  color: string;
}

export function CopyColorButton({ label, color }: CopyColorButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(color);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard API unavailable -- silently no-op
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group flex w-full min-w-0 items-center gap-3 rounded-xl border border-zinc-200 bg-white p-2 pr-3 text-left transition-colors hover:border-accent/40 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <span
        className="h-11 w-11 shrink-0 rounded-lg ring-1 ring-black/10 dark:ring-white/10"
        style={{ backgroundColor: color }}
      />
      <span className="min-w-0 flex-1">
        <span className="block text-xs text-zinc-500 dark:text-zinc-400">
          {label}
        </span>
        <code className="block font-mono text-sm font-medium text-zinc-950 dark:text-zinc-50">
          {color}
        </code>
      </span>
      <span className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg px-2 text-xs font-medium text-zinc-500 transition-colors group-hover:bg-zinc-100 group-hover:text-zinc-900 dark:text-zinc-400 dark:group-hover:bg-zinc-800 dark:group-hover:text-zinc-100">
        {copied ? (
          <Check size={13} className="text-emerald-500" />
        ) : (
          <Copy size={13} />
        )}
        {copied ? "Copied" : "Copy"}
      </span>
    </button>
  );
}
