"use client";

import type { PlatformUser } from "@omniplex/core/api/types";
import { formatCount, formatRelativeTime } from "@omniplex/core/utils/format";
import { Avatar } from "@omniplex/ui/Avatar";
import { Badge } from "@omniplex/ui/Badge";
import {
  ArrowRight,
  Bot,
  ClipboardList,
  Flag,
  LifeBuoy,
  Server,
  Ticket,
  Users,
} from "lucide-react";
import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/app/AdminContext";
import { AdminPageHeader } from "@/app/AdminPageHeader";
import { AdminError, AdminLoading } from "@/components/admin/AdminState";
import { StatCard } from "@/components/admin/StatCard";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type {
  BaseAnalytics,
  PartialBot,
  PartialServer,
  RPCLogEntry,
} from "@/lib/arcadia/types";

function sumCounts(counts: Record<string, number>): number {
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

function daysSince(iso?: string): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

interface QueueEntry {
  tab: "bots" | "servers";
  id: string;
  name: string;
  avatar: string;
  claimedBy: string | null;
  lastClaimed: string | null;
  createdAt?: string;
}

interface QueueSummary {
  total: number;
  unclaimed: number;
  oldestDays: number | null;
  entries: QueueEntry[];
}

function summarise(entries: QueueEntry[]): QueueSummary {
  const ages = entries
    .map((i) => daysSince(i.createdAt))
    .filter((d): d is number => d !== null);
  return {
    total: entries.length,
    unclaimed: entries.filter((i) => !i.claimedBy).length,
    oldestDays: ages.length > 0 ? Math.max(...ages) : null,
    entries,
  };
}

function botEntry(b: PartialBot): QueueEntry {
  return {
    tab: "bots",
    id: b.bot_id,
    name: b.user.username,
    avatar: b.user.avatar,
    claimedBy: b.claimed_by,
    lastClaimed: b.last_claimed,
    createdAt: b.created_at,
  };
}

function serverEntry(s: PartialServer): QueueEntry {
  return {
    tab: "servers",
    id: s.server_id,
    name: s.name,
    avatar: s.avatar,
    claimedBy: s.claimed_by,
    lastClaimed: s.last_claimed,
    createdAt: s.created_at,
  };
}

function oldestUnclaimed(q: QueueSummary | null) {
  return (q?.entries ?? [])
    .filter((e) => !e.claimedBy)
    .sort((a, b) => (a.createdAt ?? "").localeCompare(b.createdAt ?? ""))[0];
}

function QueueLink({ entry, detail }: { entry: QueueEntry; detail: string }) {
  return (
    <Link
      href={`/queue?tab=${entry.tab}&id=${entry.id}`}
      className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
    >
      <Avatar src={entry.avatar} alt={entry.name} size={32} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
          {entry.name}
        </span>
        <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
          {detail}
        </span>
      </span>
      <ArrowRight
        size={14}
        className="shrink-0 text-zinc-400 transition-transform group-hover:translate-x-0.5"
      />
    </Link>
  );
}

interface AttentionCardProps {
  href: string;
  icon: ReactNode;
  label: string;
  value: number | null;
  detail?: string;
  urgent?: boolean;
}

function AttentionCard({
  href,
  icon,
  label,
  value,
  detail,
  urgent,
}: AttentionCardProps) {
  const active = value !== null && value > 0;
  return (
    <Link
      href={href}
      className={[
        "group flex min-w-0 flex-col rounded-xl border bg-white p-4 transition-colors dark:bg-zinc-900",
        urgent
          ? "border-amber-300 hover:border-amber-400 dark:border-amber-800"
          : "border-zinc-200 hover:border-accent/40 dark:border-zinc-800",
      ].join(" ")}
    >
      <span className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        {icon}
        {label}
      </span>
      <span
        className={[
          "mt-2 text-2xl font-semibold tabular-nums",
          active
            ? "text-zinc-950 dark:text-zinc-50"
            : "text-zinc-400 dark:text-zinc-600",
        ].join(" ")}
      >
        {value === null ? "–" : formatCount(value)}
      </span>
      <span className="mt-1 flex items-center justify-between gap-2 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="truncate">
          {value === null ? "Couldn't load" : (detail ?? " ")}
        </span>
        <ArrowRight
          size={12}
          className="shrink-0 transition-transform group-hover:translate-x-0.5"
        />
      </span>
    </Link>
  );
}

function queueDetail(q: QueueSummary | null): string | undefined {
  if (!q || q.total === 0) return q ? "All clear" : undefined;
  const parts = [`${q.unclaimed} unclaimed`];
  if (q.oldestDays !== null) {
    parts.push(q.oldestDays < 1 ? "oldest today" : `oldest ${q.oldestDays}d`);
  }
  return parts.join(" · ");
}

export default function AdminOverviewPage() {
  const { loginToken, hasPerm, staffMember } = useAdmin();
  const [analytics, setAnalytics] = useState<BaseAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [botQueue, setBotQueue] = useState<QueueSummary | null>(null);
  const [serverQueue, setServerQueue] = useState<QueueSummary | null>(null);
  const [openReports, setOpenReports] = useState<number | null>(null);
  const [openTickets, setOpenTickets] = useState<number | null>(null);
  const [pendingApps, setPendingApps] = useState<number | null>(null);
  const [logs, setLogs] = useState<RPCLogEntry[]>([]);
  const [users, setUsers] = useState<Record<string, PlatformUser>>({});

  const load = useCallback(() => {
    setError(null);
    arcadia
      .baseAnalytics(loginToken)
      .then(setAnalytics)
      .catch((err) =>
        setError(
          err instanceof ArcadiaError
            ? err.message
            : "Failed to load analytics.",
        ),
      );

    arcadia
      .botQueue(loginToken)
      .then((entries) =>
        setBotQueue(
          summarise(
            entries
              .filter((e): e is { Bot: PartialBot } => "Bot" in e)
              .map((e) => botEntry(e.Bot)),
          ),
        ),
      )
      .catch(() => setBotQueue(null));

    arcadia
      .serverQueue(loginToken)
      .then((entries) =>
        setServerQueue(
          summarise(
            entries
              .filter((e): e is { Server: PartialServer } => "Server" in e)
              .map((e) => serverEntry(e.Server)),
          ),
        ),
      )
      .catch(() => setServerQueue(null));

    arcadia.reports
      .list(loginToken, "open")
      .then((r) => setOpenReports(r.total))
      .catch(() => setOpenReports(null));

    arcadia
      .popplioStaff<{ apps: { state: string }[] }>(
        loginToken,
        "GET",
        "/staff/apps",
      )
      .then(({ json }) =>
        setPendingApps(
          (json?.apps ?? []).filter((a) => a.state === "pending").length,
        ),
      )
      .catch(() => setPendingApps(null));

    arcadia
      .getRpcLogEntries(loginToken)
      .then(async (entries) => {
        const recent = entries.slice(0, 8);
        setLogs(recent);
        const ids = [...new Set(recent.map((e) => e.user_id))];
        const fetched = await Promise.all(
          ids.map((id) => arcadia.getUser(loginToken, id).catch(() => null)),
        );
        setUsers(
          Object.fromEntries(
            fetched.filter((u): u is PlatformUser => !!u).map((u) => [u.id, u]),
          ),
        );
      })
      .catch(() => setLogs([]));
  }, [loginToken]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    arcadia
      .staffTickets(loginToken, true)
      .then((res) => setOpenTickets(res.tickets.length))
      .catch(() => setOpenTickets(null));
  }, [loginToken]);

  if (error && !analytics) return <AdminError message={error} onRetry={load} />;
  if (!analytics) return <AdminLoading />;

  const myId = staffMember.user.id;
  const myClaims = [
    ...(botQueue?.entries ?? []),
    ...(serverQueue?.entries ?? []),
  ].filter((e) => e.claimedBy === myId);
  const nextUp = [
    oldestUnclaimed(botQueue),
    oldestUnclaimed(serverQueue),
  ].filter((e): e is QueueEntry => !!e);
  const firstName = staffMember.user.display_name || staffMember.user.username;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Overview"
        description={`Welcome back, ${firstName}. Here's what needs attention.`}
      />

      {hasPerm("review_entities") &&
        (myClaims.length > 0 || nextUp.length > 0) && (
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <section className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
              <h2 className="px-3 pt-1 pb-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Claimed by you
              </h2>
              {myClaims.length === 0 ? (
                <p className="px-3 pb-3 text-sm text-zinc-500 dark:text-zinc-400">
                  Nothing claimed. Pick something from next up.
                </p>
              ) : (
                myClaims.map((e) => (
                  <QueueLink
                    key={e.id}
                    entry={e}
                    detail={`${e.tab === "bots" ? "Bot" : "Server"} · claimed ${e.lastClaimed ? formatRelativeTime(e.lastClaimed) : ""}`}
                  />
                ))
              )}
            </section>
            <section className="rounded-2xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900/60">
              <h2 className="px-3 pt-1 pb-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Next up
              </h2>
              {nextUp.length === 0 ? (
                <p className="px-3 pb-3 text-sm text-zinc-500 dark:text-zinc-400">
                  Everything in the queue is claimed.
                </p>
              ) : (
                nextUp.map((e) => {
                  const days = daysSince(e.createdAt);
                  return (
                    <QueueLink
                      key={e.id}
                      entry={e}
                      detail={`Oldest unclaimed ${e.tab === "bots" ? "bot" : "server"}${days !== null ? ` · waiting ${days < 1 ? "since today" : `${days} day${days === 1 ? "" : "s"}`}` : ""}`}
                    />
                  );
                })
              )}
            </section>
          </div>
        )}

      <h2 className="mt-8 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        Needs attention
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
        <AttentionCard
          href="/queue"
          icon={<Bot size={13} />}
          label="Bot queue"
          value={botQueue?.total ?? null}
          detail={queueDetail(botQueue)}
          urgent={(botQueue?.oldestDays ?? 0) >= 7}
        />
        <AttentionCard
          href="/queue"
          icon={<Server size={13} />}
          label="Server queue"
          value={serverQueue?.total ?? null}
          detail={queueDetail(serverQueue)}
          urgent={(serverQueue?.oldestDays ?? 0) >= 7}
        />
        {hasPerm("review_reports") && (
          <AttentionCard
            href="/reports"
            icon={<Flag size={13} />}
            label="Open reports"
            value={openReports}
            detail={openReports === 0 ? "All clear" : "Waiting for review"}
            urgent={(openReports ?? 0) > 0}
          />
        )}
        {hasPerm("view_tickets") && (
          <AttentionCard
            href="/tickets"
            icon={<LifeBuoy size={13} />}
            label="Open tickets"
            value={openTickets}
            detail={openTickets === 0 ? "All clear" : "Waiting for a reply"}
          />
        )}
        {hasPerm("view_apps") && (
          <AttentionCard
            href="/applications"
            icon={<ClipboardList size={13} />}
            label="Applications"
            value={pendingApps}
            detail={pendingApps === 0 ? "All clear" : "Pending decision"}
          />
        )}
      </div>

      {hasPerm("view_audit_logs") && (
        <>
          <div className="mt-10 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Recent staff activity
            </h2>
            <Link
              href="/logs"
              className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
            >
              All logs <ArrowRight size={12} />
            </Link>
          </div>
          <div className="mt-3 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            {logs.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No recent activity.
              </p>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {logs.map((entry) => {
                  const user = users[entry.user_id];
                  return (
                    <li
                      key={entry.id}
                      className="flex min-w-0 items-center gap-3 px-4 py-2.5 text-sm"
                    >
                      {user ? (
                        <Avatar
                          src={user.avatar}
                          alt={user.username}
                          size={22}
                        />
                      ) : (
                        <span className="h-[22px] w-[22px] shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                      )}
                      <span className="min-w-0 flex-1 truncate">
                        <span className="font-medium text-zinc-950 dark:text-zinc-50">
                          {user?.username ?? entry.user_id}
                        </span>{" "}
                        <span className="text-zinc-500 dark:text-zinc-400">
                          ran {entry.method}
                        </span>
                      </span>
                      {entry.state !== "success" && (
                        <Badge
                          variant={
                            entry.state === "pending" ? "warning" : "danger"
                          }
                        >
                          {entry.state}
                        </Badge>
                      )}
                      <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                        {formatRelativeTime(entry.created_at)}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </>
      )}

      <h2 className="mt-10 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        Platform totals
      </h2>
      <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Bot size={14} />}
          label="Bots"
          value={sumCounts(analytics.bot_counts)}
          counts={analytics.bot_counts}
        />
        <StatCard
          icon={<Server size={14} />}
          label="Servers"
          value={sumCounts(analytics.server_counts)}
          counts={analytics.server_counts}
        />
        <StatCard
          icon={<Ticket size={14} />}
          label="Tickets"
          value={sumCounts(analytics.ticket_counts)}
          counts={analytics.ticket_counts}
        />
        <StatCard
          icon={<Users size={14} />}
          label="Total users"
          value={analytics.total_users}
        />
      </div>
    </div>
  );
}
