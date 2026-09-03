import Link from "next/link";
import { packEmojiUrl, packStickerUrl } from "@/lib/utils/assets";

interface SimilarPackAssetsProps {
  kind: "emoji" | "sticker";
  packUrl: string;
  packName: string;
  items: { id: string; name: string; animated: boolean }[];
}

/** "More from this pack" -- individual emojis/stickers have no tags of
 * their own to match on, so "similar" is simply other items from the same
 * pack. Renders nothing when there's nothing else in the pack to show. */
export function SimilarPackAssets({
  kind,
  packUrl,
  packName,
  items,
}: SimilarPackAssetsProps) {
  if (items.length === 0) return null;

  return (
    <div className="mt-8">
      <h2 className="mb-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">
        More from {packName}
      </h2>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(72px,1fr))] gap-2.5">
        {items.map((item) => {
          const assetUrl =
            kind === "emoji"
              ? packEmojiUrl(packUrl, item.id, item.animated)
              : packStickerUrl(packUrl, item.id, item.animated);

          return (
            <Link
              key={item.id}
              href={`/${kind}s/${item.id}`}
              title={item.name}
              className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-200 p-2.5 transition-colors hover:border-accent/40 hover:bg-accent/5 dark:border-zinc-800"
            >
              {/* biome-ignore lint/performance/noImgElement: small thumbnail */}
              <img
                src={assetUrl}
                alt={item.name}
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
              />
              <span className="w-full truncate text-center text-xs text-zinc-500 dark:text-zinc-400">
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
