"use client";

import { type RefObject, useLayoutEffect } from "react";

export function useFitViewport(
  ref: RefObject<HTMLElement | null>,
  active: boolean,
  margin = 12,
) {
  useLayoutEffect(() => {
    if (!active) return;
    const el = ref.current;
    if (!el) return;

    function fit() {
      if (!el) return;
      el.style.transform = "";
      const rect = el.getBoundingClientRect();
      const width = document.documentElement.clientWidth;
      let shift = 0;
      if (rect.right > width - margin) shift = width - margin - rect.right;
      if (rect.left + shift < margin) shift = margin - rect.left;
      el.style.transform = shift ? `translateX(${shift}px)` : "";
    }

    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [ref, active, margin]);
}
