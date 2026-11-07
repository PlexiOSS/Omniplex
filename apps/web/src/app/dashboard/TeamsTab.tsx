"use client";

import type { Team } from "@omniplex/core/api/types";
import { hasPermString } from "@omniplex/core/permissions";
import { teamAvatarUrl } from "@omniplex/core/utils/assets";
import { formatCountLabel } from "@omniplex/core/utils/format";
import { Avatar } from "@omniplex/ui/Avatar";
import { Button } from "@omniplex/ui/Button";
import { ArrowUpRight, Settings, Users } from "lucide-react";
import Link from "next/link";

export function TeamsTab({ teams, userId }: { teams: Team[]; userId: string }) {
  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {formatCountLabel(teams.length, "team")}
        </p>
        <Link href="/teams/add">
          <Button variant="secondary" size="sm">
            Create Team
          </Button>
        </Link>
      </div>

      {teams.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users size={32} className="mb-3 text-zinc-300 dark:text-zinc-700" />
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            You aren&apos;t in any teams yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {teams.map((team) => {
            const members = team.entities?.members ?? [];
            const myFlags =
              members.find((m) => m.user?.id === userId)?.flags ?? [];
            const isOwner = hasPermString(myFlags, "owner");
            return (
              <div
                key={team.id}
                className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <div className="flex items-center gap-3">
                  <Avatar
                    src={teamAvatarUrl(team.id, team.asset_versions?.avatar)}
                    alt={team.name}
                    size={40}
                  />
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/teams/${team.vanity || team.id}`}
                      className="block truncate font-semibold text-zinc-950 transition-colors hover:text-accent dark:text-zinc-50"
                    >
                      {team.name}
                    </Link>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      {isOwner ? "Owner" : "Member"}
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
                  {[
                    formatCountLabel(members.length, "member"),
                    formatCountLabel(team.entities?.bots?.length ?? 0, "bot"),
                    formatCountLabel(
                      team.entities?.servers?.length ?? 0,
                      "server",
                    ),
                  ].join(" · ")}
                </p>
                <div className="min-h-4 flex-1" />
                <div className="-mx-4 -mb-4 flex items-center justify-between gap-3 border-t border-zinc-100 bg-zinc-50/60 px-4 py-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-400">
                  <Link
                    href={`/teams/${team.vanity || team.id}`}
                    className="inline-flex items-center gap-1 transition-colors hover:text-zinc-900 dark:hover:text-zinc-50"
                  >
                    View
                    <ArrowUpRight size={11} />
                  </Link>
                  <Link
                    href={`/teams/${team.id}/settings`}
                    className="inline-flex h-7 items-center gap-1 rounded-lg px-2 font-medium transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50"
                  >
                    <Settings size={12} />
                    Settings
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
