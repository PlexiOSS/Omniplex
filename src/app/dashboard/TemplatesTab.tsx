"use client";

import { ArrowUpRight, LayoutTemplate, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { serverTemplates } from "@/lib/api";
import type { ServerTemplate } from "@/lib/api/types";
import { TemplateEditModal } from "./TemplateEditModal";

function TemplateItem({
  template,
  userId,
  token,
  mutate,
}: {
  template: ServerTemplate;
  userId: string;
  token: string;
  mutate: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function handleDeleteClick() {
    if (!confirming) {
      setConfirming(true);
      confirmRef.current = setTimeout(() => setConfirming(false), 3000);
      return;
    }
    if (confirmRef.current) clearTimeout(confirmRef.current);
    setConfirming(false);
    setDeleting(true);
    serverTemplates
      .delete(userId, template.id, token)
      .then(() => mutate())
      .catch(() => setDeleting(false));
  }

  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="truncate font-semibold text-zinc-950 dark:text-zinc-50">
        {template.name}
      </p>
      <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
        {template.short}
      </p>

      {template.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {template.tags.slice(0, 4).map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between pt-3 text-xs text-zinc-500 dark:text-zinc-400">
        <span>{template.usage_count} uses on Discord</span>
        <div className="flex items-center gap-2">
          <Link
            href={`/templates/${template.id}`}
            className="inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
          >
            View
            <ArrowUpRight size={11} />
          </Link>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setEditing(true)}
            className="h-7 px-2 text-xs"
          >
            <Pencil size={12} />
            Edit
          </Button>
          <Button
            variant={confirming ? "danger" : "ghost"}
            size="sm"
            loading={deleting}
            onClick={handleDeleteClick}
            className="h-7 px-2 text-xs"
          >
            <Trash2 size={12} />
            {confirming ? "Confirm?" : "Delete"}
          </Button>
        </div>
      </div>

      {editing && (
        <TemplateEditModal
          template={template}
          userId={userId}
          token={token}
          onClose={() => setEditing(false)}
          onSaved={mutate}
        />
      )}
    </div>
  );
}

export function TemplatesTab({
  templates,
  userId,
  token,
  mutate,
}: {
  templates: ServerTemplate[];
  userId: string;
  token: string;
  mutate: () => void;
}) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {templates.length} {templates.length === 1 ? "template" : "templates"}
        </p>
        <Link href="/templates/add">
          <Button variant="secondary" size="sm">
            Submit Template
          </Button>
        </Link>
      </div>

      {templates.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <LayoutTemplate
            size={32}
            className="mb-3 text-zinc-300 dark:text-zinc-700"
          />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            You haven&apos;t submitted any server templates yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <TemplateItem
              key={template.id}
              template={template}
              userId={userId}
              token={token}
              mutate={mutate}
            />
          ))}
        </div>
      )}
    </div>
  );
}
