"use client";

import { Check, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pagination } from "@/components/search/Pagination";
import { Button } from "@/components/ui/Button";
import {
  alerts as alertsApi,
  notifications as notificationsApi,
} from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type {
  Alert,
  AlertCategory,
  AlertList,
  AlertType,
  NotificationPrefs,
  PagedResult,
} from "@/lib/api/types";
import { ALERT_CATEGORY_LABELS } from "@/lib/api/types";
import { formatRelativeTime } from "@/lib/utils/format";

interface NotificationsTabProps {
  userId: string;
  token: string;
}

const TYPE_DOT: Record<AlertType, string> = {
  success: "bg-green-500",
  error: "bg-red-500",
  info: "bg-accent",
  warning: "bg-amber-500",
};

/** The same lightweight two-click confirm BotItem's delete uses in this
 * same dashboard — one row, low stakes, no modal needed. */
function useArmedConfirm() {
  const [armed, setArmed] = useState(false);
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  const trigger = useCallback(
    (onConfirm: () => void) => {
      if (!armed) {
        setArmed(true);
        ref.current = setTimeout(() => setArmed(false), 3000);
        return;
      }
      if (ref.current) clearTimeout(ref.current);
      setArmed(false);
      onConfirm();
    },
    [armed],
  );

  return { armed, trigger };
}

function NotificationRow({
  alert,
  onAck,
  onDelete,
}: {
  alert: Alert;
  onAck: (itag: string) => void;
  onDelete: (itag: string) => void;
}) {
  const del = useArmedConfirm();

  return (
    <div className="flex items-start gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <span
        className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${TYPE_DOT[alert.type]} ${alert.acked ? "opacity-30" : ""}`}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="font-medium text-zinc-950 dark:text-zinc-50">
            {alert.title}
          </span>
          {!alert.acked && (
            <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
              Unread
            </span>
          )}
        </div>
        <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
          {alert.message}
        </p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
          {formatRelativeTime(alert.created_at)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {!alert.acked && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAck(alert.itag)}
            title="Mark as read"
          >
            <Check size={13} />
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => del.trigger(() => onDelete(alert.itag))}
          title="Delete"
        >
          {del.armed ? "Confirm?" : <Trash2 size={13} />}
        </Button>
      </div>
    </div>
  );
}

const CATEGORY_ORDER: AlertCategory[] = [
  "bot_server_reviews",
  "votes",
  "payments",
  "shop",
  "webhooks",
  "staff_applications",
  "reports",
  "account_security",
];

function NotificationPrefsPanel({ userId, token }: NotificationsTabProps) {
  const [prefs, setPrefs] = useState<NotificationPrefs | null>(null);
  const [saving, setSaving] = useState<AlertCategory | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    notificationsApi
      .getPrefs(userId, token)
      .then(setPrefs)
      .catch(() => setError("Failed to load notification preferences."));
  }, [userId, token]);

  async function toggle(category: AlertCategory) {
    if (!prefs) return;
    const next = prefs[category] ?? true;
    setPrefs({ ...prefs, [category]: !next });
    setSaving(category);
    setError(null);
    try {
      await notificationsApi.updatePrefs(userId, token, { [category]: !next });
    } catch (err) {
      setPrefs({ ...prefs, [category]: next });
      setError(
        err instanceof ApiError
          ? err.message
          : "Failed to update notification preference.",
      );
    } finally {
      setSaving(null);
    }
  }

  if (!prefs) return null;

  return (
    <div className="mb-6 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        Notification preferences
      </p>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        Choose which kinds of activity notify you, in the bell and via push.
      </p>

      <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {CATEGORY_ORDER.map((category) => (
          <label
            key={category}
            className="flex cursor-pointer items-center gap-2.5"
          >
            <input
              type="checkbox"
              checked={prefs[category] ?? true}
              disabled={saving === category}
              onChange={() => toggle(category)}
              className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
            />
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              {ALERT_CATEGORY_LABELS[category]}
            </span>
          </label>
        ))}
      </div>

      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}

export function NotificationsTab({ userId, token }: NotificationsTabProps) {
  const [data, setData] = useState<PagedResult<AlertList> | null>(null);
  const [page, setPage] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const clearAll = useArmedConfirm();
  const [clearing, setClearing] = useState(false);

  const load = useCallback(async () => {
    try {
      const result = await alertsApi.list(userId, token, page);
      setData(result);
    } catch {
      setError("Failed to load notifications.");
    }
  }, [userId, token, page]);

  useEffect(() => {
    load();
  }, [load]);

  async function ack(itag: string) {
    if (!data) return;
    setData({
      ...data,
      results: {
        ...data.results,
        alerts: data.results.alerts.map((a) =>
          a.itag === itag ? { ...a, acked: true } : a,
        ),
      },
    });
    try {
      await alertsApi.patch(userId, token, [{ itag, patch: "ack" }]);
    } catch {
      load();
    }
  }

  async function remove(itag: string) {
    if (!data) return;
    setData({
      ...data,
      count: data.count - 1,
      results: {
        ...data.results,
        alerts: data.results.alerts.filter((a) => a.itag !== itag),
      },
    });
    try {
      await alertsApi.patch(userId, token, [{ itag, patch: "delete" }]);
    } catch {
      load();
    }
  }

  async function handleClearAll() {
    setClearing(true);
    try {
      await alertsApi.deleteAll(userId, token);
      setPage(1);
      await load();
    } finally {
      setClearing(false);
    }
  }

  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  if (!data) {
    return (
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
    );
  }

  const alerts = data.results.alerts;

  return (
    <div>
      <NotificationPrefsPanel userId={userId} token={token} />

      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {data.count} notification{data.count === 1 ? "" : "s"}
        </p>
        {alerts.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            loading={clearing}
            onClick={() => clearAll.trigger(handleClearAll)}
          >
            {clearAll.armed ? "Confirm clear all?" : "Clear all"}
          </Button>
        )}
      </div>

      {alerts.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-400 dark:text-zinc-600">
          No notifications.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {alerts.map((alert) => (
            <NotificationRow
              key={alert.itag}
              alert={alert}
              onAck={ack}
              onDelete={remove}
            />
          ))}
        </div>
      )}

      {data.count > data.per_page && (
        <div className="mt-6">
          <Pagination
            page={page}
            total={data.count}
            perPage={data.per_page}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
