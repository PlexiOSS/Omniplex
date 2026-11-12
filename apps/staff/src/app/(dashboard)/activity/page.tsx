"use client";

import { formatRelativeTime } from "@omniplex/core/utils/format";
import { Avatar } from "@omniplex/ui/Avatar";
import { Badge } from "@omniplex/ui/Badge";
import { Button } from "@omniplex/ui/Button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useAdmin } from "@/app/AdminContext";
import { AdminPageHeader } from "@/app/AdminPageHeader";
import { AdminEmptyState } from "@/components/admin/AdminListRow";
import { AdminError, AdminLoading } from "@/components/admin/AdminState";
import {
  AdminFilterChips,
  AdminToolbar,
} from "@/components/admin/AdminToolbar";
import { DataValue, fieldLabel } from "@/components/admin/DataValue";
import {
  type AuditEvent,
  type AuditEventList,
  type AuditFilters,
  type AuditSource,
  actorLabel,
  auditPath,
  describeAction,
  SOURCE_LABELS,
  statusTone,
  targetLabel,
} from "@/lib/admin/activity";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";

const PAGE_SIZE = 50;

const SOURCES: (AuditSource | "")[] = [
  "",
  "api",
  "panel",
  "system",
  "stripe",
  "paypal",
];

const inputClass =
  "h-9 min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition-colors placeholder:text-zinc-400 focus:border-accent/50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-50";

function ActivityLog() {
  const { loginToken, hasPerm } = useAdmin();
  const searchParams = useSearchParams();

  const [filters, setFilters] = useState<AuditFilters>({
    source: (searchParams.get("source") as AuditSource | null) ?? "",
    actorId: searchParams.get("actor") ?? "",
    targetId: searchParams.get("target") ?? "",
    action: searchParams.get("action") ?? "",
    failed: searchParams.get("failed") === "true",
  });
  const [draft, setDraft] = useState(filters);
  const [events, setEvents] = useState<AuditEvent[] | null>(null);
  const [cursors, setCursors] = useState<(string | null)[]>([null]);
  const [pageIndex, setPageIndex] = useState(0);
  const [hasOlder, setHasOlder] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const fetchPage = useCallback(
    async (before: string | null) => {
      const { json } = await arcadia.popplioStaff<AuditEventList>(
        loginToken,
        "GET",
        auditPath({ ...filters, before, limit: PAGE_SIZE }),
      );
      return json ?? { events: [], next_before: null };
    },
    [loginToken, filters],
  );

  const [pagedFetch, setPagedFetch] = useState(() => fetchPage);
  if (pagedFetch !== fetchPage) {
    setPagedFetch(() => fetchPage);
    setCursors([null]);
    setPageIndex(0);
  }

  const cursor = cursors[pageIndex] ?? null;

  const [attempt, setAttempt] = useState(0);
  const load = useCallback(() => setAttempt((n) => n + 1), []);

  useEffect(() => {
    let cancelled = false;
    void attempt;
    setError(null);
    setEvents(null);
    fetchPage(cursor)
      .then((page) => {
        if (cancelled) return;
        setEvents(page.events);
        setHasOlder(!!page.next_before);
        if (page.next_before) {
          const older = page.next_before;
          setCursors((prev) =>
            prev.length > pageIndex + 1
              ? prev
              : [...prev.slice(0, pageIndex + 1), older],
          );
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setError(
          err instanceof ArcadiaError
            ? err.message
            : "Failed to load the activity log.",
        );
      });
    return () => {
      cancelled = true;
    };
  }, [fetchPage, cursor, pageIndex, attempt]);

  function goTo(index: number) {
    setPageIndex(index);
    window.scrollTo({ top: 0 });
  }

  if (!hasPerm("view_audit_logs")) {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
        <AdminPageHeader
          title="Activity"
          description="You need the View Audit Logs permission to see the activity log."
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Activity"
        description="Everything that changed: every API change by members, owners and API tokens, every staff panel action, payments, refunds, Auto-vote and background task failures. Kept for 180 days."
      />

      <AdminToolbar>
        <AdminFilterChips
          value={filters.source ?? ""}
          onChange={(source) => {
            setFilters((f) => ({ ...f, source }));
            setDraft((d) => ({ ...d, source }));
          }}
          chips={SOURCES.map((s) => ({
            key: s,
            label: s ? SOURCE_LABELS[s] : "All",
          }))}
        />
      </AdminToolbar>

      <form
        className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center"
        onSubmit={(e) => {
          e.preventDefault();
          setFilters(draft);
        }}
      >
        <input
          value={draft.actorId}
          onChange={(e) => setDraft({ ...draft, actorId: e.target.value })}
          placeholder="Actor ID"
          aria-label="Actor ID"
          className={inputClass}
        />
        <input
          value={draft.targetId}
          onChange={(e) => setDraft({ ...draft, targetId: e.target.value })}
          placeholder="Target ID"
          aria-label="Target ID"
          className={inputClass}
        />
        <input
          value={draft.action}
          onChange={(e) => setDraft({ ...draft, action: e.target.value })}
          placeholder="Action starts with, e.g. payment."
          aria-label="Action"
          className={inputClass}
        />
        <label className="flex shrink-0 cursor-pointer items-center gap-2 text-sm text-zinc-700 dark:text-zinc-300">
          <input
            type="checkbox"
            checked={!!draft.failed}
            onChange={(e) => setDraft({ ...draft, failed: e.target.checked })}
            className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
          />
          Failed only
        </label>
        <Button type="submit" variant="secondary" size="sm">
          Filter
        </Button>
      </form>

      {error && events && (
        <p className="mt-4 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {error && !events ? (
        <AdminError message={error} onRetry={load} />
      ) : !events ? (
        <AdminLoading />
      ) : (
        <div className="mt-6 divide-y divide-zinc-100 overflow-hidden rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {events.length === 0 && (
            <AdminEmptyState message="No activity matches these filters." />
          )}
          {events.map((event) => {
            const target = targetLabel(event);
            const isOpen = open === event.id;
            const fields = Object.entries(event.data ?? {});
            return (
              <div key={event.id}>
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : event.id)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                >
                  <ChevronRight
                    size={14}
                    className={[
                      "shrink-0 text-zinc-400 transition-transform",
                      isOpen ? "rotate-90" : "",
                    ].join(" ")}
                  />
                  {event.actor_avatar ? (
                    <Avatar
                      src={event.actor_avatar}
                      alt={actorLabel(event)}
                      size={26}
                    />
                  ) : (
                    <span className="h-[26px] w-[26px] shrink-0 rounded-full bg-zinc-100 dark:bg-zinc-800" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">
                      <span className="font-medium text-zinc-950 dark:text-zinc-50">
                        {actorLabel(event)}
                      </span>{" "}
                      <span className="text-zinc-500 dark:text-zinc-400">
                        {describeAction(event.action)}
                      </span>
                      {target && (
                        <span
                          className={[
                            "text-zinc-500 dark:text-zinc-400",
                            event.target_name ? "" : "font-mono text-xs",
                          ].join(" ")}
                        >
                          {" "}
                          on {target}
                        </span>
                      )}
                    </p>
                  </div>
                  <Badge>{SOURCE_LABELS[event.source] ?? event.source}</Badge>
                  {event.status != null && (
                    <Badge variant={statusTone(event.status)}>
                      {event.status}
                    </Badge>
                  )}
                  <span
                    className="hidden w-20 shrink-0 text-right text-xs text-zinc-400 sm:block dark:text-zinc-500"
                    title={new Date(event.created_at).toLocaleString()}
                  >
                    {formatRelativeTime(event.created_at)}
                  </span>
                </button>
                {isOpen && (
                  <div className="border-t border-zinc-100 bg-zinc-50/60 px-4 py-4 sm:pl-14 dark:border-zinc-800 dark:bg-zinc-950/40">
                    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[10rem_minmax(0,1fr)]">
                      <div className="contents">
                        <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          Action
                        </dt>
                        <dd className="min-w-0 font-mono text-xs wrap-anywhere text-zinc-950 dark:text-zinc-50">
                          {event.action}
                        </dd>
                      </div>
                      <div className="contents">
                        <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          Actor
                        </dt>
                        <dd className="min-w-0 wrap-anywhere text-zinc-950 dark:text-zinc-50">
                          {event.actor_type}
                          {event.actor_name && ` ${event.actor_name}`}
                          {event.actor_id && (
                            <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                              {" "}
                              {event.actor_id}
                            </span>
                          )}
                        </dd>
                      </div>
                      {event.target_id && (
                        <div className="contents">
                          <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            Target
                          </dt>
                          <dd className="min-w-0 wrap-anywhere text-zinc-950 dark:text-zinc-50">
                            {event.target_type}
                            {event.target_name && ` ${event.target_name}`}
                            <span className="font-mono text-xs text-zinc-500 dark:text-zinc-400">
                              {" "}
                              {event.target_id}
                            </span>
                          </dd>
                        </div>
                      )}
                      {event.ip && (
                        <div className="contents">
                          <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            IP
                          </dt>
                          <dd className="min-w-0 font-mono text-xs text-zinc-950 dark:text-zinc-50">
                            {event.ip}
                          </dd>
                        </div>
                      )}
                      {fields.map(([key, value]) => (
                        <div key={key} className="contents">
                          <dt className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                            {fieldLabel(key)}
                          </dt>
                          <dd className="min-w-0 wrap-anywhere text-zinc-950 dark:text-zinc-50">
                            <DataValue value={value} />
                          </dd>
                        </div>
                      ))}
                    </dl>
                    <p className="mt-3 text-xs text-zinc-400 dark:text-zinc-500">
                      {new Date(event.created_at).toLocaleString()} · event{" "}
                      <span className="font-mono">{event.id}</span>
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {events && (pageIndex > 0 || hasOlder) && (
        <div className="mt-6 flex items-center justify-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            disabled={pageIndex === 0}
            onClick={() => goTo(pageIndex - 1)}
          >
            <ChevronLeft size={14} />
            Newer
          </Button>
          <span className="text-sm text-zinc-500 dark:text-zinc-400">
            Page {pageIndex + 1}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={!hasOlder}
            onClick={() => goTo(pageIndex + 1)}
          >
            Older
            <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ActivityPage() {
  return (
    <Suspense fallback={<AdminLoading />}>
      <ActivityLog />
    </Suspense>
  );
}
