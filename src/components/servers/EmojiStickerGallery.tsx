import Image from "next/image";
import type { ServerEmoji, ServerSticker } from "@/lib/api/types";

interface EmojiStickerGalleryProps {
  emojis: ServerEmoji[];
  stickers: ServerSticker[];
}

export function EmojiStickerGallery({
  emojis,
  stickers,
}: EmojiStickerGalleryProps) {
  // Lottie stickers are a JSON animation format, not an image — there's
  // nothing to put in an <img>/<Image> for them.
  const renderableStickers = stickers.filter((s) => s.format !== "lottie");

  if (emojis.length === 0 && renderableStickers.length === 0) return null;

  return (
    <div className="mt-8 border-t border-zinc-200 pt-8 dark:border-zinc-800">
      {emojis.length > 0 && (
        <div className={renderableStickers.length > 0 ? "mb-6" : ""}>
          <h2 className="mb-4 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Emojis
            <span className="ml-2 text-sm font-normal text-zinc-400 dark:text-zinc-600">
              {emojis.length}
            </span>
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-3">
            {emojis.map((emoji) => (
              <div
                key={emoji.id}
                title={`:${emoji.name}:`}
                className="group flex flex-col items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 p-2.5 transition-colors hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-accent/40 dark:hover:bg-accent/10"
              >
                <Image
                  src={emoji.url}
                  alt={emoji.name}
                  width={32}
                  height={32}
                  unoptimized={emoji.animated}
                  className="transition-transform group-hover:scale-110"
                />
                <span className="w-full truncate text-center text-[11px] text-zinc-500 dark:text-zinc-400">
                  {emoji.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {renderableStickers.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Stickers
            <span className="ml-2 text-sm font-normal text-zinc-400 dark:text-zinc-600">
              {renderableStickers.length}
            </span>
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(104px,1fr))] gap-3">
            {renderableStickers.map((sticker) => (
              <div
                key={sticker.id}
                title={sticker.name}
                className="group flex flex-col items-center gap-1.5 rounded-xl border border-zinc-200 bg-zinc-50 p-3 transition-colors hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-accent/40 dark:hover:bg-accent/10"
              >
                <Image
                  src={sticker.url}
                  alt={sticker.name}
                  width={64}
                  height={64}
                  unoptimized={sticker.format === "gif"}
                  className="object-contain transition-transform group-hover:scale-110"
                />
                <span className="w-full truncate text-center text-[11px] text-zinc-500 dark:text-zinc-400">
                  {sticker.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
