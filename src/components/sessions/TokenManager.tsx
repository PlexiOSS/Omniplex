"use client";

import { Check, CircleCheck, CircleX, Copy, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { PermSelector } from "@/components/teams/PermSelector";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { auth, sessions, teams } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { ApiSession, PermissionData } from "@/lib/api/types";
import { hasPermString, isSuperPerm } from "@/lib/permissions";

type TargetType = "user" | "bot" | "server" | "team";

// POST /auth/test relies on a Popplio fix (ExtData was missing on the
// synthetic route it builds internally, so it 500ed on every valid token)
// that hasn't been deployed yet. Flip this once that's live — the button
// stays in the UI, just disabled, so there's nothing else to wire up later.
const TEST_AUTH_ENABLED = true;

interface TokenManagerProps {
  targetType: TargetType;
  targetId: string;
  /** The signed-in user's own token — always sent as the `Authorization` header, regardless of targetType. */
  authToken: string;
  /** The signed-in user's resolved perms on this target — [] on their own user target means "owner" (self). */
  myPerms: string[];
  isSelf?: boolean;
}

const EXPIRY_OPTIONS = [
  { label: "1 hour", seconds: 60 * 60 },
  { label: "1 day", seconds: 60 * 60 * 24 },
  { label: "7 days", seconds: 60 * 60 * 24 * 7 },
  { label: "30 days", seconds: 60 * 60 * 24 * 30 },
  { label: "1 year", seconds: 60 * 60 * 24 * 365 },
];

function isExpired(expiry: string): boolean {
  return new Date(expiry).getTime() < Date.now();
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function TokenManager({
  targetType,
  targetId,
  authToken,
  myPerms,
  isSelf = false,
}: TokenManagerProps) {
  const [list, setList] = useState<ApiSession[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<PermissionData[]>([]);

  const canManage = isSelf || hasPermString(myPerms, "manage_sessions");
  const isOwner = myPerms.some(isSuperPerm);

  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [expiry, setExpiry] = useState(EXPIRY_OPTIONS[1].seconds);
  const [restrict, setRestrict] = useState(!isOwner);
  const [permLimits, setPermLimits] = useState<string[]>([]);
  const [creatingLoading, setCreatingLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<
    { ok: true; targetType: string } | { ok: false; message: string } | null
  >(null);

  const [revokingId, setRevokingId] = useState<string | null>(null);

  function load() {
    setError(null);
    sessions
      .list(targetType, targetId, authToken)
      .then(setList)
      .catch((err) => {
        setError(
          err instanceof ApiError ? err.message : "Failed to load tokens.",
        );
      });
  }

  useEffect(() => {
    load();
    if (canManage && !isOwner) {
      teams
        .getPermissionCatalog()
        .then((res) => setCatalog(res.perms))
        .catch(() => setCatalog([]));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetType, targetId]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setCreateError("Name is required.");
      return;
    }
    if (restrict && permLimits.length === 0) {
      setCreateError(
        "Pick at least one permission, or uncheck \"Restrict permissions\" if you have full access.",
      );
      return;
    }

    setCreatingLoading(true);
    setCreateError(null);
    try {
      const res = await sessions.create(
        targetType,
        targetId,
        {
          name: name.trim(),
          type: "api",
          perm_limits: restrict ? permLimits : [],
          expiry,
        },
        authToken,
      );
      setNewToken(res.token);
      setTestResult(null);
      setName("");
      setPermLimits([]);
      load();
    } catch (err) {
      setCreateError(
        err instanceof ApiError ? err.message : "Failed to create token.",
      );
    } finally {
      setCreatingLoading(false);
    }
  }

  async function handleRevoke(sessionId: string) {
    setRevokingId(sessionId);
    try {
      await sessions.revoke(targetType, targetId, sessionId, authToken);
      setList((prev) => prev?.filter((s) => s.id !== sessionId) ?? null);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to revoke token.",
      );
    } finally {
      setRevokingId(null);
    }
  }

  function copyToken() {
    if (!newToken) return;
    navigator.clipboard.writeText(newToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function testNewToken() {
    if (!newToken) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await auth.testAuth(targetType, targetId, newToken);
      setTestResult(
        res.authorized
          ? { ok: true, targetType: res.target_type }
          : { ok: false, message: "Token did not authorize." },
      );
    } catch (err) {
      setTestResult({
        ok: false,
        message: err instanceof ApiError ? err.message : "Test failed.",
      });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-4">
      {newToken && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-300">
            Copy this token now — you won&apos;t be able to see it again.
          </p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 overflow-x-auto whitespace-nowrap rounded-lg bg-white px-3 py-2 text-xs text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">
              {newToken}
            </code>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={copyToken}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              loading={testing}
              disabled={!TEST_AUTH_ENABLED}
              onClick={testNewToken}
              title={
                TEST_AUTH_ENABLED
                  ? undefined
                  : "Coming soon — pending a Popplio deploy"
              }
              className={!TEST_AUTH_ENABLED ? "opacity-50" : undefined}
            >
              Test
            </Button>
          </div>
          {testResult && (
            <p
              className={[
                "mt-2 flex items-center gap-1.5 text-xs",
                testResult.ok
                  ? "text-green-700 dark:text-green-400"
                  : "text-red-700 dark:text-red-400",
              ].join(" ")}
            >
              {testResult.ok ? (
                <>
                  <CircleCheck size={12} />
                  Valid — authorized as {testResult.targetType}
                </>
              ) : (
                <>
                  <CircleX size={12} />
                  {testResult.message}
                </>
              )}
            </p>
          )}
          <button
            type="button"
            onClick={() => setNewToken(null)}
            className="mt-2 text-xs text-amber-700 underline underline-offset-2 dark:text-amber-400"
          >
            Done, dismiss this
          </button>
        </div>
      )}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {list === null && !error ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading…</p>
      ) : (
        <div className="space-y-2">
          {list?.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              No tokens yet.
            </p>
          )}
          {list?.map((s) => {
            const expired = isExpired(s.expiry);
            return (
              <div
                key={s.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {s.name || "Unnamed token"}
                    </p>
                    {expired && <Badge variant="danger">Expired</Badge>}
                  </div>
                  <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                    Created {formatDate(s.created_at)} ·{" "}
                    {expired ? "expired" : "expires"} {formatDate(s.expiry)}
                  </p>
                  <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-600">
                    {s.perm_limits.length === 0
                      ? "Full access"
                      : s.perm_limits.join(", ")}
                  </p>
                </div>
                {canManage && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    loading={revokingId === s.id}
                    onClick={() => handleRevoke(s.id)}
                    className="shrink-0 px-2 text-xs h-7"
                  >
                    <Trash2 size={12} />
                    Revoke
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {canManage && (
        <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
          {!creating ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setCreating(true)}
            >
              Create Token
            </Button>
          ) : (
            <form onSubmit={handleCreate} className="space-y-3">
              <Input
                label="Name"
                placeholder="e.g. My Script"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="token-expiry"
                  className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
                >
                  Expires in
                </label>
                <select
                  id="token-expiry"
                  value={expiry}
                  onChange={(e) => setExpiry(Number(e.target.value))}
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
                >
                  {EXPIRY_OPTIONS.map((o) => (
                    <option key={o.seconds} value={o.seconds}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>

              {isOwner && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={restrict}
                    onChange={(e) => setRestrict(e.target.checked)}
                    className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    Restrict permissions
                  </span>
                </label>
              )}

              {restrict && (
                <PermSelector
                  catalog={catalog}
                  granterPerms={myPerms}
                  value={permLimits}
                  onChange={setPermLimits}
                />
              )}

              {createError && (
                <p className="text-sm text-red-600 dark:text-red-400">
                  {createError}
                </p>
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={creatingLoading}
                >
                  Create
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setCreating(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
