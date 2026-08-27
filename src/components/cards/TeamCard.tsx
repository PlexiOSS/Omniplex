import Link from "next/link";
import { Avatar } from "@/components/ui/Avatar";
import type { Team } from "@/lib/api/types";
import { teamAvatarUrl } from "@/lib/utils/assets";

interface TeamCardProps {
  team: Team;
}

export function TeamCard({ team }: TeamCardProps) {
  const avatarSrc = teamAvatarUrl(team.id);
  return (
    <Link
      href={`/teams/${team.id}`}
      className="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition-all hover:border-accent/40 hover:shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:hover:border-accent/40"
    >
      <Avatar src={avatarSrc} alt={team.name} size={44} />
      <div className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-zinc-950 transition-colors group-hover:text-accent dark:text-zinc-50">
          {team.name}
        </span>
        {team.short && (
          <p className="mt-0.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
            {team.short}
          </p>
        )}
      </div>
    </Link>
  );
}
