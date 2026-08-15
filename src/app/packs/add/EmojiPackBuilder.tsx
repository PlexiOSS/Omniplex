"use client";

import { Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { PackEmojiInput } from "@/lib/api/types";
import { packEmojiUrl } from "@/lib/utils/assets";

const MAX_EMOJIS = 50;
const MAX_BYTES = 256 * 1024;
const ALLOWED_TYPES = new Set([
  "image/webp",
  "image/png",
  "image/jpeg",
  "image/gif",
]);

interface EmojiPackBuilderProps {
  packUrl: string;
  userId: string;
  token: string;
  emojis: PackEmojiInput[];
  onChange: (emojis: PackEmojiInput[]) => void;
}

export function EmojiPackBuilder({
  packUrl,
  userId,
  token,
  emojis,
  onChange,
}: EmojiPackBuilderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const remaining = MAX_EMOJIS - emojis.length;
    const toUpload = Array.from(files).slice(0, remaining);

    if (files.length > remaining) {
      setError(`Only ${remaining} more emoji(s) can be added (50 max).`);
    }

    setUploading(true);

    for (const file of toUpload) {
      if (!ALLOWED_TYPES.has(file.type)) {
        setError(`${file.name}: unsupported image type.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name}: too large — 256KB max per emoji.`);
        continue;
      }

      const id = crypto.randomUUID();
      const animated = file.type === "image/gif";
      const name = file.name.replace(/\.[^.]+$/, "").slice(0, 32) || "emoji";

      const form = new FormData();
      form.set("kind", "pack-emoji");
      form.set("targetId", packUrl);
      form.set("assetId", id);
      form.set("animated", String(animated));
      form.set("userId", userId);
      form.set("token", token);
      form.set("file", file);

      try {
        const res = await fetch("/api/uploads", { method: "POST", body: form });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(`${file.name}: ${body.error ?? "upload failed"}`);
          continue;
        }
        onChange([...emojis, { id, name, animated }]);
      } catch {
        setError(`${file.name}: upload failed.`);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeEmoji(id: string) {
    onChange(emojis.filter((e) => e.id !== id));
  }

  function renameEmoji(id: string, name: string) {
    onChange(emojis.map((e) => (e.id === id ? { ...e, name } : e)));
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Emojis <span className="text-red-500">*</span>{" "}
        <span className="text-xs font-normal text-zinc-400">
          ({emojis.length}/{MAX_EMOJIS})
        </span>
      </p>

      {!packUrl.trim() ? (
        <p className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
          Choose a pack URL above before adding emojis.
        </p>
      ) : (
        <>
          {emojis.length > 0 && (
            <div className="mb-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {emojis.map((emoji) => (
                <div
                  key={emoji.id}
                  className="group relative flex flex-col items-center gap-1 rounded-xl border border-zinc-200 p-2 dark:border-zinc-800"
                >
                  <button
                    type="button"
                    onClick={() => removeEmoji(emoji.id)}
                    aria-label={`Remove ${emoji.name}`}
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    <X size={11} />
                  </button>
                  {/* biome-ignore lint/performance/noImgElement: freshly-uploaded emoji preview, no next/image benefit here */}
                  <img
                    src={packEmojiUrl(packUrl, emoji.id, emoji.animated)}
                    alt={emoji.name}
                    width={32}
                    height={32}
                  />
                  <input
                    value={emoji.name}
                    onChange={(e) => renameEmoji(emoji.id, e.target.value)}
                    maxLength={32}
                    className="w-full min-w-0 rounded border-0 bg-transparent text-center text-[10px] text-zinc-500 outline-none focus:bg-zinc-100 dark:text-zinc-400 dark:focus:bg-zinc-800"
                  />
                </div>
              ))}
            </div>
          )}

          {emojis.length < MAX_EMOJIS && (
            <Button
              type="button"
              variant="secondary"
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus size={14} />
              Add Emoji
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/webp,image/png,image/jpeg,image/gif"
            multiple
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  );
}
