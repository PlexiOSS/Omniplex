"use client";

import type { StatsHistory } from "@omniplex/core/api/types";
import { formatCount } from "@omniplex/core/utils/format";
import { useState } from "react";
import { formatMonth, MonthlyChart } from "./MonthlyChart";

const RANGES = [
  { key: "all", label: "All time", months: 0 },
  { key: "2y", label: "2 years", months: 24 },
  { key: "1y", label: "12 months", months: 12 },
] as const;

type Range = (typeof RANGES)[number]["key"];

function firstRecorded<T>(months: T[], pick: (m: T) => number | null) {
  const i = months.findIndex((m) => pick(m) != null);
  return i < 0 ? months.length : i;
}

function Card({
  title,
  facts,
  note,
  children,
}: {
  title: string;
  facts: { label: string; value: string }[];
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="min-w-0 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        {title}
      </h3>
      <dl className="mt-3 mb-4 flex flex-wrap gap-x-6 gap-y-2">
        {facts.map((f) => (
          <div key={f.label}>
            <dt className="text-xs text-zinc-500 dark:text-zinc-400">
              {f.label}
            </dt>
            <dd className="text-lg font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
              {f.value}
            </dd>
          </div>
        ))}
      </dl>
      {children}
      {note && (
        <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">{note}</p>
      )}
    </section>
  );
}

export function StatsHistorySection({ history }: { history: StatsHistory }) {
  const [range, setRange] = useState<Range>("all");

  const months = history.months;
  const span = RANGES.find((r) => r.key === range)?.months ?? 0;
  const slice = (from: number) =>
    months.slice(span ? Math.max(from, months.length - span) : from);
  const votesFrom = firstRecorded(months, (m) => m.votes);
  const reviewsFrom = firstRecorded(months, (m) => m.approved);
  const usersFrom = firstRecorded(months, (m) => m.new_users);
  const listingsFrom = Math.max(
    0,
    months.findIndex((m) => m.new_bots > 0 || m.new_servers > 0),
  );

  const votes = slice(votesFrom);
  const reviews = slice(reviewsFrom);
  const listings = slice(listingsFrom);
  const users = slice(usersFrom);

  const decided = history.approvals + history.denials;
  const rate = decided ? Math.round((history.approvals / decided) * 100) : 0;
  const since = (iso: string | null) =>
    iso ? formatMonth(iso.slice(0, 7)) : "";

  return (
    <section className="mt-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
            Over time
          </h2>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Month by month, as far back as our records go.
          </p>
        </div>
        <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-1 dark:border-zinc-800 dark:bg-zinc-950">
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              aria-pressed={range === r.key}
              onClick={() => setRange(r.key)}
              className={[
                "h-7 rounded-lg px-3 text-xs font-medium transition-colors",
                range === r.key
                  ? "bg-white text-zinc-950 shadow-sm dark:bg-zinc-800 dark:text-zinc-50"
                  : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100",
              ].join(" ")}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card
          title="Votes"
          facts={[
            { label: "All time", value: formatCount(history.votes_all_time) },
            {
              label: "This month",
              value: formatCount(history.votes_this_month),
            },
            {
              label: "People who've voted",
              value: formatCount(history.voters_all_time),
            },
          ]}
          note={`Since ${since(history.votes_since)}. Votes reset each month for the rankings, but every vote is kept here.`}
        >
          <MonthlyChart
            title="Votes each month"
            months={votes.map((m) => m.month)}
            series={[
              {
                label: "Votes",
                tone: "primary",
                values: votes.map((m) => m.votes),
              },
            ]}
          />
        </Card>

        <Card
          title="Reviews"
          facts={[
            { label: "Approved", value: formatCount(history.approvals) },
            { label: "Denied", value: formatCount(history.denials) },
            { label: "Approval rate", value: `${rate}%` },
          ]}
          note={`Since ${since(history.reviews_since)}, when we started keeping review records.`}
        >
          <MonthlyChart
            title="Reviews each month"
            months={reviews.map((m) => m.month)}
            series={[
              {
                label: "Approved",
                tone: "primary",
                values: reviews.map((m) => m.approved),
              },
              {
                label: "Denied",
                tone: "secondary",
                values: reviews.map((m) => m.denied),
              },
            ]}
          />
        </Card>

        <Card
          title="New listings"
          facts={[
            {
              label: "Bots submitted",
              value: formatCount(sumOf(months, (m) => m.new_bots)),
            },
            {
              label: "Servers added",
              value: formatCount(sumOf(months, (m) => m.new_servers)),
            },
          ]}
        >
          <MonthlyChart
            title="New listings each month"
            months={listings.map((m) => m.month)}
            series={[
              {
                label: "Bots",
                tone: "primary",
                values: listings.map((m) => m.new_bots),
              },
              {
                label: "Servers",
                tone: "secondary",
                values: listings.map((m) => m.new_servers),
              },
            ]}
          />
        </Card>

        <Card
          title="New members"
          facts={[
            {
              label: "Signed up",
              value: formatCount(sumOf(months, (m) => m.new_users ?? 0)),
            },
          ]}
          note={
            users.length
              ? `Since ${formatMonth(users[0].month)}, when we started recording sign-up dates.`
              : undefined
          }
        >
          <MonthlyChart
            title="New members each month"
            months={users.map((m) => m.month)}
            series={[
              {
                label: "Sign-ups",
                tone: "primary",
                values: users.map((m) => m.new_users),
              },
            ]}
          />
        </Card>
      </div>
    </section>
  );
}

function sumOf<T>(items: T[], pick: (item: T) => number) {
  return items.reduce((t, i) => t + pick(i), 0);
}
