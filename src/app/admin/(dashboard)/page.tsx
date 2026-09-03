"use client";

import { Bot, Server, Ticket, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { StatCard } from "@/components/admin/StatCard";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { BaseAnalytics } from "@/lib/arcadia/types";
import { AdminPageHeader } from "../AdminPageHeader";
import { useAdmin } from "../AdminContext";

function sumCounts(counts: Record<string, number>): number {
  return Object.values(counts).reduce((a, b) => a + b, 0);
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
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="mx-auto flex max-w-5xl justify-center px-4 py-24">
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
