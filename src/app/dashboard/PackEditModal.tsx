"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { TagPicker } from "@/components/ui/TagPicker";
import { packs } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { BotPack, IndexBot } from "@/lib/api/types";
import { BOT_TAGS } from "@/lib/constants/tags";

interface PackEditModalProps {
  pack: BotPack;
  userId: string;
  userBots: IndexBot[];
  token: string;
  onClose: () => void;
  onSaved: () => void;
}

export function PackEditModal({
  pack,
  userId,
  userBots,
  token,
  onClose,
  onSaved,
}: PackEditModalProps) {
  const [form, setForm] = useState({
    name: pack.name,
    short: pack.short,
    tags: pack.tags,
    bots: pack.bot_ids,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleBot(botId: string) {
    setForm((f) => ({
      ...f,
      bots: f.bots.includes(botId)
        ? f.bots.filter((id) => id !== botId)
        : f.bots.length < 10
          ? [...f.bots, botId]
          : f.bots,
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.bots.length === 0) {
      setError("Select at least one bot.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await packs.updatePack(
        userId,
        pack.url,
        {
          name: form.name.trim(),
          short: form.short.trim(),
          tags: form.tags,
          bots: form.bots,
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
    <Modal open onClose={onClose} title="Edit Pack">
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="pack-name"
          label="Pack Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="pack-short"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Short Description
          </label>
          <textarea
            id="pack-short"
            rows={2}
            maxLength={100}
            value={form.short}
            onChange={(e) => setForm((f) => ({ ...f, short: e.target.value }))}
            className="w-full resize-none rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
            required
          />
        </div>

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

        <div>
          <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Bots{" "}
            <span className="text-xs font-normal text-zinc-400">
              ({form.bots.length}/10 selected)
            </span>
          </p>
          <div className="space-y-2">
            {userBots.map((bot) => {
              const checked = form.bots.includes(bot.bot_id);
              return (
                <label
                  key={bot.bot_id}
                  className={[
                    "flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-colors",
                    checked
                      ? "border-accent bg-accent/5"
                      : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-800 dark:hover:border-zinc-700",
                  ].join(" ")}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleBot(bot.bot_id)}
                    className="h-4 w-4 rounded border-zinc-300 accent-accent dark:border-zinc-700"
                  />
                  <Avatar
                    src={bot.user.avatar}
                    alt={bot.user.username}
                    size={28}
                  />
                  <span className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {bot.user.username}
                  </span>
                </label>
              );
            })}
          </div>
        </div>

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
    </Modal>
  );
}
