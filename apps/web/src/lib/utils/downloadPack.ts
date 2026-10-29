import JSZip from "jszip";
import type { PackEmoji, PackSound, PackSticker } from "@/lib/api/types";
import { packEmojiUrl, packSoundUrl, packStickerUrl } from "./assets";

/** Sanitize a filename component: strip anything that isn't safe across
 * Windows/macOS/Linux filesystems, collapse to a fallback if that leaves
 * nothing usable. Emoji/sticker names are user-entered and only loosely
 * validated server-side, so this can't assume they're already
 * filesystem-safe. */
function safeFileName(name: string, fallback: string): string {
  const cleaned = name.trim().replace(/[^a-zA-Z0-9_-]+/g, "_");
  return cleaned || fallback;
}

interface DownloadableItem {
  id: string;
  name: string;
}

/** Bundles every item in a pack into a .zip and triggers a browser
 * download for it. Runs entirely client-side: pack assets are served
 * same-origin (`/cdn/...`), so no server-side archive endpoint is needed
 * just to zip a handful of small files together. Shared by
 * downloadEmojiPack/downloadStickerPack/downloadSoundPack below --
 * identical logic, only the asset URL/extension resolvers differ. */
async function downloadPackAssets<T extends DownloadableItem>(
  packUrl: string,
  packName: string,
  items: T[],
  assetUrl: (packUrl: string, item: T) => string,
  ext: (item: T) => string,
): Promise<void> {
  const zip = new JSZip();
  const usedNames = new Set<string>();

  const results = await Promise.allSettled(
    items.map(async (item) => {
      const res = await fetch(assetUrl(packUrl, item));
      if (!res.ok) throw new Error(`Failed to fetch ${item.name}`);
      const blob = await res.blob();

      const itemExt = ext(item);
      const base = safeFileName(item.name, item.id);
      let fileName = `${base}.${itemExt}`;
      let n = 2;
      while (usedNames.has(fileName)) {
        fileName = `${base}_${n}.${itemExt}`;
        n += 1;
      }
      usedNames.add(fileName);

      zip.file(fileName, blob);
    }),
  );

  if (results.every((r) => r.status === "rejected")) {
    throw new Error("Every item in this pack failed to download.");
  }

  const archive = await zip.generateAsync({ type: "blob" });
  const objectUrl = URL.createObjectURL(archive);

  const link = document.createElement("a");
  link.href = objectUrl;
  link.download = `${safeFileName(packName, packUrl)}.zip`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export function downloadEmojiPack(
  packUrl: string,
  packName: string,
  emojis: PackEmoji[],
): Promise<void> {
  return downloadPackAssets(
    packUrl,
    packName,
    emojis,
    (url, item) => packEmojiUrl(url, item.id, item.animated),
    (item) => (item.animated ? "gif" : "webp"),
  );
}

export function downloadStickerPack(
  packUrl: string,
  packName: string,
  stickers: PackSticker[],
): Promise<void> {
  return downloadPackAssets(
    packUrl,
    packName,
    stickers,
    (url, item) => packStickerUrl(url, item.id, item.animated),
    (item) => (item.animated ? "gif" : "webp"),
  );
}

export function downloadSoundPack(
  packUrl: string,
  packName: string,
  sounds: PackSound[],
): Promise<void> {
  return downloadPackAssets(
    packUrl,
    packName,
    sounds,
    (url, item) => packSoundUrl(url, item.id),
    () => "mp3",
  );
}
