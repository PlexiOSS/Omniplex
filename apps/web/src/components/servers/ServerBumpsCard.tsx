import { ArrowBigUpDash } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import type { ServerBumpInfo } from "@/lib/api/types";
import { formatCount, formatRelativeTime } from "@/lib/utils/format";

interface ServerBumpsCardProps {
  info: ServerBumpInfo;
}

export function ServerBumpsCard({ info }: ServerBumpsCardProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
        <ArrowBigUpDash size={15} className="text-accent" />
        Bumps
      </h3>

      {info.bumped_at ? (
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Last bumped {formatRelativeTime(info.bumped_at)} ·{" "}
          {formatCount(info.bumps_30d)} in 30 days
        </p>
      ) : (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Not bumped yet.
        </p>
      )}

      {info.top_bumpers.length > 0 && (
        <ol className="mt-3 space-y-2">
          {info.top_bumpers.map((b, i) => (
            <li key={b.user.id} className="flex items-center gap-2.5 text-sm">
              <span className="w-4 text-xs tabular-nums text-zinc-400">
                {i + 1}
              </span>
              <Avatar src={b.user.avatar} alt={b.user.username} size={22} />
              <span className="min-w-0 flex-1 truncate text-zinc-800 dark:text-zinc-200">
                {b.user.display_name || b.user.username}
              </span>
              <span className="text-xs tabular-nums text-zinc-500 dark:text-zinc-400">
                {formatCount(b.bumps)}
              </span>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">
        Members can use{" "}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">/bump</code>{" "}
        in the server every 2 hours to move it up Recently bumped, and{" "}
        <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">/vote</code>{" "}
        to vote without leaving Discord.
      </p>
    </div>
  );
}
