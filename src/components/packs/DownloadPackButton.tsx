"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { PackEmoji } from "@/lib/api/types";
import { downloadEmojiPack } from "@/lib/utils/downloadPack";

interface DownloadPackButtonProps {
  packUrl: string;
  packName: string;
  emojis: PackEmoji[];
}

export function DownloadPackButton({
  packUrl,
  packName,
  emojis,
}: DownloadPackButtonProps) {
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    setError(false);
    try {
      await downloadEmojiPack(packUrl, packName, emojis);
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
        variant="secondary"
        loading={downloading}
        onClick={handleDownload}
        disabled={emojis.length === 0}
      >
        <Download size={14} />
        Download Pack (.zip)
      </Button>
      {error && (
        <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">
          Download failed. Try again.
        </p>
      )}
    </div>
  );
}
