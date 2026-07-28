import { ImageResponse } from "next/og";
import { OmniplexLogo } from "@/components/ui/OmniplexLogo";
import { list } from "@/lib/api";
import { OG_CONTENT_TYPE, OG_SIZE, OgFrame, OgStat, og } from "@/lib/og/shared";
import { formatCount } from "@/lib/utils/format";

export const alt = "Omniplex — Discord Bot List";
export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default async function Image() {
  const stats = await list.getStats().catch(() => null);

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
        {/* Brand mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 20,
            marginBottom: 32,
          }}
        >
          <div style={{ display: "flex", color: og.fg }}>
            <OmniplexLogo size={60} />
          </div>
          <span
            style={{
              fontSize: 48,
              fontWeight: 700,
              color: og.fg,
              letterSpacing: "-1px",
            }}
          >
            Omniplex
          </span>
        </div>

        {/* Tagline */}
        <p
          style={{
            fontSize: 24,
            color: og.muted,
            textAlign: "center",
            margin: 0,
            maxWidth: 600,
            lineHeight: 1.4,
          }}
        >
          Discover the best Discord bots and servers
        </p>

        {/* Live stats */}
        {stats && (
          <div style={{ display: "flex", gap: 56, marginTop: 48 }}>
            <OgStat
              label="Bots"
              value={formatCount(stats.total_approved_bots)}
            />
            <OgStat label="Users" value={formatCount(stats.total_users)} />
            <OgStat label="Votes" value={formatCount(stats.total_votes)} />
          </div>
        )}
      </div>
    </OgFrame>,
    { ...size },
  );
}
