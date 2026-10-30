"use client";

import { useState } from "react";
import { EmojiPackBuilder } from "@/app/packs/add/EmojiPackBuilder";
import { SoundPackBuilder } from "@/app/packs/add/SoundPackBuilder";
import { StickerPackBuilder } from "@/app/packs/add/StickerPackBuilder";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { TagPicker } from "@/components/ui/TagPicker";
import { packs, vanity as vanityApi } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type {
  BotPack,
  PackEmojiInput,
  PackSoundInput,
  PackStickerInput,
} from "@/lib/api/types";
import { BOT_TAGS } from "@/lib/constants/tags";

interface EmojiStickerPackEditModalProps {
  pack: BotPack;
  userId: string;
  token: string;
  onClose: () => void;
  onSaved: () => void;
}

/** Edit flow for emoji/sticker packs -- these never had one before (only
 * bot/server packs did, via PackEditModal). Reuses the exact builder
 * components `/packs/add` already uses for content (upload/rename/remove),
 * plus a short-link editor per existing item -- new items uploaded in this
 * session don't exist server-side yet, so they get their own short link
 * automatically on save rather than being editable here. */
export function EmojiStickerPackEditModal({
  pack,
  userId,
  token,
  onClose,
  onSaved,
}: EmojiStickerPackEditModalProps) {
  const isEmoji = pack.pack_type === "emoji";
  const isSticker = pack.pack_type === "sticker";
  const isSound = pack.pack_type === "sound";

  const [form, setForm] = useState({
    name: pack.name,
    short: pack.short,
    tags: pack.tags ?? [],
  });
  const [emojis, setEmojis] = useState<PackEmojiInput[]>(
    (pack.emojis ?? []).map((e) => ({
      id: e.id,
      name: e.name,
      animated: e.animated,
    })),
  );
  const [stickers, setStickers] = useState<PackStickerInput[]>(
    (pack.stickers ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      animated: s.animated,
    })),
  );
  const [sounds, setSounds] = useState<PackSoundInput[]>(
    (pack.sounds ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      duration_ms: s.duration_ms,
    })),
  );

  const initialVanities: Record<string, string> = Object.fromEntries(
    [
      ...(pack.emojis ?? []),
      ...(pack.stickers ?? []),
      ...(pack.sounds ?? []),
    ].map((item) => [item.id, item.vanity]),
  );
  const [vanities, setVanities] =
    useState<Record<string, string>>(initialVanities);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const items = isEmoji ? emojis : isSticker ? stickers : sounds;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
          bots: [],
          servers: [],
          emojis: isEmoji
            ? emojis
            : (pack.emojis ?? []).map((e) => ({
                id: e.id,
                name: e.name,
                animated: e.animated,
              })),
          stickers: isSticker
            ? stickers
            : (pack.stickers ?? []).map((s) => ({
                id: s.id,
                name: s.name,
                animated: s.animated,
              })),
          sounds: isSound
            ? sounds
            : (pack.sounds ?? []).map((s) => ({
                id: s.id,
                name: s.name,
                duration_ms: s.duration_ms,
              })),
        },
        token,
      );

      const currentIds = new Set(items.map((i) => i.id));
      let vanityFailure: string | null = null;
      const vanityTargetType = isEmoji
        ? "pack_emoji"
        : isSticker
          ? "pack_sticker"
          : "pack_sound";

      for (const [id, code] of Object.entries(vanities)) {
        const trimmed = code.trim();
        const original = initialVanities[id] ?? "";
        if (!currentIds.has(id) || !trimmed || trimmed === original) continue;

        try {
          await vanityApi.update(vanityTargetType, id, trimmed, token);
        } catch (err) {
          vanityFailure =
            err instanceof ApiError
              ? err.message
              : "One of the short links couldn't be changed.";
        }
      }

      onSaved();

      if (vanityFailure) {
        setError(`Pack saved, but: ${vanityFailure}`);
        setSaving(false);
        return;
      }

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
    <Modal
      open
      onClose={onClose}
      title={`Edit ${isEmoji ? "Emoji" : isSticker ? "Sticker" : "Sound"} Pack`}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="epack-name"
          label="Pack Name"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          required
        />

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="epack-short"
            className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
          >
            Short Description
          </label>
          <textarea
            id="epack-short"
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

        {isEmoji ? (
          <EmojiPackBuilder
            packUrl={pack.url}
            userId={userId}
            token={token}
            emojis={emojis}
            onChange={setEmojis}
          />
        ) : isSticker ? (
          <StickerPackBuilder
            packUrl={pack.url}
            userId={userId}
            token={token}
            stickers={stickers}
            onChange={setStickers}
          />
        ) : (
          <SoundPackBuilder
            packUrl={pack.url}
            userId={userId}
            token={token}
            sounds={sounds}
            onChange={setSounds}
          />
        )}

        {items.some((item) => item.id in initialVanities) && (
          <div>
            <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Short Links
            </p>
            <div className="space-y-2">
              {items
                .filter((item) => item.id in initialVanities)
                .map((item) => (
                  <div key={item.id} className="flex items-center gap-2">
                    <span className="w-24 shrink-0 truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {item.name}
                    </span>
                    <input
                      value={vanities[item.id] ?? ""}
                      onChange={(e) =>
                        setVanities((v) => ({
                          ...v,
                          [item.id]: e.target.value,
                        }))
                      }
                      className="min-w-0 flex-1 rounded-lg border border-zinc-200 bg-white px-2.5 py-1.5 text-xs text-zinc-950 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:focus:border-zinc-600"
                    />
                  </div>
                ))}
            </div>
            <p className="mt-1.5 text-xs text-zinc-400 dark:text-zinc-600">
              Newly added items get a short link automatically once saved.
            </p>
          </div>
        )}

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
