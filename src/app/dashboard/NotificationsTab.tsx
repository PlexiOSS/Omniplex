"use client";

import {
  Check,
  ChevronDown,
  ExternalLink,
  Settings2,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  alerts as alertsApi,
  notifications as notificationsApi,
} from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type {
  Alert,
  AlertCategory,
  AlertType,
  NotificationPrefs,
} from "@/lib/api/types";
import { ALERT_CATEGORY_LABELS } from "@/lib/api/types";
import { alertLink } from "@/lib/utils/alerts";
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
  const link = alertLink(alert.url);

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
        <p className="mt-0.5 whitespace-pre-line text-sm text-zinc-500 wrap-anywhere dark:text-zinc-400">
          {alert.message}
        </p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
          {formatRelativeTime(alert.created_at)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        {link &&
          (link.external ? (
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              title="Open"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              <ExternalLink size={13} />
            </a>
          ) : (
            <Link
              href={link.href}
              onClick={() => !alert.acked && onAck(alert.itag)}
              title="Open"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
            >
              <ExternalLink size={13} />
            </Link>
          ))}
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
    <div className="mb-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
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

type Filter = "all" | "unread" | AlertCategory;

type Entry =
  | { kind: "single"; alert: Alert }
  | { kind: "reminders"; key: string; alerts: Alert[] };

function isVoteReminder(alert: Alert) {
  return alert.category === "votes" && /^vote for /i.test(alert.title);
}

function groupEntries(alerts: Alert[]): Entry[] {
  const out: Entry[] = [];
  for (const alert of alerts) {
    const last = out[out.length - 1];
    if (isVoteReminder(alert)) {
      if (last?.kind === "reminders") {
        last.alerts.push(alert);
        continue;
      }
      out.push({ kind: "reminders", key: alert.itag, alerts: [alert] });
      continue;
    }
    out.push({ kind: "single", alert });
  }
  return out.flatMap((e) =>
    e.kind === "reminders" && e.alerts.length === 1
      ? [{ kind: "single" as const, alert: e.alerts[0] }]
      : [e],
  );
}

function ReminderGroup({
  alerts,
  onAck,
  onDelete,
}: {
  alerts: Alert[];
  onAck: (itag: string) => void;
  onDelete: (itag: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const unread = alerts.filter((a) => !a.acked).length;
  const names = alerts.map((a) =>
    a.title.replace(/^vote for /i, "").replace(/!$/, ""),
  );
  const preview = [...new Set(names)].slice(0, 3).join(", ");

  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-start gap-3 p-4 text-left"
      >
        <span
          className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent ${unread ? "" : "opacity-30"}`}
        />
        <span className="min-w-0 flex-1">
          <span className="font-medium text-zinc-950 dark:text-zinc-50">
            {alerts.length} vote reminders
          </span>
          {unread > 0 && (
            <span className="ml-1.5 rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
              {unread} unread
            </span>
          )}
          <span className="mt-0.5 block truncate text-sm text-zinc-500 dark:text-zinc-400">
            You can vote again for {preview}
            {names.length > 3 ? " and more" : ""}.
          </span>
          <span className="mt-1 block text-xs text-zinc-400 dark:text-zinc-600">
            {formatRelativeTime(alerts[0].created_at)}
          </span>
        </span>
        <ChevronDown
          size={15}
          className={`mt-1 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="space-y-2 border-t border-zinc-100 p-2 dark:border-zinc-800">
          {alerts.map((alert) => (
            <NotificationRow
              key={alert.itag}
              alert={alert}
              onAck={onAck}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function NotificationsTab({ userId, token }: NotificationsTabProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [perPage, setPerPage] = useState(0);
  const [page, setPage] = useState(1);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [showPrefs, setShowPrefs] = useState(false);
  const clearAll = useArmedConfirm();
  const [clearing, setClearing] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const loadPage = useCallback(
    async (target: number, replace: boolean) => {
      try {
        const result = await alertsApi.list(userId, token, target);
        setTotal(result.count);
        setPerPage(result.per_page);
        setPage(target);
        setAlerts((prev) =>
          replace ? result.results.alerts : [...prev, ...result.results.alerts],
        );
      } catch {
        setError("Failed to load notifications.");
      }
    },
    [userId, token],
  );

  useEffect(() => {
    loadPage(1, true);
  }, [loadPage]);

  async function loadMore() {
    setLoadingMore(true);
    await loadPage(page + 1, false);
    setLoadingMore(false);
  }

  async function ack(itag: string) {
    setAlerts((prev) =>
      prev.map((a) => (a.itag === itag ? { ...a, acked: true } : a)),
    );
    try {
      await alertsApi.patch(userId, token, [{ itag, patch: "ack" }]);
    } catch {
      loadPage(1, true);
    }
  }

  async function markAllRead() {
    const unread = alerts.filter((a) => !a.acked).map((a) => a.itag);
    if (unread.length === 0) return;
    setMarkingAll(true);
    setAlerts((prev) => prev.map((a) => ({ ...a, acked: true })));
    try {
      await alertsApi.patch(
        userId,
        token,
        unread.map((itag) => ({ itag, patch: "ack" as const })),
      );
    } catch {
      loadPage(1, true);
    } finally {
      setMarkingAll(false);
    }
  }

  async function remove(itag: string) {
    setAlerts((prev) => prev.filter((a) => a.itag !== itag));
    setTotal((t) => (t === null ? t : Math.max(0, t - 1)));
    try {
      await alertsApi.patch(userId, token, [{ itag, patch: "delete" }]);
    } catch {
      loadPage(1, true);
    }
  }

  async function handleClearAll() {
    setClearing(true);
    try {
      await alertsApi.deleteAll(userId, token);
      await loadPage(1, true);
    } finally {
      setClearing(false);
    }
  }

  if (error) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  if (total === null) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-900 dark:border-zinc-800 dark:border-t-zinc-50" />
      </div>
    );
  }

  const unreadCount = alerts.filter((a) => !a.acked).length;
  const categories = CATEGORY_ORDER.filter((c) =>
    alerts.some((a) => a.category === c),
  );
  const visible = alerts.filter((a) =>
    filter === "all"
      ? true
      : filter === "unread"
        ? !a.acked
        : a.category === filter,
  );
  const entries = groupEntries(visible);
  const hasMore = alerts.length < total && perPage > 0;

  const chip = (key: Filter, label: string, count: number) => (
    <button
      key={key}
      type="button"
      onClick={() => setFilter(key)}
      aria-pressed={filter === key}
      className={[
        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        filter === key
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-zinc-200 text-zinc-600 hover:border-accent/40 hover:text-accent dark:border-zinc-700 dark:text-zinc-300",
      ].join(" ")}
    >
      {label}
      <span className="ml-1.5 tabular-nums opacity-70">{count}</span>
    </button>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {total} notification{total === 1 ? "" : "s"}
          {unreadCount > 0 && `, ${unreadCount} unread on this list`}
        </p>
        <div className="flex flex-wrap items-center gap-1">
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              loading={markingAll}
              onClick={markAllRead}
            >
              <Check size={13} />
              Mark all read
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowPrefs((o) => !o)}
            aria-expanded={showPrefs}
          >
            <Settings2 size={13} />
            Preferences
          </Button>
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
      </div>

      {showPrefs && <NotificationPrefsPanel userId={userId} token={token} />}

      {alerts.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          {chip("all", "All", alerts.length)}
          {unreadCount > 0 && chip("unread", "Unread", unreadCount)}
          {categories.map((c) =>
            chip(
              c,
              ALERT_CATEGORY_LABELS[c],
              alerts.filter((a) => a.category === c).length,
            ),
          )}
        </div>
      )}

      {entries.length === 0 ? (
        <p className="py-16 text-center text-sm text-zinc-400 dark:text-zinc-600">
          {alerts.length === 0
            ? "No notifications."
            : "No notifications match this filter."}
        </p>
      ) : (
        <div className="space-y-2">
          {entries.map((entry) =>
            entry.kind === "single" ? (
              <NotificationRow
                key={entry.alert.itag}
                alert={entry.alert}
                onAck={ack}
                onDelete={remove}
              />
            ) : (
              <ReminderGroup
                key={entry.key}
                alerts={entry.alerts}
                onAck={ack}
                onDelete={remove}
              />
            ),
          )}
        </div>
      )}

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <Button
            variant="secondary"
            size="sm"
            loading={loadingMore}
            onClick={loadMore}
          >
            Load more ({total - alerts.length} older)
          </Button>
        </div>
      )}
    </div>
  );
}
