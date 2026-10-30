"use client";

import {
  ArrowLeft,
  CalendarDays,
  Check,
  CheckCircle2,
  CircleDot,
  Clock,
  Copy,
  LifeBuoy,
  Lock,
  MessageSquare,
  SearchX,
  Send,
  Tag,
  Unlock,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Container } from "@/components/layout/Container";
import { TicketMessageBody } from "@/components/tickets/TicketMessageBody";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LoadingState } from "@/components/ui/PageStates";
import { SignInLink } from "@/components/ui/SignInLink";
import { StatRow } from "@/components/ui/StatRow";
import { StatusCard } from "@/components/ui/StatusCard";
import { useAuth } from "@/hooks/useAuth";
import { tickets } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { PlatformUser, Ticket, TicketMessage } from "@/lib/api/types";
import { formatRelativeTime } from "@/lib/utils/format";

const GROUP_WINDOW_MS = 7 * 60 * 1000;

interface MessageGroup {
  key: string;
  authorId: string;
  author: PlatformUser | null;
  messages: TicketMessage[];
}

function displayName(user: PlatformUser | null | undefined) {
  return user?.display_name || user?.username || "Unknown";
}

function isEmpty(msg: TicketMessage) {
  return (
    !msg.content.trim() &&
    (msg.embeds ?? []).length === 0 &&
    (msg.attachments ?? []).length === 0
  );
}

function dayLabel(date: Date) {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return "Today";
  if (date.toDateString() === yesterday.toDateString()) return "Yesterday";
  return date.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
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
        GROUP_WINDOW_MS &&
      new Date(msg.timestamp).toDateString() ===
        new Date(prev.timestamp).toDateString()
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

export default function TicketThreadPage() {
  const params = useParams<{ id: string }>();
  const { session, isAuthenticated, loading: authLoading } = useAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [topicName, setTopicName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [togglingOpen, setTogglingOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  useEffect(() => {
    if (!ticket?.topic_id) return;
    tickets
      .getTopics()
      .then((res) =>
        setTopicName(
          res.topics.find((t) => t.id === ticket.topic_id)?.name ?? null,
        ),
      )
      .catch(() => {});
  }, [ticket?.topic_id]);

  if (authLoading) return null;

  if (!isAuthenticated) {
    return (
      <Container className="flex flex-1 items-center py-24">
        <StatusCard
          icon={LifeBuoy}
          title="Sign in to view this ticket"
          actions={
            <SignInLink>
              <Button variant="primary" size="sm">
                Sign in
              </Button>
            </SignInLink>
          }
        />
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
      setError(
        err instanceof ApiError ? err.message : "Failed to update ticket.",
      );
    } finally {
      setTogglingOpen(false);
    }
  }

  async function copyId() {
    if (!ticket) return;
    try {
      await navigator.clipboard.writeText(ticket.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  if (loading && !ticket) {
    return (
      <Container className="py-10">
        <LoadingState label="Loading ticket…" />
      </Container>
    );
  }

  if (notFound || !ticket) {
    return (
      <Container className="flex flex-1 items-center py-24">
        <StatusCard
          icon={SearchX}
          tone="neutral"
          title="Ticket not found"
          description="This ticket doesn't exist, or you don't have permission to view it."
          actions={
            <Link href="/tickets">
              <Button variant="secondary" size="sm">
                Back to tickets
              </Button>
            </Link>
          }
        />
      </Container>
    );
  }

  const messages = [...ticket.messages]
    .filter((m) => !isEmpty(m))
    .sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime() ||
        a.id.length - b.id.length ||
        a.id.localeCompare(b.id),
    );
  const authorId = ticket.author?.id ?? messages[0]?.author_id;
  const isOwner = session?.user_id === authorId;
  const groups = groupMessages(messages);
  const lastActivity = messages.at(-1)?.timestamp;

  const peopleMap = new Map<
    string,
    { id: string; user: PlatformUser | null; roles: string[]; count: number }
  >();
  const person = (id: string | undefined, user: PlatformUser | null) => {
    if (!id) return null;
    let entry = peopleMap.get(id);
    if (!entry) {
      entry = { id, user, roles: [], count: 0 };
      peopleMap.set(id, entry);
    }
    if (!entry.user && user) entry.user = user;
    return entry;
  };
  person(authorId, ticket.author)?.roles.push("Opened the ticket");
  for (const msg of messages) {
    const entry = person(msg.author_id, msg.author);
    if (entry) entry.count++;
  }
  if (!ticket.open && ticket.close_user) {
    person(ticket.close_user.id, ticket.close_user)?.roles.push("Closed it");
  }
  const people = [...peopleMap.values()]
    .map((p) => ({
      ...p,
      roles:
        p.roles.length > 0
          ? p.roles
          : [p.user?.bot ? "Bot" : p.id === authorId ? "Member" : "Staff"],
    }))
    .sort(
      (a, b) =>
        Number(b.id === authorId) - Number(a.id === authorId) ||
        Number(!!a.user?.bot) - Number(!!b.user?.bot) ||
        b.count - a.count,
    );

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

  const actions = ticket.open ? (
    <Button
      variant="secondary"
      size="sm"
      className="w-full"
      loading={togglingOpen}
      onClick={() => toggleOpen(false)}
    >
      <Lock size={13} />
      Close ticket
    </Button>
  ) : (
    !isOwner && (
      <Button
        variant="secondary"
        size="sm"
        className="w-full"
        loading={togglingOpen}
        onClick={() => toggleOpen(true)}
      >
        <Unlock size={13} />
        Reopen ticket
      </Button>
    )
  );

  return (
    <Container className="py-10">
      <div className="mx-auto max-w-5xl">
        <Link
          href="/tickets"
          className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <ArrowLeft size={14} />
          Back to tickets
        </Link>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <h1 className="min-w-0 text-2xl font-semibold tracking-tight text-zinc-950 wrap-anywhere dark:text-zinc-50">
            {ticket.issue}
          </h1>
          <Badge variant={ticket.open ? "success" : "default"}>
            {ticket.open ? "Open" : "Closed"}
          </Badge>
        </div>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Opened by {displayName(ticket.author)}{" "}
          {formatRelativeTime(ticket.created_at)}
          {topicName && ` in ${topicName}`}
        </p>

        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className="min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
            {groups.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
                No messages yet.
              </p>
            ) : (
              <ol className="divide-y divide-zinc-100 dark:divide-zinc-800/70">
                {groups.map((group, i) => {
                  const first = group.messages[0];
                  const date = new Date(first.timestamp);
                  const prev = groups[i - 1]?.messages[0];
                  const newDay =
                    !prev ||
                    new Date(prev.timestamp).toDateString() !==
                      date.toDateString();
                  const isBot = !!group.author?.bot;
                  const fromStaff =
                    !isBot && !!authorId && group.authorId !== authorId;
                  const isYou = group.authorId === session?.user_id;
                  return (
                    <li key={group.key}>
                      {newDay && (
                        <div className="flex items-center gap-3 px-5 pt-4 text-[11px] font-medium tracking-wide text-zinc-400 uppercase dark:text-zinc-500">
                          <span className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                          {dayLabel(date)}
                          <span className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                        </div>
                      )}
                      <div
                        className={[
                          "flex gap-3 px-5 py-4",
                          fromStaff ? "bg-accent/[0.03]" : "",
                        ].join(" ")}
                      >
                        <Avatar
                          src={group.author?.avatar ?? ""}
                          alt={group.author?.username ?? "User"}
                          size={36}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                              {displayName(group.author)}
                            </span>
                            {isBot ? (
                              <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                                Bot
                              </span>
                            ) : fromStaff ? (
                              <span className="rounded-md bg-accent/10 px-1.5 py-0.5 text-[11px] font-medium text-accent">
                                Staff
                              </span>
                            ) : (
                              isYou && (
                                <span className="text-[11px] font-medium text-zinc-400">
                                  You
                                </span>
                              )
                            )}
                            <time
                              dateTime={first.timestamp}
                              title={date.toLocaleString()}
                              className="text-xs text-zinc-400 dark:text-zinc-500"
                            >
                              {date.toLocaleTimeString(undefined, {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </time>
                          </div>
                          <div className="space-y-1.5 text-sm text-zinc-700 dark:text-zinc-300">
                            {group.messages.map((msg) => (
                              <TicketMessageBody
                                key={msg.id}
                                message={msg}
                                lookup={lookup}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}

            {error && (
              <div className="border-t border-red-200 bg-red-50 px-5 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                {error}
              </div>
            )}

            {ticket.open ? (
              <form
                onSubmit={handleReply}
                className="border-t border-zinc-200 bg-zinc-50/60 p-3 dark:border-zinc-800 dark:bg-zinc-950/40"
              >
                <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white focus-within:border-accent/50 dark:border-zinc-800 dark:bg-zinc-900">
                  <textarea
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault();
                        e.currentTarget.form?.requestSubmit();
                      }
                    }}
                    rows={3}
                    maxLength={4000}
                    placeholder="Write a reply…"
                    aria-label="Reply"
                    className="block w-full resize-y bg-transparent px-4 py-3 text-sm text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-zinc-50 dark:placeholder:text-zinc-600"
                  />
                  <div className="flex items-center justify-between gap-3 px-3 pb-2.5">
                    <span className="text-xs text-zinc-400 tabular-nums">
                      {reply.length}/4000 · Ctrl+Enter to send
                    </span>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      loading={sending}
                      disabled={!reply.trim()}
                    >
                      <Send size={14} />
                      Send
                    </Button>
                  </div>
                </div>
              </form>
            ) : (
              <div className="flex items-center gap-2 border-t border-zinc-200 bg-zinc-50/60 px-5 py-3.5 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
                <CheckCircle2 size={15} className="shrink-0" />
                This ticket is closed.{" "}
                <Link
                  href="/tickets/new"
                  className="font-medium text-accent hover:underline"
                >
                  Open a new one
                </Link>{" "}
                if you need more help.
              </div>
            )}
          </section>

          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {actions && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                {actions}
              </div>
            )}

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Ticket
              </h3>
              <dl className="space-y-2.5">
                <StatRow
                  icon={
                    ticket.open ? <CircleDot size={14} /> : <Lock size={14} />
                  }
                  label="Status"
                  value={
                    <span
                      className={
                        ticket.open
                          ? "text-emerald-600 dark:text-emerald-400"
                          : undefined
                      }
                    >
                      {ticket.open ? "Open" : "Closed"}
                    </span>
                  }
                />
                {topicName && (
                  <StatRow
                    icon={<Tag size={14} />}
                    label="Topic"
                    value={topicName}
                  />
                )}
                <StatRow
                  icon={<CalendarDays size={14} />}
                  label="Created"
                  value={
                    <span title={new Date(ticket.created_at).toLocaleString()}>
                      {new Date(ticket.created_at).toLocaleDateString()}
                    </span>
                  }
                />
                {lastActivity && (
                  <StatRow
                    icon={<Clock size={14} />}
                    label="Last activity"
                    value={formatRelativeTime(lastActivity)}
                  />
                )}
                <StatRow
                  icon={<MessageSquare size={14} />}
                  label="Messages"
                  value={String(messages.length)}
                />
              </dl>
              <button
                type="button"
                onClick={copyId}
                title="Copy ticket ID"
                className="mt-4 flex w-full items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-left transition-colors hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-700"
              >
                <span className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">
                  {ticket.id}
                </span>
                {copied ? (
                  <Check size={13} className="shrink-0 text-emerald-500" />
                ) : (
                  <Copy size={13} className="shrink-0 text-zinc-400" />
                )}
              </button>
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                People
              </h3>
              <ul className="space-y-3">
                {people.map((p) => {
                  const inner = (
                    <>
                      <Avatar
                        src={p.user?.avatar ?? ""}
                        alt={p.user?.username ?? "User"}
                        size={32}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                          {displayName(p.user)}
                        </span>
                        <span className="block text-xs text-zinc-500 dark:text-zinc-400">
                          {p.roles.join(" · ")}
                          {p.count > 0 &&
                            ` · ${p.count} message${p.count === 1 ? "" : "s"}`}
                        </span>
                      </span>
                    </>
                  );
                  return (
                    <li key={p.id}>
                      {p.user && !p.user.bot ? (
                        <Link
                          href={`/user/${p.id}`}
                          className="flex items-center gap-2.5 rounded-lg transition-colors hover:text-accent"
                        >
                          {inner}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-2.5">{inner}</div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </Container>
  );
}
