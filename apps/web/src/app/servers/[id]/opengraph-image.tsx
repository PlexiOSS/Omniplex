import { ImageResponse } from "next/og";
import { servers, vanity } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { toOgImageSrc } from "@/lib/og/image";
import {
  OG_CONTENT_TYPE,
  OG_SIZE,
  OgBrand,
  OgFrame,
  OgPill,
  OgStat,
  og,
  ogClamp,
} from "@/lib/og/shared";
import { formatCount } from "@/lib/utils/format";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

async function fetchServer(id: string) {
  try {
    return await servers.getServer(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      const resolved = await vanity.resolve(id).catch(() => null);
      if (resolved?.target_type === "server") {
        return servers.getServer(resolved.target_id);
      }
    }
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const server = await fetchServer(id).catch(() => null);

  const name = server?.name ?? "Server";
  const description = ogClamp(
    server?.short ?? "A Discord server on Omniplex",
    140,
  );
  const avatarUrl = await toOgImageSrc(server?.avatar);

  return new ImageResponse(
    <OgFrame>
      <OgBrand />

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 32,
          flex: 1,
        }}
      >
        {avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarUrl}
            width={96}
            height={96}
            style={{ borderRadius: "50%" }}
            alt=""
          />
        ) : (
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: "50%",
              background: og.border,
            }}
          />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <span
              style={{
                fontSize: 52,
                fontWeight: 700,
                color: og.fg,
                letterSpacing: "-1px",
              }}
            >
              {name}
            </span>
            {server?.type === "certified" && <OgPill>Certified</OgPill>}
          </div>
          <span
            style={{
              fontSize: 22,
              color: og.muted,
              maxWidth: 800,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {description}
          </span>
        </div>
      </div>

      {server && (
        <div style={{ display: "flex", gap: 40 }}>
          <OgStat label="Votes" value={formatCount(server.approximate_votes)} />
          <OgStat label="Members" value={formatCount(server.total_members)} />
          <OgStat label="Page Views" value={formatCount(server.clicks)} />
        </div>
      )}
    </OgFrame>,
    { ...size },
  );
}
