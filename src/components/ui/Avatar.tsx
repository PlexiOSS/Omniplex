"use client";

import Image from "next/image";

interface AvatarProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
}

export function Avatar({ src, alt, size = 40, className = "" }: AvatarProps) {
  return (
    <div
      className={[
        "relative shrink-0 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800",
        className,
      ].join(" ")}
      style={{ width: size, height: size }}
    >
      <Image
        src={src}
        alt={alt}
        fill
        sizes={`${size}px`}
        className="object-cover"
        onError={(e) => {
          (e.currentTarget as HTMLImageElement).src =
            `https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&size=${size}&background=random`;
        }}
      />
    </div>
  );
}
