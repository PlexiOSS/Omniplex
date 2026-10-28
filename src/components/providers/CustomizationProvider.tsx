"use client";

import { useEffect, useState } from "react";
import {
  type AccentColor,
  type CardStat,
  CUSTOMIZATION_DEFAULTS,
  CustomizationContext,
  type CustomizationPrefs,
  type FontOption,
  type LayoutOption,
  type RadiusOption,
  STORAGE_KEY,
  type ThemePreset,
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
  el.dataset.layout = prefs.layout;
  el.dataset.radius = prefs.radius;
  el.dataset.hiddenStats = prefs.hiddenStats.join(" ");
  el.dataset.hideNsfw = String(prefs.hideNsfw);
  // Blurring is meaningless once nsfw content is hidden outright — collapse
  // both prefs into one applied flag so the CSS rule doesn't need to know
  // about hideNsfw at all.
  el.dataset.blurNsfw = String(prefs.blurNsfw && !prefs.hideNsfw);
}

function savePrefs(prefs: CustomizationPrefs) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {}
}

export function CustomizationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [prefs, setPrefs] = useState<CustomizationPrefs>(
    CUSTOMIZATION_DEFAULTS,
  );

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

  function setLayout(layout: LayoutOption) {
    const next = { ...prefs, layout };
    setPrefs(next);
    applyPrefs(next);
    savePrefs(next);
  }

  function setRadius(radius: RadiusOption) {
    const next = { ...prefs, radius };
    setPrefs(next);
    applyPrefs(next);
    savePrefs(next);
  }

  function applyPreset(preset: ThemePreset) {
    const next = {
      ...prefs,
      accent: preset.accent,
      font: preset.font,
      radius: preset.radius,
    };
    setPrefs(next);
    applyPrefs(next);
    savePrefs(next);
  }

  function toggleStat(stat: CardStat) {
    const hiddenStats = prefs.hiddenStats.includes(stat)
      ? prefs.hiddenStats.filter((s) => s !== stat)
      : [...prefs.hiddenStats, stat];
    const next = { ...prefs, hiddenStats };
    setPrefs(next);
    applyPrefs(next);
    savePrefs(next);
  }

  function resetPrefs() {
    setPrefs(CUSTOMIZATION_DEFAULTS);
    applyPrefs(CUSTOMIZATION_DEFAULTS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  }

  function setHideNsfw(hideNsfw: boolean) {
    const next = { ...prefs, hideNsfw };
    setPrefs(next);
    applyPrefs(next);
    savePrefs(next);
  }

  function setBlurNsfw(blurNsfw: boolean) {
    const next = { ...prefs, blurNsfw };
    setPrefs(next);
    applyPrefs(next);
    savePrefs(next);
  }

  return (
    <CustomizationContext.Provider
      value={{
        ...prefs,
        setAccent,
        setFont,
        setLayout,
        setRadius,
        applyPreset,
        toggleStat,
        resetPrefs,
        setHideNsfw,
        setBlurNsfw,
      }}
    >
      {children}
    </CustomizationContext.Provider>
  );
}
