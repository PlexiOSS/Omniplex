"use client";

import { useEffect, useState } from "react";
import {
  CustomizationContext,
  CUSTOMIZATION_DEFAULTS,
  STORAGE_KEY,
  type AccentColor,
  type CustomizationPrefs,
  type FontOption,
} from "@/hooks/useCustomization";

function readPrefs(): CustomizationPrefs {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return CUSTOMIZATION_DEFAULTS;
    return { ...CUSTOMIZATION_DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return CUSTOMIZATION_DEFAULTS;
  }
}

function applyPrefs(prefs: CustomizationPrefs) {
  const el = document.documentElement;
  el.dataset.accent = prefs.accent;
  el.dataset.font = prefs.font;
}

function savePrefs(prefs: CustomizationPrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {}
}

export function CustomizationProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<CustomizationPrefs>(CUSTOMIZATION_DEFAULTS);

  // Sync from localStorage on mount
  useEffect(() => {
    const stored = readPrefs();
    setPrefs(stored);
    applyPrefs(stored);
  }, []);

  function setAccent(accent: AccentColor) {
    const next = { ...prefs, accent };
    setPrefs(next);
    applyPrefs(next);
    savePrefs(next);
  }

  function setFont(font: FontOption) {
    const next = { ...prefs, font };
    setPrefs(next);
    applyPrefs(next);
    savePrefs(next);
  }

  return (
    <CustomizationContext.Provider value={{ ...prefs, setAccent, setFont }}>
      {children}
    </CustomizationContext.Provider>
  );
}
