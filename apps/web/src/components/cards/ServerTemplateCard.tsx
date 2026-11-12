import type { ServerTemplate } from "@omniplex/core/api/types";
import { formatCountLabel } from "@omniplex/core/utils/format";
import { Badge } from "@omniplex/ui/Badge";
import { ArrowUpRight, Hash, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { TemplateIcon } from "@/components/templates/TemplateIcon";

interface ServerTemplateCardProps {
  template: ServerTemplate;
}

export function ServerTemplateCard({ template }: ServerTemplateCardProps) {
  return (
    <Link
      href={`/templates/${template.id}`}
      data-nsfw={template.nsfw || undefined}
      className="group flex min-w-0 flex-col rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:border-accent/40 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-accent/40"
    >
      <div className="flex items-start gap-3">
        <TemplateIcon
          templateId={template.id}
          version={template.icon_version}
          name={template.name}
          size={40}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate font-semibold text-zinc-950 transition-colors group-hover:text-accent dark:text-zinc-50">
              {template.name}
            </span>
            {template.nsfw && <Badge variant="danger">NSFW</Badge>}
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
            {template.short}
          </p>
        </div>
        <ArrowUpRight
          size={16}
          className="shrink-0 text-zinc-300 transition-colors group-hover:text-accent dark:text-zinc-700"
        />
      </div>

      {template.tags.length > 0 && (
        <div className="mt-3 flex min-w-0 flex-wrap gap-1.5">
          {template.tags.slice(0, 4).map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
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
        <span className="flex items-center gap-1">
          <ShieldCheck size={12} />
          {formatCountLabel(template.role_count, "role")}
        </span>
      </div>
    </Link>
  );
}
