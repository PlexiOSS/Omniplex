"use client";

import { Search as SearchIcon, X } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { TagPicker } from "@/components/ui/TagPicker";
import { packs, search } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import type { BotPack, IndexBot } from "@/lib/api/types";
import { BOT_TAGS } from "@/lib/constants/tags";

type PickedEntity = {
  type: "bot" | "server";
  id: string;
  label: string;
  avatar: string;
};

const MAX_PER_TYPE = 10;

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
    tags: pack.tags ?? [],
  });
  const [entities, setEntities] = useState<PickedEntity[]>([
    ...(pack.bots ?? []).map((b) => ({
      type: "bot" as const,
      id: b.bot_id,
      label: b.user.username,
      avatar: b.user.avatar,
    })),
    ...(pack.servers ?? []).map((s) => ({
      type: "server" as const,
      id: s.server_id,
      label: s.name,
      avatar:
        s.avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&size=64&background=random`,
    })),
  ]);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PickedEntity[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const botCount = entities.filter((e) => e.type === "bot").length;
  const serverCount = entities.filter((e) => e.type === "server").length;

  function isPicked(type: "bot" | "server", id: string) {
    return entities.some((e) => e.type === type && e.id === id);
  }

  function addEntity(entity: PickedEntity) {
    if (isPicked(entity.type, entity.id)) return;
    const countForType = entity.type === "bot" ? botCount : serverCount;
    if (countForType >= MAX_PER_TYPE) return;
    setEntities((e) => [...e, entity]);
  }

  function removeEntity(type: "bot" | "server", id: string) {
    setEntities((e) => e.filter((x) => !(x.type === type && x.id === id)));
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const res = await search.search({
        query: query.trim(),
        target_types: ["bot", "server"],
      });
      const bots: PickedEntity[] = (res.bots ?? []).map((b) => ({
        type: "bot",
        id: b.bot_id,
        label: b.user.username,
        avatar: b.user.avatar,
      }));
      const servers: PickedEntity[] = (res.servers ?? []).map((s) => ({
        type: "server",
        id: s.server_id,
        label: s.name,
        avatar:
          s.avatar ||
          `https://ui-avatars.com/api/?name=${encodeURIComponent(s.name)}&size=64&background=random`,
      }));
      setSearchResults([...bots, ...servers]);
    } catch {
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (entities.length === 0) {
      setError("Add at least one bot or server.");
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
          bots: entities.filter((e) => e.type === "bot").map((e) => e.id),
          servers: entities.filter((e) => e.type === "server").map((e) => e.id),
          // This modal only ever edits bot/server packs (PacksTab hides the
          // Edit button for emoji/sticker/sound packs) — pass the existing
          // emoji/sticker/sound lists through unchanged as a defensive
          // default rather than sending an empty array, so a future caller
          // can't accidentally wipe one of those packs' contents via this
          // form.
          emojis: (pack.emojis ?? []).map((e) => ({
            id: e.id,
            name: e.name,
            animated: e.animated,
          })),
          stickers: (pack.stickers ?? []).map((s) => ({
            id: s.id,
            name: s.name,
            animated: s.animated,
          })),
          sounds: (pack.sounds ?? []).map((s) => ({
            id: s.id,
            name: s.name,
            duration_ms: s.duration_ms,
          })),
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
            Bots &amp; Servers{" "}
            <span className="text-xs font-normal text-zinc-400">
              ({botCount}/{MAX_PER_TYPE} bots, {serverCount}/{MAX_PER_TYPE}{" "}
              servers)
            </span>
          </p>

          {entities.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {entities.map((entity) => (
                <span
                  key={`${entity.type}-${entity.id}`}
                  className="flex items-center gap-1.5 rounded-full border border-zinc-200 py-1 pr-1.5 pl-2 text-xs dark:border-zinc-800"
                >
                  <Avatar src={entity.avatar} alt={entity.label} size={16} />
                  {entity.label}
                  <button
                    type="button"
                    onClick={() => removeEntity(entity.type, entity.id)}
                    aria-label={`Remove ${entity.label}`}
                    className="flex h-4 w-4 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch(e);
                }
              }}
              placeholder="Search any bot or server by name…"
              className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-950 placeholder:text-zinc-400 outline-none transition-colors focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-50 dark:placeholder:text-zinc-600 dark:focus:border-zinc-600"
            />
            <Button
              type="button"
              variant="secondary"
              loading={searching}
              onClick={handleSearch}
            >
              <SearchIcon size={14} />
            </Button>
          </div>

          {searchResults.length > 0 && (
            <div className="mt-2 max-h-48 space-y-1.5 overflow-y-auto">
              {searchResults.map((result) => {
                const picked = isPicked(result.type, result.id);
                const atLimit =
                  (result.type === "bot" ? botCount : serverCount) >=
                  MAX_PER_TYPE;
                return (
                  <button
                    key={`${result.type}-${result.id}`}
                    type="button"
                    disabled={picked || atLimit}
                    onClick={() => addEntity(result)}
                    className="flex w-full items-center gap-2.5 rounded-xl border border-zinc-200 p-2.5 text-left transition-colors hover:border-accent/40 hover:bg-accent/5 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-800"
                  >
                    <Avatar src={result.avatar} alt={result.label} size={24} />
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {result.label}
                    </span>
                    <span className="shrink-0 text-xs text-zinc-400 dark:text-zinc-600">
                      {result.type === "bot" ? "Bot" : "Server"}
                    </span>
                    {picked && (
                      <span className="shrink-0 text-xs text-accent">
                        Added
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {userBots.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                Quick-add your bots
              </p>
              <div className="flex flex-wrap gap-1.5">
                {userBots.map((bot) => {
                  const picked = isPicked("bot", bot.bot_id);
                  return (
                    <button
                      key={bot.bot_id}
                      type="button"
                      disabled={picked || botCount >= MAX_PER_TYPE}
                      onClick={() =>
                        addEntity({
                          type: "bot",
                          id: bot.bot_id,
                          label: bot.user.username,
                          avatar: bot.user.avatar,
                        })
                      }
                      className={[
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                        picked
                          ? "border-accent bg-accent/10 text-accent"
                          : "border-zinc-200 text-zinc-600 hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800 dark:text-zinc-400",
                      ].join(" ")}
                    >
                      {bot.user.username}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
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
