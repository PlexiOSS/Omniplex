"use client";

import { ExternalLink, Settings } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

interface TemplateDetailActionsProps {
  templateId: string;
  code: string;
  ownerId: string;
  unavailable: boolean;
}

export function TemplateDetailActions({
  templateId,
  code,
  ownerId,
  unavailable,
}: TemplateDetailActionsProps) {
  const { session } = useAuth();
  const isOwner = session?.user_id === ownerId;

  return (
    <div className="flex flex-col gap-2">
      {unavailable ? (
        <span className="inline-flex h-10 items-center justify-center rounded-xl bg-zinc-100 px-4 text-sm font-medium text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
          No longer on Discord
        </span>
      ) : (
        <a
          href={`https://discord.com/template/${code}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-muted"
        >
          Use template
          <ExternalLink size={14} />
        </a>
      )}
      {isOwner && (
        <Link
          href={`/dashboard/templates/${templateId}`}
          className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          <Settings size={14} />
          Manage template
        </Link>
      )}
    </div>
  );
}
