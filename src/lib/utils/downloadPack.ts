import JSZip from "jszip";
import type { PackEmoji } from "@/lib/api/types";
import { packEmojiUrl } from "./assets";

/** Sanitize a filename component: strip anything that isn't safe across
 * Windows/macOS/Linux filesystems, collapse to a fallback if that leaves
 * nothing usable. Emoji names are user-entered and only loosely validated
 * server-side, so this can't assume they're already filesystem-safe. */
function safeFileName(name: string, fallback: string): string {
  const cleaned = name.trim().replace(/[^a-zA-Z0-9_-]+/g, "_");
  return cleaned || fallback;
}

/** Bundles every emoji in a pack into a .zip and triggers a browser
 * download for it. Runs entirely client-side: pack emoji images are served
 * same-origin (`/cdn/emojis/packs/...`), so no server-side archive endpoint
 * is needed just to zip a handful of small images together. */
export async function downloadEmojiPack(
  packUrl: string,
  packName: string,
  emojis: PackEmoji[],
): Promise<void> {
  const zip = new JSZip();
  const usedNames = new Set<string>();

  const results = await Promise.allSettled(
    emojis.map(async (emoji) => {
      const res = await fetch(packEmojiUrl(packUrl, emoji.id, emoji.animated));
      if (!res.ok) throw new Error(`Failed to fetch ${emoji.name}`);
      const blob = await res.blob();

      const ext = emoji.animated ? "gif" : "webp";
      let base = safeFileName(emoji.name, emoji.id);
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
    throw new Error("Every emoji in this pack failed to download.");
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
