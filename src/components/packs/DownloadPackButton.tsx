"use client";

import { Download } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import type { PackEmoji, PackSound, PackSticker } from "@/lib/api/types";
import {
  downloadEmojiPack,
  downloadSoundPack,
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
    }
  | {
      kind: "sound";
      packUrl: string;
      packName: string;
      sounds: PackSound[];
    };

export function DownloadPackButton(props: DownloadPackButtonProps) {
  const { kind, packUrl, packName } = props;
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(false);

  const itemCount =
    kind === "emoji"
      ? props.emojis.length
      : kind === "sticker"
        ? props.stickers.length
        : props.sounds.length;

  async function handleDownload() {
    setDownloading(true);
    setError(false);
    try {
      if (props.kind === "emoji") {
        await downloadEmojiPack(packUrl, packName, props.emojis);
      } else if (props.kind === "sticker") {
        await downloadStickerPack(packUrl, packName, props.stickers);
      } else {
        await downloadSoundPack(packUrl, packName, props.sounds);
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
