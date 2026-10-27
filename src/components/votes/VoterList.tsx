"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { useAuth } from "@/hooks/useAuth";
import { votes } from "@/lib/api";
import type { EntityVoterList, TargetType } from "@/lib/api/types";
import { mirroredAvatarUrl } from "@/lib/utils/assets";
import { formatCount, formatCountLabel } from "@/lib/utils/format";

interface VoterListProps {
  targetType: TargetType;
  targetId: string;
  initialData?: EntityVoterList;
}

const LIMIT = 24;

export function VoterList({
  targetType,
  targetId,
  initialData,
}: VoterListProps) {
  const { session, loading: authLoading } = useAuth();
  const token = session?.token;
  const { data, error } = useSWR(
    authLoading ? null : ["votes/voters", targetType, targetId, token ?? ""],
    () => votes.getVoters(targetType, targetId, LIMIT, token),
    { fallbackData: initialData },
  );

  if (error) {
    return <ErrorState message="Couldn't load voters right now." />;
  }

  if (!data) {
    return <LoadingState label="Loading voters…" />;
  }

  if (data.voters.length === 0) {
    return (
      <EmptyState icon={Users} title="No votes yet">
        Be the first to vote.
      </EmptyState>
    );
  }

  const extra = Math.max(data.total - data.voters.length, 0);
  const top = Math.max(1, ...data.voters.map((v) => v.votes));
  const RANK = [
    "bg-amber-400/15 text-amber-600 ring-amber-400/30 dark:text-amber-400",
    "bg-zinc-300/20 text-zinc-600 ring-zinc-400/30 dark:text-zinc-300",
    "bg-orange-400/15 text-orange-700 ring-orange-400/30 dark:text-orange-400",
  ];

  return (
    <div>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        {formatCountLabel(data.total, "person", "people")} voted since the last
        monthly reset.
      </p>
      <ol className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
        {data.voters.map((voter, i) => {
          const name = voter.user.display_name || voter.user.username;
          return (
            <li key={voter.user.id}>
              <Link
                href={`/user/${voter.user.id}`}
                className="group flex min-w-0 items-center gap-3 px-4 py-3 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
              >
                <span
                  className={[
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold tabular-nums",
                    i < 3
                      ? `ring-1 ${RANK[i]}`
                      : "text-zinc-400 dark:text-zinc-500",
                  ].join(" ")}
                >
                  {i + 1}
                </span>
                <Avatar
                  src={mirroredAvatarUrl(
                    "users",
                    voter.user.id,
                    voter.user.avatar,
                  )}
                  alt={name}
                  size={32}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-zinc-900 transition-colors group-hover:text-accent dark:text-zinc-100">
                    {name}
                  </span>
                  <span className="mt-1 block h-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <span
                      className="block h-full rounded-full bg-indigo-500"
                      style={{ width: `${(voter.votes / top) * 100}%` }}
                    />
                  </span>
                </span>
                <span className="w-24 shrink-0 text-right">
                  <span className="block text-sm font-semibold tabular-nums text-zinc-900 dark:text-zinc-100">
                    {formatCountLabel(voter.votes, "vote")}
                  </span>
                  {voter.total_votes !== voter.votes && (
                    <span className="block text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                      {formatCount(voter.total_votes)} all time
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      {extra > 0 && (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          and {formatCountLabel(extra, "other voter")}
        </p>
      )}
    </div>
  );
}
