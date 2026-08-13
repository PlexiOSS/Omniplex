import { ImageResponse } from "next/og";
import { bots, vanity } from "@/lib/api";
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

async function fetchBot(id: string) {
  try {
    return await bots.getBot(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      const resolved = await vanity.resolve(id).catch(() => null);
      if (resolved?.target_type === "bot") {
        return bots.getBot(resolved.target_id);
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
  const bot = await fetchBot(id).catch(() => null);

  const name = bot?.user.username ?? "Bot";
  const description = ogClamp(bot?.short ?? "A Discord bot on Omniplex", 140);
  // bot.user.avatar is already a fully-resolved URL from dovewing, but it's
  // served as .webp — re-encode to PNG since Satori/resvg can't decode webp
  const avatarUrl = await toOgImageSrc(bot?.user.avatar);

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
            {bot?.type === "certified" && <OgPill>Certified</OgPill>}
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

      {/* Bottom: stats row */}
      {bot && (
        <div style={{ display: "flex", gap: 40 }}>
          <OgStat label="Votes" value={formatCount(bot.approximate_votes)} />
          <OgStat label="Servers" value={formatCount(bot.servers)} />
          <OgStat label="Page Views" value={formatCount(bot.clicks)} />
        </div>
      )}
    </OgFrame>,
    { ...size },
  );
}
