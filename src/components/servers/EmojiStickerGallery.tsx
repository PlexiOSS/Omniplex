"use client";

import { Check, Copy, Sparkles } from "lucide-react";
import { useState } from "react";
import type { ServerEmoji, ServerSticker } from "@/lib/api/types";
import { EmojiImage, isAnimatedSticker, StickerMedia } from "./EmojiStickerMedia";

interface EmojiStickerGalleryProps {
  emojis: ServerEmoji[];
  stickers: ServerSticker[];
  /** Set when rendered inside its own tab panel (ServerPageTabs), which already provides its own separation from the tab bar above. */
  noTopBorder?: boolean;
}

/** A single server's own emoji/sticker list — shown on that server's own page, where the "which server" context is already obvious from the page you're on. */
export function EmojiStickerGallery({
  emojis,
  stickers,
  noTopBorder = false,
}: EmojiStickerGalleryProps) {
  if (emojis.length === 0 && stickers.length === 0) return null;

  return (
    <div
      className={
        noTopBorder
          ? ""
          : "mt-8 border-t border-zinc-200 pt-8 dark:border-zinc-800"
      }
    >
      {emojis.length > 0 && (
        <div className={stickers.length > 0 ? "mb-8" : ""}>
          <h2 className="mb-4 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Emojis
            <span className="ml-2 text-sm font-normal text-zinc-400 dark:text-zinc-600">
              {emojis.length}
            </span>
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(88px,1fr))] gap-3">
            {emojis.map((emoji) => (
              <EmojiTile key={emoji.id} emoji={emoji} />
            ))}
          </div>
        </div>
      )}

      {stickers.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Stickers
            <span className="ml-2 text-sm font-normal text-zinc-400 dark:text-zinc-600">
              {stickers.length}
            </span>
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-3">
            {stickers.map((sticker) => (
              <StickerTile key={sticker.id} sticker={sticker} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmojiTile({ emoji }: { emoji: ServerEmoji }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(`:${emoji.name}:`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`:${emoji.name}: — click to copy`}
      className="group relative flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-left transition-colors hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-accent/40 dark:hover:bg-accent/10"
    >
      {emoji.animated && (
        <Sparkles
          size={11}
          className="absolute right-1.5 top-1.5 text-accent"
        />
      )}
      <EmojiImage url={emoji.url} name={emoji.name} animated={emoji.animated} />
      <span className="flex w-full items-center justify-center gap-1 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
        <span className="min-w-0 truncate">{emoji.name}</span>
        {copied ? (
          <Check size={10} className="shrink-0 text-emerald-500" />
        ) : (
          <Copy
            size={10}
            className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          />
        )}
      </span>
    </button>
  );
}

function StickerTile({ sticker }: { sticker: ServerSticker }) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(sticker.name);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`${sticker.name} — click to copy`}
      className="group relative flex flex-col items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 p-3.5 text-left transition-colors hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-accent/40 dark:hover:bg-accent/10"
    >
      {isAnimatedSticker(sticker.format) && (
        <Sparkles
          size={11}
          className="absolute right-1.5 top-1.5 text-accent"
        />
      )}
      <StickerMedia url={sticker.url} name={sticker.name} format={sticker.format} />
      <span className="flex w-full items-center justify-center gap-1 text-center text-[11px] text-zinc-500 dark:text-zinc-400">
        <span className="min-w-0 truncate">{sticker.name}</span>
        {copied ? (
          <Check size={10} className="shrink-0 text-emerald-500" />
        ) : (
          <Copy
            size={10}
            className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
          />
        )}
      </span>
    </button>
  );
}
