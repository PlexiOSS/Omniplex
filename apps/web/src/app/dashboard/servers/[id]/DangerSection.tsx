"use client";

import { servers } from "@omniplex/core/api";
import { ApiError } from "@omniplex/core/api/client";
import { Button } from "@omniplex/ui/Button";
import { Input } from "@omniplex/ui/Input";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormMessage, SettingsCard } from "../../manage/ManageShell";

import type { SectionProps } from "./DetailsSection";

export function DangerSection({ server, token }: SectionProps) {
  const router = useRouter();
  const [confirm, setConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const name = server.name;

  async function remove(e: React.FormEvent) {
    e.preventDefault();
    if (confirm !== name) return;
    setDeleting(true);
    setError(null);
    try {
      await servers.deleteServer(server.server_id, token);
      router.push("/dashboard?tab=servers");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to delete the server.",
      );
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={remove}>
      <SettingsCard
        tone="danger"
        title="Delete this server"
        description="Removes the listing, its votes and reviews. Your Discord server itself isn't touched. This can't be undone."
        footer={
          <>
            <FormMessage error={error} />
            <Button
              type="submit"
              variant="danger"
              loading={deleting}
              disabled={confirm !== name}
            >
              Delete server
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
