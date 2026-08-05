"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useVote } from "@/hooks/useVote";
import { formatCount } from "@/lib/utils/format";

interface ServerVoteButtonProps {
  serverId: string;
  currentVotes: number;
}

export function ServerVoteButton({
  serverId,
  currentVotes,
}: ServerVoteButtonProps) {
  const { session, isAuthenticated } = useAuth();
  const { vote, loading, error } = useVote("server", serverId);
  const [localVotes, setLocalVotes] = useState(currentVotes);
  const [votedDirection, setVotedDirection] = useState<"up" | "down" | null>(
    null,
  );

  if (!isAuthenticated) {
    return (
      <Link
        href="/auth/login"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-accent/40 dark:hover:bg-accent/10"
      >
        <ThumbsUp size={14} />
        Sign in to vote
      </Link>
    );
  }

  // Servers allow multiple votes over time, but only one vote (in either
  // direction) per cooldown window — voting again to "switch" direction is
  // rejected server-side the same as voting again in the same direction, so
  // once either button succeeds both are disabled until the next window.
  const voted = votedDirection !== null;

  const handleVote = async (upvote: boolean) => {
    if (!session || voted) return;
    const ok = await vote(session.user_id, session.token, upvote);
    if (!ok) return;
    setLocalVotes((v) => v + (upvote ? 1 : -1));
    setVotedDirection(upvote ? "up" : "down");
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <Button
          variant={votedDirection === "up" ? "secondary" : "primary"}
          onClick={() => handleVote(true)}
          loading={loading && votedDirection === null}
          disabled={voted}
          className="flex-1"
        >
          <ThumbsUp
            size={14}
            className={votedDirection === "up" ? "fill-current" : undefined}
          />
          {votedDirection === "up"
            ? "Voted!"
            : `Upvote · ${formatCount(localVotes)}`}
        </Button>
        <Button
          variant={votedDirection === "down" ? "danger" : "secondary"}
          onClick={() => handleVote(false)}
          loading={loading && votedDirection === null}
          disabled={voted}
          aria-label="Downvote this server"
        >
          <ThumbsDown
            size={14}
            className={votedDirection === "down" ? "fill-current" : undefined}
          />
        </Button>
      </div>
      {error && (
        <p className="text-center text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
