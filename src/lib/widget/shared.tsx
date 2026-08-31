// Copyright (C) 2026 NodeByte LTD 

import { OmniplexLogo } from "@/components/ui/OmniplexLogo";
import { ACCENT_COLORS, isAccentColor } from "@/lib/constants/accent";

export const WIDGET_SIZE = { width: 480, height: 180 };
export const WIDGET_CONTENT_TYPE = "image/png";

export interface WidgetTheme {
  bg: string;
  bgSecondary: string;
  fg: string;
  muted: string;
  dim: string;
  border: string;
  accent: string;
}

const THEMES: Record<"dark" | "light", Omit<WidgetTheme, "accent">> = {
  dark: {
    bg: "#09090b",
    bgSecondary: "#18181b",
    fg: "#fafafa",
    muted: "#a1a1aa",
    dim: "#71717a",
    border: "#27272a",
  },
  light: {
    bg: "#ffffff",
    bgSecondary: "#f4f4f5",
    fg: "#09090b",
    muted: "#52525b",
    dim: "#71717a",
    border: "#e4e4e7",
  },
};

export function resolveWidgetTheme(searchParams: URLSearchParams): WidgetTheme {
  const themeParam = searchParams.get("theme");
  const theme = themeParam === "light" ? "light" : "dark";

  const accentParam = searchParams.get("accent") ?? "";
  const accent = isAccentColor(accentParam)
    ? ACCENT_COLORS[accentParam]
    : ACCENT_COLORS.indigo;

  return { ...THEMES[theme], accent };
}

export function resolveVisibleStats(
  searchParams: URLSearchParams,
  allKeys: string[],
): Set<string> {
  const raw = searchParams.get("stats");
  if (raw === null) return new Set(allKeys);
  if (raw.trim() === "") return new Set();

  const requested = new Set(raw.split(",").map((s) => s.trim()));
  return new Set(allKeys.filter((key) => requested.has(key)));
}

export function WidgetFrame({
  theme,
  children,
}: {
  theme: WidgetTheme;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: theme.bg,
        border: `1px solid ${theme.border}`,
        borderRadius: 16,
        padding: "18px 22px",
        fontFamily: "system-ui, sans-serif",
        position: "relative",
      }}
    >
      {children}

      {/* Watermark */}
      <div
        style={{
          position: "absolute",
          bottom: 14,
          right: 18,
          display: "flex",
          alignItems: "center",
          gap: 5,
        }}
      >
        <div style={{ display: "flex", color: theme.dim }}>
          <OmniplexLogo size={13} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, color: theme.dim }}>
          Omniplex
        </span>
      </div>

      {/* Accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          bottom: 0,
          width: 4,
          borderTopLeftRadius: 16,
          borderBottomLeftRadius: 16,
          background: theme.accent,
        }}
      />
    </div>
  );
}

export function WidgetStat({
  theme,
  label,
  value,
}: {
  theme: WidgetTheme;
  label: string;
  value: string;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
      <span style={{ fontSize: 20, fontWeight: 700, color: theme.fg }}>
        {value}
      </span>
      <span style={{ fontSize: 11, color: theme.dim }}>{label}</span>
    </div>
  );
}

export function WidgetBadge({
  theme,
  children,
}: {
  theme: WidgetTheme;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: theme.bgSecondary,
        color: theme.muted,
        borderRadius: 9999,
        padding: "2px 9px",
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

export function widgetClamp(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}

export interface WidgetStatDef {
  key: string;
  label: string;
}

export const BOT_WIDGET_STATS: WidgetStatDef[] = [
  { key: "votes", label: "Votes" },
  { key: "servers", label: "Servers" },
];

export const SERVER_WIDGET_STATS: WidgetStatDef[] = [
  { key: "votes", label: "Votes" },
  { key: "members", label: "Members" },
];

export const PACK_WIDGET_STATS: WidgetStatDef[] = [
  { key: "votes", label: "Votes" },
  { key: "bots", label: "Bots" },
];
