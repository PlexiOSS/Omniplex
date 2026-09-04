import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { StatRow } from "@/components/ui/StatRow";
import { TagBadgeLink } from "@/components/ui/TagBadgeLink";
import type { CompareEntity } from "./types";

interface CompareCardProps {
  entity: CompareEntity;
  /** Tags present on the *other* side too, highlighted so shared tags stand out. */
  sharedTags: Set<string>;
}

export function CompareCard({ entity, sharedTags }: CompareCardProps) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <Link href={entity.href} className="flex items-center gap-3">
        <Avatar src={entity.avatarSrc} alt={entity.name} size={48} />
        <div className="min-w-0">
          <p className="truncate font-semibold text-zinc-950 transition-colors hover:text-accent dark:text-zinc-50">
            {entity.name}
          </p>
          <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {entity.short}
          </p>
        </div>
      </Link>

      <dl className="mt-4 space-y-2.5 border-t border-zinc-200 pt-4 dark:border-zinc-800">
        {entity.stats.map((stat) => (
          <StatRow
            key={stat.label}
            icon={stat.icon}
            label={stat.label}
            value={stat.value}
          />
        ))}
      </dl>

      {entity.tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          {entity.tags.map((tag) => (
            <TagBadgeLink
              key={tag}
              tag={tag}
              highlighted={sharedTags.has(tag)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
