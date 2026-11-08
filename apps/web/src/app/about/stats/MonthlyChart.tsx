"use client";

import { formatCount } from "@omniplex/core/utils/format";
import { useState } from "react";

export interface MonthlySeries {
  label: string;
  tone: "primary" | "secondary";
  values: (number | null)[];
}

const TONE_BG = {
  primary: "bg-accent",
  secondary:
    "bg-[color-mix(in_oklab,var(--accent)_40%,white)] dark:bg-[color-mix(in_oklab,var(--accent)_45%,#18181b)]",
};

export function formatMonth(month: string, short = false) {
  const [y, m] = month.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, 1)).toLocaleDateString(undefined, {
    month: short ? "short" : "long",
    year: "numeric",
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

export function MonthlyChart({
  title,
  months,
  series,
}: {
  title: string;
  months: string[];
  series: MonthlySeries[];
}) {
  const [hover, setHover] = useState<number | null>(null);
  const n = months.length;
  const totals = months.map((_, i) =>
    series.every((s) => s.values[i] == null)
      ? null
      : series.reduce((t, s) => t + (s.values[i] ?? 0), 0),
  );
  const known = totals.filter((v): v is number => v != null);
  const hasData = known.some((v) => v > 0);
  const hi = niceCeil(Math.max(0, ...known));
  const scale = (v: number) => (v / hi) * 100;
  const years = months
    .map((m, i) => ({ m, i }))
    .filter(({ m, i }) => m.endsWith("-01") && i > 0);
  const hoverX = hover == null ? 0 : ((hover + 0.5) / n) * 100;

  return (
    <div className="min-w-0">
      {series.length > 1 && (
        <ul className="mb-3 flex flex-wrap gap-x-3 text-xs text-zinc-500 dark:text-zinc-400">
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

      <div className="flex gap-2">
        <div className="relative h-40 min-w-0 flex-1">
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

          {hasData && (
            <div className="absolute inset-0 flex items-end" aria-hidden>
              {months.map((month, i) => (
                <div
                  key={month}
                  className={`flex h-full min-w-0 flex-1 flex-col-reverse gap-px ${n <= 40 ? "px-px" : ""}`}
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
                        className={`${TONE_BG[s.tone]} ${top ? "rounded-t-[2px]" : ""} ${hover != null && hover !== i ? "opacity-60" : ""} transition-opacity`}
                        style={{ height: `${scale(v)}%` }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          )}

          {hover != null && hasData && (
            <>
              <div
                className="pointer-events-none absolute inset-y-0 border-l border-zinc-300 dark:border-zinc-600"
                style={{ left: `${hoverX}%` }}
                aria-hidden
              />
              <div
                aria-hidden
                className="pointer-events-none absolute bottom-full z-10 mb-2 w-max max-w-52 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs shadow-sm dark:border-zinc-700 dark:bg-zinc-900"
                style={{
                  left: `${hoverX}%`,
                  transform: `translateX(-${Math.min(100, Math.max(0, hoverX))}%)`,
                }}
              >
                <p className="font-medium text-zinc-950 dark:text-zinc-50">
                  {formatMonth(months[hover])}
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
              setHover(Math.min(n - 1, Math.max(0, Math.floor(x * n))));
            }}
            onPointerLeave={() => setHover(null)}
            aria-hidden
          />
        </div>

        <div className="flex h-40 flex-col justify-between text-right text-[11px] tabular-nums text-zinc-400">
          <span>{hasData ? formatCount(hi) : ""}</span>
          <span>{hasData ? formatCount(Math.round(hi / 2)) : ""}</span>
          <span>{hasData ? "0" : ""}</span>
        </div>
      </div>

      <div className="relative mt-1.5 mr-8 h-4 text-[11px] text-zinc-400">
        {years.length > 0 && years.length <= 8 ? (
          years.map(({ m, i }) => (
            <span
              key={m}
              className="absolute -translate-x-1/2"
              style={{ left: `${(i / n) * 100}%` }}
            >
              {m.slice(0, 4)}
            </span>
          ))
        ) : (
          <>
            <span className="absolute left-0">
              {formatMonth(months[0], true)}
            </span>
            <span className="absolute right-0">
              {formatMonth(months[n - 1], true)}
            </span>
          </>
        )}
      </div>

      <div className="sr-only">
        <table>
          <caption>{title}</caption>
          <thead>
            <tr>
              <th scope="col">Month</th>
              {series.map((s) => (
                <th key={s.label} scope="col">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {months.map((m, i) => (
              <tr key={m}>
                <th scope="row">{formatMonth(m)}</th>
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
    </div>
  );
}
