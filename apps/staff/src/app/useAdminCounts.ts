"use client";

import useSWR from "swr";
import { useAdmin } from "@/app/AdminContext";
import { arcadia } from "@/lib/arcadia/client";

export interface AdminCounts {
  queue: number | null;
  reports: number | null;
  tickets: number | null;
  applications: number | null;
  disciplinaries: number | null;
  backgrounds: number | null;
}

const settle = <T>(p: Promise<T>) => p.catch(() => null);

export function useAdminCounts(): AdminCounts {
  const { loginToken, hasPerm } = useAdmin();
  const canDiscipline = hasPerm("manage_disciplinaries");
  const canReview = hasPerm("review_entities");

  const { data } = useSWR(
    ["admin-counts", loginToken, canDiscipline, canReview],
    async () => {
      const [
        bots,
        servers,
        reports,
        apps,
        openTickets,
        pendingDiscs,
        backgrounds,
      ] = await Promise.all([
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
        settle(arcadia.staffTickets(loginToken, true)),
        canDiscipline
          ? settle(
              arcadia.disciplinaries.list(loginToken, { state: "pending" }),
            )
          : Promise.resolve(null),
        canReview
          ? settle(arcadia.pageStyles.listPending(loginToken))
          : Promise.resolve(null),
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
        reports: reports ? reports.total : null,
        tickets: openTickets ? openTickets.tickets.length : null,
        applications: apps
          ? (apps.json?.apps ?? []).filter((a) => a.state === "pending").length
          : null,
        disciplinaries: pendingDiscs ? pendingDiscs.length : null,
        backgrounds: backgrounds ? backgrounds.length : null,
      } satisfies AdminCounts;
    },
    { refreshInterval: 60_000, revalidateOnFocus: true },
  );

  return (
    data ?? {
      queue: null,
      reports: null,
      tickets: null,
      applications: null,
      disciplinaries: null,
      backgrounds: null,
    }
  );
}
