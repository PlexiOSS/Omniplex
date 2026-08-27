"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { bots } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { Team } from "@/lib/api/types";

interface TransferTeamModalProps {
  botId: string;
  userId: string;
  token: string;
  /** Teams the user has "Add Bots" on, excluding the bot's current team. */
  candidates: Team[];
  onClose: () => void;
  onTransferred: () => void;
}

export function TransferTeamModal({
  botId,
  userId,
  token,
  candidates,
  onClose,
  onTransferred,
}: TransferTeamModalProps) {
  const [teamId, setTeamId] = useState(candidates[0]?.id ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!teamId) return;
    setSaving(true);
    setError(null);
    try {
      await bots.transferTeam(userId, botId, { team_id: teamId }, token);
      onTransferred();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to transfer team.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Change Team">
      {candidates.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          You don&apos;t have &quot;Add Bots&quot; permission on any other
          team to move this bot into.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="transfer-team"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Destination team
            </label>
            <select
              id="transfer-team"
              value={teamId}
              onChange={(e) => setTeamId(e.target.value)}
              className="h-10 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
            >
              {candidates.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-zinc-400 dark:text-zinc-600">
            This transfers full ownership of the bot to the selected team.
            You&apos;ll lose direct control unless you&apos;re also a member
            of that team.
          </p>

          {error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          <div className="flex items-center gap-2">
            <Button type="submit" variant="primary" size="sm" loading={saving}>
              Transfer
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
