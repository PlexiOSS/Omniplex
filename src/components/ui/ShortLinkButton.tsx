"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";

interface ShortLinkButtonProps {
  url: string;
}

export function ShortLinkButton({ url }: ShortLinkButtonProps) {
  const [copied, setCopied] = useState(false);
  const display = url.replace(/^https?:\/\//, "");

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link", url);
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`Copy ${display}`}
      className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
    >
      {copied ? (
        <Check size={14} className="text-emerald-500" />
      ) : (
        <Link2 size={14} />
      )}
      {copied ? "Copied!" : "Short link"}
    </button>
  );
}
