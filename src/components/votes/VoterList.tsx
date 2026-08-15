"use client";

import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { users, votes } from "@/lib/api";
import type { TargetType } from "@/lib/api/types";

interface VoterListProps {
  targetType: TargetType;
  targetId: string;
}

interface ResolvedVoter {
  id: string;
  username: string;
  avatar: string;
}

const SAMPLE_SIZE = 12;

export function VoterList({ targetType, targetId }: VoterListProps) {
  const [voters, setVoters] = useState<ResolvedVoter[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        // Page 1 at 100/page gives a real total instead of guessing from an
        // unpaginated array's length.
        const ids = await votes.getUserList(targetType, targetId, 1);
        if (cancelled) return;
        setTotal(ids.length);

        const sample = ids.slice(0, SAMPLE_SIZE);
        const resolved = await Promise.allSettled(
          sample.map((id) => users.getUser(id)),
        );
        if (cancelled) return;

        setVoters(
          sample.map((id, i) => {
            const outcome = resolved[i];
            const user =
              outcome.status === "fulfilled" ? outcome.value.user : null;
            return {
              id,
              username: user?.display_name || user?.username || id,
              avatar: user?.avatar ?? "",
            };
          }),
        );
      } catch {
        if (!cancelled) {
          setVoters([]);
          setTotal(0);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [targetType, targetId]);

  if (!voters || voters.length === 0) return null;

  const extra = total !== null ? Math.max(total - voters.length, 0) : 0;

  return (
    <div className="mt-8 border-t border-zinc-200 pt-8 dark:border-zinc-800">
      <h2 className="mb-4 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
        Recent voters
      </h2>
      <div className="flex flex-wrap gap-3">
        {voters.map((voter) => (
          <div
            key={voter.id}
            className="flex items-center gap-2 rounded-xl border border-zinc-200 py-1.5 pr-3 pl-1.5 dark:border-zinc-800"
          >
            <Avatar src={voter.avatar} alt={voter.username} size={24} />
            <span className="max-w-32 truncate text-sm text-zinc-700 dark:text-zinc-300">
              {voter.username}
            </span>
          </div>
        ))}
        {extra > 0 && (
          <div className="flex items-center rounded-xl border border-zinc-200 px-3 py-1.5 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            +{extra} more
          </div>
        )}
      </div>
    </div>
  );
}
