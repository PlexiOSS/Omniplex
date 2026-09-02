"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { emojis, stickers } from "@/lib/api";
import { formatCount } from "@/lib/utils/format";

interface AssetDownloadButtonProps {
  kind: "emoji" | "sticker";
  id: string;
  assetUrl: string;
  fileName: string;
  initialDownloads: number;
}

/** Downloads a single emoji/sticker (not a whole pack -- see
 * DownloadPackButton for that) and records the download against its own
 * count. The image fetch and the count-increment are independent calls;
 * if the increment fails, the file still saves -- a lost count is much
 * less bad than a user who thinks their download failed when it didn't. */
export function AssetDownloadButton({
  kind,
  id,
  assetUrl,
  fileName,
  initialDownloads,
}: AssetDownloadButtonProps) {
  const [downloads, setDownloads] = useState(initialDownloads);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    setError(false);
    try {
      const res = await fetch(assetUrl);
      if (!res.ok) throw new Error("fetch failed");
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(objectUrl);

      const recordDownload =
        kind === "emoji" ? emojis.recordDownload : stickers.recordDownload;
      recordDownload(id)
        .then((summary) => setDownloads(summary.downloads))
        .catch(() => {
          // The file already saved -- a failed count bump isn't worth
          // surfacing as an error to the user.
        });
    } catch {
      setError(true);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div>
      <Button
        type="button"
        variant="primary"
        loading={downloading}
        onClick={handleDownload}
      >
        <Download size={14} />
        Download{downloads > 0 ? ` (${formatCount(downloads)})` : ""}
      </Button>
      {error && (
        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          Download failed. Try again.
        </p>
      )}
    </div>
  );
}
