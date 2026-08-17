"use client";

import { Bell, BellOff, Check, ListChecks } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Dropdown, DropdownItem } from "@/components/ui/Dropdown";
import { useAuth } from "@/hooks/useAuth";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { alerts as alertsApi } from "@/lib/api";
import type { Alert, AlertType } from "@/lib/api/types";
import { formatRelativeTime } from "@/lib/utils/format";

const TRIGGER_CLASS =
  "flex h-9 w-9 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-50";

const TYPE_DOT: Record<AlertType, string> = {
  success: "bg-green-500",
  error: "bg-red-500",
  info: "bg-accent",
  warning: "bg-amber-500",
};

const POLL_MS = 60_000;

export function NotificationBell() {
  const { session, isAuthenticated } = useAuth();
  const push = usePushNotifications();

  const [open, setOpen] = useState(false);
  const [unacked, setUnacked] = useState<Alert[]>([]);
  const [unackedCount, setUnackedCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    try {
      const data = await alertsApi.getFeatured(
        session.user_id,
        session.token,
        0,
        8,
      );
      setUnacked(data.unacked);
      setUnackedCount(data.unacked_count);
    } catch {}
  }, [session]);

  useEffect(() => {
    if (!isAuthenticated) return;
    load();
    const interval = setInterval(load, POLL_MS);
    return () => clearInterval(interval);
  }, [isAuthenticated, load]);

  async function ack(itag: string) {
    if (!session) return;
    setUnacked((prev) => prev.filter((a) => a.itag !== itag));
    setUnackedCount((c) => Math.max(0, c - 1));
    try {
      await alertsApi.patch(session.user_id, session.token, [
        { itag, patch: "ack" },
      ]);
    } catch {
      load();
    }
  }

  async function ackAll() {
    if (!session || unacked.length === 0) return;
    setLoading(true);
    const itags = unacked.map((a) => a.itag);
    try {
      await alertsApi.patch(
        session.user_id,
        session.token,
        itags.map((itag) => ({ itag, patch: "ack" as const })),
      );
      await load();
    } finally {
      setLoading(false);
    }
  }

  if (!isAuthenticated) return null;

  const entries = unacked.slice(0, 8);

  return (
    <Dropdown
      open={open}
      onClose={() => setOpen(false)}
      panelClassName="w-80"
      trigger={
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className={`relative ${TRIGGER_CLASS}`}
          aria-label="Notifications"
        >
          <Bell size={16} />
          {unackedCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-fg">
              {unackedCount > 9 ? "9+" : unackedCount}
            </span>
          )}
        </button>
      }
    >
      <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
        <p className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Notifications
        </p>
        {unacked.length > 0 && (
          <button
            type="button"
            onClick={ackAll}
            disabled={loading}
            className="flex items-center gap-1 text-xs font-medium text-accent hover:underline disabled:opacity-50"
          >
            <Check size={11} />
            Mark all read
          </button>
        )}
      </div>

      <div className="max-h-80 overflow-y-auto">
        {entries.length === 0 ? (
          <p className="px-3 py-6 text-center text-xs text-zinc-400 dark:text-zinc-600">
            No notifications yet.
          </p>
        ) : (
          entries.map((alert) => (
            <button
              key={alert.itag}
              type="button"
              onClick={() => ack(alert.itag)}
              className="flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/60"
            >
              <span
                className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${TYPE_DOT[alert.type]}`}
              />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {alert.title}
                </span>
                <span className="block line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400">
                  {alert.message}
                </span>
                <span className="mt-0.5 block text-[11px] text-zinc-400 dark:text-zinc-600">
                  {formatRelativeTime(alert.created_at)}
                </span>
              </span>
            </button>
          ))
        )}
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800">
        <Link
          href="/dashboard?tab=notifications"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2 px-3 py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-800/60"
        >
          <ListChecks size={13} />
          View all notifications
        </Link>
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-800">
        {push.supported ? (
          <DropdownItem
            onClick={push.subscribed ? push.unsubscribe : push.subscribe}
            icon={push.subscribed ? <BellOff size={14} /> : <Bell size={14} />}
            loading={push.busy}
          >
            {push.subscribed
              ? "Disable push notifications"
              : "Enable push notifications"}
          </DropdownItem>
        ) : (
          <p className="px-3 py-2 text-xs text-zinc-400 dark:text-zinc-600">
            Push notifications aren't supported in this browser.
          </p>
        )}
        {push.error && (
          <p className="px-3 pb-2 text-xs text-red-600 dark:text-red-400">
            {push.error}
          </p>
        )}
      </div>
    </Dropdown>
  );
}
