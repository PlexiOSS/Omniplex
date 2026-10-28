"use client";

import {
  CheckCircle2,
  ChevronRight,
  LifeBuoy,
  MessageCircle,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/PageStates";
import { SignInLink } from "@/components/ui/SignInLink";
import { StatusCard } from "@/components/ui/StatusCard";
import { useAuth } from "@/hooks/useAuth";
import { tickets } from "@/lib/api";
import type { Ticket } from "@/lib/api/types";
import { formatRelativeTime } from "@/lib/utils/format";

export default function TicketsPage() {
  const { session, isAuthenticated, loading: authLoading } = useAuth();
  const [ticketList, setTicketList] = useState<Ticket[] | null>(null);

  useEffect(() => {
    if (!session) return;
    tickets
      .list(session.user_id, session.token)
      .then((res) => setTicketList(res.tickets))
      .catch(() => setTicketList([]));
  }, [session]);

  const openCount = (ticketList ?? []).filter((t) => t.open).length;
  const sortedTickets = [...(ticketList ?? [])].sort(
    (a, b) =>
      Number(b.open) - Number(a.open) ||
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  return (
    <Container className="py-10">
      <PageHeader
        centered
        icon={LifeBuoy}
        title="Support Tickets"
        description={
          <>
            Something wrong with your account, a payment, or a listing? Open a
            ticket and a staff member will follow up here.
          </>
        }
      />

      {authLoading ? (
        <LoadingState />
      ) : !isAuthenticated ? (
        <StatusCard
          icon={LifeBuoy}
          title="Sign in to see your tickets"
          description="Open a ticket and follow up on it here."
          actions={
            <SignInLink>
              <Button variant="primary" size="sm">
                Sign in
              </Button>
            </SignInLink>
          }
        />
      ) : (
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-center justify-between gap-3">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {ticketList === null
                ? "Loading…"
                : `${openCount} open · ${(ticketList?.length ?? 0) - openCount} closed`}
            </p>
            <Link href="/tickets/new">
              <Button variant="primary" size="sm">
                <Plus size={14} />
                New Ticket
              </Button>
            </Link>
          </div>

          {ticketList === null ? (
            <LoadingState label="Loading tickets…" />
          ) : ticketList.length === 0 ? (
            <EmptyState icon={LifeBuoy} title="No tickets yet">
              If something&apos;s wrong with your account, a payment or a
              listing, open a ticket and staff will follow up here.
            </EmptyState>
          ) : (
            <div className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
              {sortedTickets.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="group flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-zinc-50 sm:px-5 dark:hover:bg-zinc-800/40"
                >
                  <span
                    className={[
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1",
                      ticket.open
                        ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400"
                        : "bg-zinc-100 text-zinc-400 ring-zinc-200 dark:bg-zinc-800 dark:ring-zinc-700",
                    ].join(" ")}
                  >
                    {ticket.open ? (
                      <MessageCircle size={16} />
                    ) : (
                      <CheckCircle2 size={16} />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={[
                        "block truncate text-sm font-medium transition-colors group-hover:text-accent",
                        ticket.open
                          ? "text-zinc-950 dark:text-zinc-50"
                          : "text-zinc-500 dark:text-zinc-400",
                      ].join(" ")}
                    >
                      {ticket.issue}
                    </span>
                    <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                      Opened {formatRelativeTime(ticket.created_at)} ·{" "}
                      {ticket.messages.length} message
                      {ticket.messages.length === 1 ? "" : "s"}
                    </span>
                  </span>
                  <Badge variant={ticket.open ? "success" : "default"}>
                    {ticket.open ? "Open" : "Closed"}
                  </Badge>
                  <ChevronRight
                    size={16}
                    className="shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 dark:text-zinc-600"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </Container>
  );
}
