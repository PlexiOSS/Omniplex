"use client";

import { staff } from "@omniplex/core/api";
import type { PermissionData } from "@omniplex/core/api/types";
import { hasPermString, isSuperPerm } from "@omniplex/core/permissions";
import { formatRelativeTime } from "@omniplex/core/utils/format";
import { Avatar } from "@omniplex/ui/Avatar";
import { Button } from "@omniplex/ui/Button";
import { Modal } from "@omniplex/ui/Modal";
import {
  ChevronRight,
  Crown,
  KeyRound,
  LogOut,
  Monitor,
  Search,
  ShieldCheck,
  Smartphone,
  TriangleAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { OtpInput } from "@/app/(auth)/OtpInput";
import { LeaveCard } from "@/app/(dashboard)/account/LeaveCard";
import { useAdmin } from "@/app/AdminContext";
import { AdminPageHeader } from "@/app/AdminPageHeader";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import { clearArcadiaSession } from "@/lib/arcadia/session";
import type { StaffSession } from "@/lib/arcadia/types";

function describeDevice(ua: string | null) {
  if (!ua) return { label: "Unknown device", mobile: false };
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\/|Opera/.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "Browser";
  const os = /Windows/.test(ua)
    ? "Windows"
    : /iPhone|iPad/.test(ua)
      ? "iOS"
      : /Android/.test(ua)
        ? "Android"
        : /Mac OS X/.test(ua)
          ? "macOS"
          : /Linux/.test(ua)
            ? "Linux"
            : "an unknown system";
  return {
    label: `${browser} on ${os}`,
    mobile: /Mobile|iPhone|Android/.test(ua),
  };
}

function Card({
  title,
  description,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60">
      <header className="flex flex-col gap-3 border-b border-zinc-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800/80">
        <div>
          <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {description}
            </p>
          )}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function PermissionsCard({
  catalog,
  resolved,
}: {
  catalog: PermissionData[];
  resolved: string[];
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState<string[]>([]);
  const isAdmin = resolved.some((p) => isSuperPerm(p));

  const groups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const map = new Map<string, PermissionData[]>();
    for (const p of catalog) {
      if (!hasPermString(resolved, p.id)) continue;
      if (
        needle &&
        !`${p.name} ${p.desc} ${p.id} ${p.category}`
          .toLowerCase()
          .includes(needle)
      )
        continue;
      const list = map.get(p.category) ?? [];
      list.push(p);
      map.set(p.category, list);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [catalog, resolved, query]);

  const total = groups.reduce((n, [, perms]) => n + perms.length, 0);
  const searching = query.trim() !== "";

  return (
    <Card
      title="Your permissions"
      description={
        catalog.length === 0
          ? "Loading…"
          : `${total} permission${total === 1 ? "" : "s"} from your positions, after any disciplinary limits.`
      }
      action={
        <label className="flex h-9 w-full items-center gap-2 rounded-lg border border-zinc-200 bg-white px-2.5 sm:w-56 dark:border-zinc-800 dark:bg-zinc-950">
          <Search size={13} className="shrink-0 text-zinc-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search permissions"
            aria-label="Search permissions"
            className="w-full bg-transparent text-sm text-zinc-950 outline-none placeholder:text-zinc-400 dark:text-zinc-50"
          />
        </label>
      }
    >
      {isAdmin && !searching && (
        <p className="flex items-center gap-2 border-b border-zinc-100 bg-accent/5 px-5 py-3 text-sm text-zinc-700 dark:border-zinc-800/80 dark:text-zinc-300">
          <Crown size={15} className="shrink-0 text-accent" />
          You're an administrator, so you have every permission below.
        </p>
      )}
      {groups.length === 0 ? (
        <p className="px-5 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
          {searching ? "No permissions match." : "No permissions."}
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          {groups.map(([category, perms]) => {
            const expanded = searching || open.includes(category);
            const dangerous = perms.filter((p) => p.dangerous).length;
            return (
              <li key={category}>
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() =>
                    setOpen((prev) =>
                      prev.includes(category)
                        ? prev.filter((c) => c !== category)
                        : [...prev, category],
                    )
                  }
                  className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
                >
                  <ChevronRight
                    size={14}
                    className={`shrink-0 text-zinc-400 transition-transform ${expanded ? "rotate-90" : ""}`}
                  />
                  <span className="flex-1 text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {category}
                  </span>
                  {dangerous > 0 && (
                    <span className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:text-red-300">
                      {dangerous} sensitive
                    </span>
                  )}
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs tabular-nums text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                    {perms.length}
                  </span>
                </button>
                {expanded && (
                  <div className="grid gap-2 px-5 pb-4 sm:grid-cols-2">
                    {perms.map((p) => (
                      <div
                        key={p.id}
                        className={[
                          "rounded-xl border px-3 py-2.5",
                          p.dangerous
                            ? "border-red-200 bg-red-50/50 dark:border-red-900/50 dark:bg-red-950/20"
                            : "border-zinc-100 bg-zinc-50/60 dark:border-zinc-800 dark:bg-zinc-800/30",
                        ].join(" ")}
                      >
                        <p className="flex items-center gap-1.5 text-sm font-medium text-zinc-950 dark:text-zinc-50">
                          {p.dangerous && (
                            <TriangleAlert
                              size={13}
                              className="shrink-0 text-red-500"
                            />
                          )}
                          {p.name}
                        </p>
                        {p.desc && (
                          <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                            {p.desc}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

export default function AccountPage() {
  const { loginToken, staffMember } = useAdmin();
  const router = useRouter();

  const [sessions, setSessions] = useState<StaffSession[] | null>(null);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<PermissionData[]>([]);
  const [resetOpen, setResetOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [resetError, setResetError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  const loadSessions = useCallback(async () => {
    try {
      setSessions(await arcadia.sessions.list(loginToken));
    } catch (err) {
      setSessionsError(
        err instanceof ArcadiaError && err.message.includes("UpdateSessions")
          ? "Session management needs the latest Popplio release."
          : err instanceof ArcadiaError
            ? err.message
            : "Couldn't load sessions.",
      );
    }
  }, [loginToken]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    staff
      .getPermissionCatalog()
      .then((res) => setCatalog(res.perms))
      .catch(() => {});
  }, []);

  async function revoke(id: string) {
    setBusy(id);
    setNotice(null);
    try {
      await arcadia.sessions.revoke(loginToken, id);
      setNotice("Signed that device out.");
      await loadSessions();
    } catch (err) {
      setSessionsError(
        err instanceof ArcadiaError ? err.message : "Couldn't sign it out.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function revokeOthers() {
    setBusy("others");
    setNotice(null);
    try {
      const n = await arcadia.sessions.revokeOthers(loginToken);
      setNotice(
        n === 0
          ? "You weren't signed in anywhere else."
          : `Signed out ${n} other device${n === 1 ? "" : "s"}.`,
      );
      await loadSessions();
    } catch (err) {
      setSessionsError(
        err instanceof ArcadiaError ? err.message : "Couldn't sign them out.",
      );
    } finally {
      setBusy(null);
    }
  }

  async function resetTwoFactor(code: string) {
    if (code.length !== 6 || resetting) return;
    setResetting(true);
    setResetError(null);
    try {
      await arcadia.auth.resetMfaTotp(loginToken, code);
      clearArcadiaSession();
      router.replace("/login");
    } catch (err) {
      setResetError(
        err instanceof ArcadiaError
          ? err.message
          : "That code didn't work. Check your app and try again.",
      );
      setOtp("");
      setResetting(false);
    }
  }

  const user = staffMember.user;
  const positions = [...(staffMember.positions ?? [])].sort(
    (a, b) => a.index - b.index,
  );
  const others = (sessions ?? []).filter((s) => !s.current).length;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
      <AdminPageHeader
        title="Account"
        description="Your staff profile, where you're signed in, and your security settings."
      />

      <div className="mt-6 grid items-start gap-4 lg:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="space-y-4 lg:sticky lg:top-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
            <div className="flex items-center gap-3">
              <Avatar src={user.avatar} alt={user.username} size={56} />
              <div className="min-w-0">
                <p className="truncate text-base font-semibold text-zinc-950 dark:text-zinc-50">
                  {user.display_name || user.username}
                </p>
                <p className="truncate text-sm text-zinc-500 dark:text-zinc-400">
                  @{user.username}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {positions.length === 0 ? (
                <span className="text-sm text-zinc-500 dark:text-zinc-400">
                  No positions
                </span>
              ) : (
                positions.map((p) => (
                  <span
                    key={p.id}
                    className="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-medium text-accent"
                  >
                    {p.name}
                  </span>
                ))
              )}
            </div>
            <dl className="mt-4 divide-y divide-zinc-100 text-sm dark:divide-zinc-800/80">
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-zinc-500 dark:text-zinc-400">
                  Staff since
                </dt>
                <dd className="text-zinc-950 dark:text-zinc-50">
                  {new Date(staffMember.created_at).toLocaleDateString()}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-zinc-500 dark:text-zinc-400">Two-factor</dt>
                <dd className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={14} />
                  On
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-zinc-500 dark:text-zinc-400">User ID</dt>
                <dd className="font-mono text-xs text-zinc-950 dark:text-zinc-50">
                  {staffMember.user_id}
                </dd>
              </div>
            </dl>
          </div>
        </aside>

        <div className="space-y-4">
          <Card
            title="Where you're signed in"
            description="Sessions end after 12 hours without activity."
          >
            {notice && (
              <p
                aria-live="polite"
                className="border-b border-zinc-100 bg-emerald-50 px-5 py-2.5 text-sm text-emerald-800 dark:border-zinc-800/80 dark:bg-emerald-950/30 dark:text-emerald-200"
              >
                {notice}
              </p>
            )}
            {sessionsError ? (
              <p className="px-5 py-4 text-sm text-red-600 dark:text-red-400">
                {sessionsError}
              </p>
            ) : !sessions ? (
              <p className="px-5 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                Loading…
              </p>
            ) : (
              <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {sessions.map((s) => {
                  const device = describeDevice(s.user_agent);
                  const Icon = device.mobile ? Smartphone : Monitor;
                  return (
                    <li
                      key={s.id}
                      className="flex items-center gap-4 px-5 py-3.5"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                        <Icon size={18} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-zinc-950 dark:text-zinc-50">
                          {device.label}
                          {s.current && (
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                              This device
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-zinc-500 dark:text-zinc-400">
                          {s.ip ? `${s.ip} · ` : ""}signed in{" "}
                          {formatRelativeTime(s.created_at)} · active{" "}
                          {formatRelativeTime(s.last_seen_at)}
                        </p>
                      </div>
                      {!s.current && (
                        <Button
                          variant="ghost"
                          size="sm"
                          loading={busy === s.id}
                          onClick={() => revoke(s.id)}
                        >
                          Sign out
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card
            title="Security"
            description="Keep your staff account locked down."
          >
            <ul className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
              <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    Authenticator app
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                      On
                    </span>
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                    Lost your phone or switching apps? Resetting signs you out
                    everywhere, and you'll scan a new QR code next sign-in.
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="shrink-0 whitespace-nowrap"
                  onClick={() => {
                    setOtp("");
                    setResetError(null);
                    setResetOpen(true);
                  }}
                >
                  <KeyRound size={13} />
                  Reset
                </Button>
              </li>
              <li className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  <LogOut size={18} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    Other devices
                  </p>
                  <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
                    {sessions === null
                      ? "Checking where else you're signed in."
                      : others === 0
                        ? "You're only signed in here."
                        : `You're signed in on ${others} other device${others === 1 ? "" : "s"}.`}
                  </p>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="shrink-0 whitespace-nowrap"
                  disabled={others === 0}
                  loading={busy === "others"}
                  onClick={revokeOthers}
                >
                  Sign them out
                </Button>
              </li>
            </ul>
          </Card>

          <LeaveCard />

          <PermissionsCard
            catalog={catalog}
            resolved={staffMember.resolved_perms}
          />
        </div>
      </div>

      <Modal
        open={resetOpen}
        onClose={() => !resetting && setResetOpen(false)}
        title="Reset two-factor"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            resetTwoFactor(otp);
          }}
          className="space-y-4"
        >
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Enter the current 6-digit code from your authenticator app. You'll
            be signed out everywhere and set up a new authenticator when you
            sign back in.
          </p>
          <OtpInput
            value={otp}
            onChange={(v) => {
              setOtp(v);
              if (resetError) setResetError(null);
            }}
            onComplete={resetTwoFactor}
            disabled={resetting}
          />
          {resetError && (
            <p className="text-center text-sm text-red-600 dark:text-red-400">
              {resetError}
            </p>
          )}
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              disabled={resetting}
              onClick={() => setResetOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              loading={resetting}
              disabled={otp.length !== 6}
            >
              Reset and sign out
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
