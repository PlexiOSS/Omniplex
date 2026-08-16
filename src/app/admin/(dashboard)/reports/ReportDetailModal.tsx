"use client";

import { ExternalLink } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { Report } from "@/lib/arcadia/types";
import { formatRelativeTime } from "@/lib/utils/format";

interface ReportDetailModalProps {
  report: Report;
  loginToken: string;
  onClose: () => void;
  onResolved: () => void;
}

const REASON_LABELS: Record<Report["reason"], string> = {
  license_violation: "License violation",
  tos_violation: "ToS violation",
  spam: "Spam",
  other: "Other",
};

export function ReportDetailModal({
  report,
  loginToken,
  onClose,
  onResolved,
}: ReportDetailModalProps) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<"resolve" | "dismiss" | null>(
    null,
  );

  const isOpenForReview =
    report.status === "open" || report.status === "under_review";

  async function handle(action: "resolve" | "dismiss") {
    setSubmitting(action);
    setError(null);
    try {
      if (action === "resolve") {
        await arcadia.reports.resolve(loginToken, report.id, note);
      } else {
        await arcadia.reports.dismiss(loginToken, report.id, note);
      }
      onResolved();
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to update report.",
      );
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <Modal open onClose={onClose} title="Report detail">
      <div className="space-y-4 text-sm">
        <div>
          <p className="text-xs font-medium text-zinc-400 dark:text-zinc-600">
            Target
          </p>
          {report.target_url ? (
            <a
              href={report.target_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-0.5 flex items-center gap-1.5 font-medium text-zinc-950 hover:text-accent dark:text-zinc-50"
            >
              {report.target_name} ({report.target_type})
              <ExternalLink size={12} />
            </a>
          ) : (
            <p className="mt-0.5 font-medium text-zinc-950 dark:text-zinc-50">
              {report.target_name} ({report.target_type})
              <span className="ml-1.5 text-xs font-normal text-zinc-400 dark:text-zinc-600">
                — no live link for this target
              </span>
            </p>
          )}
        </div>

        <div>
          <p className="text-xs font-medium text-zinc-400 dark:text-zinc-600">
            Reason
          </p>
          <p className="mt-0.5 text-zinc-700 dark:text-zinc-300">
            {REASON_LABELS[report.reason]}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-zinc-400 dark:text-zinc-600">
            Description
          </p>
          <p className="mt-0.5 whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
            {report.description}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-zinc-400 dark:text-zinc-600">
            Reported by
          </p>
          <p className="mt-0.5 text-zinc-700 dark:text-zinc-300">
            {report.reporter_id} · {formatRelativeTime(report.created_at)}
          </p>
        </div>

        {!isOpenForReview && (
          <div>
            <p className="text-xs font-medium text-zinc-400 dark:text-zinc-600">
              {report.status === "resolved" ? "Resolved" : "Dismissed"} by
            </p>
            <p className="mt-0.5 text-zinc-700 dark:text-zinc-300">
              {report.resolved_by}
              {report.resolved_at &&
                ` · ${formatRelativeTime(report.resolved_at)}`}
            </p>
            {report.resolution_note && (
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                "{report.resolution_note}"
              </p>
            )}
          </div>
        )}

        {isOpenForReview && (
          <>
            <div>
              <label
                htmlFor="report-note"
                className="text-xs font-medium text-zinc-400 dark:text-zinc-600"
              >
                Note (optional)
              </label>
              <textarea
                id="report-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="mt-1 w-full resize-none rounded-lg border border-zinc-200 bg-transparent p-2 text-sm text-zinc-950 outline-none focus:border-accent dark:border-zinc-800 dark:text-zinc-50"
                placeholder="Why this was resolved or dismissed"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
            )}

            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() => handle("dismiss")}
                loading={submitting === "dismiss"}
                disabled={submitting !== null}
              >
                Dismiss
              </Button>
              <Button
                variant="primary"
                onClick={() => handle("resolve")}
                loading={submitting === "resolve"}
                disabled={submitting !== null}
              >
                Resolve
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
