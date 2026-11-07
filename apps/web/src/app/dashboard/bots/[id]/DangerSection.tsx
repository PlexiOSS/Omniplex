"use client";

import { bots } from "@omniplex/core/api";
import { ApiError } from "@omniplex/core/api/client";
import { Button } from "@omniplex/ui/Button";
import { Input } from "@omniplex/ui/Input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormMessage, SettingsCard } from "../../manage/ManageShell";

import type { SectionProps } from "./DetailsSection";

export function DangerSection({ bot, token }: SectionProps) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = bot.user.username;

  async function remove(e: React.FormEvent) {
    e.preventDefault();
    if (confirm !== name) return;
    setDeleting(true);
    setError(null);
    try {
      await bots.deleteBot(bot.bot_id, token);
      router.push("/dashboard?tab=bots");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to delete the bot.",
      );
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={remove}>
      <SettingsCard
        tone="danger"
        title="Delete this bot"
        description="Removes the listing, its votes, reviews, commands and changelog. This can't be undone."
        footer={
          <>
            <FormMessage error={error} />
            <Button
              type="submit"
              variant="danger"
              loading={deleting}
              disabled={confirm !== name}
            >
              Delete bot
            </Button>
          </>
        }
      >
        <Input
          id="delete-confirm"
          label={`Type ${name} to confirm`}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </SettingsCard>
    </form>
  );
}
