"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

interface RotatingWordProps {
  words: string[];
  intervalMs?: number;
  className?: string;
}

const FADE_MS = 180;
const RESIZE_MS = 320;

export function RotatingWord({
  words,
  intervalMs = 2000,
  className,
}: RotatingWordProps) {
  const [index, setIndex] = useState(0);
  const [anim, setAnim] = useState<"in" | "out">("in");
  const [widths, setWidths] = useState<number[]>([]);
  const measureRefs = useRef<(HTMLSpanElement | null)[]>([]);

  useLayoutEffect(() => {
    const measure = () =>
      setWidths(
        measureRefs.current.map((el) => el?.getBoundingClientRect().width ?? 0),
      );
    measure();
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

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
  const width = widths[index];

  return (
    <span
      className="relative inline-block whitespace-nowrap align-baseline"
      style={{
        width: width ? `${width}px` : undefined,
        transition: `width ${RESIZE_MS}ms cubic-bezier(0.4,0,0.2,1)`,
      }}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none invisible absolute top-0 left-0 whitespace-nowrap"
      >
        {words.map((w, i) => (
          <span
            key={w}
            ref={(el) => {
              measureRefs.current[i] = el;
            }}
            className={["absolute top-0 left-0", className]
              .filter(Boolean)
              .join(" ")}
          >
            {w}
          </span>
        ))}
      </span>
      <span
        className={["inline-block will-change-transform", className]
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
