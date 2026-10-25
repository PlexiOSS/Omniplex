"use client";

import { Users } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { Avatar } from "@/components/ui/Avatar";
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
    return (
      <p className="py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
        Couldn&apos;t load voters right now.
      </p>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
      </div>
    );
  }

  if (data.voters.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Users size={28} className="mb-3 text-zinc-300 dark:text-zinc-700" />
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          No votes yet.
        </p>
      </div>
    );
  }

  const extra = Math.max(data.total - data.voters.length, 0);

  return (
    <div>
      <p className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
        {formatCountLabel(data.total, "person", "people")} voted. Counts are
        since the last monthly vote reset, with all-time totals alongside.
      </p>
      <div className="grid gap-2 sm:grid-cols-2">
        {data.voters.map((voter) => {
          const name = voter.user.display_name || voter.user.username;
          return (
            <Link
              key={voter.user.id}
              href={`/user/${voter.user.id}`}
              className="group flex min-w-0 items-center gap-3 rounded-xl border border-zinc-200 px-3 py-2.5 transition-colors hover:border-accent/40 dark:border-zinc-800"
            >
              <Avatar
                src={mirroredAvatarUrl(
                  "users",
                  voter.user.id,
                  voter.user.avatar,
                )}
                alt={name}
                size={32}
              />
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800 transition-colors group-hover:text-accent dark:text-zinc-200">
                {name}
              </span>
              <span className="flex shrink-0 flex-col items-end">
                <span
                  className={[
                    "text-sm font-semibold",
                    voter.votes > 0
                      ? "text-zinc-800 dark:text-zinc-200"
                      : "text-zinc-400 dark:text-zinc-500",
                  ].join(" ")}
                >
                  {formatCountLabel(voter.votes, "vote")}
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-500">
                  {formatCount(voter.total_votes)} all time
                </span>
              </span>
            </Link>
          );
        })}
      </div>
      {extra > 0 && (
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          and {formatCountLabel(extra, "other voter")}
        </p>
      )}
    </div>
  );
}
