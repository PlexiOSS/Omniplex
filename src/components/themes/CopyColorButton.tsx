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
      className="flex w-full items-center justify-between gap-2 rounded-xl border border-zinc-200 px-4 py-2.5 text-sm transition-colors hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800"
    >
      <span className="flex items-center gap-2">
        <span
          className="h-4 w-4 shrink-0 rounded-full border border-black/10 dark:border-white/10"
          style={{ backgroundColor: color }}
        />
        <span className="font-medium text-zinc-950 dark:text-zinc-50">
          {label}
        </span>
        <code className="text-zinc-500 dark:text-zinc-400">{color}</code>
      </span>
      {copied ? (
        <Check size={14} className="shrink-0 text-accent" />
      ) : (
        <Copy size={14} className="shrink-0 text-zinc-400" />
      )}
    </button>
  );
}
