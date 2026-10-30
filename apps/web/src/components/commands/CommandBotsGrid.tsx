"use client";

import { Avatar } from "@/components/ui/Avatar";
import type { BotWithCommands } from "@/lib/api/types";
import { mirroredAvatarUrl } from "@/lib/utils/assets";
import { commandLabel } from "./commandLabel";

interface CommandBotsGridProps {
  bots: BotWithCommands[];
  onSelect: (botId: string) => void;
}

export function CommandBotsGrid({ bots, onSelect }: CommandBotsGridProps) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {bots.map((bot) => {
        const name = bot.user?.username ?? bot.bot_id;
        const more = bot.commands - bot.preview.length;
        return (
          <button
            key={bot.bot_id}
            type="button"
            onClick={() => onSelect(bot.bot_id)}
            className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 text-left transition-colors hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            <div className="flex min-w-0 items-center gap-2.5">
              <Avatar
                src={mirroredAvatarUrl("bots", bot.bot_id, bot.user?.avatar)}
                alt={name}
                size={32}
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {name}
                </span>
                <span className="block text-xs text-zinc-400 dark:text-zinc-500">
                  {bot.commands === 1
                    ? "1 command"
                    : `${bot.commands} commands`}
                </span>
              </span>
            </div>
            <div className="mt-3 flex min-w-0 flex-wrap gap-1.5">
              {bot.preview.map((command) => (
                <code
                  key={command}
                  className="max-w-full truncate rounded bg-zinc-100 px-1.5 py-0.5 text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {commandLabel(command)}
                </code>
              ))}
              {more > 0 && (
                <span className="px-1 py-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                  +{more} more
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
