"use client";

import { Star } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/hooks/useAuth";
import { useVote } from "@/hooks/useVote";
import { formatCount } from "@/lib/utils/format";

interface VoteButtonProps {
  botId: string;
  currentVotes: number;
}

export function VoteButton({ botId, currentVotes }: VoteButtonProps) {
  const { session, isAuthenticated } = useAuth();
  const { vote, loading, error, success } = useVote("bot", botId);
  const [localVotes, setLocalVotes] = useState(currentVotes);

  if (!isAuthenticated) {
    return (
      <Link
        href="/auth/login"
        className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-accent/40 dark:hover:bg-accent/10"
      >
        <Star size={14} />
        Sign in to vote
      </Link>
    );
  }

  const handleVote = async () => {
    if (!session) return;
    const ok = await vote(session.user_id, session.token);
    if (ok) setLocalVotes((v) => v + 1);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <Button
        variant={success ? "secondary" : "primary"}
        onClick={handleVote}
        loading={loading}
        disabled={success}
      >
        <Star size={14} className={success ? "fill-current" : undefined} />
        {success ? "Voted!" : `Vote · ${formatCount(localVotes)}`}
      </Button>
      {error && (
        <p className="text-center text-xs text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
