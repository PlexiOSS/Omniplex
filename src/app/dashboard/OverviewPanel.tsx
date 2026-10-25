"use client";

import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Bell,
  Bot,
  Clock,
  Coins,
  KeyRound,
  Plus,
  Server as ServerIcon,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import useSWR from "swr";
import { Avatar } from "@/components/ui/Avatar";
import { alerts, votes } from "@/lib/api";
import type { BotType, IndexBot, IndexServer } from "@/lib/api/types";
import { botPath, mirroredAvatarUrl, serverPath } from "@/lib/utils/assets";
import { formatCount, formatCountLabel } from "@/lib/utils/format";

interface Listing {
  kind: "bot" | "server";
  id: string;
  name: string;
  avatar: string;
  href: string;
  type: BotType | string;
  votes: number;
}

interface OverviewPanelProps {
  userId: string;
  token: string;
  bots: IndexBot[];
  servers: IndexServer[];
  onNavigate: (
    tab: "bots" | "servers" | "notifications" | "sessions" | "profile",
  ) => void;
}

const LIVE = new Set(["approved", "certified"]);
const IN_REVIEW = new Set(["pending", "under_review", "claimed"]);
const DENIED = new Set(["denied", "banned"]);

function toListings(bots: IndexBot[], servers: IndexServer[]): Listing[] {
  return [
    ...bots.map((b) => ({
      kind: "bot" as const,
      id: b.bot_id,
      name: b.user?.username ?? b.bot_id,
      avatar: mirroredAvatarUrl("bots", b.bot_id, b.user?.avatar),
      href: botPath(b.bot_id, b.vanity),
      type: b.type,
      votes: b.approximate_votes,
    })),
    ...servers.map((s) => ({
      kind: "server" as const,
      id: s.server_id,
      name: s.name,
      avatar: mirroredAvatarUrl("servers", s.server_id, s.avatar),
      href: serverPath(s.server_id, s.vanity),
      type: s.type,
      votes: s.approximate_votes,
    })),
  ];
}

function nextReset(periodStart: string | null | undefined): Date | null {
  if (!periodStart) return null;
  const next = new Date(periodStart);
  next.setMonth(next.getMonth() + 1);
  return next;
}

function Panel({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon: ReactNode;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-semibold text-zinc-950 dark:text-zinc-50">
          <span className="text-accent">{icon}</span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-2xl font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
        {value}
      </p>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
    </div>
  );
}

export function OverviewPanel({
  userId,
  token,
  bots,
  servers,
  onNavigate,
}: OverviewPanelProps) {
  const { data: rank } = useSWR(["dashboard/rank", userId], () =>
    votes.getLeaderboardRank(userId, "month"),
  );
  const { data: featured } = useSWR(["dashboard/alerts", userId], () =>
    alerts.getFeatured(userId, token),
  );

  const listings = toListings(bots, servers);
  const live = listings.filter((l) => LIVE.has(l.type));
  const inReview = listings.filter((l) => IN_REVIEW.has(l.type));
  const denied = listings.filter((l) => DENIED.has(l.type));
  const monthVotes = live.reduce((sum, l) => sum + l.votes, 0);
  const top = [...live].sort((a, b) => b.votes - a.votes).slice(0, 5);
  const reset = nextReset(rank?.period_start);
  const unread = featured?.unacked_count ?? 0;

  const attention: { key: string; icon: ReactNode; body: ReactNode }[] = [];
  if (denied.length > 0) {
    attention.push({
      key: "denied",
      icon: <AlertTriangle size={15} className="text-red-500" />,
      body: (
        <>
          {denied.length === 1 ? (
            <>
              <Link
                href={denied[0].href}
                className="font-medium hover:text-accent"
              >
                {denied[0].name}
              </Link>{" "}
              was denied.
            </>
          ) : (
            <>
              {formatCountLabel(denied.length, "listing")} were denied:{" "}
              {denied.map((l, i) => (
                <span key={`${l.kind}-${l.id}`}>
                  {i > 0 && ", "}
                  <Link href={l.href} className="font-medium hover:text-accent">
                    {l.name}
                  </Link>
                </span>
              ))}
              .
            </>
          )}{" "}
          Check the reviewer&apos;s feedback in your notifications, fix the
          issue, then{" "}
          <Link
            href="/apps/resubmit"
            className="font-medium text-accent hover:underline"
          >
            request a re-review
          </Link>
          .
        </>
      ),
    });
  }
  if (inReview.length > 0) {
    attention.push({
      key: "review",
      icon: <Clock size={15} className="text-amber-500" />,
      body: (
        <>
          {formatCountLabel(inReview.length, "listing")} waiting for staff
          review: {inReview.map((l) => l.name).join(", ")}.
        </>
      ),
    });
  }
  if (monthVotes > 0) {
    attention.push({
      key: "credits",
      icon: <Coins size={15} className="text-accent" />,
      body: (
        <>
          Your listings have {formatCountLabel(monthVotes, "vote")} this month.
          Votes reset
          {reset
            ? ` on ${reset.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`
            : " monthly"}
          , so{" "}
          <Link
            href="/shop"
            className="font-medium text-accent hover:underline"
          >
            redeem them for credits
          </Link>{" "}
          before then.
        </>
      ),
    });
  }
  if (unread > 0) {
    attention.push({
      key: "unread",
      icon: <Bell size={15} className="text-accent" />,
      body: (
        <>
          You have {formatCountLabel(unread, "unread notification")}.{" "}
          <button
            type="button"
            onClick={() => onNavigate("notifications")}
            className="font-medium text-accent hover:underline"
          >
            Review them
          </button>
          .
        </>
      ),
    });
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_20rem]">
        <Panel title="Needs attention" icon={<AlertTriangle size={16} />}>
          {attention.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              You&apos;re all caught up. Nothing needs your attention right now.
            </p>
          ) : (
            <ul className="space-y-3">
              {attention.map((item) => (
                <li
                  key={item.key}
                  className="flex gap-3 text-sm text-zinc-600 dark:text-zinc-300"
                >
                  <span className="mt-0.5 shrink-0">{item.icon}</span>
                  <span className="min-w-0">{item.body}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Quick actions" icon={<Plus size={16} />}>
          <div className="grid gap-2">
            {[
              {
                href: "/bots/add",
                label: "Add a bot",
                icon: <Bot size={14} />,
              },
              {
                href: "/servers/add",
                label: "Add a server",
                icon: <ServerIcon size={14} />,
              },
            ].map((a) => (
              <Link
                key={a.href}
                href={a.href}
                className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-sm font-medium text-zinc-700 transition-colors hover:border-accent/40 hover:text-accent dark:border-zinc-800 dark:text-zinc-300"
              >
                {a.icon}
                {a.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => onNavigate("sessions")}
              className="flex items-center gap-2 rounded-lg border border-zinc-200 px-3 py-2 text-left text-sm font-medium text-zinc-700 transition-colors hover:border-accent/40 hover:text-accent dark:border-zinc-800 dark:text-zinc-300"
            >
              <KeyRound size={14} />
              Create an API token
            </button>
            <Link
              href={`/user/${userId}`}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
            >
              View your public profile <ArrowUpRight size={13} />
            </Link>
          </div>
        </Panel>
      </div>

      <Panel title="This month" icon={<Trophy size={16} />}>
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
          <Stat
            label="Votes on your listings"
            value={formatCount(monthVotes)}
          />
          <Stat
            label="Live listings"
            value={`${formatCount(live.length)} / ${formatCount(listings.length)}`}
          />
          <Stat
            label="Your voter rank"
            value={rank && rank.rank > 0 ? `#${formatCount(rank.rank)}` : "–"}
          />
          <Stat
            label="Votes you cast"
            value={rank ? formatCount(rank.votes) : "–"}
          />
        </div>

        {top.length > 0 && (
          <div className="mt-6 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <p className="mb-3 text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              Most voted this month
            </p>
            <ul className="space-y-2.5">
              {top.map((l) => (
                <li key={`${l.kind}-${l.id}`}>
                  <Link
                    href={l.href}
                    className="group flex min-w-0 items-center gap-3"
                  >
                    <Avatar src={l.avatar} alt={l.name} size={28} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800 transition-colors group-hover:text-accent dark:text-zinc-200">
                      {l.name}
                    </span>
                    <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                      {formatCountLabel(l.votes, "vote")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex gap-4">
              <button
                type="button"
                onClick={() => onNavigate("bots")}
                className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
              >
                All bots <ArrowRight size={13} />
              </button>
              <button
                type="button"
                onClick={() => onNavigate("servers")}
                className="inline-flex items-center gap-1 text-sm text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
              >
                All servers <ArrowRight size={13} />
              </button>
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
