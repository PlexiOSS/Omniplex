"use client";

import Image from "next/image";
import { useState } from "react";
import { OmniplexLogo } from "./OmniplexLogo";

interface BannerProps {
  src?: string | null;
  alt: string;
  className?: string;
}

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
