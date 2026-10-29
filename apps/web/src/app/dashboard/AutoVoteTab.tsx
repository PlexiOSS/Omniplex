"use client";

import {
  Check,
  CreditCard,
  Plus,
  Repeat,
  Search,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { search, users } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { AutoVoteStatus, AutoVoteTarget } from "@/lib/api/types";
import { formatRelativeTime } from "@/lib/utils/format";
import { FormMessage, SettingsCard } from "./manage/ManageShell";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Draft = Omit<AutoVoteTarget, "last_voted_at" | "last_skip_reason"> & {
  last_voted_at?: string | null;
  last_skip_reason?: string | null;
};

type Candidate = {
  target_type: "bot" | "server";
  target_id: string;
  name: string;
  avatar: string;
};

function toTime(minute: number) {
  const m = Math.min(minute, 1439);
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function fromTime(value: string, fallback: number) {
  const [h, m] = value.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return fallback;
  return h * 60 + m;
}

function isAlways(t: Draft) {
  return t.days.length === 0 && t.start_minute === 0 && t.end_minute === 1440;
}

export function AutoVoteTab({
  userId,
  token,
}: {
  userId: string;
  token: string;
}) {
  const searchParams = useSearchParams();
  const justSubscribed = searchParams.get("subscribed") === "1";
  const timezone =
    Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const [status, setStatus] = useState<AutoVoteStatus | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [targets, setTargets] = useState<Draft[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billing, setBilling] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Candidate[]>([]);
  const [searching, setSearching] = useState(false);

  const load = useCallback(async () => {
    try {
      const s = await users.getAutoVote(userId, token);
      setStatus(s);
      setTargets(s.targets);
      setDirty(false);
      setLoadError(null);
    } catch (err) {
      setLoadError(
        err instanceof ApiError ? err.message : "Couldn't load auto-vote.",
      );
    }
  }, [userId, token]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!justSubscribed || status?.subscribed) return;
    const id = setInterval(load, 4000);
    return () => clearInterval(id);
  }, [justSubscribed, status?.subscribed, load]);

  if (loadError) return <ErrorState message={loadError} onRetry={load} />;
  if (!status) return <LoadingState label="Loading auto-vote…" />;

  const price = `$${(status.price_cents / 100).toFixed(2)}`;
  const full = targets.length >= status.max_targets;

  function update(i: number, patch: Partial<Draft>) {
    setTargets((prev) => prev.map((t, j) => (j === i ? { ...t, ...patch } : t)));
    setDirty(true);
    setSaved(false);
  }

  function remove(i: number) {
    setTargets((prev) => prev.filter((_, j) => j !== i));
    setDirty(true);
    setSaved(false);
  }

  function add(c: Candidate) {
    if (full) return;
    if (targets.some((t) => t.target_type === c.target_type && t.target_id === c.target_id)) return;
    setTargets((prev) => [
      ...prev,
      { ...c, days: [], start_minute: 0, end_minute: 1440, timezone },
    ]);
    setResults([]);
    setQuery("");
    setDirty(true);
    setSaved(false);
  }

  async function runSearch() {
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await search.search({
        query: query.trim(),
        target_types: ["bot", "server"],
      });
      setResults([
        ...(res.bots ?? []).map((b) => ({
          target_type: "bot" as const,
          target_id: b.bot_id,
          name: b.user.username,
          avatar: b.user.avatar,
        })),
        ...(res.servers ?? []).map((s) => ({
          target_type: "server" as const,
          target_id: s.server_id,
          name: s.name,
          avatar: s.avatar,
        })),
      ]);
    } catch {
      setResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function save() {
    setSaving(true);
    setError(null);
    try {
      await users.updateAutoVoteTargets(
        userId,
        targets.map((t) => ({
          target_type: t.target_type,
          target_id: t.target_id,
          days: t.days,
          start_minute: t.start_minute,
          end_minute: t.end_minute,
          timezone: t.timezone,
        })),
        token,
      );
      setSaved(true);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't save.");
    } finally {
      setSaving(false);
    }
  }

  async function openBilling(kind: "checkout" | "portal") {
    setBilling(true);
    setError(null);
    try {
      const { url } =
        kind === "checkout"
          ? await users.startAutoVoteCheckout(userId, token)
          : await users.openAutoVotePortal(userId, token);
      window.location.href = url;
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Couldn't open checkout.",
      );
      setBilling(false);
    }
  }

  return (
    <div className="space-y-4">
      {status.subscribed ? (
        <section className="flex flex-wrap items-center gap-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 sm:p-6">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400">
            <Repeat size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-zinc-950 dark:text-zinc-50">
              Auto-vote is on
            </p>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {status.current_period_end
                ? `${status.cancel_at_period_end ? "Ends" : "Renews"} ${new Date(status.current_period_end).toLocaleDateString()} · ${price}/month`
                : `${price}/month`}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            loading={billing}
            onClick={() => openBilling("portal")}
          >
            <CreditCard size={14} />
            Manage billing
          </Button>
        </section>
      ) : justSubscribed ? (
        <section className="rounded-2xl border border-accent/30 bg-accent/5 p-5 text-sm text-zinc-700 sm:p-6 dark:text-zinc-300">
          Payment received. Your subscription can take a few seconds to
          activate, and this page updates on its own.
        </section>
      ) : (
        <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <div className="p-5 sm:p-6">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-accent ring-1 ring-accent/15">
                <Repeat size={20} />
              </span>
              <div className="min-w-0">
                <h2 className="font-semibold text-zinc-950 dark:text-zinc-50">
                  Never miss a vote
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                  Auto-vote votes for up to {status.max_targets} bots or
                  servers for you as soon as your cooldown ends, always or
                  on a schedule you choose.
                </p>
              </div>
            </div>
            <ul className="mt-5 grid gap-2 text-sm text-zinc-600 sm:grid-cols-2 dark:text-zinc-300">
              {[
                "Votes count toward the listing's votes and ranking",
                "Pick up to 3 listings, each with its own schedule",
                "Skips listings whose owners turned automatic votes off",
                "Skips listings that need a captcha to vote",
              ].map((line) => (
                <li key={line} className="flex items-start gap-2">
                  <Check size={15} className="mt-0.5 shrink-0 text-accent" />
                  {line}
                </li>
              ))}
            </ul>
            <p className="mt-4 rounded-xl bg-zinc-50 px-3 py-2.5 text-xs text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
              Automatic votes don&apos;t count toward the voter leaderboard,
              voting badges like Active Voter and Top Voter, or the
              listing&apos;s vote credits. Those stay for votes you cast
              yourself.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/60 px-5 py-3 sm:px-6 dark:border-zinc-800 dark:bg-zinc-950/40">
            <span className="text-sm text-zinc-600 dark:text-zinc-300">
              <span className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                {price}
              </span>{" "}
              / month · cancel anytime
            </span>
            <Button
              variant="primary"
              size="sm"
              loading={billing}
              onClick={() => openBilling("checkout")}
            >
              Subscribe
            </Button>
          </div>
        </section>
      )}

      <SettingsCard
        title="Listings"
        description={`Up to ${status.max_targets}. Schedules use your timezone (${timezone}).${status.subscribed ? "" : " You can set these up before subscribing."}`}
        footer={
          <>
            <FormMessage error={error} success={saved ? "Saved." : null} />
            <Button
              variant="primary"
              size="sm"
              loading={saving}
              disabled={!dirty}
              onClick={save}
            >
              Save listings
            </Button>
          </>
        }
      >
        {targets.length === 0 ? (
          <p className="rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            No listings yet. Search below to add one.
          </p>
        ) : (
          <div className="space-y-3">
            {targets.map((t, i) => {
              const always = isAlways(t);
              return (
                <div
                  key={`${t.target_type}-${t.target_id}`}
                  className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <Avatar src={t.avatar} alt={t.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                        {t.name}
                      </p>
                      <p className="text-xs text-zinc-500 capitalize dark:text-zinc-400">
                        {t.target_type}
                        {t.last_voted_at &&
                          ` · last voted ${formatRelativeTime(t.last_voted_at)}`}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      aria-label={`Remove ${t.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {t.last_skip_reason && (
                    <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                      <TriangleAlert size={13} className="mt-0.5 shrink-0" />
                      {t.last_skip_reason}
                    </p>
                  )}

                  <div className="mt-3 inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-950">
                    {(["Always", "Custom"] as const).map((mode) => {
                      const active = (mode === "Always") === always;
                      return (
                        <button
                          key={mode}
                          type="button"
                          aria-pressed={active}
                          onClick={() =>
                            mode === "Always"
                              ? update(i, {
                                  days: [],
                                  start_minute: 0,
                                  end_minute: 1440,
                                })
                              : update(i, {
                                  days: [1, 2, 3, 4, 5],
                                  start_minute: 9 * 60,
                                  end_minute: 22 * 60,
                                })
                          }
                          className={[
                            "h-7 rounded-lg px-3 text-xs font-medium transition-colors",
                            active
                              ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
                          ].join(" ")}
                        >
                          {mode === "Always" ? "Whenever possible" : "On a schedule"}
                        </button>
                      );
                    })}
                  </div>

                  {!always && (
                    <div className="mt-3 space-y-3">
                      <div className="flex flex-wrap gap-1.5">
                        {DAYS.map((label, day) => {
                          const on =
                            t.days.length === 0 || t.days.includes(day);
                          return (
                            <button
                              key={label}
                              type="button"
                              aria-pressed={on}
                              onClick={() => {
                                const base =
                                  t.days.length === 0
                                    ? [0, 1, 2, 3, 4, 5, 6]
                                    : t.days;
                                const next = on
                                  ? base.filter((d) => d !== day)
                                  : [...base, day].sort();
                                update(i, {
                                  days: next.length === 7 ? [] : next,
                                });
                              }}
                              className={[
                                "h-8 w-11 rounded-lg border text-xs font-medium transition-colors",
                                on
                                  ? "border-accent/40 bg-accent/10 text-accent"
                                  : "border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-800 dark:text-zinc-400",
                              ].join(" ")}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                        Between
                        <input
                          type="time"
                          value={toTime(t.start_minute)}
                          onChange={(e) =>
                            update(i, {
                              start_minute: fromTime(
                                e.target.value,
                                t.start_minute,
                              ),
                            })
                          }
                          className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                        />
                        and
                        <input
                          type="time"
                          value={toTime(t.end_minute)}
                          onChange={(e) =>
                            update(i, {
                              end_minute: Math.max(
                                fromTime(e.target.value, t.end_minute),
                                t.start_minute + 1,
                              ),
                            })
                          }
                          className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!full && (
          <div>
            <div className="flex gap-2">
              <div className="relative min-w-0 flex-1">
                <Search
                  size={14}
                  className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-400"
                />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      runSearch();
                    }
                  }}
                  placeholder="Search bots and servers to add"
                  className="h-10 w-full rounded-xl border border-zinc-200 bg-white pr-3 pl-9 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
                />
              </div>
              <Button
                type="button"
                variant="secondary"
                loading={searching}
                onClick={runSearch}
              >
                Search
              </Button>
            </div>
            {results.length > 0 && (
              <div className="mt-2 max-h-64 space-y-1.5 overflow-y-auto">
                {results.map((r) => (
                  <button
                    key={`${r.target_type}-${r.target_id}`}
                    type="button"
                    onClick={() => add(r)}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-zinc-200 p-2.5 text-left transition-colors hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800"
                  >
                    <Avatar src={r.avatar} alt={r.name} size={28} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {r.name}
                    </span>
                    <span className="text-xs text-zinc-500 capitalize dark:text-zinc-400">
                      {r.target_type}
                    </span>
                    <Plus size={14} className="text-accent" />
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </SettingsCard>
    </div>
  );
}
