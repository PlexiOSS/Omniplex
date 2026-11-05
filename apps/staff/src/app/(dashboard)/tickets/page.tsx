"use client";

import { SITE_URL } from "@omniplex/core/api/config";
import type { Ticket } from "@omniplex/core/api/types";
import { formatRelativeTime } from "@omniplex/core/utils/format";
import { Badge } from "@omniplex/ui/Badge";
import { LifeBuoy } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/app/AdminContext";
import { AdminPageHeader } from "@/app/AdminPageHeader";
import { AdminError, AdminLoading } from "@/components/admin/AdminState";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";

const FILTER_TABS: { key: boolean | null; label: string }[] = [
  { key: true, label: "Open" },
  { key: false, label: "Closed" },
  { key: null, label: "All" },
];

export default function AdminTicketsPage() {
  const { hasPerm, loginToken } = useAdmin();
  const canView = hasPerm("view_tickets");

  const [open, setOpen] = useState<boolean | null>(true);
  const [ticketList, setTicketList] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await arcadia.staffTickets(loginToken, open ?? undefined);
      setTicketList(res.tickets);
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load tickets.",
      );
    }
  }, [loginToken, open]);

  useEffect(() => {
    setTicketList(null);
    load();
  }, [load]);

  if (!canView) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          You don't have permission to view tickets.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Tickets"
        description="Every support ticket platform-wide. Open one to reply, close it, or reopen it."
      />

      <div className="mt-6 flex flex-wrap gap-1.5">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setOpen(tab.key)}
            className={[
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              open === tab.key
                ? "bg-accent/10 text-accent"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && ticketList && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {!ticketList ? (
        error ? (
          <AdminError
            message={error}
            onRetry={() => {
              setError(null);
              load();
            }}
          />
        ) : (
          <AdminLoading />
        )
      ) : ticketList.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <LifeBuoy
            size={28}
            className="mb-3 text-zinc-300 dark:text-zinc-700"
          />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            No tickets here.
          </p>
        </div>
      ) : (
        <div className="mt-6 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {ticketList.map((ticket) => (
            <Link
              key={ticket.id}
              href={`${SITE_URL}/tickets/${ticket.id}`}
              className="flex items-center justify-between gap-3 px-4 py-3.5 transition-colors hover:bg-accent/5 dark:hover:bg-accent/10"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {ticket.issue}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-600">
                  {ticket.author?.display_name ??
                    ticket.author?.username ??
                    "Unknown"}{" "}
                  · Opened {formatRelativeTime(ticket.created_at)} ·{" "}
                  {ticket.messages.length} message
                  {ticket.messages.length === 1 ? "" : "s"}
                </p>
              </div>
              <span className="shrink-0">
                <Badge variant={ticket.open ? "success" : "default"}>
                  {ticket.open ? "Open" : "Closed"}
                </Badge>
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
