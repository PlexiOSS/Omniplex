"use client";

import {
  AlertTriangle,
  Check,
  MoreHorizontal,
  Server as ServerIcon,
  ShieldCheck,
  ShieldOff,
  Star,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Pagination } from "@/components/search/Pagination";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { usePagination } from "@/hooks/usePagination";
import { list } from "@/lib/api";
import type { StaffTemplate } from "@/lib/api/types";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type {
  PartialBot,
  PartialServer,
  PlatformUser,
  RPCWebAction,
  TargetType,
} from "@/lib/arcadia/types";
import { formatCount } from "@/lib/utils/format";
import { useAdmin } from "../../AdminContext";
import { AdminPageHeader } from "../../AdminPageHeader";
import { GenericRpcModal } from "../GenericRpcModal";
import { ReviewsModal } from "../ReviewsModal";
import { RpcActionModal } from "../RpcActionModal";

type ActionKind = "unclaim" | "approve" | "deny";
type QueueTab = "bots" | "servers";

// Already have fast-path buttons below — the "More actions" modal only needs the rest.
const QUICK_ACTION_IDS = new Set(["Claim", "Unclaim", "Approve", "Deny"]);

const QUEUE_PAGE_SIZE = 10;

interface ModalTarget {
  targetType: TargetType;
  id: string;
  label: string;
}

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

  const [activeTab, setActiveTab] = useState<QueueTab>("bots");
  const [bots, setBots] = useState<PartialBot[] | null>(null);
  const [servers, setServers] = useState<PartialServer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState<string | null>(null);
  const [modalAction, setModalAction] = useState<{
    kind: ActionKind;
    target: ModalTarget;
  } | null>(null);
  const [resultMessage, setResultMessage] = useState<string | null>(null);
  const [moreActionsFor, setMoreActionsFor] = useState<ModalTarget | null>(
    null,
  );
  const [moreActionMethods, setMoreActionMethods] = useState<
    RPCWebAction[] | null
  >(null);
  const [reviewsFor, setReviewsFor] = useState<ModalTarget | null>(null);
  const [claimers, setClaimers] = useState<Record<string, PlatformUser>>({});
  const [templates, setTemplates] = useState<StaffTemplate[]>([]);

  const botPagination = usePagination(bots ?? [], QUEUE_PAGE_SIZE);
  const serverPagination = usePagination(servers ?? [], QUEUE_PAGE_SIZE);
  const { page, setPage, pageItems } =
    activeTab === "bots" ? botPagination : serverPagination;

  const load = useCallback(async () => {
    try {
      const [botEntries, serverEntries] = await Promise.all([
        arcadia.botQueue(loginToken),
        arcadia.serverQueue(loginToken),
      ]);

      const queuedBots = botEntries
        .filter((e): e is { Bot: PartialBot } => "Bot" in e)
        .map((e) => e.Bot);
      const queuedServers = serverEntries
        .filter((e): e is { Server: PartialServer } => "Server" in e)
        .map((e) => e.Server);

      setBots(queuedBots);
      setServers(queuedServers);

      const claimerIds = Array.from(
        new Set(
          [...queuedBots, ...queuedServers]
            .map((e) => e.claimed_by)
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

  useEffect(() => {
    list
      .getStaffTemplates()
      .then((data) => setTemplates(data.templates))
      .catch(() => {});
  }, []);

  async function handleClaim(target: ModalTarget) {
    setClaiming(target.id);
    try {
      await arcadia.executeRpc(loginToken, target.targetType, {
        Claim: { target_id: target.id, force: false },
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
    const { kind, target } = modalAction;
    const method =
      kind === "unclaim"
        ? { Unclaim: { target_id: target.id, reason } }
        : kind === "approve"
          ? { Approve: { target_id: target.id, reason } }
          : { Deny: { target_id: target.id, reason } };

    const result = await arcadia.executeRpc(
      loginToken,
      target.targetType,
      method,
    );
    if (result) setResultMessage(result);
    await load();
  }

  async function openMoreActions(target: ModalTarget) {
    try {
      const methods = await arcadia.getRpcMethods(loginToken, true);
      const filtered = methods.filter(
        (m) =>
          m.supported_target_types.includes(target.targetType) &&
          !QUICK_ACTION_IDS.has(m.id),
      );
      if (filtered.length === 0) {
        setError("No further actions available.");
        return;
      }
      setMoreActionMethods(filtered);
      setMoreActionsFor(target);
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load actions.",
      );
    }
  }

  function renderActions(target: ModalTarget, claimedBy: string | null) {
    return (
      <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-900">
        {!claimedBy && hasPerm("review_bots") && (
          <Button
            variant="secondary"
            size="sm"
            loading={claiming === target.id}
            onClick={() => handleClaim(target)}
          >
            Claim
          </Button>
        )}
        {claimedBy && hasPerm("review_bots") && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setModalAction({ kind: "unclaim", target })}
          >
            Unclaim
          </Button>
        )}
        {claimedBy && hasPerm("review_bots") && (
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalAction({ kind: "approve", target })}
          >
            <Check size={12} />
            Approve
          </Button>
        )}
        {claimedBy && hasPerm("review_bots") && (
          <Button
            variant="danger"
            size="sm"
            onClick={() => setModalAction({ kind: "deny", target })}
          >
            <X size={12} />
            Deny
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => openMoreActions(target)}
        >
          <MoreHorizontal size={12} />
          More
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() =>
            setReviewsFor({
              targetType: target.targetType,
              id: target.id,
              label: target.label,
            })
          }
        >
          Reviews
        </Button>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!bots || !servers) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
      </div>
    );
  }

  const tabs: {
    key: QueueTab;
    label: string;
    icon: typeof ServerIcon;
    count: number;
  }[] = [
    { key: "bots", label: "Bots", icon: ShieldCheck, count: bots.length },
    {
      key: "servers",
      label: "Servers",
      icon: ServerIcon,
      count: servers.length,
    },
  ];

  const activeCount = activeTab === "bots" ? bots.length : servers.length;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <AdminPageHeader
        title="Review Queue"
        description={`${activeCount} ${activeTab === "bots" ? "bot" : "server"}${activeCount === 1 ? "" : "s"} pending or claimed for review.`}
      />

      <div className="mt-6 overflow-x-auto overflow-y-hidden border-b border-zinc-200 dark:border-zinc-800">
        <div className="flex flex-nowrap items-center gap-4">
          {tabs.map(({ key, label, icon: Icon, count }) => (
            <button
              key={key}
              type="button"
              onClick={() => setActiveTab(key)}
              className={[
                "relative -mb-px flex shrink-0 items-center gap-2 border-b-2 px-1 pb-3 pt-1 text-sm font-medium transition-colors",
                activeTab === key
                  ? "border-accent text-accent"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
              ].join(" ")}
            >
              <Icon size={14} />
              {label}
              {count > 0 && (
                <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-xs dark:bg-zinc-800">
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {resultMessage && (
        <div className="mt-4 whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
          {resultMessage}
        </div>
      )}

      {activeTab === "bots" &&
        (bots.length === 0 ? (
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
          <div className="mt-6 space-y-2">
            {(pageItems as PartialBot[]).map((bot, i) => {
              const target: ModalTarget = {
                targetType: "Bot",
                id: bot.bot_id,
                label: bot.user.username,
              };
              return (
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
                          <ServerIcon size={11} />
                          {formatCount(bot.servers)} servers
                        </span>
                        <span>{bot.library}</span>
                        {bot.claimed_by && (
                          <span>
                            Claimed by{" "}
                            {claimers[bot.claimed_by]?.username ??
                              bot.claimed_by}
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

                  {renderActions(target, bot.claimed_by)}
                </div>
              );
            })}
          </div>
        ))}

      {activeTab === "servers" &&
        (servers.length === 0 ? (
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
          <div className="mt-6 space-y-2">
            {(pageItems as PartialServer[]).map((server, i) => {
              const target: ModalTarget = {
                targetType: "Server",
                id: server.server_id,
                label: server.name,
              };
              return (
                <div
                  key={server.server_id}
                  className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                      {(page - 1) * QUEUE_PAGE_SIZE + i + 1}
                    </span>
                    <Avatar src={server.avatar} alt={server.name} size={44} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                          {server.name}
                        </span>
                        <Badge
                          variant={server.claimed_by ? "warning" : "default"}
                        >
                          {server.claimed_by ? "Claimed" : "Unclaimed"}
                        </Badge>
                        {server.nsfw && <Badge variant="danger">NSFW</Badge>}
                        {server.premium && (
                          <Badge variant="premium">Premium</Badge>
                        )}
                      </div>
                      <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                        {server.short}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-zinc-400 dark:text-zinc-600">
                        <span className="flex items-center gap-1">
                          <Star size={11} />
                          {formatCount(server.votes)} votes
                        </span>
                        <span className="flex items-center gap-1">
                          <Users size={11} />
                          {formatCount(server.total_members)} members (
                          {formatCount(server.online_members)} online)
                        </span>
                        {server.claimed_by && (
                          <span>
                            Claimed by{" "}
                            {claimers[server.claimed_by]?.username ??
                              server.claimed_by}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {renderActions(target, server.claimed_by)}
                </div>
              );
            })}
          </div>
        ))}

      {activeCount > 0 && (
        <div className="mt-6">
          <Pagination
            page={page}
            total={activeCount}
            perPage={QUEUE_PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}

      {modalAction && (
        <RpcActionModal
          title={`${modalAction.kind[0].toUpperCase()}${modalAction.kind.slice(1)} — ${modalAction.target.label}`}
          confirmLabel={
            modalAction.kind === "approve"
              ? "Approve"
              : modalAction.kind === "deny"
                ? "Deny"
                : "Unclaim"
          }
          danger={modalAction.kind === "deny"}
          templates={templates
            .filter((t) =>
              modalAction.kind === "approve"
                ? t.type === "approval"
                : modalAction.kind === "deny"
                  ? t.type === "denial"
                  : false,
            )
            .map((t) => ({
              id: t.id,
              name: t.name,
              description: t.description,
            }))}
          onClose={() => setModalAction(null)}
          onSubmit={handleModalSubmit}
        />
      )}

      {moreActionsFor && moreActionMethods && (
        <GenericRpcModal
          loginToken={loginToken}
          targetType={moreActionsFor.targetType}
          targetId={moreActionsFor.id}
          entityLabel={moreActionsFor.label}
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
          targetType={reviewsFor.targetType.toLowerCase() as "bot" | "server"}
          targetId={reviewsFor.id}
          entityLabel={reviewsFor.label}
          onClose={() => setReviewsFor(null)}
        />
      )}
    </div>
  );
}
