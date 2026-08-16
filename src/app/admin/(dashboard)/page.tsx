"use client";

import { Bot, Server, Ticket, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { BaseAnalytics } from "@/lib/arcadia/types";
import { formatCount } from "@/lib/utils/format";
import { AdminPageHeader } from "../AdminPageHeader";
import { useAdmin } from "../AdminContext";

function sumCounts(counts: Record<string, number>): number {
  return Object.values(counts).reduce((a, b) => a + b, 0);
}

function CountBreakdown({ counts }: { counts: Record<string, number> }) {
  const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  if (entries.length === 0) {
    return (
      <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-600">No data.</p>
    );
  }
  return (
    <dl className="mt-3 space-y-1.5">
      {entries.map(([type, count]) => (
        <div
          key={type}
          className="flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400"
        >
          <dt className="capitalize">{type}</dt>
          <dd className="font-medium text-zinc-700 dark:text-zinc-300">
            {formatCount(count)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function StatCard({
  icon,
  label,
  value,
  counts,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  counts?: Record<string, number>;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-600">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wide">
          {label}
        </span>
      </div>
      <p className="mt-2 text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
        {formatCount(value)}
      </p>
      {counts && <CountBreakdown counts={counts} />}
    </div>
  );
}

export default function AdminOverviewPage() {
  const { loginToken } = useAdmin();
  const [analytics, setAnalytics] = useState<BaseAnalytics | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, [loginToken]);

  if (error) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <AdminPageHeader
        title="Overview"
        description="Platform-wide counts across bots, servers, tickets, and users."
      />

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
