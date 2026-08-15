"use client";

import { ArrowLeft, Lock, Send, Unlock } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/layout/Container";
import { SignInLink } from "@/components/ui/SignInLink";
import { useAuth } from "@/hooks/useAuth";
import { tickets } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { Ticket } from "@/lib/api/types";
import { formatRelativeTime } from "@/lib/utils/format";

export default function TicketThreadPage() {
  const params = useParams<{ id: string }>();
  const { session, isAuthenticated, loading: authLoading } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [togglingOpen, setTogglingOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!session) return;
    setLoading(true);
    tickets
      .get(params.id, session.token)
      .then((t) => {
        setTicket(t);
        setNotFound(false);
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [session, params.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  if (authLoading) return null;

  if (!isAuthenticated) {
    return (
      <Container className="py-16 text-center">
        <p className="mb-3 text-sm text-zinc-500 dark:text-zinc-400">
          Sign in to view this ticket.
        </p>
        <SignInLink>
          <Button variant="primary" size="sm">
            Sign in
          </Button>
        </SignInLink>
      </Container>
    );
  }

  async function handleReply(e: React.FormEvent) {
    e.preventDefault();
    if (!session || reply.trim().length === 0) return;
    setSending(true);
    setError(null);
    try {
      await tickets.reply(params.id, reply.trim(), session.token);
      setReply("");
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to send reply.");
    } finally {
      setSending(false);
    }
  }

  async function toggleOpen(open: boolean) {
    if (!session) return;
    setTogglingOpen(true);
    setError(null);
    try {
      await tickets.setOpen(params.id, open, session.token);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update ticket.");
    } finally {
      setTogglingOpen(false);
    }
  }

  if (loading) return null;

  if (notFound || !ticket) {
    return (
      <Container className="py-16 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          This ticket doesn&apos;t exist, or you don&apos;t have permission to view it.
        </p>
        <Link
          href="/tickets"
          className="mt-4 inline-flex items-center gap-1.5 text-sm text-accent"
        >
          <ArrowLeft size={14} />
          Back to tickets
        </Link>
      </Container>
    );
  }

  const isOwner = session?.user_id === ticket.messages[0]?.author_id;

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-2xl">
        <Link
          href="/tickets"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <ArrowLeft size={14} />
          Back to tickets
        </Link>

        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-xl font-semibold text-zinc-950 dark:text-zinc-50">
            {ticket.issue}
          </h1>
          <Badge variant={ticket.open ? "success" : "default"}>
            {ticket.open ? "Open" : "Closed"}
          </Badge>
        </div>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
          Opened {formatRelativeTime(ticket.created_at)} by{" "}
          {ticket.author?.display_name || ticket.author?.username || "Unknown"}
        </p>

        <div className="mt-6 space-y-4">
          {ticket.messages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <Avatar
                src={msg.author?.avatar ?? ""}
                alt={msg.author?.username ?? "User"}
                size={32}
              />
              <div className="min-w-0 flex-1 rounded-xl border border-zinc-200 px-3 py-2.5 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {msg.author?.display_name || msg.author?.username || "Unknown"}
                  </span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-600">
                    {formatRelativeTime(msg.timestamp)}
                  </span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-700 dark:text-zinc-300">
                  {msg.content}
                </p>
              </div>
            </div>
          ))}
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {error}
          </div>
        )}

        {ticket.open ? (
          <form onSubmit={handleReply} className="mt-6 flex items-start gap-2">
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={3}
              maxLength={4000}
              placeholder="Write a reply…"
              className="min-w-0 flex-1 resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
            />
            <Button type="submit" variant="primary" loading={sending} disabled={!reply.trim()}>
              <Send size={14} />
              Send
            </Button>
          </form>
        ) : (
          <p className="mt-6 text-center text-sm text-zinc-400 dark:text-zinc-600">
            This ticket is closed.
          </p>
        )}

        <div className="mt-4 flex justify-end">
          {ticket.open ? (
            <Button
              variant="ghost"
              size="sm"
              loading={togglingOpen}
              onClick={() => toggleOpen(false)}
            >
              <Lock size={12} />
              Close ticket
            </Button>
          ) : (
            // Only staff can reopen a ticket. Anyone who can view a closed
            // ticket they don't own must be staff — get_ticket only ever
            // grants access to the owner or staff with manage_tickets.
            !isOwner && (
              <Button
                variant="ghost"
                size="sm"
                loading={togglingOpen}
                onClick={() => toggleOpen(true)}
              >
                <Unlock size={12} />
                Reopen ticket
              </Button>
            )
          )}
        </div>
      </div>
    </Container>
  );
}
