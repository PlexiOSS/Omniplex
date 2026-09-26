"use client";

import Image from "next/image";
import { useState } from "react";
import { OmniplexLogo } from "./OmniplexLogo";

interface BannerProps {
  src?: string | null;
  fallbackSrc?: string | null;
  alt: string;
  className?: string;
  hideWhenMissing?: boolean;
}

export function Banner({
  src,
  fallbackSrc,
  alt,
  className = "",
  hideWhenMissing = false,
}: BannerProps) {
  const candidates = [src, fallbackSrc].filter((s): s is string => !!s);
  const [attempt, setAttempt] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const current = candidates[attempt];

  if (hideWhenMissing && !current) return null;

  return (
    <div
      className={[
        "relative overflow-hidden bg-linear-to-br from-accent/30 via-accent/10 to-transparent dark:from-accent/25 dark:via-accent/10",
        className,
        hideWhenMissing && !loaded ? "hidden" : "",
      ].join(" ")}
    >
      {current && (
        <Image
          key={current}
          src={current}
          alt={alt}
          fill
          sizes="100vw"
          className="object-cover"
          unoptimized
          loading={hideWhenMissing ? "eager" : undefined}
          onLoad={() => setLoaded(true)}
          onError={() => {
            setLoaded(false);
            setAttempt((a) => a + 1);
          }}
        />
      )}
      {!current && (
        <div className="absolute inset-0 flex items-center justify-center">
          <OmniplexLogo
            size={40}
            className="text-zinc-950/10 dark:text-white/10"
          />
        </div>
      )}
    </div>
  );
}
