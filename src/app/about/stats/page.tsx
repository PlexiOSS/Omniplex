import {
  ArrowRight,
  BarChart3,
  Bot,
  Package,
  Server,
  ThumbsUp,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { list } from "@/lib/api";
import type { ListStats, ListTag } from "@/lib/api/types";
import { isApiUnavailable } from "@/lib/utils/errors";
import { formatCount } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Platform Stats",
  description:
    "Live numbers from Omniplex: listed bots and servers, votes, users, packs and the most used tags.",
};

const TOP_TAGS = 12;

function Tile({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Bot;
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <p className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <Icon size={13} />
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-zinc-950 dark:text-zinc-50">
        {formatCount(value)}
      </p>
      {hint && (
        <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          {hint}
        </p>
      )}
    </div>
  );
}

function StatusCard({
  title,
  icon: Icon,
  rows,
}: {
  title: string;
  icon: typeof Bot;
  rows: { label: string; value: number }[];
}) {
  const total = rows.reduce((sum, r) => sum + r.value, 0);
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          <Icon size={15} className="text-accent" />
          {title}
        </h2>
        <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
          {formatCount(total)} submitted
        </span>
      </div>
      <dl className="mt-4 space-y-3">
        {rows.map((r) => {
          const share = total > 0 ? (r.value / total) * 100 : 0;
          return (
            <div key={r.label}>
              <div className="flex items-baseline justify-between gap-2 text-sm">
                <dt className="text-zinc-600 dark:text-zinc-300">{r.label}</dt>
                <dd className="tabular-nums font-medium text-zinc-950 dark:text-zinc-50">
                  {formatCount(r.value)}
                  <span className="ml-1.5 text-xs font-normal text-zinc-500 dark:text-zinc-400">
                    {share.toFixed(0)}%
                  </span>
                </dd>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className="h-full rounded-full bg-indigo-500"
                  style={{ width: `${Math.max(share, r.value > 0 ? 1 : 0)}%` }}
                />
              </div>
            </div>
          );
        })}
      </dl>
    </section>
  );
}

function TopTags({ tags }: { tags: ListTag[] }) {
  const top = tags.slice(0, TOP_TAGS);
  const max = Math.max(1, ...top.map((t) => t.bots + t.servers));
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
          Most used tags
        </h2>
        <Link
          href="/tags"
          className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:underline"
        >
          All {formatCount(tags.length)} tags <ArrowRight size={12} />
        </Link>
      </div>
      <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
        Listed bots and servers using each tag
      </p>
      <ol className="mt-4 space-y-0.5">
        {top.map((t) => {
          const total = t.bots + t.servers;
          return (
            <li key={t.tag}>
              <Link
                href={`/tags/${encodeURIComponent(t.tag)}`}
                title={`${t.tag}: ${t.bots} bots, ${t.servers} servers`}
                className="group grid grid-cols-[7.5rem_minmax(0,1fr)_3rem] items-center gap-3 rounded-md px-1 py-1 transition-colors hover:bg-zinc-50 sm:grid-cols-[10rem_minmax(0,1fr)_3.5rem] dark:hover:bg-zinc-800/50"
              >
                <span className="truncate text-sm text-zinc-700 group-hover:text-accent dark:text-zinc-300">
                  {t.tag}
                </span>
                <span className="h-4">
                  <span
                    className="block h-full rounded-r-[4px] bg-indigo-500 transition-opacity group-hover:opacity-80"
                    style={{ width: `${(total / max) * 100}%` }}
                  />
                </span>
                <span className="text-right text-sm tabular-nums text-zinc-950 dark:text-zinc-50">
                  {formatCount(total)}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

export default async function StatsPage() {
  let stats: ListStats;
  try {
    stats = await list.getStats();
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable />;
    throw err;
  }
  const tags = await list
    .getTags()
    .then((r) => r.tags)
    .catch(() => [] as ListTag[]);

  const listedBots = stats.total_approved_bots + stats.total_certified_bots;
  const listedServers =
    stats.total_approved_servers + stats.total_certified_servers;

  return (
    <Container className="py-10">
      <PageHeader
        icon={BarChart3}
        title="Platform Stats"
        description="Live numbers from across Omniplex. They update as bots and servers are listed and votes come in."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Tile
          icon={Bot}
          label="Listed bots"
          value={listedBots}
          hint={`${formatCount(stats.total_certified_bots)} certified`}
        />
        <Tile
          icon={Server}
          label="Listed servers"
          value={listedServers}
          hint={`${formatCount(stats.total_certified_servers)} certified`}
        />
        <Tile icon={ThumbsUp} label="Votes cast" value={stats.total_votes} />
        <Tile icon={Users} label="Users" value={stats.total_users} />
        <Tile icon={Package} label="Packs" value={stats.total_packs} />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <StatusCard
          title="Bots by status"
          icon={Bot}
          rows={[
            { label: "Approved", value: stats.total_approved_bots },
            { label: "Certified", value: stats.total_certified_bots },
            { label: "In review", value: stats.total_pending_bots },
            { label: "Denied", value: stats.total_denied_bots },
          ]}
        />
        <StatusCard
          title="Servers by status"
          icon={Server}
          rows={[
            { label: "Approved", value: stats.total_approved_servers },
            { label: "Certified", value: stats.total_certified_servers },
            { label: "In review", value: stats.total_pending_servers },
            { label: "Denied", value: stats.total_denied_servers },
          ]}
        />
      </div>

      {tags.length > 0 && (
        <div className="mt-4">
          <TopTags tags={tags} />
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <Link
          href="/about/moderation"
          className="inline-flex items-center gap-1 text-accent hover:underline"
        >
          Moderation transparency <ArrowRight size={13} />
        </Link>
        <Link
          href="/leaderboard"
          className="inline-flex items-center gap-1 text-accent hover:underline"
        >
          Voter leaderboard <ArrowRight size={13} />
        </Link>
        <Link
          href="/about"
          className="inline-flex items-center gap-1 text-accent hover:underline"
        >
          About Omniplex <ArrowRight size={13} />
        </Link>
      </div>
    </Container>
  );
}
