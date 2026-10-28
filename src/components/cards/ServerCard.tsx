import {
  ArrowUpRight,
  Eye,
  MousePointerClick,
  Star,
  Users,
} from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import type { IndexServer } from "@/lib/api/types";
import { bannerUrl, mirroredAvatarUrl, serverPath } from "@/lib/utils/assets";
import { cardCosmetics } from "@/lib/utils/cardCosmetics";
import { formatCount, formatCountLabel } from "@/lib/utils/format";

interface ServerCardProps {
  server: IndexServer;
}

export function ServerCard({ server }: ServerCardProps) {
  const href = serverPath(server.server_id, server.vanity);
  const avatarSrc = mirroredAvatarUrl(
    "servers",
    server.server_id,
    server.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(server.name)}&size=64&background=random`,
  );
  const isStandout = server.premium || server.type === "certified";

  const cosmetics = cardCosmetics(server);

  return (
    <Link
      href={href}
      data-nsfw={server.nsfw || undefined}
      style={cosmetics.style}
      className={[
        cosmetics.className,
        "group flex min-w-0 flex-col overflow-hidden rounded-xl border transition-all hover:shadow-sm",
        isStandout
          ? "border-accent/25 bg-linear-to-br from-accent/7 via-white to-white hover:border-accent/50 dark:border-accent/25 dark:from-accent/10 dark:via-zinc-900 dark:to-zinc-900"
          : "border-zinc-200 bg-white hover:border-accent/40 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-accent/40",
      ].join(" ")}
    >
      <Banner
        src={bannerUrl(
          "servers",
          server.server_id,
          server.asset_versions?.banner,
        )}
        alt={server.name}
        className="h-16"
      />

      <div className="flex min-w-0 flex-1 flex-col p-4">
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
              {server.supporter_badge && (
                <Badge variant="info">Supporter</Badge>
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
          <div className="mt-3 flex min-w-0 flex-wrap gap-1.5">
            {server.tags.slice(0, 4).map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
            {server.tags.length > 4 && <Badge>+{server.tags.length - 4}</Badge>}
          </div>
        )}

        {/* Stats */}
        <div className="mt-auto flex flex-wrap items-center gap-x-3.5 gap-y-1 pt-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span data-stat="votes" className="flex items-center gap-1">
            <Star size={12} />
            {formatCountLabel(server.approximate_votes, "vote")}
          </span>
          <span data-stat="size" className="flex items-center gap-1">
            <Users size={12} />
            {formatCountLabel(server.total_members, "member")}
          </span>
          {server.online_members > 0 && (
            <span data-stat="online" className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {formatCount(server.online_members)} online
            </span>
          )}
          <span data-stat="views" className="flex items-center gap-1">
            <Eye size={12} />
            {formatCountLabel(server.clicks, "view")}
          </span>
          <span data-stat="invites" className="flex items-center gap-1">
            <MousePointerClick size={12} />
            {formatCountLabel(server.invite_clicks, "invite")}
          </span>
        </div>
      </div>
    </Link>
  );
}
