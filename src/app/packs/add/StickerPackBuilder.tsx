"use client";

import { Plus, X } from "lucide-react";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import type { PackStickerInput } from "@/lib/api/types";
import { packStickerUrl } from "@/lib/utils/assets";

const MAX_STICKERS = 50;
const MAX_BYTES = 256 * 1024;
const ALLOWED_TYPES = new Set([
  "image/webp",
  "image/png",
  "image/jpeg",
  "image/gif",
]);

interface StickerPackBuilderProps {
  packUrl: string;
  userId: string;
  token: string;
  stickers: PackStickerInput[];
  onChange: (stickers: PackStickerInput[]) => void;
}

export function StickerPackBuilder({
  packUrl,
  userId,
  token,
  stickers,
  onChange,
}: StickerPackBuilderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setError(null);

    const remaining = MAX_STICKERS - stickers.length;
    const toUpload = Array.from(files).slice(0, remaining);

    if (files.length > remaining) {
      setError(`Only ${remaining} more sticker(s) can be added (50 max).`);
    }

    setUploading(true);

    // See EmojiPackBuilder's identical comment: accumulated locally so a
    // multi-file batch doesn't clobber itself down to just the last file.
    const uploaded: PackStickerInput[] = [];

    for (const file of toUpload) {
      if (!ALLOWED_TYPES.has(file.type)) {
        setError(`${file.name}: unsupported image type.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`${file.name}: too large — 256KB max per sticker.`);
        continue;
      }

      const id = crypto.randomUUID();
      const animated = file.type === "image/gif";
      const name = file.name.replace(/\.[^.]+$/, "").slice(0, 32) || "sticker";

      const form = new FormData();
      form.set("kind", "pack-sticker");
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
        uploaded.push({ id, name, animated });
        onChange([...stickers, ...uploaded]);
      } catch {
        setError(`${file.name}: upload failed.`);
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeSticker(id: string) {
    onChange(stickers.filter((s) => s.id !== id));
  }

  function renameSticker(id: string, name: string) {
    onChange(stickers.map((s) => (s.id === id ? { ...s, name } : s)));
  }

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
        Stickers <span className="text-red-500">*</span>{" "}
        <span className="text-xs font-normal text-zinc-400">
          ({stickers.length}/{MAX_STICKERS})
        </span>
      </p>

      {!packUrl.trim() ? (
        <p className="rounded-xl border border-dashed border-zinc-200 p-4 text-center text-sm text-zinc-400 dark:border-zinc-800 dark:text-zinc-600">
          Choose a pack URL above before adding stickers.
        </p>
      ) : (
        <>
          {stickers.length > 0 && (
            <div className="mb-3 grid grid-cols-4 gap-2 sm:grid-cols-6">
              {stickers.map((sticker) => (
                <div
                  key={sticker.id}
                  className="group relative flex flex-col items-center gap-1 rounded-xl border border-zinc-200 p-2 dark:border-zinc-800"
                >
                  <button
                    type="button"
                    onClick={() => removeSticker(sticker.id)}
                    aria-label={`Remove ${sticker.name}`}
                    className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-zinc-900 text-white opacity-0 transition-opacity group-hover:opacity-100 dark:bg-zinc-100 dark:text-zinc-900"
                  >
                    <X size={11} />
                  </button>
                  {/* biome-ignore lint/performance/noImgElement: freshly-uploaded sticker preview, no next/image benefit here */}
                  <img
                    src={packStickerUrl(packUrl, sticker.id, sticker.animated)}
                    alt={sticker.name}
                    width={32}
                    height={32}
                  />
                  <input
                    value={sticker.name}
                    onChange={(e) => renameSticker(sticker.id, e.target.value)}
                    maxLength={32}
                    className="w-full min-w-0 rounded border-0 bg-transparent text-center text-[10px] text-zinc-500 outline-none focus:bg-zinc-100 dark:text-zinc-400 dark:focus:bg-zinc-800"
                  />
                </div>
              ))}
            </div>
          )}

          {stickers.length < MAX_STICKERS && (
            <Button
              type="button"
              variant="secondary"
              loading={uploading}
              onClick={() => fileInputRef.current?.click()}
            >
              <Plus size={14} />
              Add Sticker
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
