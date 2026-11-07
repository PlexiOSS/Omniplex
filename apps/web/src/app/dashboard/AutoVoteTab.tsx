"use client";

import { search, users } from "@omniplex/core/api";
import { ApiError } from "@omniplex/core/api/client";
import type {
  AutoVoteNotify,
  AutoVoteStatus,
  AutoVoteTarget,
} from "@omniplex/core/api/types";
import { isAlways, voteStatus } from "@omniplex/core/autoVote";
import { formatRelativeTime } from "@omniplex/core/utils/format";
import { Avatar } from "@omniplex/ui/Avatar";
import { Button } from "@omniplex/ui/Button";
import {
  Bell,
  Clock,
  CreditCard,
  Pause,
  Play,
  Plus,
  Repeat,
  Search,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { AutoVoteSubscribe } from "@/components/billing/AutoVoteSubscribe";
import { ErrorState, LoadingState } from "@/components/ui/PageStates";
import { AutoVoteSlotsCard } from "./AutoVoteSlotsCard";
import { FormMessage, SettingsCard } from "./manage/ManageShell";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Draft = Omit<
  AutoVoteTarget,
  "last_voted_at" | "last_skip_reason" | "cooldown_until" | "in_schedule"
> & {
  last_voted_at?: string | null;
  last_skip_reason?: string | null;
  cooldown_until?: string | null;
  in_schedule?: boolean;
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

export function AutoVoteTab({
  userId,
  token,
}: {
  userId: string;
  token: string;
}) {
  const searchParams = useSearchParams();
  const justSubscribed = searchParams.get("subscribed") === "1";
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  const [status, setStatus] = useState<AutoVoteStatus | null>(null);
  const [savingNotify, setSavingNotify] = useState(false);
  const [notifyError, setNotifyError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [targets, setTargets] = useState<Draft[]>([]);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [billing, setBilling] = useState(false);
  const [billingError, setBillingError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Candidate[]>([]);
  const [searching, setSearching] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

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

  const refresh = useCallback(async () => {
    setNow(Date.now());
    try {
      const s = await users.getAutoVote(userId, token);
      setStatus(s);
      if (!dirtyRef.current) setTargets(s.targets);
    } catch {
      return;
    }
  }, [userId, token]);

  useEffect(() => {
    if (!justSubscribed || status?.subscribed) return;
    const id = setInterval(refresh, 4000);
    return () => clearInterval(id);
  }, [justSubscribed, status?.subscribed, refresh]);

  useEffect(() => {
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    const id = setInterval(onVisible, 60000);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  if (loadError) return <ErrorState message={loadError} onRetry={load} />;
  if (!status) return <LoadingState label="Loading auto-vote…" />;

  const full = targets.length >= status.max_targets;

  function update(i: number, patch: Partial<Draft>) {
    setTargets((prev) =>
      prev.map((t, j) => (j === i ? { ...t, ...patch } : t)),
    );
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
    if (
      targets.some(
        (t) => t.target_type === c.target_type && t.target_id === c.target_id,
      )
    )
      return;
    setTargets((prev) => [
      ...prev,
      {
        ...c,
        days: [],
        start_minute: 0,
        end_minute: 1440,
        timezone,
        paused: false,
      },
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

  async function saveNotify(notify: AutoVoteNotify) {
    if (!status || status.notify === notify) return;
    setSavingNotify(true);
    setNotifyError(null);
    try {
      await users.updateAutoVoteTargets(
        userId,
        status.targets.map((t) => ({
          target_type: t.target_type,
          target_id: t.target_id,
          days: t.days,
          start_minute: t.start_minute,
          end_minute: t.end_minute,
          timezone: t.timezone,
          paused: t.paused,
        })),
        token,
        { notify },
      );
      setStatus({ ...status, notify });
    } catch (err) {
      setNotifyError(
        err instanceof ApiError ? err.message : "Couldn't save that.",
      );
    } finally {
      setSavingNotify(false);
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
          paused: !!t.paused,
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

  async function openBilling() {
    setBilling(true);
    setBillingError(null);
    try {
      const { url } = await users.openAutoVotePortal(userId, token);
      window.location.href = url;
    } catch (err) {
      setBillingError(
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
                ? `${status.cancel_at_period_end ? "Ends" : "Renews"} ${new Date(status.current_period_end).toLocaleDateString()}`
                : "Active"}
            </p>
          </div>
          <Button
            variant="secondary"
            size="sm"
            loading={billing}
            onClick={openBilling}
          >
            <CreditCard size={14} />
            Manage billing
          </Button>
          {billingError && (
            <p className="w-full text-xs text-red-600 dark:text-red-400">
              {billingError}
            </p>
          )}
        </section>
      ) : justSubscribed ? (
        <section className="rounded-2xl border border-accent/30 bg-accent/5 p-5 text-sm text-zinc-700 sm:p-6 dark:text-zinc-300">
          Payment received. Your subscription can take a few seconds to
          activate, and this page updates on its own.
        </section>
      ) : (
        <AutoVoteSubscribe
          priceCents={status.price_cents}
          yearlyPriceCents={status.yearly_price_cents}
          includedSlots={status.max_targets - status.booster_slots}
          slotPriceCents={status.slot_price_cents}
          userId={userId}
          token={token}
          initialPromo={searchParams.get("promo")}
        />
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
                      onClick={() => update(i, { paused: !t.paused })}
                      aria-label={
                        t.paused ? `Resume ${t.name}` : `Pause ${t.name}`
                      }
                      title={t.paused ? "Resume" : "Pause"}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                    >
                      {t.paused ? <Play size={14} /> : <Pause size={14} />}
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(i)}
                      aria-label={`Remove ${t.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-red-600 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  {t.paused ? (
                    <p className="mt-3 flex items-start gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
                      <Pause size={13} className="mt-0.5 shrink-0" />
                      Paused. Auto-vote won't vote for this listing until you
                      resume it.
                    </p>
                  ) : (
                    !dirty &&
                    !t.last_skip_reason && (
                      <p className="mt-3 flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                        <Clock size={13} className="mt-0.5 shrink-0" />
                        {voteStatus(t, status.subscribed, now)}
                      </p>
                    )
                  )}

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
                                  days: [],
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
                          {mode === "Always"
                            ? "Whenever possible"
                            : "On a schedule"}
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

        {full && status.subscribed && (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            All {status.max_targets} slots are in use.
            {status.extra_slots < status.max_extra_slots &&
              " Add more under Listing slots below."}
          </p>
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

      {status.subscribed && (
        <AutoVoteSlotsCard
          status={status}
          userId={userId}
          token={token}
          inUse={targets.length}
          onChanged={load}
        />
      )}

      <SettingsCard
        title="Notifications"
        description="How you hear about the votes Auto-vote casts for you. Skipped votes always get a notification."
      >
        <div className="grid gap-2 sm:grid-cols-3">
          {(
            [
              ["off", "Off", "No notification for votes that go through."],
              [
                "daily",
                "Daily summary",
                "One notification a day with what was voted for.",
              ],
              [
                "each",
                "Every vote",
                "A notification each time Auto-vote votes.",
              ],
            ] as const
          ).map(([value, title, body]) => {
            const active = status.notify === value;
            return (
              <button
                key={value}
                type="button"
                aria-pressed={active}
                disabled={savingNotify}
                onClick={() => saveNotify(value)}
                className={[
                  "flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-colors disabled:opacity-60",
                  active
                    ? "border-accent/50 bg-accent/5"
                    : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700",
                ].join(" ")}
              >
                <span className="flex items-center gap-1.5 text-sm font-medium text-zinc-950 dark:text-zinc-50">
                  {value !== "off" && (
                    <Bell size={13} className="text-accent" />
                  )}
                  {title}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {body}
                </span>
              </button>
            );
          })}
        </div>
        {notifyError && (
          <p className="mt-2 text-xs text-red-600 dark:text-red-400">
            {notifyError}
          </p>
        )}
      </SettingsCard>
    </div>
  );
}
