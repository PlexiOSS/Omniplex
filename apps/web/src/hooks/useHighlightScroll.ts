"use client";

// Copyright (C) 2026 NodeByte LTD

import { useEffect } from "react";
import { scrollBehavior } from "@/lib/utils/motion";

export function useHighlightScroll(elementId: string | undefined) {
  useEffect(() => {
    if (!elementId) return;
    const el = document.getElementById(elementId);
    if (!el) return;
    el.scrollIntoView({ behavior: scrollBehavior(), block: "center" });
  }, [elementId]);
}
