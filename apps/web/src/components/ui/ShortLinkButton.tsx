"use client";

import { Check, Link2 } from "lucide-react";
import { useState } from "react";
import { ENTITY_ACTION_CLASS } from "@/components/ui/entityAction";

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
      className={ENTITY_ACTION_CLASS}
    >
      {copied ? (
        <Check size={13} className="text-emerald-500" />
      ) : (
        <Link2 size={13} />
      )}
      {copied ? "Copied" : "Short link"}
    </button>
  );
}
