"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { SignInLink } from "@/components/ui/SignInLink";
import { useAuth } from "@/hooks/useAuth";
import { useVote } from "@/hooks/useVote";
import {
  formatCount,
  isWeekendVoteBonusDay,
  voteCooldownHours,
} from "@/lib/utils/format";

interface VoteButtonProps {
  botId: string;
  currentVotes: number;
  premium?: boolean;
  captchaOptOut?: boolean;
}

export function VoteButton({
  botId,
  currentVotes,
  premium = false,
  captchaOptOut = false,
}: VoteButtonProps) {
  const router = useRouter();
  const { session, isAuthenticated } = useAuth();
  const { vote, loading, verifying, error } = useVote("bot", botId);
  const [localVotes, setLocalVotes] = useState(currentVotes);
  const [votedDirection, setVotedDirection] = useState<"up" | "down" | null>(
    null,
  );
  const [pendingDir, setPendingDir] = useState<"up" | "down" | null>(null);
  const [confirmingDownvote, setConfirmingDownvote] = useState(false);

  if (!isAuthenticated) {
    return (
      <SignInLink className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 px-4 text-sm font-medium text-zinc-700 transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-accent dark:border-zinc-800 dark:text-zinc-300 dark:hover:border-accent/40 dark:hover:bg-accent/10">
        <ThumbsUp size={14} />
        Sign in to vote
      </SignInLink>
    );
  }

  // Bots allow multiple votes over time, but only one vote (in either
  // direction) per cooldown window — voting again to "switch" direction is
  // rejected server-side the same as voting again in the same direction, so
  // once either button succeeds both are disabled until the next window.
  const voted = votedDirection !== null;

  const handleVote = async (upvote: boolean) => {
    if (!session || voted) return;
    setPendingDir(upvote ? "up" : "down");
    try {
      const ok = await vote(
        session.user_id,
        session.token,
        upvote,
        !captchaOptOut,
      );
      if (!ok) return;
      setLocalVotes((v) => v + (upvote ? 1 : -1));
      setVotedDirection(upvote ? "up" : "down");
      // approximate_votes updates synchronously on the backend, but this page's
      // Stats sidebar was fetched server-side before the vote -- refresh so it
      // (and anything else on the page reading the pre-vote count) catches up
      // instead of only this button's own optimistic label doing so.
      router.refresh();
    } finally {
      setPendingDir(null);
    }
  };

  const confirmDownvote = async () => {
    setConfirmingDownvote(false);
    await handleVote(false);
  };

  return (
    <div className="flex flex-col gap-1.5">
      {!premium && isWeekendVoteBonusDay() && (
        <p className="text-center text-xs font-medium text-accent">
          🎉 Double-vote weekend: all votes count 2x with a reduced 6h cooldown
        </p>
      )}
      <div className="flex items-center gap-2">
        <Button
          variant={votedDirection === "up" ? "secondary" : "primary"}
          onClick={() => handleVote(true)}
          loading={loading && pendingDir === "up"}
          disabled={voted || loading}
          className="flex-1"
        >
          <ThumbsUp
            size={14}
            className={votedDirection === "up" ? "fill-current" : undefined}
          />
          {votedDirection === "up"
            ? "Voted!"
            : verifying
              ? "Verifying…"
              : `Upvote · ${formatCount(localVotes)}`}
        </Button>
        <Button
          variant={votedDirection === "down" ? "danger" : "secondary"}
          onClick={() => setConfirmingDownvote(true)}
          loading={loading && pendingDir === "down"}
          disabled={voted || loading}
          aria-label="Downvote this bot"
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

      <Modal
        open={confirmingDownvote}
        onClose={() => setConfirmingDownvote(false)}
        title="Downvote this bot?"
      >
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Downvotes can't be removed or changed once submitted, and you can
          only vote once every {voteCooldownHours(premium)} hours. Are you
          sure?
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setConfirmingDownvote(false)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={confirmDownvote}
            loading={loading && pendingDir === "down"}
          >
            Downvote
          </Button>
        </div>
      </Modal>
    </div>
  );
}
