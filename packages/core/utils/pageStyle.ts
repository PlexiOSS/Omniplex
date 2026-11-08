import { CDN_URL } from "../api/config";
import type { PageGradient, PageStyle } from "../api/types";

export const PAGE_GRADIENTS: {
  id: PageGradient;
  label: string;
  css: string;
}[] = [
  {
    id: "aurora",
    label: "Aurora",
    css: "radial-gradient(60% 80% at 15% 10%, #22d3ee55, transparent 60%), radial-gradient(50% 70% at 85% 20%, #a855f766, transparent 60%), linear-gradient(160deg, #1e1b4b, #0f172a)",
  },
  {
    id: "sunset",
    label: "Sunset",
    css: "radial-gradient(70% 90% at 80% 0%, #fb923c77, transparent 60%), linear-gradient(160deg, #9d174d, #4c1d95)",
  },
  {
    id: "ocean",
    label: "Ocean",
    css: "radial-gradient(60% 80% at 20% 0%, #38bdf866, transparent 60%), linear-gradient(170deg, #0c4a6e, #082f49)",
  },
  {
    id: "forest",
    label: "Forest",
    css: "radial-gradient(60% 80% at 80% 0%, #4ade8055, transparent 60%), linear-gradient(170deg, #14532d, #052e16)",
  },
  {
    id: "candy",
    label: "Candy",
    css: "radial-gradient(60% 80% at 10% 10%, #f472b677, transparent 60%), radial-gradient(60% 80% at 90% 30%, #818cf877, transparent 60%), linear-gradient(160deg, #831843, #312e81)",
  },
  {
    id: "midnight",
    label: "Midnight",
    css: "radial-gradient(50% 60% at 50% 0%, #6366f155, transparent 70%), linear-gradient(180deg, #111827, #030712)",
  },
  {
    id: "ember",
    label: "Ember",
    css: "radial-gradient(60% 80% at 50% 0%, #f9731666, transparent 60%), linear-gradient(170deg, #7c2d12, #1c1917)",
  },
  {
    id: "mono",
    label: "Mono",
    css: "radial-gradient(60% 80% at 30% 0%, #a1a1aa44, transparent 60%), linear-gradient(170deg, #3f3f46, #09090b)",
  },
];

export function gradientCss(id: PageGradient | null | undefined) {
  return PAGE_GRADIENTS.find((g) => g.id === id)?.css ?? null;
}

export function pageImageUrl(
  target: "bot" | "server",
  id: string,
  version: string,
) {
  return `${CDN_URL}/backgrounds/${target}s/${id}/${version}.webp`;
}

function channel(hex: string) {
  const c = Number.parseInt(hex, 16) / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance(color: string) {
  const hex = color.replace("#", "");
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return -1;
  return (
    0.2126 * channel(hex.slice(0, 2)) +
    0.7152 * channel(hex.slice(2, 4)) +
    0.0722 * channel(hex.slice(4, 6))
  );
}

function contrast(a: number, b: number) {
  const [hi, lo] = a > b ? [a, b] : [b, a];
  return (hi + 0.05) / (lo + 0.05);
}

export function readableAccent(color: string) {
  const l = luminance(color);
  if (l < 0) return false;
  return contrast(l, 1) >= 2.2 && contrast(l, luminance("#09090b")) >= 2.6;
}

export function accentVars(style: PageStyle | null | undefined) {
  if (!style?.accent) return undefined;
  const fg = luminance(style.accent) > 0.35 ? "#09090b" : "#ffffff";
  return {
    "--accent": style.accent,
    "--accent-muted": style.accent,
    "--accent-fg": fg,
  } as Record<string, string>;
}
