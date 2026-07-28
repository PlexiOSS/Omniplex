"use client";

import { createContext, useContext } from "react";
import {
  ACCENT_COLORS,
  ACCENT_LABELS,
  ACCENT_VALUES,
  type AccentColor,
} from "@/lib/constants/accent";

export type { AccentColor };
export type FontOption = "sans" | "serif" | "rounded" | "mono";

export interface CustomizationPrefs {
  accent: AccentColor;
  font: FontOption;
}

export const CUSTOMIZATION_DEFAULTS: CustomizationPrefs = {
  accent: "indigo",
  font: "sans",
};

export const STORAGE_KEY = "omniplex-prefs";

export interface CustomizationContextValue extends CustomizationPrefs {
  setAccent: (accent: AccentColor) => void;
  setFont: (font: FontOption) => void;
}

export const CustomizationContext = createContext<CustomizationContextValue>({
  ...CUSTOMIZATION_DEFAULTS,
  setAccent: () => {},
  setFont: () => {},
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
  { value: "sans", label: "Geist", description: "Default — clean, modern" },
  { value: "rounded", label: "Jakarta", description: "Friendly, rounded" },
  { value: "serif", label: "Lora", description: "Elegant, literary" },
  { value: "mono", label: "Mono", description: "Developer aesthetic" },
];
