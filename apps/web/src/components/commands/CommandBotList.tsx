"use client";

import { Avatar } from "@/components/ui/Avatar";
import type { BotWithCommands } from "@/lib/api/types";
import { mirroredAvatarUrl } from "@/lib/utils/assets";

interface CommandBotListProps {
  bots: BotWithCommands[];
  activeBot: string;
  onSelect: (botId: string) => void;
}

export function CommandBotList({
  bots,
  activeBot,
  onSelect,
}: CommandBotListProps) {
  if (bots.length === 0) return null;

  return (
    <div>
      <p className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
        Bots
      </p>
      <ul className="space-y-1">
        {bots.map((bot) => {
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
                  src={mirroredAvatarUrl("bots", bot.bot_id, bot.user?.avatar)}
                  alt={name}
                  size={24}
                />
                <span
                  className={[
                    "min-w-0 flex-1 truncate text-sm font-medium",
                    active ? "text-accent" : "text-zinc-900 dark:text-zinc-100",
                  ].join(" ")}
                >
                  {name}
                </span>
                <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                  {bot.commands}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
