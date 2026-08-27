"use client";

import Image from "next/image";
import { useState } from "react";
import { OmniplexLogo } from "./OmniplexLogo";

interface BannerProps {
  /** Null/omitted skips straight to the fallback — no request is made. */
  src?: string | null;
  alt: string;
  className?: string;
}

/**
 * Full-bleed hero banner for bot/server/team pages. Popplio no longer serves
 * banner URLs at all (the CDN upload pipeline they came from was removed),
 * so `src` is always a guess at a legacy CDN path that may 404 — this falls
 * back to a themed gradient (using the viewer's own accent color, so it
 * tracks Customize) instead of a broken image or empty space either way.
 */
export function Banner({ src, alt, className = "" }: BannerProps) {
  const [errored, setErrored] = useState(false);
  const showImage = !!src && !errored;

  return (
    <div
      className={[
        "relative overflow-hidden bg-linear-to-br from-accent/30 via-accent/10 to-transparent dark:from-accent/25 dark:via-accent/10",
        className,
      ].join(" ")}
    >
      {showImage && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes="100vw"
          className="object-cover"
          // Always our own /cdn/... proxy — see Avatar.tsx's identical note
          // on why bypassing Next's optimizer cache is the actual fix for
          // uploads not showing up instantly.
          unoptimized
          onError={() => setErrored(true)}
        />
      )}
      {!showImage && (
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
