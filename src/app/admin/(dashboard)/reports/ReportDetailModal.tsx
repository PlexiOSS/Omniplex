"use client";

import {
  Bot,
  ExternalLink,
  Package,
  Server as ServerIcon,
  Sliders,
  Users,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { Report, RPCWebAction, TargetType } from "@/lib/arcadia/types";
import { formatRelativeTime } from "@/lib/utils/format";
import { GenericRpcModal } from "../GenericRpcModal";

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

// Report.target_type comes from Popplio lowercased ("bot"/"server"/...);
// Arcadia's RPC system capitalizes it. "team" has no icon of its own here
// since reports don't currently target teams in practice, but Users icon
// reads fine as a fallback.
const TARGET_TYPE_MAP: Record<string, TargetType> = {
  bot: "Bot",
  server: "Server",
  pack: "Pack",
  team: "Team",
  user: "User",
};

const TARGET_ICONS: Record<TargetType, typeof Bot> = {
  Bot: Bot,
  Server: ServerIcon,
  Pack: Package,
  Team: Users,
  User: Users,
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
  const [actionsMethods, setActionsMethods] = useState<RPCWebAction[] | null>(
    null,
  );
  const [actionsLoading, setActionsLoading] = useState(false);
  const [actionResult, setActionResult] = useState<string | null>(null);

  const isOpenForReview =
    report.status === "open" || report.status === "under_review";

  const targetType = TARGET_TYPE_MAP[report.target_type];
  const TargetIcon = targetType ? TARGET_ICONS[targetType] : Sliders;

  async function openActions() {
    if (!targetType) {
      setError(
        `No staff actions are available for target type "${report.target_type}".`,
      );
      return;
    }
    setActionsLoading(true);
    setError(null);
    try {
      const methods = await arcadia.getRpcMethods(loginToken, true);
      const filtered = methods.filter((m) =>
        m.supported_target_types.includes(targetType),
      );
      if (filtered.length === 0) {
        setError(
          `No staff actions exist for ${targetType.toLowerCase()}s yet — only bots have moderation actions like force-removal today.`,
        );
        return;
      }
      setActionsMethods(filtered);
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to load actions.",
      );
    } finally {
      setActionsLoading(false);
    }
  }

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
        <div className="flex items-center gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
            <TargetIcon size={16} />
          </div>
          <div className="min-w-0 flex-1">
            {report.target_url ? (
              <a
                href={report.target_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 truncate font-medium text-zinc-950 hover:text-accent dark:text-zinc-50"
              >
                {report.target_name}
                <ExternalLink size={12} className="shrink-0" />
              </a>
            ) : (
              <p className="truncate font-medium text-zinc-950 dark:text-zinc-50">
                {report.target_name}
              </p>
            )}
            <p className="text-xs text-zinc-400 dark:text-zinc-600">
              {report.target_type} · {report.target_id}
              {!report.target_url && " · no live link for this target"}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            loading={actionsLoading}
            onClick={openActions}
            className="shrink-0"
          >
            <Sliders size={12} />
            Actions
          </Button>
        </div>

        {actionResult && (
          <div className="whitespace-pre-wrap rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            {actionResult}
          </div>
        )}

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
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="report-note"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Note (optional)
              </label>
              <textarea
                id="report-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
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

      {actionsMethods && targetType && (
        <GenericRpcModal
          loginToken={loginToken}
          targetType={targetType}
          targetId={report.target_id}
          entityLabel={report.target_name}
          methods={actionsMethods}
          onClose={() => setActionsMethods(null)}
          onDone={(msg) => {
            if (msg) setActionResult(msg);
          }}
        />
      )}
    </Modal>
  );
}
