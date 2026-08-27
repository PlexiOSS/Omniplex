"use client";

import { LifeBuoy, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SignInLink } from "@/components/ui/SignInLink";
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

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
          <LifeBuoy size={22} className="text-accent" />
        </div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Support Tickets
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Something wrong with your account, a payment, or a listing? Open a
          ticket and a staff member will follow up here.
        </p>
      </div>

      {authLoading ? null : !isAuthenticated ? (
        <div className="mx-auto mt-10 max-w-md rounded-2xl border border-zinc-200 p-8 text-center dark:border-zinc-800">
          <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to open or view your tickets.
          </p>
          <SignInLink>
            <Button variant="primary" size="sm">
              Sign in
            </Button>
          </SignInLink>
        </div>
      ) : (
        <div className="mx-auto mt-10 max-w-2xl">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {ticketList === null
                ? "Loading…"
                : `${ticketList.length} ticket${ticketList.length === 1 ? "" : "s"}`}
            </p>
            <Link href="/tickets/new">
              <Button variant="primary" size="sm">
                <Plus size={14} />
                New Ticket
              </Button>
            </Link>
          </div>

          {ticketList && ticketList.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-zinc-200 py-16 text-center dark:border-zinc-800">
              <LifeBuoy size={28} className="mb-3 text-zinc-300 dark:text-zinc-700" />
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                You haven&apos;t opened any tickets yet.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {(ticketList ?? []).map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="flex items-center justify-between rounded-xl border border-zinc-200 px-4 py-3 transition-colors hover:border-accent/40 dark:border-zinc-800"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {ticket.issue}
                    </p>
                    <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-600">
                      Opened {formatRelativeTime(ticket.created_at)} ·{" "}
                      {ticket.messages.length} message
                      {ticket.messages.length === 1 ? "" : "s"}
                    </p>
                  </div>
                  <Badge variant={ticket.open ? "success" : "default"}>
                    {ticket.open ? "Open" : "Closed"}
                  </Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </Container>
  );
}
