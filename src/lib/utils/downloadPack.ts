import JSZip from "jszip";
import type { PackEmoji, PackSticker } from "@/lib/api/types";
import { packEmojiUrl, packStickerUrl } from "./assets";

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
  animated: boolean;
}

/** Bundles every item in a pack into a .zip and triggers a browser
 * download for it. Runs entirely client-side: pack assets are served
 * same-origin (`/cdn/...`), so no server-side archive endpoint is needed
 * just to zip a handful of small images together. Shared by
 * downloadEmojiPack/downloadStickerPack below -- identical logic, only the
 * asset-URL builder differs. */
async function downloadPackAssets(
  packUrl: string,
  packName: string,
  items: DownloadableItem[],
  assetUrl: (packUrl: string, id: string, animated: boolean) => string,
): Promise<void> {
  const zip = new JSZip();
  const usedNames = new Set<string>();

  const results = await Promise.allSettled(
    items.map(async (item) => {
      const res = await fetch(assetUrl(packUrl, item.id, item.animated));
      if (!res.ok) throw new Error(`Failed to fetch ${item.name}`);
      const blob = await res.blob();

      const ext = item.animated ? "gif" : "webp";
      const base = safeFileName(item.name, item.id);
      let fileName = `${base}.${ext}`;
      let n = 2;
      while (usedNames.has(fileName)) {
        fileName = `${base}_${n}.${ext}`;
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
  return downloadPackAssets(packUrl, packName, emojis, packEmojiUrl);
}

export function downloadStickerPack(
  packUrl: string,
  packName: string,
  stickers: PackSticker[],
): Promise<void> {
  return downloadPackAssets(packUrl, packName, stickers, packStickerUrl);
}
