"use client";

import {
  Bell,
  BellOff,
  BellRing,
  Check,
  ChevronDown,
  ClipboardList,
  CreditCard,
  ExternalLink,
  Flag,
  type LucideIcon,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  ThumbsUp,
  Trash2,
  Webhook,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
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
import { ALERT_CATEGORY_LABELS } from "@/lib/constants/alertCategories";
import { alertLink } from "@/lib/utils/alerts";
import { formatRelativeTime } from "@/lib/utils/format";

interface NotificationsTabProps {
  userId: string;
  token: string;
}

const TYPE_TILE: Record<AlertType, string> = {
  success:
    "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20 dark:text-emerald-400",
  error: "bg-red-500/10 text-red-600 ring-red-500/20 dark:text-red-400",
  info: "bg-accent/10 text-accent ring-accent/15",
  warning:
    "bg-amber-500/10 text-amber-600 ring-amber-500/20 dark:text-amber-400",
};

const CATEGORY_ICON: Record<string, LucideIcon> = {
  votes: ThumbsUp,
  bot_server_reviews: ShieldCheck,
  payments: CreditCard,
  shop: ShoppingBag,
  webhooks: Webhook,
  staff_applications: ClipboardList,
  reports: Flag,
  account_security: ShieldCheck,
};

const ACTION_CLASS =
  "flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50";

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

function IconTile({
  icon: Icon,
  tone,
  dim,
}: {
  icon: LucideIcon;
  tone: string;
  dim?: boolean;
}) {
  return (
    <span
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ring-1 ${tone} ${dim ? "opacity-60" : ""}`}
    >
      <Icon size={16} />
    </span>
  );
}

function NotificationRow({
  alert,
  onAck,
  onDelete,
  nested,
}: {
  alert: Alert;
  onAck: (itag: string) => void;
  onDelete: (itag: string) => void;
  nested?: boolean;
}) {
  const del = useArmedConfirm();
  const link = alertLink(alert.url);
  const Icon = CATEGORY_ICON[alert.category] ?? Bell;

  return (
    <div
      className={[
        "group flex items-start gap-3 px-4 py-3.5 transition-colors sm:px-5",
        nested ? "pl-8 sm:pl-[4.25rem]" : "",
        alert.acked
          ? "hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
          : "bg-accent/[0.04] hover:bg-accent/[0.07]",
      ].join(" ")}
    >
      {!nested && (
        <IconTile icon={Icon} tone={TYPE_TILE[alert.type]} dim={alert.acked} />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <p className="flex min-w-0 items-center gap-2 text-sm font-medium text-zinc-950 dark:text-zinc-50">
            {!alert.acked && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
            )}
            <span className="truncate">{alert.title}</span>
          </p>
          <span className="shrink-0 text-xs text-zinc-400 tabular-nums dark:text-zinc-500">
            {formatRelativeTime(alert.created_at)}
          </span>
        </div>
        <p className="mt-0.5 whitespace-pre-line text-sm text-zinc-500 wrap-anywhere dark:text-zinc-400">
          {alert.message}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-0.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
        {link &&
          (link.external ? (
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              title="Open"
              aria-label="Open"
              className={ACTION_CLASS}
            >
              <ExternalLink size={14} />
            </a>
          ) : (
            <Link
              href={link.href}
              onClick={() => !alert.acked && onAck(alert.itag)}
              title="Open"
              aria-label="Open"
              className={ACTION_CLASS}
            >
              <ExternalLink size={14} />
            </Link>
          ))}
        {!alert.acked && (
          <button
            type="button"
            onClick={() => onAck(alert.itag)}
            title="Mark as read"
            aria-label="Mark as read"
            className={ACTION_CLASS}
          >
            <Check size={14} />
          </button>
        )}
        <button
          type="button"
          onClick={() => del.trigger(() => onDelete(alert.itag))}
          title="Delete"
          aria-label="Delete"
          className={
            del.armed
              ? "flex h-8 items-center rounded-lg bg-red-500/10 px-2 text-xs font-medium text-red-600 dark:text-red-400"
              : ACTION_CLASS
          }
        >
          {del.armed ? "Delete?" : <Trash2 size={14} />}
        </button>
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
    <section className="mb-4 rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6 dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        Notification preferences
      </h2>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        Choose which kinds of activity notify you, in the bell and via push.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
        {CATEGORY_ORDER.map((category) => {
          const on = prefs[category] ?? true;
          const Icon = CATEGORY_ICON[category] ?? Bell;
          return (
            <label
              key={category}
              className={[
                "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors",
                on
                  ? "border-accent/40 bg-accent/5"
                  : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700",
              ].join(" ")}
            >
              <Icon
                size={15}
                className={on ? "text-accent" : "text-zinc-400"}
              />
              <span className="flex-1 text-sm font-medium text-zinc-800 dark:text-zinc-200">
                {ALERT_CATEGORY_LABELS[category]}
              </span>
              <input
                type="checkbox"
                checked={on}
                disabled={saving === category}
                onChange={() => toggle(category)}
                className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
              />
            </label>
          );
        })}
      </div>

      {error && (
        <p className="mt-3 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </section>
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
    <div>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={[
          "flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors sm:px-5",
          unread
            ? "bg-accent/[0.04] hover:bg-accent/[0.07]"
            : "hover:bg-zinc-50 dark:hover:bg-zinc-800/40",
        ].join(" ")}
      >
        <IconTile icon={BellRing} tone={TYPE_TILE.info} dim={!unread} />
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-3">
            <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-zinc-950 dark:text-zinc-50">
              {unread > 0 && (
                <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />
              )}
              {alerts.length} vote reminders
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                {unread > 0 ? `${unread} unread` : "All read"}
              </span>
            </span>
            <span className="shrink-0 text-xs text-zinc-400 tabular-nums dark:text-zinc-500">
              {formatRelativeTime(alerts[0].created_at)}
            </span>
          </span>
          <span className="mt-0.5 block truncate text-sm text-zinc-500 dark:text-zinc-400">
            You can vote again for {preview}
            {names.length > 3 ? " and more" : ""}.
          </span>
        </span>
        <ChevronDown
          size={16}
          className={`mt-2.5 shrink-0 text-zinc-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="divide-y divide-zinc-100 border-t border-zinc-100 bg-zinc-50/60 dark:divide-zinc-800/70 dark:border-zinc-800 dark:bg-zinc-950/30">
          {alerts.map((alert) => (
            <NotificationRow
              key={alert.itag}
              alert={alert}
              onAck={onAck}
              onDelete={onDelete}
              nested
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
        setError(null);
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
    return <ErrorState message={error} onRetry={() => loadPage(1, true)} />;
  }

  if (total === null) {
    return <LoadingState label="Loading notifications…" />;
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
        "inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-xs font-medium transition-colors",
        filter === key
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-50",
      ].join(" ")}
    >
      {label}
      <span className="tabular-nums opacity-70">{count}</span>
    </button>
  );

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {alerts.length > 0 && (
            <>
              {chip("all", "All", alerts.length)}
              {unreadCount > 0 && chip("unread", "Unread", unreadCount)}
              {categories.map((c) =>
                chip(
                  c,
                  ALERT_CATEGORY_LABELS[c],
                  alerts.filter((a) => a.category === c).length,
                ),
              )}
            </>
          )}
        </div>
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
            variant={showPrefs ? "secondary" : "ghost"}
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
              <Trash2 size={13} />
              {clearAll.armed ? "Clear everything?" : "Clear all"}
            </Button>
          )}
        </div>
      </div>

      {showPrefs && <NotificationPrefsPanel userId={userId} token={token} />}

      {entries.length === 0 ? (
        <EmptyState
          icon={BellOff}
          title={
            alerts.length === 0
              ? "You're all caught up"
              : "Nothing matches this filter"
          }
        >
          {alerts.length === 0
            ? "Votes, reviews and payments will show up here."
            : "Try another filter."}
        </EmptyState>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
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
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/60 px-4 py-3 text-xs text-zinc-500 sm:px-5 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
            <span className="tabular-nums">
              Showing {alerts.length} of {total}
            </span>
            {hasMore && (
              <Button
                variant="secondary"
                size="sm"
                loading={loadingMore}
                onClick={loadMore}
              >
                Load {Math.min(perPage, total - alerts.length)} more
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
