"use client";

import { useEffect, useState } from "react";

interface RotatingWordProps {
  /** Cycled in order. Add more here later — nothing else needs to change. */
  words: string[];
  intervalMs?: number;
  className?: string;
}

const FADE_MS = 180;

/** Crossfades + slight slide in place — inline like static text but snappier.
 * Uses opacity + translate + blur for a crisp swap; stays inline so the hero
 * doesn't reflow for longer words like "servers"/"packs". */
export function RotatingWord({
  words,
  intervalMs = 2000,
  className,
}: RotatingWordProps) {
  const [index, setIndex] = useState(0);
  const [anim, setAnim] = useState<"in" | "out">("in");

  useEffect(() => {
    if (words.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => {
      setAnim("out");
      setTimeout(() => {
        setIndex((i) => (i + 1) % words.length);
        setAnim("in");
      }, FADE_MS);
    }, intervalMs);

    return () => clearInterval(id);
  }, [words, intervalMs]);

  const entering = anim === "in";
  const longest = words.reduce((a, b) => (a.length >= b.length ? a : b), "");

  return (
    <span className="inline-grid align-baseline">
      {/* Sizer — invisible but reserves width of longest word so the h1 never reflows */}
      <span
        className={["invisible col-start-1 row-start-1", className]
          .filter(Boolean)
          .join(" ")}
        aria-hidden="true"
      >
        {longest}
      </span>
      <span
        className={[
          "col-start-1 row-start-1 inline-block will-change-transform",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        style={{
          opacity: entering ? 1 : 0,
          transform: entering ? "translateY(0)" : "translateY(8px)",
          filter: entering ? "blur(0px)" : "blur(4px)",
          transition: `opacity ${FADE_MS}ms cubic-bezier(0.4,0,0.2,1), transform ${FADE_MS}ms cubic-bezier(0.4,0,0.2,1), filter ${FADE_MS}ms cubic-bezier(0.4,0,0.2,1)`,
        }}
      >
        {words[index]}
      </span>
    </span>
  );
}
