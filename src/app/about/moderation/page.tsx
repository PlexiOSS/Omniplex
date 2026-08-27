import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { list, reports } from "@/lib/api";
import type { ReportReason, ReportStatus } from "@/lib/api/types";
import { formatCount } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Moderation Transparency",
  description:
    "Anonymized counts of content reports filed on Omniplex, by reason and status.",
};

const REASON_LABELS: Record<ReportReason, string> = {
  license_violation: "License violation",
  tos_violation: "ToS violation",
  spam: "Spam",
  other: "Other",
};

const STATUS_LABELS: Record<ReportStatus, string> = {
  open: "Open",
  under_review: "Under Review",
  resolved: "Resolved",
  dismissed: "Dismissed",
};

const STATUS_ORDER: ReportStatus[] = [
  "open",
  "under_review",
  "resolved",
  "dismissed",
];

function StatsTable({
  title,
  metricLabel,
  rows,
}: {
  title: string;
  metricLabel: string;
  rows: { label: string; value: number }[];
}) {
  return (
    <div className="mx-auto mt-10 max-w-2xl">
      <h2 className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
        {title}
      </h2>
      <div className="overflow-x-auto">
        <table className="w-full min-w-72 border-collapse text-sm">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800">
              <th className="py-2 pr-4 text-left font-medium text-zinc-500 dark:text-zinc-400">
                {metricLabel}
              </th>
              <th className="py-2 px-4 text-right font-medium text-zinc-500 dark:text-zinc-400">
                Count
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ label, value }) => (
              <tr
                key={label}
                className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
              >
                <td className="py-2.5 pr-4 font-medium text-zinc-950 dark:text-zinc-50">
                  {label}
                </td>
                <td className="py-2.5 px-4 text-right text-zinc-600 dark:text-zinc-400">
                  {formatCount(value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default async function ModerationPage() {
  const [stats, listStats] = await Promise.all([
    reports.getStats().catch(() => null),
    list.getStats().catch(() => null),
  ]);

  const byReason = new Map<ReportReason, Map<ReportStatus, number>>();
  let total = 0;
  let resolvedOrDismissed = 0;

  for (const row of stats ?? []) {
    total += row.count;
    if (row.status === "resolved" || row.status === "dismissed") {
      resolvedOrDismissed += row.count;
    }
    if (!byReason.has(row.reason)) byReason.set(row.reason, new Map());
    // biome-ignore lint/style/noNonNullAssertion: just set above
    byReason.get(row.reason)!.set(row.status, row.count);
  }

  const resolutionRate =
    total > 0 ? Math.round((resolvedOrDismissed / total) * 100) : null;

  const reasons = Object.keys(REASON_LABELS) as ReportReason[];

  const botPipelineEntries = listStats
    ? [
        { label: "Approved", value: listStats.total_approved_bots },
        { label: "Certified", value: listStats.total_certified_bots },
        { label: "Awaiting Review", value: listStats.total_pending_bots },
        { label: "Denied", value: listStats.total_denied_bots },
      ]
    : [];

  const serverPipelineEntries = listStats
    ? [
        { label: "Approved", value: listStats.total_approved_servers },
        { label: "Certified", value: listStats.total_certified_servers },
        { label: "Awaiting Review", value: listStats.total_pending_servers },
        { label: "Denied", value: listStats.total_denied_servers },
      ]
    : [];

  const safetyEntries = listStats
    ? [
        { label: "Banned Users", value: listStats.total_banned_users },
        {
          label: "Vote-Banned Bots",
          value: listStats.total_vote_banned_bots,
        },
        {
          label: "Vote-Banned Servers",
          value: listStats.total_vote_banned_servers,
        },
      ]
    : [];

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
          Anyone can report a bot, server, or pack for a license violation,
          Terms of Service violation, spam, or anything else that needs a look.
          Reports themselves and who filed them are visible only to staff.
          What's shown here is just the count, broken down by reason and status,
          so the moderation process isn't a total black box.
        </p>
      </div>

      {botPipelineEntries.length > 0 && (
        <StatsTable
          title="Bot review pipeline"
          metricLabel="Stage"
          rows={botPipelineEntries}
        />
      )}

      {serverPipelineEntries.length > 0 && (
        <StatsTable
          title="Server review pipeline"
          metricLabel="Stage"
          rows={serverPipelineEntries}
        />
      )}

      {safetyEntries.length > 0 && (
        <StatsTable
          title="Platform safety"
          metricLabel="Metric"
          rows={safetyEntries}
        />
      )}

      <div className="mx-auto mt-10 max-w-2xl">
        <h2 className="mb-3 text-center text-xs font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-600">
          Reports by reason
        </h2>

        {!stats ? (
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            Couldn't load moderation stats right now check back shortly.
          </p>
        ) : total === 0 ? (
          <p className="text-center text-sm text-zinc-500 dark:text-zinc-400">
            No reports have been filed yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-120 border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800">
                  <th className="py-2 pr-4 text-left font-medium text-zinc-500 dark:text-zinc-400">
                    Reason
                  </th>
                  {STATUS_ORDER.map((status) => (
                    <th
                      key={status}
                      className="py-2 px-4 text-right font-medium text-zinc-500 dark:text-zinc-400"
                    >
                      {STATUS_LABELS[status]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {reasons.map((reason) => (
                  <tr
                    key={reason}
                    className="border-b border-zinc-100 last:border-0 dark:border-zinc-900"
                  >
                    <td className="py-2.5 pr-4 font-medium text-zinc-950 dark:text-zinc-50">
                      {REASON_LABELS[reason]}
                    </td>
                    {STATUS_ORDER.map((status) => (
                      <td
                        key={status}
                        className="py-2.5 px-4 text-right text-zinc-600 dark:text-zinc-400"
                      >
                        {byReason.get(reason)?.get(status) ?? 0}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-4 text-center text-xs text-zinc-400 dark:text-zinc-600">
              {total} report{total === 1 ? "" : "s"} filed in total
              {resolutionRate !== null &&
                ` — ${resolutionRate}% resolved or dismissed`}
              .
            </p>
          </div>
        )}
      </div>
    </Container>
  );
}
