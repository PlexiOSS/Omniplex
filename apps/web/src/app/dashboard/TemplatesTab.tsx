"use client";

import type { ServerTemplate } from "@omniplex/core/api/types";
import { formatCountLabel } from "@omniplex/core/utils/format";
import { Badge } from "@omniplex/ui/Badge";
import { Button } from "@omniplex/ui/Button";
import {
  ArrowUpRight,
  Hash,
  LayoutTemplate,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import Link from "next/link";
import { TemplateIcon } from "@/components/templates/TemplateIcon";
import { EmptyState } from "@/components/ui/EmptyState";

function TemplateItem({ template }: { template: ServerTemplate }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-3">
          <TemplateIcon
            templateId={template.id}
            version={template.icon_version}
            name={template.name}
            size={40}
          />
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold text-zinc-950 dark:text-zinc-50">
              {template.name}
            </p>
            <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
              {template.short}
            </p>
          </div>
        </div>

        {(template.unavailable || template.out_of_date || template.nsfw) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {template.unavailable && (
              <Badge variant="danger">Deleted on Discord</Badge>
            )}
            {!template.unavailable && template.out_of_date && (
              <Badge variant="warning">Unsynced changes</Badge>
            )}
            {template.nsfw && <Badge variant="danger">NSFW</Badge>}
          </div>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-1 pt-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <Users size={12} />
            {formatCountLabel(template.usage_count, "use")}
          </span>
          <span className="flex items-center gap-1">
            <Hash size={12} />
            {formatCountLabel(template.channel_count, "channel")}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-zinc-100 bg-zinc-50/60 px-4 py-2.5 dark:border-zinc-800 dark:bg-zinc-950/40">
        <Link
          href={`/templates/${template.id}`}
          className="inline-flex items-center gap-1 text-xs text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          View
          <ArrowUpRight size={11} />
        </Link>
        <Link href={`/dashboard/templates/${template.id}`}>
          <Button variant="secondary" size="sm" className="h-7 px-2.5 text-xs">
            <Settings size={12} />
            Manage
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function TemplatesTab({ templates }: { templates: ServerTemplate[] }) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {formatCountLabel(templates.length, "template")}
        </p>
        <Link href="/templates/add">
          <Button variant="secondary" size="sm">
            <Plus size={14} />
            Submit a template
          </Button>
        </Link>
      </div>

      {templates.length === 0 ? (
        <EmptyState icon={LayoutTemplate} title="No templates yet">
          Share a Discord server template so others can copy your setup.{" "}
          <Link href="/templates/add" className="text-accent hover:underline">
            Submit one
          </Link>
        </EmptyState>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {templates.map((template) => (
            <TemplateItem key={template.id} template={template} />
          ))}
        </div>
      )}
    </div>
  );
}
