"use client";

import { Bell, BellRing } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { reminders } from "@/lib/api";
import { ApiError } from "@/lib/api/client";

interface ReminderToggleProps {
  targetType: "bot" | "server";
  targetId: string;
}

/**
 * "Remind me to vote for this again" — feeds Popplio's existing
 * votereminders cron, which pushes a real notification (and an alert inbox
 * entry) once the vote cooldown is back up. Silently renders nothing when
 * signed out rather than prompting sign-in — unlike voting/reporting, this
 * isn't an action worth interrupting a browsing session for.
 */
export function ReminderToggle({ targetType, targetId }: ReminderToggleProps) {
  const { session, isAuthenticated } = useAuth();
  const [active, setActive] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!session) return;
    reminders
      .list(session.user_id, session.token)
      .then((data) => {
        setActive(
          data.reminders.some(
            (r) => r.target_type === targetType && r.target_id === targetId,
          ),
        );
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, [session, targetType, targetId]);

  if (!isAuthenticated || !session || !loaded) return null;

  async function toggle() {
    if (!session) return;
    setBusy(true);
    const next = !active;
    setActive(next);
    try {
      if (next) {
        await reminders.create(session.user_id, targetType, targetId, session.token);
      } else {
        await reminders.remove(session.user_id, targetType, targetId, session.token);
      }
    } catch (err) {
      setActive(!next); // revert on failure
      if (!(err instanceof ApiError)) throw err;
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      className={[
        "inline-flex items-center gap-1.5 text-xs font-medium transition-colors disabled:opacity-50",
        active
          ? "text-accent"
          : "text-zinc-400 hover:text-zinc-700 dark:text-zinc-600 dark:hover:text-zinc-300",
      ].join(" ")}
    >
      {active ? <BellRing size={12} /> : <Bell size={12} />}
      {active ? "Reminder set" : "Remind me to vote again"}
    </button>
  );
}
