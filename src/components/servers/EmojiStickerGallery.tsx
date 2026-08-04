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
          </h2>
          <div className="flex flex-wrap gap-3">
            {emojis.map((emoji) => (
              <div
                key={emoji.id}
                title={`:${emoji.name}:`}
                className="flex h-12 w-12 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <Image
                  src={emoji.url}
                  alt={emoji.name}
                  width={32}
                  height={32}
                  unoptimized={emoji.animated}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {renderableStickers.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Stickers
          </h2>
          <div className="flex flex-wrap gap-3">
            {renderableStickers.map((sticker) => (
              <div
                key={sticker.id}
                title={sticker.name}
                className="flex h-24 w-24 flex-col items-center justify-center rounded-xl border border-zinc-200 bg-zinc-50 p-2 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <Image
                  src={sticker.url}
                  alt={sticker.name}
                  width={64}
                  height={64}
                  unoptimized={sticker.format === "gif"}
                  className="object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
