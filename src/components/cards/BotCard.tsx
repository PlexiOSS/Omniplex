import { ArrowUpRight, Server, Star } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import type { IndexBot } from "@/lib/api/types";
import { bannerUrl, botPath, discordDefaultAvatar } from "@/lib/utils/assets";
import { formatCount } from "@/lib/utils/format";

interface BotCardProps {
  bot: IndexBot;
}

export function BotCard({ bot }: BotCardProps) {
  const href = botPath(bot.bot_id, bot.vanity);
  // bot.user.avatar is already a fully-resolved URL from dovewing
  const avatarSrc = bot.user.avatar || discordDefaultAvatar();

  return (
    <Link
      href={href}
      data-nsfw={bot.nsfw || undefined}
      className="group flex min-w-0 flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-all hover:border-accent/40 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-accent/40"
    >
      <Banner
        src={bannerUrl("bots", bot.bot_id)}
        alt={bot.user.username}
        className="h-16"
      />

      <div className="flex min-w-0 flex-1 flex-col p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          <Avatar
            src={avatarSrc}
            alt={bot.user.username}
            size={44}
            status={bot.user.status}
          />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <span className="truncate font-semibold text-zinc-950 transition-colors group-hover:text-accent dark:text-zinc-50">
                {bot.user.username}
              </span>
              {bot.premium && <Badge variant="premium">Premium</Badge>}
              {bot.type === "certified" && (
                <Badge variant="success">Certified</Badge>
              )}
            </div>
            <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
              {bot.short}
            </p>
          </div>
          <ArrowUpRight
            size={16}
            className="shrink-0 text-zinc-300 transition-colors group-hover:text-accent dark:text-zinc-700"
          />
        </div>

        {/* Tags */}
        {bot.tags.length > 0 && (
          <div className="mt-3 flex min-w-0 flex-wrap gap-1.5">
            {bot.tags.slice(0, 4).map((tag) => (
              <Badge key={tag}>{tag}</Badge>
            ))}
            {bot.tags.length > 4 && <Badge>+{bot.tags.length - 4}</Badge>}
          </div>
        )}

        {/* Stats */}
        <div className="mt-auto flex items-center gap-4 pt-3 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <Star size={12} />
            {formatCount(bot.approximate_votes)} votes
          </span>
          <span className="flex items-center gap-1">
            <Server size={12} />
            {formatCount(bot.servers)} servers
          </span>
        </div>
      </div>
    </Link>
  );
}
