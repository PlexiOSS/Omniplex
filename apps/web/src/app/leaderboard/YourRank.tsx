"use client";

import Link from "next/link";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { votes } from "@/lib/api";
import type { VoterLeaderboardPeriod } from "@/lib/api/types";
import { formatCount } from "@/lib/utils/format";

interface YourRankProps {
  period: VoterLeaderboardPeriod;
}

export function YourRank({ period }: YourRankProps) {
  const { session } = useAuth();
  const userId = session?.user_id;
  const { data } = useSWR(
    userId ? ["votes/leaderboard/rank", userId, period] : null,
    () => votes.getLeaderboardRank(userId as string, period),
  );

  if (!userId || !data) return null;

  const scope = period === "month" ? " this month" : "";

  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm">
      {data.rank > 0 ? (
        <p className="text-zinc-700 dark:text-zinc-300">
          You're{" "}
          <span className="font-semibold text-accent">
            #{formatCount(data.rank)}
          </span>{" "}
          of {formatCount(data.total_voters)} voters{scope}, with{" "}
          {formatCount(data.votes)} {data.votes === 1 ? "vote" : "votes"}.
        </p>
      ) : (
        <p className="text-zinc-700 dark:text-zinc-300">
          You haven't voted{scope || " yet"}.
        </p>
      )}
      <Link href="/bots" className="font-medium text-accent hover:underline">
        Find something to vote for
      </Link>
    </div>
  );
}
