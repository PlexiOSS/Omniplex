export type AccentColor =
  | "indigo"
  | "purple"
  | "blue"
  | "cyan"
  | "teal"
  | "emerald"
  | "lime"
  | "amber"
  | "orange"
  | "red"
  | "rose"
  | "pink";

export const ACCENT_COLORS: Record<AccentColor, string> = {
  indigo: "#6366f1",
  purple: "#a855f7",
  blue: "#3b82f6",
  cyan: "#06b6d4",
  teal: "#14b8a6",
  emerald: "#10b981",
  lime: "#84cc16",
  amber: "#eab308",
  orange: "#f97316",
  red: "#ef4444",
  rose: "#f43f5e",
  pink: "#ec4899",
};

export const ACCENT_LABELS: Record<AccentColor, string> = {
  indigo: "Indigo",
  purple: "Purple",
  blue: "Blue",
  cyan: "Cyan",
  teal: "Teal",
  emerald: "Emerald",
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
