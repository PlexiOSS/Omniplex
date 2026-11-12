"use client";

import { formatRelativeTime } from "@omniplex/core/utils/format";
import { Avatar } from "@omniplex/ui/Avatar";
import { Pagination } from "@omniplex/ui/Pagination";
import { Bot, CheckCircle2, Flag, Sliders, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  isSystemReporter,
  REASON_LABELS,
  ReportDetail,
  TARGET_ICONS,
  TARGET_TYPE_MAP,
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
import type { Report, ReportPage, ReportStatus } from "@/lib/arcadia/types";

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

function TargetThumb({ report }: { report: Report }) {
  if (report.target_avatar) {
    return (
      <Avatar src={report.target_avatar} alt={report.target_name} size={36} />
    );
  }
  const type = TARGET_TYPE_MAP[report.target_type];
  const Icon = type ? TARGET_ICONS[type] : Sliders;
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
      <Icon size={16} />
    </span>
  );
}

function ReportRow({
  report,
  active,
  onSelect,
}: {
  report: Report;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={active ? "true" : undefined}
      className={[
        "relative flex w-full items-center gap-3 px-4 py-3 text-left transition-colors",
        active ? "bg-accent/8" : "hover:bg-zinc-50 dark:hover:bg-zinc-800/50",
      ].join(" ")}
    >
      {active && (
        <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-accent" />
      )}
      <span className="relative shrink-0">
        <TargetThumb report={report} />
        <span
          className={`absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-zinc-900 ${STATUS_DOT[report.status]}`}
        />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
            {report.target_name}
          </span>
          <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-500">
            {formatRelativeTime(report.created_at)}
          </span>
        </span>
        <span className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="truncate">
            {REASON_LABELS[report.reason]} · {report.target_type}
          </span>
          {isSystemReporter(report.reporter_id) && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent/10 px-1.5 py-px text-[10px] font-medium text-accent">
              <Bot size={10} />
              Auto
            </span>
          )}
        </span>
      </span>
    </button>
  );
}

export default function ReportsAdminPage() {
  const { loginToken, hasPerm } = useAdmin();
  const canReview = hasPerm("review_reports");

  const [status, setStatus] = useState<StatusFilter>("open");
  const [page, setPage] = useState(1);
  const [data, setData] = useState<ReportPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setData(
        await arcadia.reports.list(
          loginToken,
          status === "all" ? null : status,
          page,
        ),
      );
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load reports.",
      );
    }
  }, [loginToken, status, page]);

  useEffect(() => {
    setData(null);
    setSelectedId(null);
    load();
  }, [load]);

  function changeStatus(next: StatusFilter) {
    setStatus(next);
    setPage(1);
  }

  const reports = data?.reports ?? null;
  const selected =
    reports?.find((r) => r.id === selectedId) ?? reports?.[0] ?? null;
  const filterLabel = STATUS_FILTERS.find((f) => f.key === status)?.label;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Reports"
        description="Reports from members and automatic checks about bots, servers, packs and teams."
      />
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <AdminFilterChips
          value={status}
          onChange={changeStatus}
          chips={STATUS_FILTERS}
        />
        {data && data.total > 0 && (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {data.total}{" "}
            {status === "all" ? "" : `${filterLabel?.toLowerCase()} `}
            {data.total === 1 ? "report" : "reports"}
          </p>
        )}
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
      ) : !data || !reports ? (
        <AdminLoading />
      ) : reports.length === 0 ? (
        <AdminEmpty
          icon={Flag}
          title={status === "open" ? "No open reports" : "No reports here"}
          description={
            status === "open"
              ? "New reports from members and automatic checks show up here."
              : "Try a different filter."
          }
        />
      ) : (
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
          <div>
            <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800/80 dark:border-zinc-800 dark:bg-zinc-900/60">
              {reports.map((report) => (
                <li key={report.id}>
                  <ReportRow
                    report={report}
                    active={selected?.id === report.id}
                    onSelect={() => setSelectedId(report.id)}
                  />
                </li>
              ))}
            </ul>
            {data.total > data.per_page && (
              <div className="mt-4">
                <Pagination
                  page={page}
                  total={data.total}
                  perPage={data.per_page}
                  onPageChange={(next) => {
                    setPage(next);
                    window.scrollTo({ top: 0 });
                  }}
                />
              </div>
            )}
          </div>

          {selected && (
            <div className="lg:sticky lg:top-6">
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}
