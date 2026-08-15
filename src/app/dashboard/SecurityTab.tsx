"use client";

import { AlertTriangle, Download, Loader2, ShieldAlert } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/hooks/useAuth";
import { data } from "@/lib/api";
import type { Task } from "@/lib/api/types";
import { SOCIAL_LINKS } from "@/lib/social";

interface SecurityTabProps {
  userId: string;
  username: string;
  token: string;
}

interface StoredTaskRef {
  taskId: string;
  taskKey: string;
  taskName: "data_request" | "data_delete";
}

const STORAGE_KEY = "omniplex-data-task";
const POLL_INTERVAL_MS = 2000;
const MAX_POLL_ATTEMPTS = 150; // ~5 minutes

function readStoredTask(): StoredTaskRef | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as StoredTaskRef) : null;
  } catch {
    return null;
  }
}

function writeStoredTask(ref: StoredTaskRef | null) {
  if (typeof window === "undefined") return;
  if (ref) localStorage.setItem(STORAGE_KEY, JSON.stringify(ref));
  else localStorage.removeItem(STORAGE_KEY);
}

function downloadJson(filename: string, content: unknown) {
  const blob = new Blob([JSON.stringify(content, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function SecurityTab({ userId, username, token }: SecurityTabProps) {
  const { logout } = useAuth();
  const [ref, setRef] = useState<StoredTaskRef | null>(() => readStoredTask());
  const [task, setTask] = useState<Task | null>(null);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const attemptsRef = useRef(0);

  useEffect(() => {
    if (!ref) return;
    attemptsRef.current = 0;
    setTimedOut(false);

    let cancelled = false;

    async function poll() {
      if (!ref || cancelled) return;
      try {
        const result = await data.getTask(
          userId,
          ref.taskId,
          ref.taskKey,
          ref.taskName === "data_delete" ? undefined : token,
        );
        if (cancelled) return;
        setTask(result);

        if (result.state === "pending") {
          attemptsRef.current += 1;
          if (attemptsRef.current >= MAX_POLL_ATTEMPTS) {
            setTimedOut(true);
            return;
          }
          setTimeout(poll, POLL_INTERVAL_MS);
          return;
        }

        // Terminal state — stop tracking this task.
        writeStoredTask(null);
        if (result.state === "completed" && ref.taskName === "data_delete") {
          logout();
        }
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof Error ? err.message : "Failed to check task status",
        );
      }
    }

    poll();
    return () => {
      cancelled = true;
    };
  }, [ref, userId, token, logout]);

  async function startTask(del: boolean) {
    setError(null);
    setTask(null);
    setStarting(true);
    try {
      const created = await data.createTask(userId, del, token);
      const newRef: StoredTaskRef = {
        taskId: created.task_id,
        taskKey: created.task_key,
        taskName: created.task_name as "data_request" | "data_delete",
      };
      writeStoredTask(newRef);
      setRef(newRef);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start request");
    } finally {
      setStarting(false);
    }
  }

  const deleting = ref?.taskName === "data_delete";
  const exporting = ref?.taskName === "data_request";
  const pending = task?.state === "pending" || (ref && !task);

  return (
    <div className="max-w-2xl space-y-8">
      {/* Data export */}
      <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
        <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">
          Download your data
        </h2>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          Get a copy of your account, team, and activity data as JSON. This
          currently covers your account, teams, votes, reviews, tickets, alerts,
          and reminders — it doesn't yet include shop purchase history for
          listings you own, since that's tracked against the listing rather than
          your account.
        </p>

        {exporting && pending && !timedOut && (
          <p className="mt-4 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <Loader2 size={14} className="animate-spin" />
            Preparing your export…
          </p>
        )}

        {exporting && timedOut && (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            This is taking longer than usual. Refresh this page in a few minutes
            to check again.
          </p>
        )}

        {exporting && task?.state === "completed" && task.output && (
          <div className="mt-4 space-y-3">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {Object.entries(task.output.data).map(([table, rows]) => (
                <div
                  key={table}
                  className="rounded-lg border border-zinc-200 px-3 py-2 dark:border-zinc-800"
                >
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    {table}
                  </p>
                  <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {Array.isArray(rows) ? rows.length : 0} row
                    {Array.isArray(rows) && rows.length === 1 ? "" : "s"}
                  </p>
                </div>
              ))}
            </div>
            <Button
              variant="secondary"
              onClick={() =>
                downloadJson(`omniplex-data-${userId}.json`, task.output)
              }
            >
              <Download size={14} />
              Download as JSON
            </Button>
          </div>
        )}

        {exporting && task?.state === "failed" && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">
            Something went wrong preparing your export. Try again, or{" "}
            <a
              href={SOCIAL_LINKS.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              reach out on Discord
            </a>{" "}
            if it keeps failing.
          </p>
        )}

        {!exporting && (
          <div className="mt-4">
            <Button
              variant="secondary"
              onClick={() => startTask(false)}
              loading={starting}
              disabled={Boolean(deleting)}
            >
              Download my data
            </Button>
          </div>
        )}
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-200 p-5 dark:border-red-900/50">
        <h2 className="flex items-center gap-2 font-semibold text-red-600 dark:text-red-400">
          <ShieldAlert size={16} />
          Danger zone
        </h2>
        <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
          Permanently delete your Omniplex account. This removes your account
          and everything tied to it that we're able to identify as yours. It
          doesn't remove bots or servers owned by a team you're part of — those
          stay with the team. This can't be undone.
        </p>

        {deleting && pending && !timedOut && (
          <p className="mt-4 flex items-center gap-2 text-sm text-zinc-500 dark:text-zinc-400">
            <Loader2 size={14} className="animate-spin" />
            Deleting your account… don't close this tab.
          </p>
        )}

        {deleting && timedOut && (
          <p className="mt-4 text-sm text-zinc-500 dark:text-zinc-400">
            This is taking longer than usual. Your account may still be deleted
            shortly — refresh this page to check again.
          </p>
        )}

        {deleting && task?.state === "failed" && (
          <p className="mt-4 text-sm text-red-600 dark:text-red-400">
            Something went wrong deleting your account. Your account has not
            been deleted.{" "}
            <a
              href={SOCIAL_LINKS.discord}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              Reach out on Discord
            </a>{" "}
            if this keeps happening.
          </p>
        )}

        {!deleting && (
          <div className="mt-4">
            <Button
              variant="danger"
              onClick={() => setConfirmOpen(true)}
              disabled={Boolean(exporting && pending)}
            >
              Delete my account
            </Button>
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <Modal
        open={confirmOpen}
        onClose={() => {
          setConfirmOpen(false);
          setConfirmText("");
        }}
        title="Delete your account?"
      >
        <p className="flex items-start gap-2 text-sm text-zinc-600 dark:text-zinc-400">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-red-500" />
          This permanently deletes your account and can't be undone. Type your
          username (
          <span className="font-medium text-zinc-950 dark:text-zinc-50">
            {username}
          </span>
          ) to confirm.
        </p>
        <div className="mt-4">
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder={username}
          />
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setConfirmOpen(false);
              setConfirmText("");
            }}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={confirmText !== username}
            loading={starting}
            onClick={async () => {
              setConfirmOpen(false);
              setConfirmText("");
              await startTask(true);
            }}
          >
            Delete my account
          </Button>
        </div>
      </Modal>
    </div>
  );
}
