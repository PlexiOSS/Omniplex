"use client";

import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";
import { tickets } from "@/lib/api";
import { arcadia } from "@/lib/arcadia/client";
import { useAdmin } from "./AdminContext";

export interface AdminCounts {
  queue: number | null;
  reports: number | null;
  tickets: number | null;
  applications: number | null;
}

const settle = <T>(p: Promise<T>) => p.catch(() => null);

export function useAdminCounts(): AdminCounts {
  const { loginToken } = useAdmin();
  const { session } = useAuth();

  const { data } = useSWR(
    ["admin-counts", loginToken, session?.token ?? ""],
    async () => {
      const [bots, servers, reports, apps, openTickets] = await Promise.all([
        settle(arcadia.botQueue(loginToken)),
        settle(arcadia.serverQueue(loginToken)),
        settle(arcadia.reports.list(loginToken, "open")),
        settle(
          arcadia.popplioStaff<{ apps: { state: string }[] }>(
            loginToken,
            "GET",
            "/staff/apps",
          ),
        ),
        session ? settle(tickets.listAll(session.token, true)) : null,
      ]);
      const unclaimed = (entries: unknown[] | null) =>
        entries
          ? entries.filter((e) => {
              const item =
                (e as { Bot?: { claimed_by: string | null } }).Bot ??
                (e as { Server?: { claimed_by: string | null } }).Server;
              return item && !item.claimed_by;
            }).length
          : 0;
      return {
        queue: bots || servers ? unclaimed(bots) + unclaimed(servers) : null,
        reports: reports ? reports.length : null,
        tickets: openTickets ? openTickets.tickets.length : null,
        applications: apps
          ? (apps.json?.apps ?? []).filter((a) => a.state === "pending").length
          : null,
      } satisfies AdminCounts;
    },
    { refreshInterval: 60_000, revalidateOnFocus: true },
  );

  return (
    data ?? { queue: null, reports: null, tickets: null, applications: null }
  );
}
