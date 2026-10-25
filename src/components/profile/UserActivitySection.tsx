import { MessageSquare, ThumbsUp, Trophy } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { StarRating } from "@/components/reviews/StarRating";
import { Avatar } from "@/components/ui/Avatar";
import type { UserActivity, VoterLeaderboardFavorite } from "@/lib/api/types";
import { botPath, mirroredAvatarUrl, serverPath } from "@/lib/utils/assets";
import {
  formatCount,
  formatCountLabel,
  formatRelativeTime,
} from "@/lib/utils/format";

interface UserActivitySectionProps {
  activity: UserActivity;
}

function targetHref(target: VoterLeaderboardFavorite) {
  return target.target_type === "bot"
    ? botPath(target.target_id, target.vanity)
    : serverPath(target.target_id, target.vanity);
}

function targetAvatar(target: VoterLeaderboardFavorite) {
  return mirroredAvatarUrl(
    target.target_type === "bot" ? "bots" : "servers",
    target.target_id,
    target.avatar,
  );
}

export function hasUserActivity(activity: UserActivity | null): boolean {
  return (
    !!activity && (activity.top_voted.length > 0 || activity.reviews.length > 0)
  );
}

export function VoterRankLine({ activity }: UserActivitySectionProps) {
  if (activity.all_time.rank === 0) return null;
  const { month, all_time: allTime } = activity;

  return (
    <Link
      href="/leaderboard"
      className="mt-3 inline-flex flex-wrap items-center gap-x-1.5 text-sm text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
    >
      <Trophy size={13} className="text-accent" />
      {month.rank > 0 && (
        <>
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            #{formatCount(month.rank)}
          </span>
          this month ({formatCountLabel(month.votes, "vote")}) ·
        </>
      )}
      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
        #{formatCount(allTime.rank)}
      </span>
      all time ({formatCountLabel(allTime.votes, "vote")})
    </Link>
  );
}

function Heading({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <h3 className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-950 dark:text-zinc-50">
      <span className="text-accent">{icon}</span>
      {children}
    </h3>
  );
}

export function UserActivityPanel({ activity }: UserActivitySectionProps) {
  return (
    <div className="grid gap-8 md:grid-cols-2">
      {activity.top_voted.length > 0 && (
        <div className="min-w-0">
          <Heading icon={<ThumbsUp size={14} />}>Votes for most</Heading>
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {activity.top_voted.map((target) => (
              <li key={`${target.target_type}-${target.target_id}`}>
                <Link
                  href={targetHref(target)}
                  className="group flex min-w-0 items-center gap-3 px-4 py-2.5"
                >
                  <Avatar
                    src={targetAvatar(target)}
                    alt={target.name}
                    size={28}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800 transition-colors group-hover:text-accent dark:text-zinc-200">
                    {target.name}
                  </span>
                  <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
                    {formatCountLabel(target.votes, "vote")}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activity.reviews.length > 0 && (
        <div className="min-w-0">
          <Heading icon={<MessageSquare size={14} />}>Recent reviews</Heading>
          <ul className="divide-y divide-zinc-200 rounded-xl border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
            {activity.reviews.map((review) => (
              <li key={review.id} className="min-w-0 px-4 py-3">
                <Link
                  href={`${targetHref(review.target)}?tab=reviews&review=${review.id}`}
                  className="group flex min-w-0 items-center gap-2"
                >
                  <Avatar
                    src={targetAvatar(review.target)}
                    alt={review.target.name}
                    size={20}
                  />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800 transition-colors group-hover:text-accent dark:text-zinc-200">
                    {review.target.name}
                  </span>
                  <StarRating value={review.stars} size={12} />
                </Link>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                  {review.content}
                </p>
                <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-500">
                  {formatRelativeTime(review.created_at)}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
