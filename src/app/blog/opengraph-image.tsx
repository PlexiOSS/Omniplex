import { ImageResponse } from "next/og";
import { OmniplexLogo } from "@/components/ui/OmniplexLogo";
import { OG_CONTENT_TYPE, OG_SIZE, OgFrame, og } from "@/lib/og/shared";

export const alt = "Omniplex Blog";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function Image() {
  return new ImageResponse(
    <OgFrame>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 24,
          }}
        >
          <div style={{ display: "flex", color: og.fg }}>
            <OmniplexLogo size={52} />
          </div>
          <span style={{ fontSize: 40, fontWeight: 700, color: og.fg }}>
            Omniplex
          </span>
        </div>
        <span
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: og.fg,
            letterSpacing: "-1.5px",
          }}
        >
          Blog
        </span>
        <p
          style={{
            fontSize: 24,
            color: og.muted,
            textAlign: "center",
            margin: 0,
            marginTop: 12,
          }}
        >
          News, updates, and stories from the Omniplex team
        </p>
      </div>
    </OgFrame>,
    { ...size },
  );
}
