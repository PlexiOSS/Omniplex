"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { ArcadiaError, arcadia } from "@/lib/arcadia/client";
import type { BotWhitelist } from "@/lib/arcadia/types";

interface BotWhitelistEditModalProps {
  loginToken: string;
  /** Omit for add; pass an existing entry to edit its reason. */
  entry?: BotWhitelist;
  onClose: () => void;
  onSaved: () => void;
}

export function BotWhitelistEditModal({
  loginToken,
  entry,
  onClose,
  onSaved,
}: BotWhitelistEditModalProps) {
  const isEdit = !!entry;
  const [botId, setBotId] = useState(entry?.bot_id ?? "");
  const [reason, setReason] = useState(entry?.reason ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    if (!botId.trim() || !reason.trim()) {
      setError("Bot ID and reason are required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const payload = { bot_id: botId.trim(), reason: reason.trim() };
      if (isEdit) {
        await arcadia.botWhitelist.edit(loginToken, payload);
      } else {
        await arcadia.botWhitelist.add(loginToken, payload);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ArcadiaError ? err.message : "Failed to save.");
      setSaving(false);
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? "Edit Whitelist Entry" : "Whitelist a Bot"}
    >
      <div className="space-y-4">
        <Input
          id="whitelist-bot-id"
          label="Bot ID"
          value={botId}
          onChange={(e) => setBotId(e.target.value)}
          disabled={isEdit}
          required
        />
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="whitelist-reason"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Reason
          </label>
          <textarea
            id="whitelist-reason"
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
            required
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" loading={saving} onClick={handleSave}>
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}
