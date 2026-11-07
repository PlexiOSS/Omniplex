"use client";

import { tickets as ticketsApi } from "@omniplex/core/api";
import { SITE_URL } from "@omniplex/core/api/config";
import type {
  PlatformUser,
  Ticket,
  TicketMessage,
} from "@omniplex/core/api/types";
import { formatRelativeTime } from "@omniplex/core/utils/format";
import { Avatar } from "@omniplex/ui/Avatar";
import { Button } from "@omniplex/ui/Button";
import { TicketMessageBody } from "@omniplex/ui/tickets/TicketMessageBody";
import {
  ArrowLeft,
  ExternalLink,
  Lock,
  MessageSquare,
  Send,
  Unlock,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAdmin } from "@/app/AdminContext";
import { AdminError, AdminLoading } from "@/components/admin/AdminState";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";

type StaffTicket = Ticket & { ticket_context?: Record<string, string> };

const GROUP_WINDOW_MS = 7 * 60 * 1000;

interface MessageGroup {
  key: string;
  authorId: string;
  author: PlatformUser | null;
  messages: TicketMessage[];
}

function displayName(
  user: Pick<PlatformUser, "display_name" | "username"> | null | undefined,
) {
  return user?.display_name || user?.username || "Unknown";
}

function groupMessages(messages: TicketMessage[]) {
  const groups: MessageGroup[] = [];
  for (const msg of messages) {
    const last = groups.at(-1);
    const prev = last?.messages.at(-1);
    if (
      last &&
      prev &&
      last.authorId === msg.author_id &&
      new Date(msg.timestamp).getTime() - new Date(prev.timestamp).getTime() <
        GROUP_WINDOW_MS
    ) {
      last.messages.push(msg);
    } else {
      groups.push({
        key: msg.id,
        authorId: msg.author_id,
        author: msg.author,
        messages: [msg],
      });
    }
  }
  return groups;
}

function Detail({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2.5 text-sm">
      <dt className="shrink-0 text-zinc-500 dark:text-zinc-400">{label}</dt>
      <dd className="min-w-0 text-right text-zinc-950 wrap-anywhere dark:text-zinc-50">
        {children}
      </dd>
    </div>
  );
}

export default function StaffTicketPage() {
  const { id } = useParams<{ id: string }>();
  const { loginToken, hasPerm, staffMember } = useAdmin();
  const canManage = hasPerm("manage_tickets");

  const [ticket, setTicket] = useState<StaffTicket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [topicName, setTopicName] = useState<string | null>(null);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      setTicket(await arcadia.staffTicket(loginToken, id));
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load ticket.",
      );
    }
  }, [loginToken, id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!ticket?.topic_id) return;
    ticketsApi
      .getTopics()
      .then((res) =>
        setTopicName(
          res.topics.find((t) => t.id === ticket.topic_id)?.name ?? null,
        ),
      )
      .catch(() => {});
  }, [ticket?.topic_id]);

  const messageCount = ticket?.messages.length ?? 0;
  useEffect(() => {
    if (messageCount > 0) endRef.current?.scrollIntoView({ block: "end" });
  }, [messageCount]);

  async function send() {
    const content = reply.trim();
    if (!content || sending) return;
    setSending(true);
    setActionError(null);
    try {
      await arcadia.replyToTicket(loginToken, id, content);
      setReply("");
      await load();
    } catch (err) {
      setActionError(
        err instanceof ArcadiaError ? err.message : "Couldn't send your reply.",
      );
    } finally {
      setSending(false);
    }
  }

  async function toggleOpen(open: boolean) {
    setToggling(true);
    setActionError(null);
    try {
      await arcadia.setTicketOpen(loginToken, id, open);
      await load();
    } catch (err) {
      setActionError(
        err instanceof ArcadiaError
          ? err.message
          : `Couldn't ${open ? "reopen" : "close"} the ticket.`,
      );
    } finally {
      setToggling(false);
    }
  }

  if (error)
    return (
      <AdminError
        message={error}
        onRetry={() => {
          setError(null);
          load();
        }}
      />
    );

  if (!ticket) return <AdminLoading />;

  const users = new Map<string, string>();
  for (const user of [
    ticket.author,
    ticket.close_user,
    ...ticket.messages.map((m) => m.author),
    ...Object.values(ticket.mentions?.users ?? {}),
  ]) {
    if (user) users.set(user.id, displayName(user));
  }
  const lookup = {
    users,
    roles: ticket.mentions?.roles ?? {},
    channels: ticket.mentions?.channels ?? {},
  };
  const authorId = ticket.author?.id;
  const groups = groupMessages(
    ticket.messages.filter(
      (m) =>
        m.content.trim() ||
        (m.embeds ?? []).length > 0 ||
        (m.attachments ?? []).length > 0,
    ),
  );
  const context = Object.entries(ticket.ticket_context ?? {}).filter(
    ([, v]) => v,
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <Link
        href="/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        All tickets
      </Link>

      <div className="mt-4 flex flex-col gap-3 border-b border-zinc-200 pb-6 sm:flex-row sm:items-start sm:justify-between dark:border-zinc-800">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={[
                "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
                ticket.open
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                  : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300",
              ].join(" ")}
            >
              <span
                className={[
                  "h-1.5 w-1.5 rounded-full",
                  ticket.open ? "bg-emerald-500" : "bg-zinc-400",
                ].join(" ")}
              />
              {ticket.open ? "Open" : "Closed"}
            </span>
            {topicName && (
              <span className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent">
                {topicName}
              </span>
            )}
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950 wrap-anywhere dark:text-zinc-50">
            {ticket.issue}
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            {displayName(ticket.author)} opened this{" "}
            {formatRelativeTime(ticket.created_at)} · {ticket.messages.length}{" "}
            message{ticket.messages.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <MessageSquare size={20} className="text-zinc-400" />
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                No messages yet.
              </p>
            </div>
          ) : (
            <ol className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              {groups.map((group) => {
                const fromAuthor = group.authorId === authorId;
                return (
                  <li key={group.key} className="flex gap-3 px-5 py-4">
                    <Avatar
                      src={group.author?.avatar ?? ""}
                      alt={displayName(group.author)}
                      size={36}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                          {displayName(group.author)}
                        </span>
                        {!fromAuthor && !group.author?.bot && (
                          <span className="rounded bg-accent/10 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-accent">
                            Staff
                          </span>
                        )}
                        <span
                          className="text-xs text-zinc-400 dark:text-zinc-500"
                          title={new Date(
                            group.messages[0].timestamp,
                          ).toLocaleString()}
                        >
                          {formatRelativeTime(group.messages[0].timestamp)}
                        </span>
                      </div>
                      <div className="mt-1 space-y-2 text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
                        {group.messages.map((m) => (
                          <TicketMessageBody
                            key={m.id}
                            message={m}
                            lookup={lookup}
                          />
                        ))}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
          <div ref={endRef} />

          {canManage && ticket.open && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                send();
              }}
              className="border-t border-zinc-100 p-4 dark:border-zinc-800/80"
            >
              <label htmlFor="ticket-reply" className="sr-only">
                Reply
              </label>
              <textarea
                id="ticket-reply"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    send();
                  }
                }}
                rows={3}
                maxLength={4000}
                placeholder={`Reply to ${displayName(ticket.author)}`}
                className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-accent/50 focus:ring-2 focus:ring-accent/15 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
              />
              <div className="mt-2 flex items-center justify-between gap-3">
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Sent as {displayName(staffMember.user)}. Ctrl+Enter to send.
                </p>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={sending}
                  disabled={!reply.trim()}
                >
                  <Send size={13} />
                  Send
                </Button>
              </div>
            </form>
          )}
          {!ticket.open && (
            <p className="border-t border-zinc-100 px-5 py-3 text-center text-xs text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-400">
              This ticket is closed
              {ticket.close_user ? ` by ${displayName(ticket.close_user)}` : ""}
              . Reopen it to reply.
            </p>
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex items-center gap-3">
              <Avatar
                src={ticket.author?.avatar ?? ""}
                alt={displayName(ticket.author)}
                size={40}
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  {displayName(ticket.author)}
                </p>
                {ticket.author?.username && (
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                    @{ticket.author.username}
                  </p>
                )}
              </div>
            </div>
            <dl className="mt-3 divide-y divide-zinc-100 dark:divide-zinc-800/80">
              <Detail label="Opened">
                {new Date(ticket.created_at).toLocaleString()}
              </Detail>
              {topicName && <Detail label="Topic">{topicName}</Detail>}
              {context.map(([k, v]) => (
                <Detail key={k} label={k.replace(/_/g, " ")}>
                  {v}
                </Detail>
              ))}
              {!ticket.open && ticket.close_user && (
                <Detail label="Closed by">
                  {displayName(ticket.close_user)}
                </Detail>
              )}
            </dl>
            {ticket.author && (
              <a
                href={`${SITE_URL}/user/${ticket.author.id}`}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 text-sm text-accent hover:underline"
              >
                View profile
                <ExternalLink size={13} />
              </a>
            )}
          </div>

          {canManage && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
              {ticket.open ? (
                <Button
                  variant="secondary"
                  className="w-full"
                  loading={toggling}
                  onClick={() => toggleOpen(false)}
                >
                  <Lock size={14} />
                  Close ticket
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  className="w-full"
                  loading={toggling}
                  onClick={() => toggleOpen(true)}
                >
                  <Unlock size={14} />
                  Reopen ticket
                </Button>
              )}
            </div>
          )}

          {actionError && (
            <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
              {actionError}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
