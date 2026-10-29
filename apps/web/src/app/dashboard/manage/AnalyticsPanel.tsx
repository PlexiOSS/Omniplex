"use client";

import { useState } from "react";
import useSWR from "swr";
import { bots, servers } from "@/lib/api";
import type { EntityAnalytics, EntityAnalyticsDay } from "@/lib/api/types";
import { formatCount } from "@/lib/utils/format";

interface AnalyticsPanelProps {
  kind: "bot" | "server";
  id: string;
  token: string;
}

interface Series {
  label: string;
  values: (number | null)[];
  tone: "primary" | "secondary";
}

interface DailyChartProps {
  title: string;
  days: string[];
  series: Series[];
  type: "bar" | "line";
}

const RANGES = [
  { days: 7, label: "7 days" },
  { days: 30, label: "30 days" },
  { days: 90, label: "90 days" },
  { days: 365, label: "1 year" },
];

const TONE_BG = {
  primary: "bg-accent",
  secondary:
    "bg-[color-mix(in_oklab,var(--accent)_40%,white)] dark:bg-[color-mix(in_oklab,var(--accent)_45%,#18181b)]",
};

function formatDay(day: string, withYear = false) {
  return new Date(`${day}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: withYear ? "numeric" : undefined,
    timeZone: "UTC",
  });
}

function niceCeil(n: number) {
  if (n <= 0) return 1;
  const mag = 10 ** Math.floor(Math.log10(n));
  for (const m of [1, 2, 2.5, 5, 10]) {
    if (m * mag >= n) return m * mag;
  }
  return 10 * mag;
}

function sum(values: (number | null | undefined)[]) {
  return values.reduce<number>((t, v) => t + (v ?? 0), 0);
}

function change(values: (number | null | undefined)[]) {
  const known = values.filter((v): v is number => v != null);
  if (known.length < 2) return null;
  return known[known.length - 1] - known[0];
}

function signed(n: number | null) {
  if (n == null) return "Not enough data";
  return `${n > 0 ? "+" : ""}${formatCount(n)}`;
}

function DailyChart({ title, days, series, type }: DailyChartProps) {
  const [hover, setHover] = useState<number | null>(null);
  const n = days.length;

  const totals = days.map((_, i) =>
    type === "bar"
      ? sum(series.map((s) => s.values[i]))
      : (series[0].values[i] ?? null),
  );
  const known = totals.filter((v): v is number => v != null);
  const hasData = known.length > 0;

  let lo = 0;
  let hi = niceCeil(Math.max(0, ...known));
  if (type === "line" && hasData) {
    const min = Math.min(...known);
    const max = Math.max(...known);
    const pad = Math.max(1, Math.round((max - min) * 0.15));
    lo = Math.max(0, min - pad);
    hi = max + pad;
  }
  const scale = (v: number) => ((v - lo) / (hi - lo || 1)) * 100;

  const lineSegments: string[] = [];
  if (type === "line") {
    let current: string[] = [];
    series[0].values.forEach((v, i) => {
      if (v == null) {
        if (current.length) lineSegments.push(current.join(" "));
        current = [];
        return;
      }
      const x = n === 1 ? 50 : (i / (n - 1)) * 100;
      current.push(`${x},${100 - scale(v)}`);
    });
    if (current.length) lineSegments.push(current.join(" "));
  }

  const hoverX =
    hover == null
      ? 0
      : type === "line"
        ? n === 1
          ? 50
          : (hover / (n - 1)) * 100
        : ((hover + 0.5) / n) * 100;

  return (
    <div className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h4 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          {title}
        </h4>
        {series.length > 1 && (
          <ul className="flex flex-wrap gap-x-3 text-xs text-zinc-500 dark:text-zinc-400">
            {series.map((s) => (
              <li key={s.label} className="flex items-center gap-1.5">
                <span
                  className={`size-2.5 rounded-sm ${TONE_BG[s.tone]}`}
                  aria-hidden
                />
                {s.label}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-2">
        <div className="relative h-36 min-w-0 flex-1">
          {[0, 50, 100].map((p) => (
            <div
              key={p}
              className="absolute inset-x-0 border-t border-zinc-100 dark:border-zinc-800"
              style={{ bottom: `${p}%` }}
              aria-hidden
            />
          ))}

          {!hasData && (
            <p className="absolute inset-0 flex items-center justify-center text-xs text-zinc-400">
              Nothing recorded yet
            </p>
          )}

          {type === "bar" && hasData && (
            <div
              className={`absolute inset-0 flex items-end ${n <= 90 ? "gap-px sm:gap-0.5" : ""}`}
              aria-hidden
            >
              {days.map((day, i) => (
                <div
                  key={day}
                  className="flex h-full min-w-0 flex-1 flex-col-reverse gap-px"
                >
                  {series.map((s, si) => {
                    const v = s.values[i] ?? 0;
                    if (v <= 0) return null;
                    const top = series
                      .slice(si + 1)
                      .every((o) => (o.values[i] ?? 0) <= 0);
                    return (
                      <div
                        key={s.label}
                        className={`${TONE_BG[s.tone]} ${top ? "rounded-t-[3px]" : ""} ${hover != null && hover !== i ? "opacity-60" : ""} transition-opacity`}
                        style={{ height: `${scale(v)}%` }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {type === "line" && hasData && (
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full overflow-visible text-accent"
              aria-hidden
            >
              <title>{title}</title>
              {lineSegments.map((pts) => (
                <polyline
                  key={pts}
                  points={pts}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  vectorEffect="non-scaling-stroke"
                />
              ))}
            </svg>
          )}

          {hover != null && hasData && (
            <>
              <div
                className="pointer-events-none absolute inset-y-0 border-l border-zinc-300 dark:border-zinc-600"
                style={{ left: `${hoverX}%` }}
                aria-hidden
              />
              {type === "line" && series[0].values[hover] != null && (
                <div
                  className="pointer-events-none absolute size-2.5 -translate-x-1/2 translate-y-1/2 rounded-full border-2 border-white bg-accent dark:border-zinc-900"
                  style={{
                    left: `${hoverX}%`,
                    bottom: `${scale(series[0].values[hover] ?? 0)}%`,
                  }}
                  aria-hidden
                />
              )}
              <div
                aria-hidden
                className="pointer-events-none absolute bottom-full z-10 mb-2 w-max max-w-48 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
                style={{
                  left: `${hoverX}%`,
                  transform: `translateX(-${Math.min(100, Math.max(0, hoverX))}%)`,
                }}
              >
                <p className="font-medium text-zinc-950 dark:text-zinc-50">
                  {formatDay(days[hover], true)}
                </p>
                {series.map((s) => (
                  <p
                    key={s.label}
                    className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300"
                  >
                    {series.length > 1 && (
                      <span
                        className={`size-2 rounded-sm ${TONE_BG[s.tone]}`}
                        aria-hidden
                      />
                    )}
                    {s.label}:{" "}
                    <span className="tabular-nums">
                      {s.values[hover] == null
                        ? "Not recorded"
                        : formatCount(s.values[hover] ?? 0)}
                    </span>
                  </p>
                ))}
              </div>
            </>
          )}

          <div
            className="absolute inset-0"
            onPointerMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const x = (e.clientX - rect.left) / rect.width;
              setHover(
                Math.min(
                  n - 1,
                  Math.max(
                    0,
                    type === "line"
                      ? Math.round(x * (n - 1))
                      : Math.floor(x * n),
                  ),
                ),
              );
            }}
            onPointerLeave={() => setHover(null)}
            aria-hidden
          />
        </div>

        <div className="flex h-36 flex-col justify-between text-right text-[11px] tabular-nums text-zinc-400">
          <span>{hasData ? formatCount(hi) : ""}</span>
          <span>{hasData ? formatCount(Math.round((hi + lo) / 2)) : ""}</span>
          <span>{hasData ? formatCount(lo) : ""}</span>
        </div>
      </div>

      <div className="mt-1.5 flex justify-between pr-8 text-[11px] text-zinc-400">
        <span>{formatDay(days[0])}</span>
        <span>{formatDay(days[n - 1])}</span>
      </div>

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            {series.map((s) => (
              <th key={s.label} scope="col">
                {s.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {days.map((day, i) => (
            <tr key={day}>
              <th scope="row">{formatDay(day, true)}</th>
              {series.map((s) => (
                <td key={s.label}>
                  {s.values[i] == null ? "Not recorded" : s.values[i]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function pick(
  data: EntityAnalytics,
  key: keyof Omit<EntityAnalyticsDay, "day">,
) {
  return data.days.map((d) => d[key] ?? null);
}

export function AnalyticsPanel({ kind, id, token }: AnalyticsPanelProps) {
  const [days, setDays] = useState(30);
  const { data, error } = useSWR(
    ["manage/analytics", kind, id, days],
    () =>
      kind === "bot"
        ? bots.getAnalytics(id, days, token)
        : servers.getAnalytics(id, days, token),
    { keepPreviousData: true },
  );

  const dayKeys = data?.days.map((d) => d.day) ?? [];
  const votes = data ? pick(data, "votes") : [];
  const autoVotes = data ? pick(data, "auto_votes") : [];
  const manualVotes = votes.map((v, i) => (v ?? 0) - (autoVotes[i] ?? 0));
  const views = data ? pick(data, "views") : [];
  const inviteClicks = data ? pick(data, "invite_clicks") : [];
  const growth = data
    ? pick(data, kind === "bot" ? "servers" : "total_members")
    : [];
  const growthLabel = kind === "bot" ? "Servers" : "Members";

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
          Over time
        </h3>
        <fieldset
          aria-label="Time range"
          className="inline-flex rounded-lg border border-zinc-200 bg-zinc-50 p-0.5 dark:border-zinc-800 dark:bg-zinc-900"
        >
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              aria-pressed={days === r.days}
              onClick={() => setDays(r.days)}
              className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                days === r.days
                  ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              }`}
            >
              {r.label}
            </button>
          ))}
        </fieldset>
      </div>

      {error && !data && (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Couldn&apos;t load analytics.
        </p>
      )}

      {!data && !error && (
        <div className="grid gap-4 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-56 animate-pulse rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
            />
          ))}
        </div>
      )}

      {data && (
        <>
          <dl className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Votes", value: formatCount(sum(votes)) },
              { label: "Page views", value: formatCount(sum(views)) },
              { label: "Invite clicks", value: formatCount(sum(inviteClicks)) },
              { label: `${growthLabel} change`, value: signed(change(growth)) },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <dd className="text-xl font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                  {s.value}
                </dd>
                <dt className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
                  {s.label}
                </dt>
              </div>
            ))}
          </dl>

          <div className="grid gap-4 sm:grid-cols-2">
            <DailyChart
              title="Votes"
              type="bar"
              days={dayKeys}
              series={[
                { label: "Manual", values: manualVotes, tone: "primary" },
                { label: "Automatic", values: autoVotes, tone: "secondary" },
              ]}
            />
            <DailyChart
              title="Page views"
              type="bar"
              days={dayKeys}
              series={[{ label: "Views", values: views, tone: "primary" }]}
            />
            <DailyChart
              title="Invite clicks"
              type="bar"
              days={dayKeys}
              series={[
                {
                  label: "Invite clicks",
                  values: inviteClicks,
                  tone: "primary",
                },
              ]}
            />
            <DailyChart
              title={growthLabel}
              type="line"
              days={dayKeys}
              series={[{ label: growthLabel, values: growth, tone: "primary" }]}
            />
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Days are in UTC. Votes include every day in the range.{" "}
            {data.tracked_since
              ? `Page views, invite clicks and ${growthLabel.toLowerCase()} have been recorded daily since ${formatDay(data.tracked_since, true)}.`
              : `Page views, invite clicks and ${growthLabel.toLowerCase()} are recorded once a day, so they'll start showing here within a day.`}
          </p>
        </>
      )}
    </section>
  );
}
