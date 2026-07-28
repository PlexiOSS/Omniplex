"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { TagPicker } from "@/components/ui/TagPicker";
import { bots } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { Bot } from "@/lib/api/types";
import { BOT_TAGS } from "@/lib/constants/tags";

interface BotEditModalProps {
  botId: string;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}

export function BotEditModal({
  botId,
  token,
  onClose,
  onSaved,
}: BotEditModalProps) {
  const [bot, setBot] = useState<Bot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    bots
      .getBot(botId)
      .then((b) => {
        if (!cancelled) setBot(b);
      })
      .catch(() => {
        if (!cancelled) setLoadError("Failed to load bot settings.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [botId]);

  return (
    <Modal open onClose={onClose} title="Edit Bot">
      {loading ? (
        <p className="py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Loading…
        </p>
      ) : loadError || !bot ? (
        <p className="py-8 text-center text-sm text-red-600 dark:text-red-400">
          {loadError ?? "Bot not found."}
        </p>
      ) : (
        <BotEditForm
          bot={bot}
          token={token}
          onClose={onClose}
          onSaved={onSaved}
        />
      )}
    </Modal>
  );
}

function BotEditForm({
  bot,
  token,
  onClose,
  onSaved,
}: {
  bot: Bot;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    short: bot.short,
    long: bot.long,
    prefix: bot.prefix,
    invite: bot.invite,
    library: bot.library,
    tags: bot.tags,
    nsfw: bot.nsfw,
    captchaOptOut: false,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await bots.updateBot(
        bot.bot_id,
        {
          short: form.short.trim(),
          long: form.long.trim(),
          prefix: form.prefix.trim(),
          invite: form.invite.trim(),
          library: form.library.trim(),
          extra_links: bot.extra_links,
          tags: form.tags,
          nsfw: form.nsfw,
          captcha_opt_out: form.captchaOptOut,
        },
        token,
      );
      onSaved();
      onClose();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Failed to save changes.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="edit-short"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Short Description
        </label>
        <textarea
          id="edit-short"
          rows={2}
          maxLength={191}
          value={form.short}
          onChange={(e) => setForm((f) => ({ ...f, short: e.target.value }))}
          className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
          required
        />
      </div>

      <Input
        id="edit-invite"
        label="Invite URL"
        type="url"
        value={form.invite}
        onChange={(e) => setForm((f) => ({ ...f, invite: e.target.value }))}
        required
      />

      <Input
        id="edit-prefix"
        label="Prefix"
        value={form.prefix}
        onChange={(e) => setForm((f) => ({ ...f, prefix: e.target.value }))}
        required
      />

      <Input
        id="edit-library"
        label="Library"
        value={form.library}
        onChange={(e) => setForm((f) => ({ ...f, library: e.target.value }))}
        required
      />

      <div>
        <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Tags
        </p>
        <TagPicker
          available={BOT_TAGS}
          selected={form.tags}
          onChange={(tags) => setForm((f) => ({ ...f, tags }))}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="edit-long"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Long Description
        </label>
        <textarea
          id="edit-long"
          rows={8}
          value={form.long}
          onChange={(e) => setForm((f) => ({ ...f, long: e.target.value }))}
          className="w-full resize-y rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
          required
        />
      </div>

      <label className="flex cursor-pointer items-center gap-3">
        <input
          type="checkbox"
          checked={form.nsfw}
          onChange={(e) => setForm((f) => ({ ...f, nsfw: e.target.checked }))}
          className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
        />
        <span className="text-sm text-zinc-700 dark:text-zinc-300">
          This bot contains NSFW content
        </span>
      </label>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={saving}>
          Save Changes
        </Button>
      </div>
    </form>
  );
}
