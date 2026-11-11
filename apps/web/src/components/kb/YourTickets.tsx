"use client";

import { tickets } from "@omniplex/core/api";
import { formatRelativeTime } from "@omniplex/core/utils/format";
import { ArrowRight, LifeBuoy } from "lucide-react";
import Link from "next/link";
import useSWR from "swr";
import { useAuth } from "@/hooks/useAuth";

export function YourTickets() {
  const { session } = useAuth();
  const { data } = useSWR(
    session ? ["kb/tickets", session.user_id] : null,
    () => (session ? tickets.list(session.user_id, session.token) : null),
  );
  const open = (data?.tickets ?? []).filter((t) => t.open);

  return (
    <section className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/15">
          <LifeBuoy size={18} />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">
            Still stuck?
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Open a ticket and our team will get back to you.
          </p>
        </div>
      </div>

      {open.length > 0 && (
        <ul className="mt-4 space-y-0.5 border-t border-zinc-100 pt-3 dark:border-zinc-800">
          {open.slice(0, 3).map((ticket) => (
            <li key={ticket.id}>
              <Link
                href={`/tickets/${ticket.id}`}
                className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-1.5 text-sm transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
              >
                <span className="min-w-0 truncate text-zinc-700 dark:text-zinc-300">
                  {ticket.issue}
                </span>
                <span className="shrink-0 text-xs text-zinc-400">
                  {formatRelativeTime(ticket.created_at)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-auto flex flex-wrap items-center gap-3 pt-4">
        <Link
          href="/tickets/new"
          className="inline-flex h-9 items-center rounded-lg bg-accent px-4 text-sm font-medium text-accent-fg transition-opacity hover:opacity-90"
        >
          Open a ticket
        </Link>
        {session && (
          <Link
            href="/tickets"
            className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-accent dark:text-zinc-300"
          >
            {open.length > 0
              ? `Your open tickets (${open.length})`
              : "Your tickets"}
            <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </section>
  );
}
