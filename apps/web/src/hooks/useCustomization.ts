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
export type SurfaceOption =
  | "zinc"
  | "slate"
  | "stone"
  | "discord"
  | "midnight"
  | "arctic"
  | "dusk"
  | "moss"
  | "paper";
export type DensityOption = "compact" | "cozy" | "spacious";
export type TextSizeOption = "small" | "default" | "large" | "larger";
export type MotionOption = "system" | "reduce" | "full";
export type ModeOption = "light" | "dark" | "system";

export interface CustomizationPrefs {
  accent: AccentColor;
  font: FontOption;
  layout: LayoutOption;
  radius: RadiusOption;
  surface: SurfaceOption;
  density: DensityOption;
  textSize: TextSizeOption;
  motion: MotionOption;
  hiddenStats: CardStat[];
  hiddenTags: string[];
  hideNsfw: boolean;
  blurNsfw: boolean;
  hideOffline: boolean;
}

export const CUSTOMIZATION_DEFAULTS: CustomizationPrefs = {
  accent: "indigo",
  font: "sans",
  layout: "comfortable",
  radius: "default",
  surface: "zinc",
  density: "cozy",
  textSize: "default",
  motion: "system",
  hiddenStats: ["invites", "shards"],
  hiddenTags: [],
  hideNsfw: false,
  blurNsfw: true,
  hideOffline: false,
};

export const MAX_HIDDEN_TAGS = 50;

export { tagAttr, tagSlug } from "@/lib/utils/tagFilter";

export const STORAGE_KEY = "omniplex-prefs";

export type SyncState = "device" | "account" | "saving" | "error";

export interface CustomizationContextValue extends CustomizationPrefs {
  update: (patch: Partial<CustomizationPrefs>) => void;
  setAccent: (accent: AccentColor) => void;
  setFont: (font: FontOption) => void;
  setLayout: (layout: LayoutOption) => void;
  setRadius: (radius: RadiusOption) => void;
  applyPreset: (preset: ThemePreset) => void;
  toggleStat: (stat: CardStat) => void;
  toggleTag: (tag: string) => void;
  resetPrefs: () => void;
  setHideNsfw: (hideNsfw: boolean) => void;
  setBlurNsfw: (blurNsfw: boolean) => void;
  sync: SyncState;
}

export const CustomizationContext = createContext<CustomizationContextValue>({
  ...CUSTOMIZATION_DEFAULTS,
  update: () => {},
  setAccent: () => {},
  setFont: () => {},
  setLayout: () => {},
  setRadius: () => {},
  applyPreset: () => {},
  toggleStat: () => {},
  toggleTag: () => {},
  resetPrefs: () => {},
  setHideNsfw: () => {},
  setBlurNsfw: () => {},
  sync: "device",
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

export const SURFACE_OPTIONS: {
  value: SurfaceOption;
  label: string;
  description: string;
  light: [string, string, string];
  dark: [string, string, string];
}[] = [
  {
    value: "zinc",
    label: "Default",
    description: "Neutral grey",
    light: ["#ffffff", "#f4f4f5", "#e4e4e7"],
    dark: ["#09090b", "#18181b", "#27272a"],
  },
  {
    value: "midnight",
    label: "Midnight",
    description: "True black, great on OLED",
    light: ["#ffffff", "#f5f5f5", "#e5e5e5"],
    dark: ["#000000", "#0a0a0a", "#171717"],
  },
  {
    value: "discord",
    label: "Discord",
    description: "The greys you know from Discord",
    light: ["#f2f3f5", "#ffffff", "#e3e5e8"],
    dark: ["#2b2d31", "#313338", "#3f4147"],
  },
  {
    value: "slate",
    label: "Slate",
    description: "Cool, slightly blue",
    light: ["#f8fafc", "#f1f5f9", "#e2e8f0"],
    dark: ["#020617", "#0f172a", "#1e293b"],
  },
  {
    value: "arctic",
    label: "Arctic",
    description: "Soft blue-grey, low contrast",
    light: ["#eceff4", "#e5e9f0", "#d8dee9"],
    dark: ["#242933", "#2e3440", "#3b4252"],
  },
  {
    value: "dusk",
    label: "Dusk",
    description: "Deep purple-grey",
    light: ["#f3f4fb", "#e6e9f5", "#cdd6f4"],
    dark: ["#11111b", "#1e1e2e", "#313244"],
  },
  {
    value: "moss",
    label: "Moss",
    description: "Green-tinted, calm",
    light: ["#f6f8f6", "#eef2ef", "#dde5df"],
    dark: ["#0b120f", "#121c17", "#1d2a23"],
  },
  {
    value: "stone",
    label: "Stone",
    description: "Warm grey",
    light: ["#fafaf9", "#f5f5f4", "#e7e5e4"],
    dark: ["#0c0a09", "#1c1917", "#292524"],
  },
  {
    value: "paper",
    label: "Paper",
    description: "Cream and ink, easy reading",
    light: ["#faf6ee", "#f3ecdf", "#e6dccb"],
    dark: ["#14110d", "#201b16", "#2e2720"],
  },
];

export const DENSITY_OPTIONS: {
  value: DensityOption;
  label: string;
  description: string;
}[] = [
  { value: "compact", label: "Compact", description: "Tighter spacing" },
  { value: "cozy", label: "Cozy", description: "Default spacing" },
  { value: "spacious", label: "Spacious", description: "More breathing room" },
];

export const TEXT_SIZE_OPTIONS: {
  value: TextSizeOption;
  label: string;
  scale: string;
}[] = [
  { value: "small", label: "Small", scale: "93.75%" },
  { value: "default", label: "Default", scale: "100%" },
  { value: "large", label: "Large", scale: "112.5%" },
  { value: "larger", label: "Larger", scale: "125%" },
];

export const MOTION_OPTIONS: {
  value: MotionOption;
  label: string;
  description: string;
}[] = [
  { value: "system", label: "System", description: "Follow your device" },
  { value: "reduce", label: "Reduce", description: "No animations" },
  { value: "full", label: "Full", description: "Always animate" },
];

export interface ThemePreset {
  id: string;
  label: string;
  description: string;
  accent: AccentColor;
  font: FontOption;
  radius: RadiusOption;
  surface: SurfaceOption;
  layout?: LayoutOption;
  density?: DensityOption;
  textSize?: TextSizeOption;
  mode?: Exclude<ModeOption, "system">;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: "classic",
    label: "Classic",
    description: "The Omniplex look",
    accent: "indigo",
    font: "sans",
    radius: "default",
    surface: "zinc",
    layout: "comfortable",
    density: "cozy",
  },
  {
    id: "discord",
    label: "Discord",
    description: "Discord's greys and blurple",
    accent: "blurple",
    font: "inter",
    radius: "default",
    surface: "discord",
    density: "cozy",
    mode: "dark",
  },
  {
    id: "midnight",
    label: "Midnight",
    description: "True black for OLED",
    accent: "violet",
    font: "sans",
    radius: "default",
    surface: "midnight",
    mode: "dark",
  },
  {
    id: "terminal",
    label: "Terminal",
    description: "Mono, sharp and dense",
    accent: "lime",
    font: "mono",
    radius: "sharp",
    surface: "midnight",
    layout: "wide",
    density: "compact",
    mode: "dark",
  },
  {
    id: "arctic",
    label: "Arctic",
    description: "Cool blues, low contrast",
    accent: "cyan",
    font: "manrope",
    radius: "round",
    surface: "arctic",
  },
  {
    id: "dusk",
    label: "Dusk",
    description: "Purple night, soft corners",
    accent: "purple",
    font: "rounded",
    radius: "round",
    surface: "dusk",
    mode: "dark",
  },
  {
    id: "paper",
    label: "Paper",
    description: "Cream pages for reading",
    accent: "amber",
    font: "serif",
    radius: "sharp",
    surface: "paper",
    layout: "compact",
    density: "spacious",
    mode: "light",
  },
  {
    id: "editorial",
    label: "Editorial",
    description: "Magazine serif",
    accent: "rose",
    font: "serif",
    radius: "sharp",
    surface: "stone",
    layout: "compact",
  },
  {
    id: "forest",
    label: "Forest",
    description: "Green and calm",
    accent: "emerald",
    font: "dmsans",
    radius: "default",
    surface: "moss",
  },
  {
    id: "ocean",
    label: "Ocean",
    description: "Slate and sky blue",
    accent: "sky",
    font: "manrope",
    radius: "round",
    surface: "slate",
  },
  {
    id: "bubblegum",
    label: "Bubblegum",
    description: "Pink, round and roomy",
    accent: "pink",
    font: "nunito",
    radius: "round",
    surface: "zinc",
    density: "spacious",
  },
  {
    id: "neon",
    label: "Neon",
    description: "Bright accents on black",
    accent: "fuchsia",
    font: "grotesk",
    radius: "default",
    surface: "midnight",
    mode: "dark",
  },
  {
    id: "dashboard",
    label: "Dashboard",
    description: "Dense and wide for power users",
    accent: "blue",
    font: "inter",
    radius: "sharp",
    surface: "slate",
    layout: "wide",
    density: "compact",
  },
  {
    id: "clear",
    label: "Clear",
    description: "Larger, high legibility text",
    accent: "blue",
    font: "atkinson",
    radius: "default",
    surface: "zinc",
    density: "spacious",
    textSize: "large",
  },
];

export function presetFields(preset: ThemePreset): Partial<CustomizationPrefs> {
  const out: Partial<CustomizationPrefs> = {
    accent: preset.accent,
    font: preset.font,
    radius: preset.radius,
    surface: preset.surface,
  };
  if (preset.layout) out.layout = preset.layout;
  if (preset.density) out.density = preset.density;
  if (preset.textSize) out.textSize = preset.textSize;
  return out;
}

export function presetActive(
  preset: ThemePreset,
  prefs: CustomizationPrefs,
): boolean {
  const fields = presetFields(preset) as Record<string, unknown>;
  const current = prefs as unknown as Record<string, unknown>;
  return Object.keys(fields).every((k) => fields[k] === current[k]);
}

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
