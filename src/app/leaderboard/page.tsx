import { Trophy } from "lucide-react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Avatar } from "@/components/ui/Avatar";
import { votes } from "@/lib/api";
import { formatCount } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Voter Leaderboard",
  description: "The most active voters on Omniplex, all-time.",
};

const RANK_STYLES = [
  "bg-yellow-400/15 text-yellow-600 dark:text-yellow-400",
  "bg-zinc-300/25 text-zinc-600 dark:text-zinc-300",
  "bg-orange-400/15 text-orange-600 dark:text-orange-400",
];

export default async function LeaderboardPage() {
  const entries = await votes.getLeaderboard(25).catch(() => []);

  return (
    <Container className="py-16">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
          <Trophy size={22} className="text-accent" />
        </div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Voter Leaderboard
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          The most active voters on Omniplex, all-time every upvote ever
          cast, across every bot, server, team, and pack.
        </p>
      </div>

      {entries.length === 0 ? (
        <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
          No votes cast yet.
        </p>
      ) : (
        <div className="mx-auto max-w-xl divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {entries.map((entry, i) => (
            <div
              key={entry.user.id}
              className="flex items-center gap-4 px-4 py-3"
            >
              <span
                className={[
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  RANK_STYLES[i] ??
                    "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400",
                ].join(" ")}
              >
                {i + 1}
              </span>
              <Avatar
                src={entry.user.avatar}
                alt={entry.user.username}
                size={36}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                {entry.user.display_name || entry.user.username}
              </span>
              <span className="shrink-0 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                {formatCount(entry.votes)} votes
              </span>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
