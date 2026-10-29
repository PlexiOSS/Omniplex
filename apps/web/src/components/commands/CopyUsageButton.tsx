"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

interface CopyUsageButtonProps {
  value: string;
}

export function CopyUsageButton({ value }: CopyUsageButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={copied ? "Copied" : "Copy usage"}
      title={copied ? "Copied" : "Copy usage"}
      className="shrink-0 rounded-md p-1 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-200"
    >
      {copied ? (
        <Check size={13} className="text-accent" />
      ) : (
        <Copy size={13} />
      )}
    </button>
  );
}
