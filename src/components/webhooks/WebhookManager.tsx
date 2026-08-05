"use client";

import { AlertTriangle, Pencil, Plus, Send, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Pagination } from "@/components/search/Pagination";
import { webhooks } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type {
  Webhook,
  WebhookLogEntry,
  WebhookTestMeta,
} from "@/lib/api/types";
import { WebhookEditModal } from "./WebhookEditModal";
import { WebhookTestModal } from "./WebhookTestModal";

type TargetType = "bot" | "server" | "team";
type View = "webhooks" | "logs";

interface WebhookManagerProps {
  targetType: TargetType;
  targetId: string;
  authToken: string;
  canManage: boolean;
  canViewLogs: boolean;
}

const LOGS_PAGE_SIZE = 10;

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function WebhookManager({
  targetType,
  targetId,
  authToken,
  canManage,
  canViewLogs,
}: WebhookManagerProps) {
  const [view, setView] = useState<View>("webhooks");

  const [list, setList] = useState<Webhook[] | null>(null);
  const [testMeta, setTestMeta] = useState<WebhookTestMeta | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<Webhook | "new" | null>(null);
  const [testing, setTesting] = useState<Webhook | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const confirmRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [logs, setLogs] = useState<WebhookLogEntry[] | null>(null);
  const [logsCount, setLogsCount] = useState(0);
  const [logsPage, setLogsPage] = useState(1);
  const [logsError, setLogsError] = useState<string | null>(null);

  function load() {
    setError(null);
    webhooks
      .list(targetType, targetId, authToken)
      .then(setList)
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Failed to load webhooks.",
        );
      });
    webhooks
      .getTestMeta(targetType, targetId)
      .then(setTestMeta)
      .catch(() => setTestMeta(null));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId]);

  useEffect(() => {
    if (view !== "logs") return;
    setLogsError(null);
    webhooks
      .getLogs(targetType, targetId, logsPage, authToken)
      .then((res) => {
        setLogs(res.results);
        setLogsCount(res.count);
      })
      .catch((err) => {
        setLogsError(
          err instanceof ApiError ? err.message : "Failed to load logs.",
        );
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, logsPage, targetType, targetId]);

  function handleDeleteClick(id: string) {
    if (confirmDeleteId !== id) {
      setConfirmDeleteId(id);
      confirmRef.current = setTimeout(() => setConfirmDeleteId(null), 3000);
      return;
    }
    if (confirmRef.current) clearTimeout(confirmRef.current);
    setConfirmDeleteId(null);
    setDeletingId(id);
    webhooks
      .delete(targetType, targetId, id, authToken)
      .then(load)
      .catch((err) =>
        setError(
          err instanceof ApiError ? err.message : "Failed to delete.",
        ),
      )
      .finally(() => setDeletingId(null));
  }

  return (
    <div className="space-y-4">
      {canViewLogs && (
        <div className="flex gap-4 border-b border-zinc-200 dark:border-zinc-800">
          {(["webhooks", "logs"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={[
                "relative -mb-px shrink-0 border-b-2 px-1 pb-3 pt-1 text-sm font-medium capitalize transition-colors",
                view === v
                  ? "border-accent text-accent"
                  : "border-transparent text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50",
              ].join(" ")}
            >
              {v === "webhooks" ? "Webhooks" : "Delivery Logs"}
            </button>
          ))}
        </div>
      )}

      {view === "webhooks" && (
        <>
          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {list === null && !error ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Loading…
            </p>
          ) : (
            <div className="space-y-3">
              {list?.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No webhooks yet.
                </p>
              )}
              {list?.map((w) => (
                <div
                  key={w.id}
                  className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                          {w.name}
                        </p>
                        {w.broken && (
                          <Badge variant="danger">
                            <AlertTriangle size={10} />
                            Broken
                          </Badge>
                        )}
                        <Badge variant={w.hmac_auth ? "success" : "default"}>
                          {w.hmac_auth
                            ? "HMAC"
                            : w.simple_auth
                              ? "Simple"
                              : "Legacy"}
                        </Badge>
                      </div>
                      <p className="mt-1 truncate text-xs text-zinc-500 dark:text-zinc-400">
                        {w.url}
                      </p>
                      <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-600">
                        {w.event_whitelist.length === 0
                          ? "All events"
                          : `${w.event_whitelist.length} event${w.event_whitelist.length === 1 ? "" : "s"}`}
                        {w.failed_requests > 0 &&
                          ` · ${w.failed_requests} failed request${w.failed_requests === 1 ? "" : "s"}`}
                      </p>
                    </div>
                    {canManage && (
                      <div className="flex shrink-0 items-center gap-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setTesting(w)}
                          className="px-2 text-xs h-8"
                        >
                          <Send size={12} />
                          Test
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditing(w)}
                          className="px-2 text-xs h-8"
                        >
                          <Pencil size={12} />
                        </Button>
                        <Button
                          type="button"
                          variant={confirmDeleteId === w.id ? "danger" : "ghost"}
                          size="sm"
                          loading={deletingId === w.id}
                          onClick={() => handleDeleteClick(w.id)}
                          className="px-2 text-xs h-8"
                        >
                          <Trash2 size={12} />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {canManage && (
            <div className="border-t border-zinc-200 pt-5 dark:border-zinc-800">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={(list?.length ?? 0) >= 5}
                onClick={() => setEditing("new")}
              >
                <Plus size={14} />
                New Webhook
              </Button>
              {(list?.length ?? 0) >= 5 && (
                <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-600">
                  Maximum of 5 webhooks per entity.
                </p>
              )}
            </div>
          )}
        </>
      )}

      {view === "logs" && (
        <div>
          {logsError && (
            <p className="text-sm text-red-600 dark:text-red-400">
              {logsError}
            </p>
          )}
          {logs === null && !logsError ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Loading…
            </p>
          ) : (
            <div className="space-y-2">
              {logs?.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400">
                  No deliveries yet.
                </p>
              )}
              {logs?.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                        {String(entry.data?.event ?? entry.state)}
                      </span>
                      <Badge
                        variant={
                          entry.state === "success"
                            ? "success"
                            : entry.state === "pending"
                              ? "warning"
                              : "danger"
                        }
                      >
                        {entry.state}
                      </Badge>
                      {entry.bad_intent && (
                        <Badge variant="info">Auth check</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                      {formatDate(entry.created_at)} · {entry.tries} tr
                      {entry.tries === 1 ? "y" : "ies"}
                      {entry.status_code > 0 && ` · HTTP ${entry.status_code}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
          {logsCount > LOGS_PAGE_SIZE && (
            <div className="mt-4">
              <Pagination
                page={logsPage}
                total={logsCount}
                perPage={LOGS_PAGE_SIZE}
                onPageChange={setLogsPage}
              />
            </div>
          )}
        </div>
      )}

      {editing === "new" && (
        <WebhookEditModal
          targetType={targetType}
          targetId={targetId}
          authToken={authToken}
          testMeta={testMeta}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
      {editing && editing !== "new" && (
        <WebhookEditModal
          targetType={targetType}
          targetId={targetId}
          authToken={authToken}
          testMeta={testMeta}
          webhook={editing}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}
      {testing && (
        <WebhookTestModal
          targetType={targetType}
          targetId={targetId}
          authToken={authToken}
          testMeta={testMeta}
          onClose={() => setTesting(null)}
        />
      )}
    </div>
  );
}
