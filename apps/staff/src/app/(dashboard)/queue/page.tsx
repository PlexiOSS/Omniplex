"use client";

import { list } from "@omniplex/core/api";
import { SITE_URL } from "@omniplex/core/api/config";
import type { StaffTemplate } from "@omniplex/core/api/types";
import { noAdminReportUrl } from "@omniplex/core/noadmin";
import { formatCount, formatRelativeTime } from "@omniplex/core/utils/format";
import {
  isDiscordAuthorizeUrl,
  requestsAdministrator,
} from "@omniplex/core/utils/invitePermissions";
import { Avatar } from "@omniplex/ui/Avatar";
import { Button } from "@omniplex/ui/Button";
import {
  AlertTriangle,
  Bot as BotIcon,
  Check,
  ExternalLink,
  FileSearch,
  Hand,
  Info,
  MessageSquareQuote,
  MoreHorizontal,
  Server as ServerIcon,
  ShieldCheck,
  ShieldOff,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { GenericRpcModal } from "@/app/(dashboard)/GenericRpcModal";
import { RpcActionModal } from "@/app/(dashboard)/RpcActionModal";
import { useAdmin } from "@/app/AdminContext";
import { AdminPageHeader } from "@/app/AdminPageHeader";
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
} from "@/components/admin/AdminState";
import { AdminFilterChips } from "@/components/admin/AdminToolbar";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type {
  PartialBot,
  PartialServer,
  PlatformUser,
  RPCWebAction,
  TargetType,
} from "@/lib/arcadia/types";

type ActionKind = "unclaim" | "approve" | "deny";
type QueueTab = "bots" | "servers";
type ClaimFilter = "all" | "unclaimed" | "mine" | "claimed";

const QUICK_ACTION_IDS = new Set(["Claim", "Unclaim", "Approve", "Deny"]);
const REFRESH_MS = 60_000;

interface ModalTarget {
  targetType: TargetType;
  id: string;
  label: string;
}

interface QueueItem {
  target: ModalTarget;
  avatar: string;
  short: string;
  claimedBy: string | null;
  lastClaimed: string | null;
  createdAt?: string;
  ownerInServer?: boolean;
  approvalNote: string;
  warnings: { tone: "danger" | "warning"; title: string; body: string }[];
  stats: { label: string; value: string }[];
  siteUrl: string;
  bot?: PartialBot;
}

function safeInviteUrl(clientId: string): string {
  return `https://discord.com/api/oauth2/authorize?client_id=${clientId}&permissions=0&scope=bot%20applications.commands`;
}

function discordNsfwLevelLabel(level: number): string {
  switch (level) {
    case 1:
      return "Explicit";
    case 2:
      return "Safe";
    case 3:
      return "Age-restricted";
    default:
      return "Default";
  }
}

function waitingDays(since?: string) {
  if (!since) return null;
  return Math.floor((Date.now() - new Date(since).getTime()) / 86400000);
}

function waitingLabel(days: number | null) {
  if (days === null) return null;
  return days < 1 ? "Today" : `${days}d`;
}

function waitingTone(days: number | null) {
  if (days === null) return "text-zinc-500 dark:text-zinc-400";
  if (days >= 14) return "text-red-600 dark:text-red-400";
  if (days >= 7) return "text-amber-600 dark:text-amber-400";
  return "text-zinc-500 dark:text-zinc-400";
}

function fromBot(bot: PartialBot): QueueItem {
  const warnings: QueueItem["warnings"] = [];
  if (bot.moderation_flagged) {
    warnings.push({
      tone: "danger",
      title: "Description flagged by moderation",
      body: `OpenAI's moderation check flagged it for: ${bot.moderation_categories.join(", ")}.`,
    });
  }
  if (requestsAdministrator(bot.invite)) {
    warnings.push({
      tone: "danger",
      title: "Invite requests Administrator",
      body: "Use the Requires Administrator denial template unless the owner explains why it needs it.",
    });
  }
  return {
    target: { targetType: "Bot", id: bot.bot_id, label: bot.user.username },
    avatar: bot.user.avatar,
    short: bot.short,
    claimedBy: bot.claimed_by,
    lastClaimed: bot.last_claimed,
    createdAt: bot.created_at,
    ownerInServer: bot.owner_in_server,
    approvalNote: bot.approval_note,
    warnings,
    stats: [
      { label: "Servers", value: formatCount(bot.servers) },
      { label: "Votes", value: formatCount(bot.votes) },
      { label: "Library", value: bot.library || "Unknown" },
      { label: "Shards", value: formatCount(bot.shards) },
    ],
    siteUrl: `${SITE_URL}/bots/${bot.bot_id}`,
    bot,
  };
}

function fromServer(server: PartialServer): QueueItem {
  const warnings: QueueItem["warnings"] = [];
  if (server.moderation_flagged) {
    warnings.push({
      tone: "danger",
      title: "Description flagged by moderation",
      body: `OpenAI's moderation check flagged it for: ${server.moderation_categories.join(", ")}.`,
    });
  }
  if (server.nsfw_channel_count > 0 && !server.nsfw) {
    warnings.push({
      tone: "danger",
      title: "Age-restricted channels, but not tagged NSFW",
      body: `${server.nsfw_channel_count} age-restricted channel${server.nsfw_channel_count === 1 ? "" : "s"} found on the last sync.`,
    });
  }
  if (server.nsfw && server.nsfw_channel_count === 0) {
    warnings.push({
      tone: "warning",
      title: "Tagged NSFW, but no age-restricted channels",
      body: "No gated channels were found on the last sync.",
    });
  }
  const stats = [
    {
      label: "Members",
      value: `${formatCount(server.total_members)} (${formatCount(server.online_members)} online)`,
    },
    { label: "Votes", value: formatCount(server.votes) },
    {
      label: "Discord NSFW level",
      value: discordNsfwLevelLabel(server.discord_nsfw_level),
    },
  ];
  if (server.nsfw) stats.push({ label: "Tagged", value: "NSFW" });
  if (server.premium) stats.push({ label: "Premium", value: "Yes" });
  return {
    target: { targetType: "Server", id: server.server_id, label: server.name },
    avatar: server.avatar,
    short: server.short,
    claimedBy: server.claimed_by,
    lastClaimed: server.last_claimed,
    createdAt: server.created_at,
    ownerInServer: server.owner_in_server,
    approvalNote: server.approval_note,
    warnings,
    stats,
    siteUrl: `${SITE_URL}/servers/${server.server_id}`,
  };
}

export default function AdminQueuePage() {
  const { loginToken, hasPerm, staffMember } = useAdmin();
  const canReview = hasPerm("review_entities");
  const myId = staffMember.user.id;

  const [activeTab, setActiveTab] = useState<QueueTab>("bots");
  const [claimFilter, setClaimFilter] = useState<ClaimFilter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [bots, setBots] = useState<PartialBot[] | null>(null);
  const [servers, setServers] = useState<PartialServer[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
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
  const [claimers, setClaimers] = useState<Record<string, PlatformUser>>({});
  const [templates, setTemplates] = useState<StaffTemplate[]>([]);

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
    const params = new URLSearchParams(window.location.search);
    const tab = params.get("tab");
    if (tab === "bots" || tab === "servers") setActiveTab(tab);
    const id = params.get("id");
    if (id) setSelectedId(id);
  }, []);

  useEffect(() => {
    const refresh = () => {
      if (document.visibilityState === "visible") load();
    };
    const timer = setInterval(refresh, REFRESH_MS);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [load]);

  useEffect(() => {
    list
      .getStaffTemplates()
      .then((data) => setTemplates(data.templates))
      .catch(() => {});
  }, []);

  const items = useMemo(() => {
    const all =
      activeTab === "bots"
        ? (bots ?? []).map(fromBot)
        : (servers ?? []).map(fromServer);
    return all
      .filter((item) => {
        if (claimFilter === "unclaimed") return !item.claimedBy;
        if (claimFilter === "claimed") return !!item.claimedBy;
        if (claimFilter === "mine") return item.claimedBy === myId;
        return true;
      })
      .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""));
  }, [activeTab, bots, servers, claimFilter, myId]);

  const selected =
    items.find((item) => item.target.id === selectedId) ?? items[0] ?? null;

  function claimerName(id: string) {
    if (id === myId) return "you";
    return claimers[id]?.display_name || claimers[id]?.username || id;
  }

  async function handleClaim(target: ModalTarget) {
    setClaiming(target.id);
    setActionError(null);
    try {
      await arcadia.executeRpc(loginToken, target.targetType, {
        Claim: { target_id: target.id, force: false },
      });
    } catch (err) {
      setActionError(
        err instanceof ArcadiaError ? err.message : "Couldn't claim it.",
      );
    } finally {
      setClaiming(null);
      await load();
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

    try {
      const result = await arcadia.executeRpc(
        loginToken,
        target.targetType,
        method,
      );
      if (result) setResultMessage(result);
      if (kind !== "unclaim") setSelectedId(null);
    } finally {
      await load();
    }
  }

  async function openMoreActions(target: ModalTarget) {
    setActionError(null);
    try {
      const methods = await arcadia.getRpcMethods(loginToken, true);
      const filtered = methods.filter(
        (m) =>
          m.supported_target_types.includes(target.targetType) &&
          !QUICK_ACTION_IDS.has(m.id),
      );
      if (filtered.length === 0) {
        setActionError("There are no other actions you can run on this.");
        return;
      }
      setMoreActionMethods(filtered);
      setMoreActionsFor(target);
    } catch (err) {
      setActionError(
        err instanceof ArcadiaError ? err.message : "Failed to load actions.",
      );
    }
  }

  if (error)
    return (
      <AdminError
        message={error}
        onRetry={() => {
          setError(null);
          load();
        }}
      />
    );

  if (!bots || !servers) return <AdminLoading />;

  const mineCount = [...bots, ...servers].filter(
    (e) => e.claimed_by === myId,
  ).length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Review Queue"
        description={`${bots.length} bot${bots.length === 1 ? "" : "s"} and ${servers.length} server${servers.length === 1 ? "" : "s"} waiting, oldest first. Updates every minute.`}
      />

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border border-zinc-200 p-1 dark:border-zinc-800">
          {(
            [
              ["bots", "Bots", BotIcon, bots.length],
              ["servers", "Servers", ServerIcon, servers.length],
            ] as const
          ).map(([key, label, Icon, n]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                setActiveTab(key);
                setSelectedId(null);
              }}
              className={[
                "inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                activeTab === key
                  ? "bg-accent/10 text-accent"
                  : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50",
              ].join(" ")}
            >
              <Icon size={14} />
              {label}
              <span className="rounded-full bg-zinc-100 px-1.5 text-xs tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {n}
              </span>
            </button>
          ))}
        </div>
        <AdminFilterChips
          value={claimFilter}
          onChange={(key) => {
            setClaimFilter(key);
            setSelectedId(null);
          }}
          chips={[
            { key: "all", label: "All" },
            { key: "unclaimed", label: "Unclaimed" },
            {
              key: "mine",
              label: "Mine",
              count: mineCount > 0 ? mineCount : undefined,
            },
            { key: "claimed", label: "Claimed" },
          ]}
        />
      </div>

      {(resultMessage || actionError) && (
        <div
          aria-live="polite"
          className={[
            "mt-4 flex items-start gap-3 rounded-xl border p-4 text-sm",
            actionError
              ? "border-red-200 bg-red-50 text-red-800 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-200"
              : "border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300",
          ].join(" ")}
        >
          <p className="min-w-0 flex-1 whitespace-pre-wrap wrap-anywhere">
            {actionError ?? resultMessage}
          </p>
          <button
            type="button"
            onClick={() => {
              setActionError(null);
              setResultMessage(null);
            }}
            aria-label="Dismiss"
            className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {items.length === 0 ? (
        <AdminEmpty
          icon={ShieldOff}
          title={
            claimFilter === "all" ? "The queue is empty" : "Nothing matches"
          }
          description={
            claimFilter === "all"
              ? `No ${activeTab} are waiting for review.`
              : "Try a different filter."
          }
        />
      ) : (
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
          <ul className="overflow-hidden rounded-2xl border border-zinc-200 bg-white lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto dark:border-zinc-800 dark:bg-zinc-900/60">
            {items.map((item) => {
              const active = selected?.target.id === item.target.id;
              const days = waitingDays(item.createdAt);
              return (
                <li
                  key={item.target.id}
                  className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800/80"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(item.target.id)}
                    aria-current={active ? "true" : undefined}
                    className={[
                      "relative flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
                      active
                        ? "bg-accent/8"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                    ].join(" ")}
                  >
                    {active && (
                      <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent" />
                    )}
                    <Avatar
                      src={item.avatar}
                      alt={item.target.label}
                      size={36}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                          {item.target.label}
                        </span>
                        {item.warnings.some((w) => w.tone === "danger") && (
                          <AlertTriangle
                            size={13}
                            className="shrink-0 text-red-500"
                            aria-label="Has warnings"
                          />
                        )}
                      </span>
                      <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {item.claimedBy
                          ? `Claimed by ${claimerName(item.claimedBy)}`
                          : "Unclaimed"}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 text-xs font-medium tabular-nums ${waitingTone(days)}`}
                      title={
                        item.createdAt
                          ? `Submitted ${new Date(item.createdAt).toLocaleString()}`
                          : undefined
                      }
                    >
                      {waitingLabel(days)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {selected && (
            <QueueDetail
              item={selected}
              canReview={canReview}
              claimedByLabel={
                selected.claimedBy ? claimerName(selected.claimedBy) : null
              }
              claiming={claiming === selected.target.id}
              onClaim={() => handleClaim(selected.target)}
              onAction={(kind) =>
                setModalAction({ kind, target: selected.target })
              }
              onMore={() => openMoreActions(selected.target)}
            />
          )}
        </div>
      )}

      {modalAction && (
        <RpcActionModal
          title={`${
            modalAction.kind === "approve"
              ? "Approve"
              : modalAction.kind === "deny"
                ? "Deny"
                : "Unclaim"
          } ${modalAction.target.label}`}
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
    </div>
  );
}

interface QueueDetailProps {
  item: QueueItem;
  canReview: boolean;
  claimedByLabel: string | null;
  claiming: boolean;
  onClaim: () => void;
  onAction: (kind: ActionKind) => void;
  onMore: () => void;
}

function QueueDetail({
  item,
  canReview,
  claimedByLabel,
  claiming,
  onClaim,
  onAction,
  onMore,
}: QueueDetailProps) {
  const days = waitingDays(item.createdAt);
  const bot = item.bot;

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
      <header className="flex flex-col gap-4 border-b border-zinc-100 p-5 sm:flex-row sm:items-start sm:p-6 dark:border-zinc-800/80">
        <Avatar src={item.avatar} alt={item.target.label} size={56} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            {item.target.label}
          </h2>
          <p className="mt-0.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
            {item.target.id}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <span
              className={[
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-medium",
                claimedByLabel
                  ? "bg-amber-500/10 text-amber-700 dark:text-amber-300"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
              ].join(" ")}
            >
              {claimedByLabel
                ? `Claimed by ${claimedByLabel}${item.lastClaimed ? ` ${formatRelativeTime(item.lastClaimed)}` : ""}`
                : "Unclaimed"}
            </span>
            {days !== null && (
              <span
                className={`font-medium ${waitingTone(days)}`}
                title={`Submitted ${new Date(item.createdAt ?? "").toLocaleString()}`}
              >
                {days < 1
                  ? "Submitted today"
                  : `Waiting ${days} day${days === 1 ? "" : "s"}`}
              </span>
            )}
            {item.ownerInServer !== undefined && (
              <span
                className="text-zinc-500 dark:text-zinc-400"
                title={
                  item.ownerInServer
                    ? "At least one owner is in the Omniplex Discord server, so you can reach them there"
                    : "No owner is in the Omniplex Discord server, so contact them through the site"
                }
              >
                {item.ownerInServer
                  ? "Owner in our server"
                  : "Owner not in our server"}
              </span>
            )}
          </div>
        </div>
        <a
          href={item.siteUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:border-accent/40 hover:text-accent dark:border-zinc-800 dark:text-zinc-300"
        >
          View listing
          <ExternalLink size={13} />
        </a>
      </header>

      <div className="space-y-5 p-5 sm:p-6">
        {item.warnings.length > 0 && (
          <div className="space-y-2">
            {item.warnings.map((w) => (
              <div
                key={w.title}
                className={[
                  "flex gap-3 rounded-xl p-3.5 text-sm",
                  w.tone === "danger"
                    ? "bg-red-50 text-red-900 dark:bg-red-950/30 dark:text-red-200"
                    : "bg-amber-50 text-amber-900 dark:bg-amber-950/30 dark:text-amber-200",
                ].join(" ")}
              >
                <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium">{w.title}</p>
                  <p className="mt-0.5 opacity-90">{w.body}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <p className="text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
          {item.short || (
            <span className="text-zinc-400 italic">No short description.</span>
          )}
        </p>

        {item.approvalNote.trim() && (
          <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-accent">
              <MessageSquareQuote size={13} />
              Note from the owner
            </p>
            <p className="mt-1.5 whitespace-pre-wrap wrap-anywhere text-sm text-zinc-800 dark:text-zinc-200">
              {item.approvalNote}
            </p>
          </div>
        )}

        <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {item.stats.map((s) => (
            <div
              key={s.label}
              className="rounded-xl bg-zinc-50 px-3.5 py-3 dark:bg-zinc-800/40"
            >
              <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                {s.label}
              </dt>
              <dd className="mt-0.5 truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                {s.value}
              </dd>
            </div>
          ))}
        </dl>

        {bot && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Testing
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              <a
                href={safeInviteUrl(bot.client_id)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
              >
                <ShieldCheck size={14} />
                Safe invite (no permissions)
              </a>
              {bot.invite && (
                <a
                  href={bot.invite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-300 px-3 py-1.5 text-sm text-amber-800 transition-colors hover:bg-amber-50 dark:border-amber-900 dark:text-amber-300 dark:hover:bg-amber-950/30"
                >
                  <AlertTriangle size={14} />
                  Submitted invite
                </a>
              )}
              {bot.invite && isDiscordAuthorizeUrl(bot.invite) && (
                <a
                  href={noAdminReportUrl(bot.invite)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:border-accent/40 hover:text-accent dark:border-zinc-800 dark:text-zinc-300"
                >
                  <FileSearch size={14} />
                  Permission report
                </a>
              )}
            </div>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <Info size={12} />
              The safe invite adds the bot with no permissions.
            </p>
          </div>
        )}
      </div>

      <footer className="sticky bottom-0 flex flex-col gap-3 border-t border-zinc-100 bg-white/90 px-5 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-6 dark:border-zinc-800/80 dark:bg-zinc-900/90">
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={onMore}>
            <MoreHorizontal size={14} />
            More actions
          </Button>
        </div>
        {canReview &&
          (claimedByLabel ? (
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={() => onAction("unclaim")}>
                Unclaim
              </Button>
              <Button
                variant="secondary"
                onClick={() => onAction("deny")}
                className="text-red-600! hover:border-red-300! hover:bg-red-50! dark:text-red-400! dark:hover:border-red-900! dark:hover:bg-red-950/40!"
              >
                <X size={14} />
                Deny
              </Button>
              <Button variant="primary" onClick={() => onAction("approve")}>
                <Check size={14} />
                Approve
              </Button>
            </div>
          ) : (
            <Button variant="primary" loading={claiming} onClick={onClaim}>
              <Hand size={14} />
              Claim to review
            </Button>
          ))}
      </footer>
    </article>
  );
}
