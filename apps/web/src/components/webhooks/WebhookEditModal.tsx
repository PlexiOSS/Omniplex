"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { webhooks } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { Webhook, WebhookTestMeta } from "@/lib/api/types";

type TargetType = "bot" | "server" | "team";
type AuthMode = "legacy" | "simple" | "hmac";

interface WebhookEditModalProps {
  targetType: TargetType;
  targetId: string;
  authToken: string;
  testMeta: WebhookTestMeta | null;
  webhook?: Webhook;
  onClose: () => void;
  onSaved: () => void;
}

export function WebhookEditModal({
  targetType,
  targetId,
  authToken,
  testMeta,
  webhook,
  onClose,
  onSaved,
}: WebhookEditModalProps) {
  const isEdit = !!webhook;

  const [name, setName] = useState(webhook?.name ?? "");
  const [url, setUrl] = useState(webhook?.url ?? "");
  const [secret, setSecret] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>(
    webhook?.hmac_auth ? "hmac" : webhook?.simple_auth ? "simple" : "legacy",
  );
  const [eventWhitelist, setEventWhitelist] = useState<string[]>(
    webhook?.event_whitelist ?? [],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const allEvents = testMeta?.data.map((t) => t.type) ?? [];

  function toggleEvent(event: string) {
    setEventWhitelist((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event],
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required.");
      return;
    }
    if (!url.trim().startsWith("https://")) {
      setError("URL must start with https://.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        url: url.trim(),
        secret: secret.trim() || undefined,
        simple_auth: authMode === "simple",
        hmac_auth: authMode === "hmac",
        event_whitelist: eventWhitelist,
      };
      if (isEdit) {
        await webhooks.edit(targetType, targetId, webhook.id, payload, authToken);
      } else {
        await webhooks.create(targetType, targetId, payload, authToken);
      }
      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to save webhook.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title={isEdit ? "Edit Webhook" : "New Webhook"}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Name"
          placeholder="e.g. Vote Alerts"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <Input
          label="URL"
          placeholder="https://example.com/webhook"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          required
        />

        <Input
          label="Secret"
          placeholder={
            isEdit
              ? "Re-enter secret to keep it (not shown for security)"
              : "Leave blank if URL is a Discord webhook"
          }
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          type="password"
        />

        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Signing method
          </p>
          <div className="flex flex-col gap-1.5">
            {(
              [
                ["hmac", "HMAC signature (recommended)"],
                ["simple", "Simple secret header"],
                ["legacy", "Legacy encrypted"],
              ] as const
            ).map(([mode, label]) => (
              <label
                key={mode}
                className="flex items-center gap-2 cursor-pointer"
              >
                <input
                  type="radio"
                  name="auth-mode"
                  checked={authMode === mode}
                  onChange={() => setAuthMode(mode)}
                  className="h-4 w-4 accent-accent"
                />
                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>

        {allEvents.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Events{" "}
              <span className="font-normal text-zinc-400 dark:text-zinc-600">
                (none selected = all events)
              </span>
            </p>
            <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
              {allEvents.map((event) => (
                <label
                  key={event}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={eventWhitelist.includes(event)}
                    onChange={() => toggleEvent(event)}
                    className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
                  />
                  <span className="text-sm text-zinc-700 dark:text-zinc-300">
                    {event}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}

        {error && (
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        )}

        <div className="flex items-center gap-2">
          <Button type="submit" variant="primary" size="sm" loading={saving}>
            {isEdit ? "Save" : "Create"}
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
