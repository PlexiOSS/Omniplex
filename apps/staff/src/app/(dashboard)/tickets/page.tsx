"use client";

import type { Ticket } from "@omniplex/core/api/types";
import { formatRelativeTime } from "@omniplex/core/utils/format";
import { Avatar } from "@omniplex/ui/Avatar";
import { ChevronRight, LifeBuoy, MessageSquare } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/app/AdminContext";
import { AdminPageHeader } from "@/app/AdminPageHeader";
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
} from "@/components/admin/AdminState";
import { AdminFilterChips } from "@/components/admin/AdminToolbar";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";

type OpenFilter = "open" | "closed" | "all";

const FILTERS: { key: OpenFilter; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "closed", label: "Closed" },
  { key: "all", label: "All" },
];

export default function AdminTicketsPage() {
  const { loginToken } = useAdmin();

  const [filter, setFilter] = useState<OpenFilter>("open");
  const [ticketList, setTicketList] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await arcadia.staffTickets(
        loginToken,
        filter === "all" ? undefined : filter === "open",
      );
      setTicketList(res.tickets);
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load tickets.",
      );
    }
  }, [loginToken, filter]);

  useEffect(() => {
    setTicketList(null);
    load();
  }, [load]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Tickets"
        description="Every support ticket on Omniplex. Open one to read it, reply, or close it."
      />
      <div className="mt-6">
        <AdminFilterChips value={filter} onChange={setFilter} chips={FILTERS} />
      </div>

      {error ? (
        <AdminError
          message={error}
          onRetry={() => {
            setError(null);
            load();
          }}
        />
      ) : !ticketList ? (
        <AdminLoading />
      ) : ticketList.length === 0 ? (
        <AdminEmpty
          icon={LifeBuoy}
          title={filter === "open" ? "No open tickets" : "No tickets here"}
          description={
            filter === "open"
              ? "New support tickets show up here."
              : "Try a different filter."
          }
        />
      ) : (
        <ul className="mt-4 divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800/80 dark:border-zinc-800 dark:bg-zinc-900/60">
          {ticketList.map((ticket) => {
            const last = ticket.messages.at(-1);
            return (
              <li key={ticket.id}>
                <Link
                  href={`/tickets/${ticket.id}`}
                  className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <Avatar
                    src={ticket.author?.avatar ?? ""}
                    alt={ticket.author?.username ?? "Unknown"}
                    size={36}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${ticket.open ? "bg-emerald-500" : "bg-zinc-400"}`}
                        title={ticket.open ? "Open" : "Closed"}
                      />
                      <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                        {ticket.issue}
                      </p>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {ticket.author?.display_name ||
                        ticket.author?.username ||
                        "Unknown"}{" "}
                      · opened {formatRelativeTime(ticket.created_at)}
                      {last &&
                        ` · last message ${formatRelativeTime(last.timestamp)}`}
                    </p>
                  </div>
                  <span className="flex shrink-0 items-center gap-1 text-xs text-zinc-400 dark:text-zinc-500">
                    <MessageSquare size={12} />
                    {ticket.messages.length}
                  </span>
                  <ChevronRight
                    size={16}
                    className="shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 dark:text-zinc-600"
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
