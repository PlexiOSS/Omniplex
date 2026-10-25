import { ArrowRight, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import type { ReactNode } from "react";
import { Container } from "@/components/layout/Container";
import { list, reports } from "@/lib/api";
import type { ReportReason, ReportStatus } from "@/lib/api/types";
import { formatCount } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Moderation Transparency",
  description:
    "How listings are reviewed and reports are handled on Omniplex, with anonymized counts.",
};

const REASON_LABELS: Record<ReportReason, string> = {
  license_violation: "License violation",
  tos_violation: "ToS violation",
  spam: "Spam",
  other: "Other",
};

const STATUS_LABELS: Record<ReportStatus, string> = {
  open: "Open",
  under_review: "Under review",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

const STATUS_COLORS: Record<ReportStatus, string> = {
  open: "bg-amber-500",
  under_review: "bg-blue-500",
  resolved: "bg-emerald-500",
  dismissed: "bg-zinc-400 dark:bg-zinc-500",
};

const STATUS_ORDER: ReportStatus[] = [
  "open",
  "under_review",
  "resolved",
  "dismissed",
];

interface Segment {
  label: string;
  value: number;
  color: string;
}

function percent(part: number, whole: number): number | null {
  return whole > 0 ? Math.round((part / whole) * 100) : null;
}

function SummaryStat({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="text-2xl font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
        {value}
      </p>
      <p className="mt-0.5 text-sm text-zinc-600 dark:text-zinc-300">{label}</p>
      {hint && (
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{hint}</p>
      )}
    </div>
  );
}

function Card({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">{title}</h2>
      {description && (
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          {description}
        </p>
      )}
      <div className="mt-4">{children}</div>
    </section>
  );
}

function StackedBar({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return <div className="h-2.5 rounded-full bg-zinc-100 dark:bg-zinc-800" />;
  }
  return (
    <div className="flex h-2.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
      {segments
        .filter((s) => s.value > 0)
        .map((s) => (
          <div
            key={s.label}
            className={s.color}
            style={{ width: `${(s.value / total) * 100}%` }}
            title={`${s.label}: ${formatCount(s.value)}`}
          />
        ))}
    </div>
  );
}

function Legend({ segments }: { segments: Segment[] }) {
  return (
    <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2">
      {segments.map((s) => (
        <div key={s.label} className="flex items-center gap-2 text-sm">
          <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.color}`} />
          <dt className="min-w-0 flex-1 truncate text-zinc-600 dark:text-zinc-300">
            {s.label}
          </dt>
          <dd className="font-medium tabular-nums text-zinc-950 dark:text-zinc-50">
            {formatCount(s.value)}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Unavailable() {
  return (
    <p className="text-sm text-zinc-500 dark:text-zinc-400">
      Couldn&apos;t load these numbers right now. Check back shortly.
    </p>
  );
}

function pipeline(
  approved: number,
  certified: number,
  pending: number,
  denied: number,
): Segment[] {
  return [
    { label: "Approved", value: approved, color: "bg-emerald-500" },
    { label: "Certified", value: certified, color: "bg-accent" },
    { label: "Awaiting review", value: pending, color: "bg-amber-500" },
    { label: "Denied", value: denied, color: "bg-red-500" },
  ];
}

const LINKS = [
  { href: "/kb/bots/rules", label: "Bot Rules" },
  { href: "/kb/servers/listing-rules", label: "Server Listing Rules" },
  { href: "/kb/support/reporting-and-appeals", label: "Reporting & Appeals" },
  { href: "/about/team", label: "Meet the team" },
];

export default async function ModerationPage() {
  const [stats, listStats] = await Promise.all([
    reports.getStats().catch(() => null),
    list.getStats().catch(() => null),
  ]);

  const byReason = new Map<ReportReason, Map<ReportStatus, number>>();
  const byStatus = new Map<ReportStatus, number>();
  let totalReports = 0;
  for (const row of stats ?? []) {
    totalReports += row.count;
    byStatus.set(row.status, (byStatus.get(row.status) ?? 0) + row.count);
    if (!byReason.has(row.reason)) byReason.set(row.reason, new Map());
    // biome-ignore lint/style/noNonNullAssertion: just set above
    byReason.get(row.reason)!.set(row.status, row.count);
  }
  const closed =
    (byStatus.get("resolved") ?? 0) + (byStatus.get("dismissed") ?? 0);
  const closedRate = percent(closed, totalReports);
  const reasons = (Object.keys(REASON_LABELS) as ReportReason[])
    .map((reason) => ({
      reason,
      total: [...(byReason.get(reason)?.values() ?? [])].reduce(
        (a, b) => a + b,
        0,
      ),
    }))
    .sort((a, b) => b.total - a.total);

  const botSegments = listStats
    ? pipeline(
        listStats.total_approved_bots,
        listStats.total_certified_bots,
        listStats.total_pending_bots,
        listStats.total_denied_bots,
      )
    : null;
  const serverSegments = listStats
    ? pipeline(
        listStats.total_approved_servers,
        listStats.total_certified_servers,
        listStats.total_pending_servers,
        listStats.total_denied_servers,
      )
    : null;

  const botsDecided = listStats
    ? listStats.total_approved_bots +
      listStats.total_certified_bots +
      listStats.total_denied_bots
    : 0;
  const botApprovalRate = listStats
    ? percent(
        listStats.total_approved_bots + listStats.total_certified_bots,
        botsDecided,
      )
    : null;
  const awaitingReview = listStats
    ? listStats.total_pending_bots + listStats.total_pending_servers
    : null;

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
          <ShieldCheck size={22} className="text-accent" />
        </div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Moderation Transparency
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          How listings are reviewed and reports are handled, in numbers.
          Individual reports, and who filed them, are only ever visible to
          staff.
        </p>
      </div>

      <div className="mx-auto mt-10 max-w-5xl space-y-6">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <SummaryStat
            label="Reports filed"
            value={stats ? formatCount(totalReports) : "–"}
          />
          <SummaryStat
            label="Reports closed"
            value={closedRate !== null ? `${closedRate}%` : "–"}
            hint="Resolved or dismissed"
          />
          <SummaryStat
            label="Bot approval rate"
            value={botApprovalRate !== null ? `${botApprovalRate}%` : "–"}
            hint={
              listStats
                ? `Of ${formatCount(botsDecided)} decided submissions`
                : undefined
            }
          />
          <SummaryStat
            label="Awaiting review"
            value={awaitingReview !== null ? formatCount(awaitingReview) : "–"}
            hint="Bots and servers"
          />
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <Card
            title="Bot reviews"
            description="Every submitted bot is reviewed by staff before it's listed."
          >
            {botSegments ? (
              <>
                <StackedBar segments={botSegments} />
                <Legend segments={botSegments} />
              </>
            ) : (
              <Unavailable />
            )}
          </Card>

          <Card
            title="Server reviews"
            description="Servers are reviewed the same way, after we confirm the submitter manages the server."
          >
            {serverSegments ? (
              <>
                <StackedBar segments={serverSegments} />
                <Legend segments={serverSegments} />
              </>
            ) : (
              <Unavailable />
            )}
          </Card>

          <Card
            title="Reports"
            description="Anyone can report a bot, server, team or pack. Here's what they were about and where they stand."
          >
            {!stats ? (
              <Unavailable />
            ) : totalReports === 0 ? (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                No reports have been filed yet.
              </p>
            ) : (
              <div className="space-y-4">
                {reasons.map(({ reason, total }) => {
                  const segments = STATUS_ORDER.map((status) => ({
                    label: STATUS_LABELS[status],
                    value: byReason.get(reason)?.get(status) ?? 0,
                    color: STATUS_COLORS[status],
                  }));
                  return (
                    <div key={reason}>
                      <div className="mb-1.5 flex items-baseline justify-between gap-2 text-sm">
                        <span className="text-zinc-700 dark:text-zinc-300">
                          {REASON_LABELS[reason]}
                        </span>
                        <span className="tabular-nums text-zinc-500 dark:text-zinc-400">
                          {formatCount(total)}
                        </span>
                      </div>
                      <StackedBar segments={segments} />
                    </div>
                  );
                })}
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-1">
                  {STATUS_ORDER.map((status) => (
                    <span
                      key={status}
                      className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400"
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${STATUS_COLORS[status]}`}
                      />
                      {STATUS_LABELS[status]} (
                      {formatCount(byStatus.get(status) ?? 0)})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </Card>

          <Card
            title="Enforcement"
            description="Account-level actions currently in effect."
          >
            {listStats ? (
              <Legend
                segments={[
                  {
                    label: "Banned users",
                    value: listStats.total_banned_users,
                    color: "bg-red-500",
                  },
                  {
                    label: "Vote-banned bots",
                    value: listStats.total_vote_banned_bots,
                    color: "bg-amber-500",
                  },
                  {
                    label: "Vote-banned servers",
                    value: listStats.total_vote_banned_servers,
                    color: "bg-amber-500",
                  },
                ]}
              />
            ) : (
              <Unavailable />
            )}
          </Card>
        </div>

        <section className="rounded-xl border border-zinc-200 bg-zinc-50 p-5 dark:border-zinc-800 dark:bg-zinc-900/50">
          <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">
            How moderation works
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-zinc-600 dark:text-zinc-300">
            <li>
              New bots and servers are reviewed by staff against our rules
              before they appear on the site, and owners are told why if
              something is denied.
            </li>
            <li>
              Every report is read by a person. Closing a report and acting on a
              listing are separate steps, so nothing is removed automatically.
            </li>
            <li>
              Every staff action taken through the staff panel or staff bot is
              logged, so moderation decisions can always be reviewed.
            </li>
          </ul>
          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:underline"
              >
                {link.label} <ArrowRight size={13} />
              </Link>
            ))}
          </div>
        </section>
      </div>
    </Container>
  );
}
