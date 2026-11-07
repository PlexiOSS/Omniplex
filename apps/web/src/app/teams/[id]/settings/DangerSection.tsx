"use client";

import { teams } from "@omniplex/core/api";
import { ApiError } from "@omniplex/core/api/client";
import type { Team } from "@omniplex/core/api/types";
import { Button } from "@omniplex/ui/Button";
import { Input } from "@omniplex/ui/Input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormMessage, SettingsCard } from "@/app/dashboard/manage/ManageShell";

export function DangerSection({ team, token }: { team: Team; token: string }) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove(e: React.FormEvent) {
    e.preventDefault();
    if (confirm !== team.name) return;
    setDeleting(true);
    setError(null);
    try {
      await teams.deleteTeam(team.id, token);
      router.push("/dashboard?tab=teams");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to delete the team.",
      );
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={remove}>
      <SettingsCard
        tone="danger"
        title="Delete this team"
        description={`Permanently deletes ${team.name}. Bots and servers owned by this team will be affected. This can't be undone.`}
        footer={
          <>
            <FormMessage error={error} />
            <Button
              type="submit"
              variant="danger"
              loading={deleting}
              disabled={confirm !== team.name}
            >
              Delete team
            </Button>
          </>
        }
      >
        <Input
          id="delete-confirm"
          label={`Type ${team.name} to confirm`}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </SettingsCard>
    </form>
  );
}
