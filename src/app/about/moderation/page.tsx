import { ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { reports } from "@/lib/api";
import type { ReportReason, ReportStatus } from "@/lib/api/types";

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

export default async function ModerationPage() {
  const stats = await reports.getStats().catch(() => null);

  const byReason = new Map<ReportReason, Map<ReportStatus, number>>();
  let total = 0;

  for (const row of stats ?? []) {
    total += row.count;
    if (!byReason.has(row.reason)) byReason.set(row.reason, new Map());
    // biome-ignore lint/style/noNonNullAssertion: just set above
    byReason.get(row.reason)!.set(row.status, row.count);
  }

  const reasons = Object.keys(REASON_LABELS) as ReportReason[];

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
          Terms of Service violation, spam, or anything else that needs a
          look. Reports themselves — and who filed them — are visible only
          to staff. What's shown here is just the count, broken down by
          reason and status, so the moderation process isn't a total black
          box.
        </p>
      </div>

      {!stats ? (
        <p className="mt-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Couldn't load moderation stats right now — check back shortly.
        </p>
      ) : total === 0 ? (
        <p className="mt-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No reports have been filed yet.
        </p>
      ) : (
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[480px] border-collapse text-sm">
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
            {total} report{total === 1 ? "" : "s"} filed in total.
          </p>
        </div>
      )}
    </Container>
  );
}
