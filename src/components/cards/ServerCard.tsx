import { ArrowUpRight, Star, Users } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { IndexServer } from "@/lib/api/types";
import { resolveAsset, serverPath } from "@/lib/utils/assets";
import { formatCount } from "@/lib/utils/format";

interface ServerCardProps {
  server: IndexServer;
}

export function ServerCard({ server }: ServerCardProps) {
  const href = serverPath(server.server_id, server.vanity);
  // Server avatar is AssetMetadata (CDN-stored), not a Discord user avatar
  const avatarSrc =
    resolveAsset(server.avatar) ??
    `https://ui-avatars.com/api/?name=${encodeURIComponent(server.name)}&size=64&background=random`;

  return (
    <Link
      href={href}
      className="group flex flex-col rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-accent/40 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-accent/40"
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <Avatar src={avatarSrc} alt={server.name} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-semibold text-zinc-950 transition-colors group-hover:text-accent dark:text-zinc-50">
              {server.name}
            </span>
            {server.premium && <Badge variant="premium">Premium</Badge>}
            {server.type === "certified" && (
              <Badge variant="success">Certified</Badge>
            )}
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
            {server.short}
          </p>
        </div>
        <ArrowUpRight
          size={16}
          className="shrink-0 text-zinc-300 transition-colors group-hover:text-accent dark:text-zinc-700"
        />
      </div>

      {/* Tags */}
      {server.tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {server.tags.slice(0, 4).map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
          {server.tags.length > 4 && <Badge>+{server.tags.length - 4}</Badge>}
        </div>
      )}

      {/* Stats */}
      <div className="mt-auto flex items-center gap-4 pt-3 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1">
          <Star size={12} />
          {formatCount(server.approximate_votes)} votes
        </span>
        <span className="flex items-center gap-1">
          <Users size={12} />
          {formatCount(server.total_members)} members
        </span>
      </div>
    </Link>
  );
}
