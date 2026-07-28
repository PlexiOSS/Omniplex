import { OmniplexLogo } from "@/components/ui/OmniplexLogo";

/**
 * Shared building blocks for `opengraph-image.tsx` routes, rendered through
 * Satori (`next/og`'s `ImageResponse`). Satori only supports a constrained
 * subset of CSS (flexbox layout, no CSS grid/position outside absolute) and
 * a limited SVG feature set — `OmniplexLogo` (path + clipPath) is confirmed
 * to render correctly here, so it's reused as-is rather than duplicated as
 * a rasterized asset.
 */

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_CONTENT_TYPE = "image/png";

export const og = {
  bg: "#09090b",
  fg: "#fafafa",
  muted: "#a1a1aa",
  dim: "#71717a",
  border: "#27272a",
  accent: "#6366f1",
  accentMuted: "#4943cb",
  success: "#4ade80",
  successBg: "#14532d",
};

/**
 * Full-bleed dark frame with the subtle dot-grid background and bottom
 * accent bar used across every generated OG image.
 */
export function OgFrame({
  children,
  padding = "60px 72px",
}: {
  children: React.ReactNode;
  padding?: string;
}) {
  return (
    <div
      style={{
        background: og.bg,
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding,
        fontFamily: "system-ui, sans-serif",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />
      {children}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: 4,
          background: `linear-gradient(90deg, ${og.accentMuted}, ${og.accent})`,
        }}
      />
    </div>
  );
}

/** Small "Omniplex" wordmark + logo, used as a corner brand stamp. */
export function OgBrand({ size = 28 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ display: "flex", color: og.fg }}>
        <OmniplexLogo size={size} />
      </div>
      <span style={{ fontSize: size * 0.7, fontWeight: 600, color: og.dim }}>
        Omniplex
      </span>
    </div>
  );
}

export function OgStat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <span style={{ fontSize: 28, fontWeight: 700, color: og.fg }}>
        {value}
      </span>
      <span style={{ fontSize: 16, color: og.dim }}>{label}</span>
    </div>
  );
}

export function OgPill({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: og.successBg,
        color: og.success,
        borderRadius: 9999,
        padding: "4px 14px",
        fontSize: 16,
        fontWeight: 600,
      }}
    >
      {children}
    </div>
  );
}

/** Truncates to a safe length for a single/double-line OG title. */
export function ogClamp(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1)}…` : text;
}
