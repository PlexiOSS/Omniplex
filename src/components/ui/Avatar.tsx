"use client";

import Image from "next/image";

type PresenceStatus = "online" | "idle" | "dnd" | "offline";

const STATUS_COLORS: Record<PresenceStatus, string> = {
  online: "bg-green-500",
  idle: "bg-amber-500",
  dnd: "bg-red-500",
  offline: "bg-zinc-400 dark:bg-zinc-600",
};

interface AvatarProps {
  src: string;
  alt: string;
  size?: number;
  className?: string;
  /** Shows a small presence dot in the bottom-right corner when set. */
  status?: PresenceStatus;
}

export function Avatar({
  src,
  alt,
  size = 40,
  className = "",
  status,
}: AvatarProps) {
  return (
    <div
      className={["relative shrink-0", className].join(" ")}
      style={{ width: size, height: size }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
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
      {status && (
        <span
          title={status}
          className={[
            "absolute right-0 bottom-0 rounded-full ring-2 ring-white dark:ring-zinc-950",
            STATUS_COLORS[status],
          ].join(" ")}
          style={{
            width: Math.max(8, Math.round(size * 0.28)),
            height: Math.max(8, Math.round(size * 0.28)),
          }}
        />
      )}
    </div>
  );
}
