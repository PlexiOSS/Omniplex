"use client";

import { bots } from "@omniplex/core/api";
import { useEffect, useState } from "react";

const SPOTS = [
  { x: 82, y: 7, size: 64 },
  { x: 62, y: 13, size: 44 },
  { x: 95, y: 21, size: 52 },
  { x: 74, y: 27, size: 76 },
  { x: 90, y: 40, size: 48 },
  { x: 70, y: 47, size: 56 },
  { x: 86, y: 57, size: 84 },
  { x: 97, y: 70, size: 44 },
  { x: 73, y: 69, size: 48 },
  { x: 84, y: 82, size: 60 },
  { x: 64, y: 88, size: 72 },
  { x: 96, y: 92, size: 52 },
  { x: 48, y: 96, size: 48 },
];

const LINKS: [number, number][] = [
  [0, 1],
  [0, 3],
  [2, 3],
  [3, 4],
  [3, 5],
  [4, 6],
  [5, 6],
  [6, 7],
  [6, 8],
  [8, 9],
  [9, 10],
  [9, 11],
  [10, 12],
];

function sized(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname === "cdn.discordapp.com") u.searchParams.set("size", "128");
    return u.toString();
  } catch {
    return null;
  }
}

export function BotConstellation() {
  const [avatars, setAvatars] = useState<string[]>([]);
  const [failed, setFailed] = useState<Set<number>>(new Set());

  useEffect(() => {
    let cancelled = false;
    bots
      .getIndex()
      .then((index) => {
        const seen = new Set<string>();
        const urls: string[] = [];
        for (const bot of [
          ...index.certified,
          ...index.top_voted,
          ...index.most_viewed,
          ...index.premium,
          ...index.recently_added,
        ]) {
          if (seen.has(bot.bot_id) || !bot.user?.avatar) continue;
          seen.add(bot.bot_id);
          const url = sized(bot.user.avatar);
          if (url) urls.push(url);
          if (urls.length === SPOTS.length) break;
        }
        if (!cancelled) setAvatars(urls);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (avatars.length === 0) return null;

  const shown = SPOTS.slice(0, avatars.length);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 animate-[constellation-in_1.2s_ease-out_both] mask-[linear-gradient(to_right,transparent_20%,black_70%)]"
    >
      <svg
        aria-hidden="true"
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {LINKS.filter(([a, b]) => a < shown.length && b < shown.length).map(
          ([a, b]) => (
            <line
              key={`${a}-${b}`}
              x1={shown[a].x}
              y1={shown[a].y}
              x2={shown[b].x}
              y2={shown[b].y}
              stroke="rgb(255 255 255 / 0.08)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ),
        )}
      </svg>
      {shown.map((spot, i) =>
        failed.has(i) ? null : (
          <span
            key={avatars[i]}
            className="absolute -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-full bg-zinc-900 opacity-30 ring-1 ring-white/15"
            style={{
              left: `${spot.x}%`,
              top: `${spot.y}%`,
              width: spot.size,
              height: spot.size,
            }}
          >
            {/* biome-ignore lint/performance/noImgElement: decorative remote avatars, sized by CSS */}
            <img
              src={avatars[i]}
              alt=""
              loading="lazy"
              referrerPolicy="no-referrer"
              className="h-full w-full object-cover"
              onError={() => setFailed((prev) => new Set(prev).add(i))}
            />
          </span>
        ),
      )}
    </div>
  );
}
