export type AccentColor =
  | "indigo"
  | "purple"
  | "blue"
  | "emerald"
  | "rose"
  | "orange"
  | "amber";

export const ACCENT_COLORS: Record<AccentColor, string> = {
  indigo: "#6366f1",
  purple: "#a855f7",
  blue: "#3b82f6",
  emerald: "#10b981",
  rose: "#f43f5e",
  orange: "#f97316",
  amber: "#eab308",
};

export const ACCENT_LABELS: Record<AccentColor, string> = {
  indigo: "Indigo",
  purple: "Purple",
  blue: "Blue",
  emerald: "Emerald",
  rose: "Rose",
  orange: "Orange",
  amber: "Amber",
};

export const ACCENT_VALUES = Object.keys(ACCENT_COLORS) as AccentColor[];

export function isAccentColor(value: string): value is AccentColor {
  return value in ACCENT_COLORS;
}
