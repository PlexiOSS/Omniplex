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
export type FontOption =
  | "sans"
  | "serif"
  | "rounded"
  | "mono"
  | "inter"
  | "grotesk"
  | "outfit"
  | "dmsans"
  | "manrope"
  | "nunito"
  | "plex"
  | "atkinson";
export type RadiusOption = "sharp" | "default" | "round";
export type CardStat =
  | "votes"
  | "size"
  | "online"
  | "views"
  | "invites"
  | "shards";
export type LayoutOption = "compact" | "comfortable" | "wide";

export interface CustomizationPrefs {
  accent: AccentColor;
  font: FontOption;
  layout: LayoutOption;
  radius: RadiusOption;
  hiddenStats: CardStat[];
  hideNsfw: boolean;
  blurNsfw: boolean;
}

export const CUSTOMIZATION_DEFAULTS: CustomizationPrefs = {
  accent: "indigo",
  font: "sans",
  layout: "comfortable",
  radius: "default",
  hiddenStats: ["invites", "shards"],
  hideNsfw: false,
  blurNsfw: true,
};

export const STORAGE_KEY = "omniplex-prefs";

export interface CustomizationContextValue extends CustomizationPrefs {
  setAccent: (accent: AccentColor) => void;
  setFont: (font: FontOption) => void;
  setLayout: (layout: LayoutOption) => void;
  setRadius: (radius: RadiusOption) => void;
  applyPreset: (preset: ThemePreset) => void;
  toggleStat: (stat: CardStat) => void;
  resetPrefs: () => void;
  setHideNsfw: (hideNsfw: boolean) => void;
  setBlurNsfw: (blurNsfw: boolean) => void;
}

export const CustomizationContext = createContext<CustomizationContextValue>({
  ...CUSTOMIZATION_DEFAULTS,
  setAccent: () => {},
  setFont: () => {},
  setLayout: () => {},
  setRadius: () => {},
  applyPreset: () => {},
  toggleStat: () => {},
  resetPrefs: () => {},
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
  family: string;
}[] = [
  {
    value: "sans",
    label: "Geist",
    description: "Default, clean, modern",
    family: "var(--font-geist-sans)",
  },
  {
    value: "inter",
    label: "Inter",
    description: "Neutral, everywhere",
    family: "var(--font-inter)",
  },
  {
    value: "dmsans",
    label: "DM Sans",
    description: "Soft, low contrast",
    family: "var(--font-dmsans)",
  },
  {
    value: "manrope",
    label: "Manrope",
    description: "Modern, open",
    family: "var(--font-manrope)",
  },
  {
    value: "rounded",
    label: "Jakarta",
    description: "Friendly, rounded",
    family: "var(--font-jakarta)",
  },
  {
    value: "nunito",
    label: "Nunito",
    description: "Playful, very round",
    family: "var(--font-nunito)",
  },
  {
    value: "outfit",
    label: "Outfit",
    description: "Geometric, bold",
    family: "var(--font-outfit)",
  },
  {
    value: "grotesk",
    label: "Space Grotesk",
    description: "Geometric, technical",
    family: "var(--font-grotesk)",
  },
  {
    value: "plex",
    label: "IBM Plex Sans",
    description: "Engineered, precise",
    family: "var(--font-plex)",
  },
  {
    value: "atkinson",
    label: "Atkinson",
    description: "Built for legibility",
    family: "var(--font-atkinson)",
  },
  {
    value: "serif",
    label: "Lora",
    description: "Elegant, literary",
    family: "var(--font-lora)",
  },
  {
    value: "mono",
    label: "Mono",
    description: "Developer aesthetic",
    family: "var(--font-geist-mono)",
  },
];

export const LAYOUT_OPTIONS: {
  value: LayoutOption;
  label: string;
  description: string;
}[] = [
  { value: "compact", label: "Compact", description: "Narrower, denser pages" },
  {
    value: "comfortable",
    label: "Comfortable",
    description: "Default page width",
  },
  {
    value: "wide",
    label: "Wide",
    description: "Maximize use of large screens",
  },
];

export const RADIUS_OPTIONS: {
  value: RadiusOption;
  label: string;
  preview: string;
}[] = [
  { value: "sharp", label: "Sharp", preview: "0.25rem" },
  { value: "default", label: "Default", preview: "0.625rem" },
  { value: "round", label: "Round", preview: "1rem" },
];

export interface ThemePreset {
  id: string;
  label: string;
  accent: AccentColor;
  font: FontOption;
  radius: RadiusOption;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "classic",
    label: "Classic",
    accent: "indigo",
    font: "sans",
    radius: "default",
  },
  {
    id: "discord",
    label: "Discord",
    accent: "blurple",
    font: "inter",
    radius: "default",
  },
  {
    id: "terminal",
    label: "Terminal",
    accent: "lime",
    font: "mono",
    radius: "sharp",
  },
  {
    id: "editorial",
    label: "Editorial",
    accent: "rose",
    font: "serif",
    radius: "sharp",
  },
  {
    id: "bubblegum",
    label: "Bubblegum",
    accent: "pink",
    font: "nunito",
    radius: "round",
  },
  {
    id: "ocean",
    label: "Ocean",
    accent: "sky",
    font: "manrope",
    radius: "round",
  },
  {
    id: "neon",
    label: "Neon",
    accent: "fuchsia",
    font: "grotesk",
    radius: "default",
  },
  {
    id: "forest",
    label: "Forest",
    accent: "emerald",
    font: "dmsans",
    radius: "default",
  },
];

export const CARD_STAT_OPTIONS: {
  value: CardStat;
  label: string;
  description: string;
}[] = [
  { value: "votes", label: "Votes", description: "Bots and servers" },
  {
    value: "size",
    label: "Size",
    description: "Servers a bot is in, or members",
  },
  {
    value: "online",
    label: "Online",
    description: "Members online, servers only",
  },
  { value: "views", label: "Views", description: "Page views" },
  {
    value: "invites",
    label: "Invite clicks",
    description: "Times the invite was opened",
  },
  { value: "shards", label: "Shards", description: "Bots only" },
];
