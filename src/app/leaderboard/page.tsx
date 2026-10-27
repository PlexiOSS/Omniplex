import { Trophy } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { Avatar } from "@/components/ui/Avatar";
import { votes } from "@/lib/api";
import type {
  VoterLeaderboardEntry,
  VoterLeaderboardFavorite,
  VoterLeaderboardPeriod,
} from "@/lib/api/types";
import { botPath, mirroredAvatarUrl, serverPath } from "@/lib/utils/assets";
import { isApiUnavailable } from "@/lib/utils/errors";
import { formatCount } from "@/lib/utils/format";
import { YourRank } from "./YourRank";

export const metadata: Metadata = {
  title: "Voter Leaderboard",
  description:
    "The most active voters on Omniplex, this month and of all time.",
};

interface Props {
  searchParams: Promise<{ period?: string }>;
}

const LIMIT = 50;

const PERIODS: { value: VoterLeaderboardPeriod; label: string }[] = [
  { value: "month", label: "This month" },
  { value: "all", label: "All time" },
];

const PODIUM_STYLES = [
  {
    badge: "bg-yellow-400/15 text-yellow-600 dark:text-yellow-400",
    ring: "border-yellow-400/40 dark:border-yellow-400/30",
  },
  {
    badge: "bg-zinc-300/25 text-zinc-600 dark:text-zinc-300",
    ring: "border-zinc-300 dark:border-zinc-600",
  },
  {
    badge: "bg-orange-400/15 text-orange-600 dark:text-orange-400",
    ring: "border-orange-400/40 dark:border-orange-400/30",
  },
];

function displayName(entry: VoterLeaderboardEntry) {
  return entry.user.display_name || entry.user.username;
}

function voteLabel(n: number) {
  return `${formatCount(n)} ${n === 1 ? "vote" : "votes"}`;
}

function breakdown(entry: VoterLeaderboardEntry) {
  const parts: string[] = [];
  if (entry.bot_votes)
    parts.push(
      `${formatCount(entry.bot_votes)} ${entry.bot_votes === 1 ? "bot" : "bots"}`,
    );
  if (entry.server_votes)
    parts.push(
      `${formatCount(entry.server_votes)} ${entry.server_votes === 1 ? "server" : "servers"}`,
    );
  if (entry.other_votes) parts.push(`${formatCount(entry.other_votes)} other`);
  return parts.length > 1 ? parts.join(" · ") : null;
}

function FavoriteLink({ favorite }: { favorite: VoterLeaderboardFavorite }) {
  const isBot = favorite.target_type === "bot";
  const href = isBot
    ? botPath(favorite.target_id, favorite.vanity)
    : serverPath(favorite.target_id, favorite.vanity);
  const src = mirroredAvatarUrl(
    isBot ? "bots" : "servers",
    favorite.target_id,
    favorite.avatar,
  );

  return (
    <Link
      href={href}
      className="inline-flex min-w-0 max-w-full items-center gap-1.5 text-xs text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
    >
      <span className="shrink-0">Mostly votes for</span>
      <Avatar src={src} alt={favorite.name} size={16} />
      <span className="truncate font-medium text-zinc-700 dark:text-zinc-300">
        {favorite.name}
      </span>
    </Link>
  );
}

function PodiumCard({ entry }: { entry: VoterLeaderboardEntry }) {
  const style = PODIUM_STYLES[entry.rank - 1];

  return (
    <div
      className={[
        "flex min-w-0 flex-col items-center rounded-xl border bg-white p-5 text-center dark:bg-zinc-900",
        style.ring,
      ].join(" ")}
    >
      <span
        className={[
          "mb-3 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold",
          style.badge,
        ].join(" ")}
      >
        {entry.rank}
      </span>
      <Link
        href={`/user/${entry.user.id}`}
        className="flex min-w-0 max-w-full flex-col items-center gap-2"
      >
        <Avatar
          src={mirroredAvatarUrl("users", entry.user.id, entry.user.avatar)}
          alt={displayName(entry)}
          size={64}
        />
        <span className="max-w-full truncate text-sm font-semibold text-zinc-950 hover:text-accent dark:text-zinc-50">
          {displayName(entry)}
        </span>
      </Link>
      <span className="mt-1 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
        {voteLabel(entry.votes)}
      </span>
      {breakdown(entry) && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {breakdown(entry)}
        </span>
      )}
      {entry.favorite && (
        <div className="mt-3 flex max-w-full justify-center">
          <FavoriteLink favorite={entry.favorite} />
        </div>
      )}
    </div>
  );
}

function LeaderboardRow({ entry }: { entry: VoterLeaderboardEntry }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
        {entry.rank}
      </span>
      <Link href={`/user/${entry.user.id}`} className="shrink-0">
        <Avatar
          src={mirroredAvatarUrl("users", entry.user.id, entry.user.avatar)}
          alt={displayName(entry)}
          size={36}
        />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <Link
          href={`/user/${entry.user.id}`}
          className="truncate text-sm font-medium text-zinc-950 transition-colors hover:text-accent dark:text-zinc-50"
        >
          {displayName(entry)}
        </Link>
        {entry.favorite && (
          <div className="flex min-w-0">
            <FavoriteLink favorite={entry.favorite} />
          </div>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end">
        <span className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {voteLabel(entry.votes)}
        </span>
        {breakdown(entry) && (
          <span className="hidden text-xs text-zinc-500 sm:block dark:text-zinc-400">
            {breakdown(entry)}
          </span>
        )}
      </div>
    </div>
  );
}

export default async function LeaderboardPage({ searchParams }: Props) {
  const { period: rawPeriod } = await searchParams;
  const period: VoterLeaderboardPeriod = rawPeriod === "all" ? "all" : "month";

  let entries: VoterLeaderboardEntry[];
  try {
    entries = (await votes.getLeaderboard(LIMIT, period)).map((e, i) => ({
      ...e,
      rank: e.rank || i + 1,
    }));
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable inline />;
    throw err;
  }

  const podium = entries.filter((e) => e.rank <= 3);
  const rest = entries.filter((e) => e.rank > 3);

  return (
    <Container className="py-10">
      <PageHeader
        centered
        icon={Trophy}
        title="Voter Leaderboard"
        description={
          <>
            {period === "month"
              ? "The most active voters since the last monthly vote reset."
              : "The most active voters on Omniplex of all time."}{" "}
            Upvotes for bots, servers, teams and packs all count.
          </>
        }
      />

      <div className="mx-auto max-w-3xl">
        <div className="mb-6 flex justify-center">
          <div className="inline-flex rounded-lg border border-zinc-200 p-1 dark:border-zinc-800">
            {PERIODS.map((p) => (
              <Link
                key={p.value}
                href={
                  p.value === "month"
                    ? "/leaderboard"
                    : "/leaderboard?period=all"
                }
                scroll={false}
                className={[
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  p.value === period
                    ? "bg-accent/10 text-accent"
                    : "text-zinc-500 hover:text-zinc-950 dark:text-zinc-400 dark:hover:text-zinc-50",
                ].join(" ")}
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>

        <YourRank period={period} />

        {entries.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 px-4 py-16 text-center dark:border-zinc-800">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              {period === "month"
                ? "No votes yet this month. Be the first."
                : "No votes cast yet."}
            </p>
            <Link
              href="/bots"
              className="mt-3 inline-block text-sm font-medium text-accent hover:underline"
            >
              Browse bots
            </Link>
          </div>
        ) : (
          <>
            {podium.length > 0 && (
              <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                {podium.map((entry) => (
                  <PodiumCard key={entry.user.id} entry={entry} />
                ))}
              </div>
            )}
            {rest.length > 0 && (
              <div className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
                {rest.map((entry) => (
                  <LeaderboardRow key={entry.user.id} entry={entry} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Container>
  );
}
