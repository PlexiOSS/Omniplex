"use client";

import { Coins } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { votes } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type {
  EntityVoteRedeemLogSummary,
  TargetType,
  VoteCreditTierRedeemSummary,
} from "@/lib/api/types";
import { formatRelativeTime } from "@/lib/utils/format";

interface VoteCreditsPanelProps {
  targetType: TargetType;
  targetId: string;
  token: string;
  /** Whether the current viewer can actually redeem -- the balance and
   * history are shown either way, same as other team settings tabs. */
  canRedeem: boolean;
}

export function VoteCreditsPanel({
  targetType,
  targetId,
  token,
  canRedeem,
}: VoteCreditsPanelProps) {
  const [creditSummary, setCreditSummary] =
    useState<EntityVoteRedeemLogSummary | null>(null);
  const [voteSummary, setVoteSummary] =
    useState<VoteCreditTierRedeemSummary | null>(null);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const refresh = useCallback(() => {
    votes
      .getRedeemLogs(targetType, targetId)
      .then(setCreditSummary)
      .catch(() => setCreditSummary(null));
    votes
      .getCreditSummary(targetType, targetId)
      .then(setVoteSummary)
      .catch(() => setVoteSummary(null));
  }, [targetType, targetId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function handleRedeem() {
    if (!voteSummary || voteSummary.votes <= 0) return;
    setRedeeming(true);
    setError(null);
    setNotice(null);
    try {
      await votes.redeemCredits(targetType, targetId, voteSummary.votes, token);
      setNotice("Votes converted to credits.");
      refresh();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to redeem votes.",
      );
    } finally {
      setRedeeming(false);
    }
  }

  const availableCredits = creditSummary?.available_credits ?? 0;

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Every vote earns credits, the same way it already does for bots and
          servers. The shop itself is bot/server-only for now, so there's
          nowhere to spend credits yet -- redeemed credits stay banked here
          until that changes.
        </p>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <Coins size={15} className="text-accent" />
          <span className="font-semibold text-zinc-950 dark:text-zinc-50">
            {(availableCredits / 100).toFixed(2)}
          </span>
          credits banked
        </div>
        {canRedeem && voteSummary && voteSummary.votes > 0 && (
          <Button
            variant="secondary"
            size="sm"
            loading={redeeming}
            onClick={handleRedeem}
          >
            Convert {voteSummary.votes} vote
            {voteSummary.votes === 1 ? "" : "s"} (
            {(voteSummary.total_credits / 100).toFixed(2)})
          </Button>
        )}
      </div>

      {notice && (
        <p className="text-xs text-green-600 dark:text-green-400">{notice}</p>
      )}
      {error && (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      )}

      {creditSummary && creditSummary.redeems.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Redemption history
          </p>
          <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {creditSummary.redeems.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between px-4 py-3 text-sm"
              >
                <span className="text-zinc-700 dark:text-zinc-300">
                  {(log.credits / 100).toFixed(2)} credits
                </span>
                <span className="text-xs text-zinc-400 dark:text-zinc-600">
                  {formatRelativeTime(log.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
