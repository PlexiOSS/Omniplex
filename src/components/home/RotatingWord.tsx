"use client";

import { useEffect, useState } from "react";

interface RotatingWordProps {
  /** Cycled in order. Add more here later — nothing else needs to change. */
  words: string[];
  intervalMs?: number;
  className?: string;
}

const FADE_MS = 300;

/** Crossfades in place as normal inline text — flows with the surrounding
 * heading exactly like a static word would, just swapped out periodically. */
export function RotatingWord({
  words,
  intervalMs = 2600,
  className,
}: RotatingWordProps) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (words.length <= 1) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIndex((i) => (i + 1) % words.length);
        setVisible(true);
      }, FADE_MS);
    }, intervalMs);

    return () => clearInterval(id);
  }, [words, intervalMs]);

  return (
    <span
      className={[
        "inline-block transition-opacity ease-out",
        visible ? "opacity-100" : "opacity-0",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{ transitionDuration: `${FADE_MS}ms` }}
    >
      {words[index]}
    </span>
  );
}
