"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { PackEmoji, PackSticker } from "@/lib/api/types";
import {
  downloadEmojiPack,
  downloadStickerPack,
} from "@/lib/utils/downloadPack";

type DownloadPackButtonProps =
  | {
      kind: "emoji";
      packUrl: string;
      packName: string;
      emojis: PackEmoji[];
    }
  | {
      kind: "sticker";
      packUrl: string;
      packName: string;
      stickers: PackSticker[];
    };

export function DownloadPackButton(props: DownloadPackButtonProps) {
  const { kind, packUrl, packName } = props;
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(false);

  const itemCount =
    kind === "emoji" ? props.emojis.length : props.stickers.length;

  async function handleDownload() {
    setDownloading(true);
    setError(false);
    try {
      if (props.kind === "emoji") {
        await downloadEmojiPack(packUrl, packName, props.emojis);
      } else {
        await downloadStickerPack(packUrl, packName, props.stickers);
      }
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
        disabled={itemCount === 0}
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
