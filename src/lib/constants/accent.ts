// Copyright (C) 2026 NodeByte LTD

export type AccentColor =
  | "indigo"
  | "blurple"
  | "violet"
  | "purple"
  | "fuchsia"
  | "blue"
  | "sky"
  | "cyan"
  | "teal"
  | "emerald"
  | "green"
  | "lime"
  | "amber"
  | "orange"
  | "red"
  | "rose"
  | "pink";

export const ACCENT_COLORS: Record<AccentColor, string> = {
  indigo: "#6366f1",
  blurple: "#5865f2",
  violet: "#8b5cf6",
  purple: "#a855f7",
  fuchsia: "#d946ef",
  blue: "#3b82f6",
  sky: "#0ea5e9",
  cyan: "#06b6d4",
  teal: "#14b8a6",
  emerald: "#10b981",
  green: "#22c55e",
  lime: "#84cc16",
  amber: "#eab308",
  orange: "#f97316",
  red: "#ef4444",
  rose: "#f43f5e",
  pink: "#ec4899",
};

export const ACCENT_LABELS: Record<AccentColor, string> = {
  indigo: "Indigo",
  blurple: "Blurple",
  violet: "Violet",
  purple: "Purple",
  fuchsia: "Fuchsia",
  blue: "Blue",
  sky: "Sky",
  cyan: "Cyan",
  teal: "Teal",
  emerald: "Emerald",
  green: "Green",
  lime: "Lime",
  amber: "Amber",
  orange: "Orange",
  red: "Red",
  rose: "Rose",
  pink: "Pink",
};

export const ACCENT_VALUES = Object.keys(ACCENT_COLORS) as AccentColor[];

export function isAccentColor(value: string): value is AccentColor {
  return value in ACCENT_COLORS;
}
