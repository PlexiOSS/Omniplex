"use client";

import { Sparkles } from "lucide-react";
import { Lottie } from "lottie-react";
import Image from "next/image";
import { useEffect, useState } from "react";

// APNG and GIF frames beyond the first get flattened by Next's image
// optimizer (it only reads frame one), so both need to bypass it to keep
// animating — not just GIF.
const ANIMATED_STICKER_FORMATS = new Set(["gif", "apng"]);

export function isAnimatedSticker(format: string): boolean {
  return ANIMATED_STICKER_FORMATS.has(format) || format === "lottie";
}

export function EmojiImage({
  url,
  name,
  animated,
  size = 40,
}: {
  url: string;
  name: string;
  animated: boolean;
  size?: number;
}) {
  return (
    <Image
      src={url}
      alt={name}
      width={size}
      height={size}
      unoptimized={animated}
      className="transition-transform group-hover:scale-110"
    />
  );
}

export function StickerMedia({
  url,
  name,
  format,
  size = 64,
}: {
  url: string;
  name: string;
  format: string;
  size?: number;
}) {
  const isLottie = format === "lottie";
  const [lottieData, setLottieData] = useState<object | null>(null);
  const [lottieFailed, setLottieFailed] = useState(false);

  useEffect(() => {
    if (!isLottie) return;
    let cancelled = false;
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setLottieData(data);
      })
      .catch(() => {
        if (!cancelled) setLottieFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [isLottie, url]);

  if (!isLottie) {
    return (
      <Image
        src={url}
        alt={name}
        width={size}
        height={size}
        unoptimized={ANIMATED_STICKER_FORMATS.has(format)}
        className="object-contain transition-transform group-hover:scale-110"
      />
    );
  }

  if (lottieData) {
    return (
      <Lottie
        src={lottieData}
        autoplay
        loop
        className="transition-transform group-hover:scale-110"
        style={{ width: size, height: size }}
      />
    );
  }

  if (lottieFailed) {
    return (
      <div
        style={{ width: size, height: size }}
        className="flex items-center justify-center text-zinc-300 dark:text-zinc-700"
      >
        <Sparkles size={size / 3} />
      </div>
    );
  }

  return (
    <div
      style={{ width: size, height: size }}
      className="animate-pulse rounded-lg bg-zinc-200 dark:bg-zinc-800"
    />
  );
}
