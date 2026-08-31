"use client";

// Copyright (C) 2026 NodeByte LTD 

import { createContext, useContext } from "react";
import {
  ACCENT_COLORS,
  ACCENT_LABELS,
  ACCENT_VALUES,
  type AccentColor,
} from "@/lib/constants/accent";

export type { AccentColor };
export type FontOption = "sans" | "serif" | "rounded" | "mono" | "inter" | "grotesk";
export type LayoutOption = "compact" | "comfortable" | "wide";

export interface CustomizationPrefs {
  accent: AccentColor;
  font: FontOption;
  layout: LayoutOption;
  hideNsfw: boolean;
  blurNsfw: boolean;
}

export const CUSTOMIZATION_DEFAULTS: CustomizationPrefs = {
  accent: "indigo",
  font: "sans",
  layout: "comfortable",
  hideNsfw: false,
  blurNsfw: true,
};

export const STORAGE_KEY = "omniplex-prefs";

export interface CustomizationContextValue extends CustomizationPrefs {
  setAccent: (accent: AccentColor) => void;
  setFont: (font: FontOption) => void;
  setLayout: (layout: LayoutOption) => void;
  setHideNsfw: (hideNsfw: boolean) => void;
  setBlurNsfw: (blurNsfw: boolean) => void;
}

export const CustomizationContext = createContext<CustomizationContextValue>({
  ...CUSTOMIZATION_DEFAULTS,
  setAccent: () => {},
  setFont: () => {},
  setLayout: () => {},
  setHideNsfw: () => {},
  setBlurNsfw: () => {},
});

export function useCustomization() {
  return useContext(CustomizationContext);
}

export const ACCENT_OPTIONS: {
  value: AccentColor;
  label: string;
  color: string;
}[] = ACCENT_VALUES.map((value) => ({
  value,
  label: ACCENT_LABELS[value],
  color: ACCENT_COLORS[value],
}));

export const FONT_OPTIONS: {
  value: FontOption;
  label: string;
  description: string;
}[] = [
  { value: "sans", label: "Geist", description: "Default, clean, modern" },
  { value: "inter", label: "Inter", description: "Neutral, everywhere" },
  { value: "rounded", label: "Jakarta", description: "Friendly, rounded" },
  { value: "grotesk", label: "Space Grotesk", description: "Geometric, technical" },
  { value: "serif", label: "Lora", description: "Elegant, literary" },
  { value: "mono", label: "Mono", description: "Developer aesthetic" },
];

export const LAYOUT_OPTIONS: {
  value: LayoutOption;
  label: string;
  description: string;
}[] = [
  { value: "compact", label: "Compact", description: "Narrower, denser pages" },
  { value: "comfortable", label: "Comfortable", description: "Default page width" },
  { value: "wide", label: "Wide", description: "Maximize use of large screens" },
];
