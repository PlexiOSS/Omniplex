"use client";

import { ExternalLink, Layers, Trash2 } from "lucide-react";
import { useRef, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { serverTemplates } from "@/lib/api";
import type { ServerTemplate } from "@/lib/api/types";
import { formatCount } from "@/lib/utils/format";

interface ServerTemplateCardProps {
  template: ServerTemplate;
  /** Called after a successful delete, so the parent can remove it from
   * its list without a full page reload. */
  onDeleted?: (id: string) => void;
}

export function ServerTemplateCard({
  template,
  onDeleted,
}: ServerTemplateCardProps) {
  const { session } = useAuth();
  const isOwner = session?.user_id === template.owner.id;

  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleDeleteClick() {
    if (!session) return;
    if (!confirming) {
      setConfirming(true);
      confirmRef.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }
    if (confirmRef.current) clearTimeout(confirmRef.current);
    setConfirming(false);
    setDeleting(true);
    serverTemplates
      .delete(session.user_id, template.id, session.token)
      .then(() => onDeleted?.(template.id))
      .catch(() => setDeleting(false));
  }

  return (
    <div
      data-nsfw={template.nsfw || undefined}
      className="flex flex-col rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-accent/40 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
    >
      <div className="flex items-start gap-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <Layers size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-zinc-950 dark:text-zinc-50">
            {template.name}
          </span>
          <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
            {template.short}
          </p>
        </div>
        {isOwner && (
          <Button
            variant={confirming ? "danger" : "ghost"}
            size="sm"
            loading={deleting}
            onClick={handleDeleteClick}
            className="h-7 shrink-0 px-2 text-xs"
          >
            <Trash2 size={12} />
            {confirming ? "Confirm?" : ""}
          </Button>
        )}
      </div>

      {template.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {template.tags.slice(0, 4).map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 pt-4">
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <Avatar
            src={template.owner.avatar}
            alt={template.owner.username}
            size={18}
          />
          <span className="truncate">
            {template.owner.display_name || template.owner.username}
          </span>
        </div>
        <a
          href={`https://discord.com/template/${template.code}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Use Template
          <ExternalLink size={12} />
        </a>
      </div>
      {template.usage_count > 0 && (
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-600">
          Used {formatCount(template.usage_count)} times on Discord
        </p>
      )}
    </div>
  );
}
