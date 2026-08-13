"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import type { Team } from "@/lib/api/types";
import { hasPermString } from "@/lib/permissions";
import { teamAvatarUrl } from "@/lib/utils/assets";

interface TeamPickerProps {
  teams: Team[];
  currentUserId: string;
  /** The entity permission required to add this kind of entity to a team, e.g. "add_bots"/"add_servers". */
  requiredPerm: string;
  /** What's being added, for copy — "bots" or "servers". */
  entityLabel: string;
  /** "" means "create a new team for this". */
  value: string;
  onChange: (teamId: string) => void;
}

/** Teams don't have to have unique names, so rows show member/entity counts to tell same-named teams apart. */
function teamMeta(team: Team): string {
  const parts: string[] = [];
  const memberCount = team.entities?.members?.length;
  if (memberCount) parts.push(`${memberCount} member${memberCount === 1 ? "" : "s"}`);
  const botCount = team.entities?.bots?.length;
  if (botCount) parts.push(`${botCount} bot${botCount === 1 ? "" : "s"}`);
  const serverCount = team.entities?.servers?.length;
  if (serverCount) parts.push(`${serverCount} server${serverCount === 1 ? "" : "s"}`);
  return parts.join(" · ");
}

export function TeamPicker({
  teams,
  currentUserId,
  requiredPerm,
  entityLabel,
  value,
  onChange,
}: TeamPickerProps) {
  const [query, setQuery] = useState("");

  const eligible = useMemo(
    () =>
      teams
        .filter((team) => {
          const myFlags =
            team.entities?.members?.find((m) => m.user?.id === currentUserId)
              ?.flags ?? [];
          return hasPermString(myFlags, requiredPerm);
        })
        .sort((a, b) => a.name.localeCompare(b.name)),
    [teams, currentUserId, requiredPerm],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return eligible;
    const q = query.trim().toLowerCase();
    return eligible.filter(
      (team) =>
        team.name.toLowerCase().includes(q) ||
        team.short.toLowerCase().includes(q),
    );
  }, [eligible, query]);

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Team
      </p>
      <div className="space-y-2">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-200 p-3 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700">
          <input
            type="radio"
            name="team_owner"
            checked={value === ""}
            onChange={() => onChange("")}
            className="mt-0.5 h-4 w-4 accent-accent"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
              Create a new team
            </p>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              A team is created automatically, with you as its owner.
            </p>
          </div>
        </label>

        {eligible.length > 5 && (
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search your teams…"
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
          />
        )}

        <div className="max-h-80 space-y-2 overflow-y-auto">
          {filtered.map((team) => {
            const meta = teamMeta(team);
            const avatarSrc = teamAvatarUrl(team.id);
            return (
              <label
                key={team.id}
                className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 p-3 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700"
              >
                <input
                  type="radio"
                  name="team_owner"
                  checked={value === team.id}
                  onChange={() => onChange(team.id)}
                  className="h-4 w-4 accent-accent"
                />
                <Avatar src={avatarSrc} alt={team.name} size={32} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {team.name}
                  </p>
                  {(meta || team.short) && (
                    <p className="truncate text-xs text-zinc-400 dark:text-zinc-600">
                      {meta || team.short}
                    </p>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {eligible.length === 0 && (
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-600">
          None of your existing teams let you add {entityLabel} — you can
          still create a new team above, or{" "}
          <Link
            href="/dashboard?tab=teams"
            className="text-accent underline underline-offset-2"
          >
            check your teams
          </Link>
          .
        </p>
      )}

      {eligible.length > 0 && filtered.length === 0 && (
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-600">
          No teams match &quot;{query}&quot;.
        </p>
      )}
    </div>
  );
}
