"use client";

import {
  AlertTriangle,
  Check,
  MoreHorizontal,
  Server,
  ShieldCheck,
  ShieldOff,
  Star,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Pagination } from "@/components/search/Pagination";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { usePagination } from "@/hooks/usePagination";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type {
  PartialBot,
  PlatformUser,
  RPCWebAction,
} from "@/lib/arcadia/types";
import { formatCount } from "@/lib/utils/format";
import { AdminPageHeader } from "../../AdminPageHeader";
import { useAdmin } from "../../AdminContext";
import { GenericRpcModal } from "../GenericRpcModal";
import { ReviewsModal } from "../ReviewsModal";
import { RpcActionModal } from "../RpcActionModal";

type ActionKind = "unclaim" | "approve" | "deny";

// Already have fast-path buttons below — the "More actions" modal only needs the rest.
const QUICK_ACTION_IDS = new Set(["Claim", "Unclaim", "Approve", "Deny"]);

const QUEUE_PAGE_SIZE = 10;

/**
 * A minimal-permission (permissions=0) direct Discord OAuth invite, built
 * from the bot's own client_id rather than whatever URL the developer
 * submitted. Safe for a tester to click without granting anything beyond
 * bot + applications.commands scope, regardless of what the submitted
 * invite requests.
 */
function safeInviteUrl(clientId: string): string {
  return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=0&scope=bot%20applications.commands`;
}

export default function AdminQueuePage() {
  const { loginToken, hasPerm } = useAdmin();

  const [bots, setBots] = useState<PartialBot[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [modalAction, setModalAction] = useState<{
    kind: ActionKind;
    bot: PartialBot;
  } | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [moreActionsFor, setMoreActionsFor] = useState<PartialBot | null>(null);
  const [moreActionMethods, setMoreActionMethods] = useState<
    RPCWebAction[] | null
  >(null);
  const [reviewsFor, setReviewsFor] = useState<PartialBot | null>(null);
  const [claimers, setClaimers] = useState<Record<string, PlatformUser>>({});

  const { page, setPage, pageItems } = usePagination(
    bots ?? [],
    QUEUE_PAGE_SIZE,
  );

  const load = useCallback(async () => {
    try {
      const entries = await arcadia.botQueue(loginToken);
      const queuedBots = entries
        .filter((e): e is { Bot: PartialBot } => "Bot" in e)
        .map((e) => e.Bot);
      setBots(queuedBots);

      const claimerIds = Array.from(
        new Set(
          queuedBots
            .map((b) => b.claimed_by)
            .filter((id): id is string => Boolean(id)),
        ),
      );
      const resolved = await Promise.all(
        claimerIds.map((id) =>
          arcadia.getUser(loginToken, id).catch(() => null),
        ),
      );
      setClaimers((prev) => {
        const next = { ...prev };
        claimerIds.forEach((id, i) => {
          const user = resolved[i];
          if (user) next[id] = user;
        });
        return next;
      });
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load queue.",
      );
    }
  }, [loginToken]);

  useEffect(() => {
    load();
  }, [load]);

  async function handleClaim(bot: PartialBot) {
    setClaiming(bot.bot_id);
    try {
      await arcadia.executeRpc(loginToken, "Bot", {
        Claim: { target_id: bot.bot_id, force: false },
      });
      await load();
    } catch (err) {
      setError(err instanceof ArcadiaError ? err.message : "Failed to claim.");
    } finally {
      setClaiming(null);
    }
  }

  async function handleModalSubmit(reason: string) {
    if (!modalAction) return;
    const { kind, bot } = modalAction;
    const method =
      kind === "unclaim"
        ? { Unclaim: { target_id: bot.bot_id, reason } }
        : kind === "approve"
          ? { Approve: { target_id: bot.bot_id, reason } }
          : { Deny: { target_id: bot.bot_id, reason } };

    const result = await arcadia.executeRpc(loginToken, "Bot", method);
    if (result) setResultMessage(result);
    await load();
  }

  async function openMoreActions(bot: PartialBot) {
    try {
      const methods = await arcadia.getRpcMethods(loginToken, true);
      const filtered = methods.filter(
        (m) =>
          m.supported_target_types.includes("Bot") &&
          !QUICK_ACTION_IDS.has(m.id),
      );
      if (filtered.length === 0) {
        setError("No further actions available.");
        return;
      }
      setMoreActionMethods(filtered);
      setMoreActionsFor(bot);
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load actions.",
      );
    }
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!bots) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <AdminPageHeader
        title="Bot Queue"
        description={`${bots.length} bot${bots.length === 1 ? "" : "s"} pending or claimed for review.`}
      />

      {resultMessage && (
        <div className="mt-4 whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          {resultMessage}
        </div>
      )}

      {bots.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <ShieldOff
            size={28}
            className="mb-3 text-zinc-300 dark:text-zinc-700"
          />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Nothing in the queue right now.
          </p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {pageItems.map((bot, i) => (
            <div
              key={bot.bot_id}
              className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <div className="flex items-start gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {(page - 1) * QUEUE_PAGE_SIZE + i + 1}
                </span>
                <Avatar
                  src={bot.user.avatar}
                  alt={bot.user.username}
                  size={44}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                      {bot.user.username}
                    </span>
                    <Badge variant={bot.claimed_by ? "warning" : "default"}>
                      {bot.claimed_by ? "Claimed" : "Unclaimed"}
                    </Badge>
                  </div>
                  <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {bot.short}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400 dark:text-zinc-600">
                    <span className="flex items-center gap-1">
                      <Star size={11} />
                      {formatCount(bot.votes)} votes
                    </span>
                    <span className="flex items-center gap-1">
                      <Server size={11} />
                      {formatCount(bot.servers)} servers
                    </span>
                    <span>{bot.library}</span>
                    {bot.claimed_by && (
                      <span>
                        Claimed by{" "}
                        {claimers[bot.claimed_by]?.username ?? bot.claimed_by}
                      </span>
                    )}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs">
                    <a
                      href={safeInviteUrl(bot.client_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-green-700 hover:underline dark:text-green-400"
                    >
                      <ShieldCheck size={11} />
                      Safe invite (no perms)
                    </a>
                    {bot.invite && (
                      <a
                        href={bot.invite}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-yellow-700 hover:underline dark:text-yellow-400"
                      >
                        <AlertTriangle size={11} />
                        Submitted invite (unverified perms)
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-900">
                {!bot.claimed_by && hasPerm("review_bots") && (
                  <Button
                    variant="secondary"
                    size="sm"
                    loading={claiming === bot.bot_id}
                    onClick={() => handleClaim(bot)}
                  >
                    Claim
                  </Button>
                )}
                {bot.claimed_by && hasPerm("review_bots") && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setModalAction({ kind: "unclaim", bot })}
                  >
                    Unclaim
                  </Button>
                )}
                {bot.claimed_by && hasPerm("review_bots") && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setModalAction({ kind: "approve", bot })}
                  >
                    <Check size={12} />
                    Approve
                  </Button>
                )}
                {bot.claimed_by && hasPerm("review_bots") && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setModalAction({ kind: "deny", bot })}
                  >
                    <X size={12} />
                    Deny
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openMoreActions(bot)}
                >
                  <MoreHorizontal size={12} />
                  More
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setReviewsFor(bot)}
                >
                  Reviews
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {bots.length > 0 && (
        <div className="mt-6">
          <Pagination
            page={page}
            total={bots.length}
            perPage={QUEUE_PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}

      {modalAction && (
        <RpcActionModal
          title={`${modalAction.kind[0].toUpperCase()}${modalAction.kind.slice(1)} — ${modalAction.bot.user.username}`}
          confirmLabel={
            modalAction.kind === "approve"
              ? "Approve"
              : modalAction.kind === "deny"
                ? "Deny"
                : "Unclaim"
          }
          danger={modalAction.kind === "deny"}
          onClose={() => setModalAction(null)}
          onSubmit={handleModalSubmit}
        />
      )}

      {moreActionsFor && moreActionMethods && (
        <GenericRpcModal
          loginToken={loginToken}
          targetType="Bot"
          targetId={moreActionsFor.bot_id}
          entityLabel={moreActionsFor.user.username}
          methods={moreActionMethods}
          onClose={() => {
            setMoreActionsFor(null);
            setMoreActionMethods(null);
          }}
          onDone={(msg) => {
            if (msg) setResultMessage(msg);
            load();
          }}
        />
      )}

      {reviewsFor && (
        <ReviewsModal
          targetType="bot"
          targetId={reviewsFor.bot_id}
          entityLabel={reviewsFor.user.username}
          onClose={() => setReviewsFor(null)}
        />
      )}
    </div>
  );
}
