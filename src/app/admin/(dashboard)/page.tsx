"use client";

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
import { AdminError, AdminLoading } from "@/components/admin/AdminState";
import { StatCard } from "@/components/admin/StatCard";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { useAuth } from "@/hooks/useAuth";
import { tickets } from "@/lib/api";
import type { PlatformUser } from "@/lib/api/types";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type {
  BaseAnalytics,
  PartialBot,
  PartialServer,
  RPCLogEntry,
} from "@/lib/arcadia/types";
import { formatCount, formatRelativeTime } from "@/lib/utils/format";
import { useAdmin } from "../AdminContext";
import { AdminPageHeader } from "../AdminPageHeader";

function sumCounts(counts: Record<string, number>): number {
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

function daysSince(iso?: string): number | null {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
}

interface QueueSummary {
  total: number;
  unclaimed: number;
  oldestDays: number | null;
}

function summarise(items: (PartialBot | PartialServer)[]): QueueSummary {
  const ages = items
    .map((i) => daysSince(i.created_at))
    .filter((d): d is number => d !== null);
  return {
    total: items.length,
    unclaimed: items.filter((i) => !i.claimed_by).length,
    oldestDays: ages.length > 0 ? Math.max(...ages) : null,
  };
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
          {value === null ? "No access" : (detail ?? " ")}
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
  const { loginToken } = useAdmin();
  const { session } = useAuth();
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
              .map((e) => e.Bot),
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
              .map((e) => e.Server),
          ),
        ),
      )
      .catch(() => setServerQueue(null));

    arcadia.reports
      .list(loginToken, "open")
      .then((r) => setOpenReports(r.length))
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
    if (!session) return;
    tickets
      .listAll(session.token, true)
      .then((res) => setOpenTickets(res.tickets.length))
      .catch(() => setOpenTickets(null));
  }, [session]);

  if (error && !analytics) return <AdminError message={error} onRetry={load} />;
  if (!analytics) return <AdminLoading />;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Overview"
        description="What needs attention right now, recent staff activity, and platform totals."
      />

      <h2 className="mt-8 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        Needs attention
      </h2>
      <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-5">
        <AttentionCard
          href="/admin/queue"
          icon={<Bot size={13} />}
          label="Bot queue"
          value={botQueue?.total ?? null}
          detail={queueDetail(botQueue)}
          urgent={(botQueue?.oldestDays ?? 0) >= 7}
        />
        <AttentionCard
          href="/admin/queue"
          icon={<Server size={13} />}
          label="Server queue"
          value={serverQueue?.total ?? null}
          detail={queueDetail(serverQueue)}
          urgent={(serverQueue?.oldestDays ?? 0) >= 7}
        />
        <AttentionCard
          href="/admin/reports"
          icon={<Flag size={13} />}
          label="Open reports"
          value={openReports}
          detail={openReports === 0 ? "All clear" : "Waiting for review"}
          urgent={(openReports ?? 0) > 0}
        />
        <AttentionCard
          href="/admin/tickets"
          icon={<LifeBuoy size={13} />}
          label="Open tickets"
          value={openTickets}
          detail={openTickets === 0 ? "All clear" : "Waiting for a reply"}
        />
        <AttentionCard
          href="/admin/applications"
          icon={<ClipboardList size={13} />}
          label="Applications"
          value={pendingApps}
          detail={pendingApps === 0 ? "All clear" : "Pending decision"}
        />
      </div>

      <div className="mt-10 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Recent staff activity
        </h2>
        <Link
          href="/admin/logs"
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
                    <Avatar src={user.avatar} alt={user.username} size={22} />
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
                      variant={entry.state === "pending" ? "warning" : "danger"}
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
