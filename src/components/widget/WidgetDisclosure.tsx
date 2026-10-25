"use client";

import { ChevronDown, Code } from "lucide-react";
import { type ReactNode, useState } from "react";

interface WidgetDisclosureProps {
  children: ReactNode;
}

export function WidgetDisclosure({ children }: WidgetDisclosureProps) {
  const [open, setOpen] = useState(false);

  if (open) return <>{children}</>;

  return (
    <button
      type="button"
      onClick={() => setOpen(true)}
      className="flex w-full items-center justify-between gap-2 rounded-xl border border-zinc-200 px-4 py-3 text-sm text-zinc-600 transition-colors hover:border-accent/40 hover:text-accent dark:border-zinc-800 dark:text-zinc-400"
    >
      <span className="flex items-center gap-2">
        <Code size={14} />
        Get embed code
      </span>
      <ChevronDown size={14} />
    </button>
  );
}
