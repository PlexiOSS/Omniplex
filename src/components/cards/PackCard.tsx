import { ArrowUpRight, Bot, Server, Star } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { BotPack } from "@/lib/api/types";
import { formatCount } from "@/lib/utils/format";

interface PackCardProps {
  pack: BotPack;
}

export function PackCard({ pack }: PackCardProps) {
  const href = pack.url ? `/packs/${pack.url}` : "#";
  // BotPack has no nsfw flag of its own — inherit it from any bot/server it contains.
  const isNsfw =
    (pack.bots ?? []).some((b) => b.nsfw) ||
    (pack.servers ?? []).some((s) => s.nsfw);

  return (
    <Link
      href={href}
      data-nsfw={isNsfw || undefined}
      className="group flex min-w-0 flex-col rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-accent/40 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-accent/40"
    >
      <div className="flex items-start gap-3">
        {/* Show up to 3 avatars stacked — bots first, falling back to servers for server-only packs */}
        <div className="flex shrink-0 -space-x-2">
          {(pack.bots ?? []).length > 0
            ? (pack.bots ?? [])
                .slice(0, 3)
                .map((bot) => (
                  <Avatar
                    key={bot.bot_id}
                    src={bot.user.avatar}
                    alt={bot.user.username}
                    size={32}
                    className="ring-2 ring-white dark:ring-zinc-900"
                  />
                ))
            : (pack.servers ?? [])
                .slice(0, 3)
                .map((server) => (
                  <Avatar
                    key={server.server_id}
                    src={
                      server.avatar ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(server.name)}&size=64&background=random`
                    }
                    alt={server.name}
                    size={32}
                    className="ring-2 ring-white dark:ring-zinc-900"
                  />
                ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="truncate font-semibold text-zinc-950 transition-colors group-hover:text-accent dark:text-zinc-50">
              {pack.name}
            </span>
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
            {pack.short}
          </p>
        </div>
        <ArrowUpRight
          size={16}
          className="shrink-0 text-zinc-300 transition-colors group-hover:text-accent dark:text-zinc-700"
        />
      </div>

      {(pack.tags ?? []).length > 0 && (
        <div className="mt-3 flex min-w-0 flex-wrap gap-1.5">
          {(pack.tags ?? []).slice(0, 4).map((tag) => (
            <Badge key={tag}>{tag}</Badge>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center gap-4 pt-3 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="flex items-center gap-1">
          <Star size={12} />
          {formatCount(pack.votes)} votes
        </span>
        {(pack.bot_ids ?? []).length > 0 && (
          <span className="flex items-center gap-1">
            <Bot size={12} />
            {(pack.bot_ids ?? []).length} bots
          </span>
        )}
        {(pack.server_ids ?? []).length > 0 && (
          <span className="flex items-center gap-1">
            <Server size={12} />
            {(pack.server_ids ?? []).length} servers
          </span>
        )}
      </div>
    </Link>
  );
}
