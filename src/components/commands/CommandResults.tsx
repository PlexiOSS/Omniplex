"use client";

import { ExternalLink, ListFilter } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import type { BotCommandSearchResult } from "@/lib/api/types";
import { mirroredAvatarUrl } from "@/lib/utils/assets";
import { CopyUsageButton } from "./CopyUsageButton";
import { commandLabel } from "./commandLabel";

interface CommandResultsProps {
  results: BotCommandSearchResult[];
  activeBot: string;
  onFilterBot: (botId: string) => void;
}

function groupByBot(results: BotCommandSearchResult[]) {
  const groups: { botId: string; commands: BotCommandSearchResult[] }[] = [];

  for (const result of results) {
    const last = groups[groups.length - 1];
    if (last && last.botId === result.bot_id) {
      last.commands.push(result);
    } else {
      groups.push({ botId: result.bot_id, commands: [result] });
    }
  }

  return groups;
}

export function CommandResults({
  results,
  activeBot,
  onFilterBot,
}: CommandResultsProps) {
  return (
    <div className="space-y-6">
      {groupByBot(results).map((group) => {
        const bot = group.commands[0].bot;
        return (
          <section
            key={group.botId}
            className="min-w-0 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
          >
            <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
              <div className="flex min-w-0 items-center gap-2.5">
                <Avatar
                  src={mirroredAvatarUrl("bots", group.botId, bot?.avatar)}
                  alt={bot?.username ?? group.botId}
                  size={28}
                />
                <span className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {bot?.username ?? group.botId}
                </span>
                <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                  {group.commands.length === 1
                    ? "1 command"
                    : `${group.commands.length} commands`}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {activeBot !== group.botId && (
                  <button
                    type="button"
                    onClick={() => onFilterBot(group.botId)}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                  >
                    <ListFilter size={13} />
                    Only this bot
                  </button>
                )}
                <Link
                  href={`/bots/${group.botId}?tab=commands`}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  <ExternalLink size={13} />
                  View bot
                </Link>
              </div>
            </header>

            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {group.commands.map((command) => (
                <li key={command.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm font-medium text-zinc-950 dark:bg-zinc-800 dark:text-zinc-50">
                      {commandLabel(command.name)}
                    </code>
                    {command.category && (
                      <Badge variant="default">{command.category}</Badge>
                    )}
                  </div>
                  {command.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-300">
                      {command.description}
                    </p>
                  )}
                  {command.usage && (
                    <div className="mt-2 flex min-w-0 items-center gap-1 rounded-lg bg-zinc-50 px-2 py-1 dark:bg-zinc-800/60">
                      <code className="min-w-0 flex-1 truncate text-xs text-zinc-600 dark:text-zinc-300">
                        {command.usage}
                      </code>
                      <CopyUsageButton value={command.usage} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
