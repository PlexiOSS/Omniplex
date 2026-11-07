"use client";

import { bots } from "@omniplex/core/api";
import { ApiError } from "@omniplex/core/api/client";
import { hasPermString } from "@omniplex/core/permissions";
import { Button } from "@omniplex/ui/Button";
import Link from "next/link";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useMe } from "@/hooks/useMe";
import { FormMessage, SettingsCard } from "../../manage/ManageShell";

import type { SectionProps } from "./DetailsSection";

export function TeamSection({ bot, userId, token, onSaved }: SectionProps) {
  const { session } = useAuth();
  const { me } = useMe(session);
  const currentTeamId = bot.team_owner?.id;
  const candidates = (me?.user_teams ?? []).filter((t) => {
    if (t.id === currentTeamId) return false;
    const flags =
      t.entities?.members?.find((m) => m.user?.id === userId)?.flags ?? [];
    return hasPermString(flags, "add_bots");
  });
  const [teamId, setTeamId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function transfer(e: React.FormEvent) {
    e.preventDefault();
    const target = teamId || candidates[0]?.id;
    if (!target) return;
    setSaving(true);
    setError(null);
    try {
      await bots.transferTeam(userId, bot.bot_id, { team_id: target }, token);
      setDone(true);
      onSaved();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to transfer the bot.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <SettingsCard title="Current owner">
        <p className="text-sm text-zinc-700 dark:text-zinc-300">
          {bot.team_owner ? (
            <>
              Owned by the team{" "}
              <Link
                href={`/teams/${bot.team_owner.id}`}
                className="font-medium text-accent hover:underline"
              >
                {bot.team_owner.name}
              </Link>
              . Members&apos; permissions are managed in the team&apos;s
              settings.
            </>
          ) : (
            "Owned directly by you."
          )}
        </p>
      </SettingsCard>

      <form onSubmit={transfer}>
        <SettingsCard
          title="Move to a team"
          description="Transfers full ownership of this bot to a team. You'll lose direct control unless you're also a member of that team."
          footer={
            candidates.length > 0 ? (
              <>
                <FormMessage
                  error={error}
                  success={done ? "Bot transferred." : null}
                />
                <Button type="submit" variant="primary" loading={saving}>
                  Transfer
                </Button>
              </>
            ) : undefined
          }
        >
          {candidates.length === 0 ? (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              You don&apos;t have the Add Bots permission on any other team.{" "}
              <Link href="/teams/add" className="text-accent hover:underline">
                Create a team
              </Link>{" "}
              first.
            </p>
          ) : (
            <select
              aria-label="Destination team"
              value={teamId || candidates[0]?.id}
              onChange={(e) => setTeamId(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50"
            >
              {candidates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          )}
        </SettingsCard>
      </form>
    </div>
  );
}
