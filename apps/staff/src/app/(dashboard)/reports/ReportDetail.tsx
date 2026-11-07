"use client";

import { formatRelativeTime } from "@omniplex/core/utils/format";
import { Avatar } from "@omniplex/ui/Avatar";
import { Button } from "@omniplex/ui/Button";
import {
  Bot,
  CheckCircle2,
  ExternalLink,
  Package,
  Server as ServerIcon,
  Sliders,
  Users,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { GenericRpcModal } from "@/app/(dashboard)/GenericRpcModal";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type {
  PlatformUser,
  Report,
  RPCWebAction,
  TargetType,
} from "@/lib/arcadia/types";

export const REASON_LABELS: Record<Report["reason"], string> = {
  license_violation: "License violation",
  tos_violation: "ToS violation",
  spam: "Spam",
  other: "Other",
};

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

interface ReportDetailProps {
  report: Report;
  loginToken: string;
  canReview: boolean;
  onResolved: (message: string) => void;
}

function useUser(loginToken: string, id: string | null) {
  const [user, setUser] = useState<PlatformUser | null>(null);
  useEffect(() => {
    setUser(null);
    if (!id) return;
    let cancelled = false;
    arcadia
      .getUser(loginToken, id)
      .then((u) => {
        if (!cancelled) setUser(u);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [loginToken, id]);
  return user;
}

function Person({ user, id }: { user: PlatformUser | null; id: string }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-2">
      <Avatar src={user?.avatar ?? ""} alt={user?.username ?? id} size={22} />
      <span className="truncate text-zinc-950 dark:text-zinc-50">
        {user?.display_name || user?.username || id}
      </span>
    </span>
  );
}

export function ReportDetail({
  report,
  loginToken,
  canReview,
  onResolved,
}: ReportDetailProps) {
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

  const reporter = useUser(loginToken, report.reporter_id);
  const resolver = useUser(loginToken, report.resolved_by);

  const isOpenForReview =
    report.status === "open" || report.status === "under_review";

  const targetType = TARGET_TYPE_MAP[report.target_type];
  const TargetIcon = targetType ? TARGET_ICONS[targetType] : Sliders;

  async function openActions() {
    if (!targetType) {
      setError(`There are no staff actions for ${report.target_type} reports.`);
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
          `There are no staff actions for ${targetType.toLowerCase()}s yet.`,
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
      onResolved(
        `${action === "resolve" ? "Resolved" : "Dismissed"} the report on ${report.target_name}.`,
      );
    } catch (err) {
      setError(
        err instanceof ArcadiaError ? err.message : "Failed to update report.",
      );
    } finally {
      setSubmitting(null);
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
      <header className="flex flex-col gap-4 border-b border-zinc-100 p-5 sm:flex-row sm:items-start sm:p-6 dark:border-zinc-800/80">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          <TargetIcon size={20} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              {report.target_name}
            </h2>
            <span className="rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-700 dark:text-red-300">
              {REASON_LABELS[report.reason]}
            </span>
          </div>
          <p className="mt-0.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
            {report.target_type} · {report.target_id}
          </p>
        </div>
        <div className="flex shrink-0 gap-2 self-start">
          {report.target_url && (
            <a
              href={report.target_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 px-3 py-1.5 text-sm text-zinc-700 transition-colors hover:border-accent/40 hover:text-accent dark:border-zinc-800 dark:text-zinc-300"
            >
              View
              <ExternalLink size={13} />
            </a>
          )}
          <Button
            variant="secondary"
            size="sm"
            loading={actionsLoading}
            onClick={openActions}
          >
            <Sliders size={13} />
            Actions
          </Button>
        </div>
      </header>

      <div className="space-y-5 p-5 sm:p-6">
        {actionResult && (
          <div className="whitespace-pre-wrap wrap-anywhere rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300">
            {actionResult}
          </div>
        )}

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            What they said
          </p>
          <p className="mt-1.5 whitespace-pre-wrap wrap-anywhere text-[15px] leading-relaxed text-zinc-700 dark:text-zinc-300">
            {report.description || (
              <span className="text-zinc-400 italic">No details given.</span>
            )}
          </p>
        </div>

        <dl className="divide-y divide-zinc-100 rounded-xl border border-zinc-100 text-sm dark:divide-zinc-800/80 dark:border-zinc-800/80">
          <div className="flex items-center justify-between gap-4 px-4 py-2.5">
            <dt className="text-zinc-500 dark:text-zinc-400">Reported by</dt>
            <dd className="min-w-0">
              <Person user={reporter} id={report.reporter_id} />
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4 px-4 py-2.5">
            <dt className="text-zinc-500 dark:text-zinc-400">Reported</dt>
            <dd
              className="text-zinc-950 dark:text-zinc-50"
              title={new Date(report.created_at).toLocaleString()}
            >
              {formatRelativeTime(report.created_at)}
            </dd>
          </div>
          {!isOpenForReview && report.resolved_by && (
            <div className="flex items-center justify-between gap-4 px-4 py-2.5">
              <dt className="text-zinc-500 dark:text-zinc-400">
                {report.status === "resolved" ? "Resolved" : "Dismissed"} by
              </dt>
              <dd className="flex min-w-0 items-center gap-2">
                <Person user={resolver} id={report.resolved_by} />
                {report.resolved_at && (
                  <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                    {formatRelativeTime(report.resolved_at)}
                  </span>
                )}
              </dd>
            </div>
          )}
        </dl>

        {!isOpenForReview && report.resolution_note && (
          <div className="rounded-xl bg-zinc-50 p-4 text-sm text-zinc-700 dark:bg-zinc-800/40 dark:text-zinc-300">
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              Staff note
            </p>
            <p className="mt-1 whitespace-pre-wrap wrap-anywhere">
              {report.resolution_note}
            </p>
          </div>
        )}

        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </p>
        )}
      </div>

      {isOpenForReview && canReview && (
        <footer className="sticky bottom-0 space-y-3 border-t border-zinc-100 bg-white/90 px-5 py-4 backdrop-blur sm:px-6 dark:border-zinc-800/80 dark:bg-zinc-900/90">
          <label htmlFor="report-note" className="sr-only">
            Note
          </label>
          <textarea
            id="report-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-accent/50 focus:ring-2 focus:ring-accent/15 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            placeholder="Optional note: what you did, or why you're dismissing it"
          />
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => handle("dismiss")}
              loading={submitting === "dismiss"}
              disabled={submitting !== null}
            >
              <XCircle size={14} />
              Dismiss
            </Button>
            <Button
              variant="primary"
              onClick={() => handle("resolve")}
              loading={submitting === "resolve"}
              disabled={submitting !== null}
            >
              <CheckCircle2 size={14} />
              Resolve
            </Button>
          </div>
        </footer>
      )}

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
    </article>
  );
}
