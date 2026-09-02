"use client";

import { Flag } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { Report, ReportStatus } from "@/lib/arcadia/types";
import { formatRelativeTime } from "@/lib/utils/format";
import { AdminPageHeader } from "../../AdminPageHeader";
import { useAdmin } from "../../AdminContext";
import { ReportDetailModal } from "./ReportDetailModal";

const STATUS_TABS: { key: ReportStatus | null; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "under_review", label: "Under Review" },
  { key: "resolved", label: "Resolved" },
  { key: "dismissed", label: "Dismissed" },
  { key: null, label: "All" },
];

const REASON_LABELS: Record<Report["reason"], string> = {
  license_violation: "License violation",
  tos_violation: "ToS violation",
  spam: "Spam",
  other: "Other",
};

const STATUS_BADGE: Record<
  ReportStatus,
  { variant: "warning" | "info" | "success" | "default"; label: string }
> = {
  open: { variant: "warning", label: "Open" },
  under_review: { variant: "info", label: "Under Review" },
  resolved: { variant: "success", label: "Resolved" },
  dismissed: { variant: "default", label: "Dismissed" },
};

export default function ReportsAdminPage() {
  const { loginToken, hasPerm } = useAdmin();
  const canReview = hasPerm("review_reports");

  const [status, setStatus] = useState<ReportStatus | null>("open");
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<Report | null>(null);

  const load = useCallback(async () => {
    try {
      setReports(await arcadia.reports.list(loginToken, status));
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load reports.",
      );
    }
  }, [loginToken, status]);

  useEffect(() => {
    setReports(null);
    load();
  }, [load]);

  if (!canReview) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-center px-4 py-24 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          You don't have permission to review reports.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <AdminPageHeader
        title="Reports"
        description="User-filed reports against bots, servers and packs — license violations, ToS violations, spam, and anything else that needs a look."
      />

      <div className="mt-6 flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => setStatus(tab.key)}
            className={[
              "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              status === tab.key
                ? "bg-accent/10 text-accent"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50",
            ].join(" ")}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {!reports ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
        </div>
      ) : (
        <div className="mt-6 space-y-2">
          {reports.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center text-zinc-500 dark:text-zinc-400">
              <Flag size={24} className="mb-2 text-zinc-300 dark:text-zinc-700" />
              <p className="text-sm">No reports here.</p>
            </div>
          )}
          {reports.map((report) => (
            <button
              key={report.id}
              type="button"
              onClick={() => setSelected(report)}
              className="flex w-full items-center gap-3 rounded-xl border border-zinc-200 p-4 text-left transition-colors hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800 dark:hover:border-accent/40 dark:hover:bg-accent/10"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="font-semibold text-zinc-950 dark:text-zinc-50">
                    {report.target_name}
                  </span>
                  <Badge variant="default">{report.target_type}</Badge>
                  <Badge variant={STATUS_BADGE[report.status].variant}>
                    {STATUS_BADGE[report.status].label}
                  </Badge>
                </div>
                <p className="mt-1 line-clamp-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {REASON_LABELS[report.reason]} — {report.description}
                </p>
              </div>
              <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-600">
                {formatRelativeTime(report.created_at)}
              </span>
            </button>
          ))}
        </div>
      )}

      {selected && (
        <ReportDetailModal
          report={selected}
          loginToken={loginToken}
          onClose={() => setSelected(null)}
          onResolved={() => {
            setSelected(null);
            load();
          }}
        />
      )}
    </div>
  );
}
