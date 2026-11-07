"use client";

import { formatRelativeTime } from "@omniplex/core/utils/format";
import { CheckCircle2, Flag, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  REASON_LABELS,
  ReportDetail,
} from "@/app/(dashboard)/reports/ReportDetail";
import { useAdmin } from "@/app/AdminContext";
import { AdminPageHeader } from "@/app/AdminPageHeader";
import {
  AdminEmpty,
  AdminError,
  AdminLoading,
} from "@/components/admin/AdminState";
import { AdminFilterChips } from "@/components/admin/AdminToolbar";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { Report, ReportStatus } from "@/lib/arcadia/types";

type StatusFilter = ReportStatus | "all";

const STATUS_FILTERS: { key: StatusFilter; label: string }[] = [
  { key: "open", label: "Open" },
  { key: "under_review", label: "Under review" },
  { key: "resolved", label: "Resolved" },
  { key: "dismissed", label: "Dismissed" },
  { key: "all", label: "All" },
];

const STATUS_DOT: Record<ReportStatus, string> = {
  open: "bg-amber-500",
  under_review: "bg-sky-500",
  resolved: "bg-emerald-500",
  dismissed: "bg-zinc-400",
};

export default function ReportsAdminPage() {
  const { loginToken, hasPerm } = useAdmin();
  const canReview = hasPerm("review_reports");

  const [status, setStatus] = useState<StatusFilter>("open");
  const [reports, setReports] = useState<Report[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setReports(
        await arcadia.reports.list(
          loginToken,
          status === "all" ? null : status,
        ),
      );
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load reports.",
      );
    }
  }, [loginToken, status]);

  useEffect(() => {
    setReports(null);
    setSelectedId(null);
    load();
  }, [load]);

  const selected =
    reports?.find((r) => r.id === selectedId) ?? reports?.[0] ?? null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Reports"
        description="Reports from members about bots, servers and packs: licence or ToS violations, spam, and anything else that needs a look."
      />
      <div className="mt-6">
        <AdminFilterChips
          value={status}
          onChange={setStatus}
          chips={STATUS_FILTERS}
        />
      </div>

      {notice && (
        <div
          aria-live="polite"
          className="mt-4 flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-200"
        >
          <CheckCircle2 size={16} className="mt-0.5 shrink-0" />
          <p className="min-w-0 flex-1 font-medium">{notice}</p>
          <button
            type="button"
            onClick={() => setNotice(null)}
            aria-label="Dismiss"
            className="shrink-0 opacity-60 transition-opacity hover:opacity-100"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {error ? (
        <AdminError
          message={error}
          onRetry={() => {
            setError(null);
            load();
          }}
        />
      ) : !reports ? (
        <AdminLoading />
      ) : reports.length === 0 ? (
        <AdminEmpty
          icon={Flag}
          title={status === "open" ? "No open reports" : "No reports here"}
          description={
            status === "open"
              ? "New reports from members show up here."
              : "Try a different filter."
          }
        />
      ) : (
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[19rem_minmax(0,1fr)]">
          <ul className="overflow-hidden rounded-2xl border border-zinc-200 bg-white lg:sticky lg:top-6 lg:max-h-[calc(100vh-3rem)] lg:overflow-y-auto dark:border-zinc-800 dark:bg-zinc-900/60">
            {reports.map((report) => {
              const active = selected?.id === report.id;
              return (
                <li
                  key={report.id}
                  className="border-b border-zinc-100 last:border-b-0 dark:border-zinc-800/80"
                >
                  <button
                    type="button"
                    onClick={() => setSelectedId(report.id)}
                    aria-current={active ? "true" : undefined}
                    className={[
                      "relative flex w-full items-start gap-3 px-4 py-3 text-left transition-colors",
                      active
                        ? "bg-accent/8"
                        : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
                    ].join(" ")}
                  >
                    {active && (
                      <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent" />
                    )}
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${STATUS_DOT[report.status]}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                          {report.target_name}
                        </span>
                        <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
                          {formatRelativeTime(report.created_at)}
                        </span>
                      </span>
                      <span className="block truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {REASON_LABELS[report.reason]} · {report.target_type}
                      </span>
                      <span className="mt-0.5 line-clamp-1 text-xs text-zinc-400 dark:text-zinc-500">
                        {report.description}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {selected && (
            <ReportDetail
              key={selected.id}
              report={selected}
              loginToken={loginToken}
              canReview={canReview}
              onResolved={(message) => {
                setNotice(message);
                setSelectedId(null);
                load();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
