"use client";

import { Avatar } from "@/components/ui/Avatar";
import { Skeleton } from "@/components/ui/Skeleton";
import { useRecentChangelogBots } from "@/hooks/useBots";
import { mirroredAvatarUrl } from "@/lib/utils/assets";
import { formatRelativeTime } from "@/lib/utils/format";

interface RecentBotsProps {
  activeBot: string;
  onSelect: (botId: string) => void;
}

const SKELETON_KEYS = ["a", "b", "c", "d"];

export function RecentBots({ activeBot, onSelect }: RecentBotsProps) {
  const { data, isLoading } = useRecentChangelogBots();

  if (!isLoading && (!data || data.length === 0)) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        Recently updated
      </p>
      <ul className="space-y-1">
        {isLoading
          ? SKELETON_KEYS.map((k) => (
              <li key={k} className="flex items-center gap-2.5 px-2 py-1.5">
                <Skeleton className="h-6 w-6 shrink-0 rounded-full" />
                <Skeleton className="h-3 w-28" />
              </li>
            ))
          : data?.map((bot) => {
              const name = bot.user?.username ?? bot.bot_id;
              const active = activeBot === bot.bot_id;
              return (
                <li key={bot.bot_id}>
                  <button
                    type="button"
                    onClick={() => onSelect(active ? "" : bot.bot_id)}
                    aria-pressed={active}
                    className={[
                      "flex w-full min-w-0 items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors",
                      active
                        ? "bg-accent/10"
                        : "hover:bg-zinc-100 dark:hover:bg-zinc-800",
                    ].join(" ")}
                  >
                    <Avatar
                      src={mirroredAvatarUrl(
                        "bots",
                        bot.bot_id,
                        bot.user?.avatar,
                      )}
                      alt={name}
                      size={24}
                    />
                    <span className="min-w-0 flex-1">
                      <span
                        className={[
                          "block truncate text-sm font-medium",
                          active
                            ? "text-accent"
                            : "text-zinc-900 dark:text-zinc-100",
                        ].join(" ")}
                      >
                        {name}
                      </span>
                      <span className="block text-xs text-zinc-400 dark:text-zinc-500">
                        {formatRelativeTime(bot.latest_at)} ·{" "}
                        {bot.updates === 1
                          ? "1 update"
                          : `${bot.updates} updates`}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
      </ul>
    </div>
  );
}
