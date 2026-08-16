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

const fallbackAvatarUrl = (alt: string, size: number) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(alt)}&size=${size}&background=random`;

/**
 * `PlatformUser.avatar` sometimes still holds an old absolute
 * `cdn.omniplex.gg/...` URL, mirrored there back when Popplio's dovewing
 * middleware used to copy Discord avatars onto the CDN (see Popplio's own
 * arcadia CONFORMANCE.md — that middleware was removed, so these are just
 * stale DB values that were never refreshed to a live Discord URL). Now
 * that `cdn.omniplex.gg` is a private bucket, any such URL 403s on every
 * request. Catch it before `next/image` ever attempts the doomed fetch —
 * `onError` alone still recovers visually, but not until after wasting a
 * round trip (and spamming the server log) per stale avatar per render.
 *
 * Every caller with a PlatformUser.avatar in hand — including the
 * signed-in user's own avatar — should be routing it through
 * `mirroredAvatarUrl()` (lib/utils/assets.ts) rather than passing the raw
 * value here, so this guard is normally a belt-and-suspenders backstop,
 * not the primary fix.
 */
function isDeadCdnUrl(src: string): boolean {
  return /^https?:\/\/cdn\.omniplex\.gg\//.test(src);
}

export function Avatar({
  src,
  alt,
  size = 40,
  className = "",
  status,
}: AvatarProps) {
  const resolvedSrc = isDeadCdnUrl(src) ? fallbackAvatarUrl(alt, size) : src;

  return (
    <div
      className={["relative shrink-0", className].join(" ")}
      style={{ width: size, height: size }}
    >
      <div className="relative h-full w-full overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={resolvedSrc}
          alt={alt}
          fill
          sizes={`${size}px`}
          className="object-cover"
          // Every source here is either our own /cdn/... proxy (already a
          // correctly-sized webp) or Discord's hash-versioned CDN — nothing
          // gains from Next's re-optimization, and its optimizer cache sits
          // in front of /cdn/...'s own (already-fixed) cache headers without
          // reliably revalidating against them, which is what made a fresh
          // upload look stale even after the origin had the new bytes.
          unoptimized
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src = fallbackAvatarUrl(
              alt,
              size,
            );
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
