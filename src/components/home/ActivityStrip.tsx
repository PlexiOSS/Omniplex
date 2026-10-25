import { ArrowRight, History, Terminal, Trophy } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { commandLabel } from "@/components/commands/commandLabel";
import { Avatar } from "@/components/ui/Avatar";
import type {
  BotWithCommands,
  RecentChangelogBot,
  VoterLeaderboardEntry,
} from "@/lib/api/types";
import { mirroredAvatarUrl } from "@/lib/utils/assets";
import { formatCountLabel, formatRelativeTime } from "@/lib/utils/format";

interface ActivityStripProps {
  recentBots: RecentChangelogBot[];
  topVoters: VoterLeaderboardEntry[];
  commandBots: BotWithCommands[];
}

function ActivityCard({
  icon,
  title,
  href,
  linkLabel,
  children,
}: {
  icon: ReactNode;
  title: string;
  href: string;
  linkLabel: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-700 dark:bg-zinc-900">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-accent">{icon}</span>
        <h3 className="font-semibold text-zinc-950 dark:text-zinc-50">
          {title}
        </h3>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
      <Link
        href={href}
        className="mt-4 inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        {linkLabel} <ArrowRight size={14} />
      </Link>
    </div>
  );
}

export function ActivityStrip({
  recentBots,
  topVoters,
  commandBots,
}: ActivityStripProps) {
  const examples = [
    ...new Set(
      commandBots.flatMap((b) => b.preview.map((name) => commandLabel(name))),
    ),
  ].slice(0, 8);
  const commandCount = commandBots.reduce((sum, b) => sum + b.commands, 0);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {recentBots.length > 0 && (
        <ActivityCard
          icon={<History size={16} />}
          title="Recently updated"
          href="/feed"
          linkLabel="See the feed"
        >
          <ul className="space-y-2.5">
            {recentBots.slice(0, 4).map((bot) => {
              const name = bot.user?.username ?? bot.bot_id;
              return (
                <li key={bot.bot_id}>
                  <Link
                    href={`/feed?bot=${bot.bot_id}`}
                    className="group flex min-w-0 items-center gap-2.5"
                  >
                    <Avatar
                      src={mirroredAvatarUrl(
                        "bots",
                        bot.bot_id,
                        bot.user?.avatar,
                      )}
                      alt={name}
                      size={28}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800 transition-colors group-hover:text-accent dark:text-zinc-200">
                      {name}
                    </span>
                    <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                      {formatRelativeTime(bot.latest_at)}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </ActivityCard>
      )}

      {topVoters.length > 0 && (
        <ActivityCard
          icon={<Trophy size={16} />}
          title="Top voters this month"
          href="/leaderboard"
          linkLabel="Full leaderboard"
        >
          <ol className="space-y-2.5">
            {topVoters.slice(0, 3).map((entry, i) => {
              const name = entry.user.display_name || entry.user.username;
              return (
                <li key={entry.user.id}>
                  <Link
                    href={`/user/${entry.user.id}`}
                    className="group flex min-w-0 items-center gap-2.5"
                  >
                    <span className="w-4 shrink-0 text-center text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                      {entry.rank || i + 1}
                    </span>
                    <Avatar
                      src={mirroredAvatarUrl(
                        "users",
                        entry.user.id,
                        entry.user.avatar,
                      )}
                      alt={name}
                      size={28}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800 transition-colors group-hover:text-accent dark:text-zinc-200">
                      {name}
                    </span>
                    <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                      {formatCountLabel(entry.votes, "vote")}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        </ActivityCard>
      )}

      {commandBots.length > 0 && (
        <ActivityCard
          icon={<Terminal size={16} />}
          title="Command Directory"
          href="/commands"
          linkLabel="Search commands"
        >
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {formatCountLabel(commandCount, "command")} documented across{" "}
            {formatCountLabel(commandBots.length, "bot")}. Find out who has the
            command you need.
          </p>
          {examples.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {examples.map((label) => (
                <Link
                  key={label}
                  href={`/commands?q=${encodeURIComponent(label.replace(/^\//, ""))}`}
                  className="rounded-full bg-zinc-100 px-2.5 py-1 font-mono text-xs text-zinc-700 transition-colors hover:bg-accent/10 hover:text-accent dark:bg-zinc-800 dark:text-zinc-300"
                >
                  {label}
                </Link>
              ))}
            </div>
          )}
        </ActivityCard>
      )}
    </div>
  );
}
