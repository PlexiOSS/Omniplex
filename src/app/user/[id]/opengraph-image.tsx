import { ImageResponse } from "next/og";
import { users } from "@/lib/api";
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

export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await users.getUser(id).catch(() => null);

  const username = profile?.user?.username ?? "Unknown user";
  const displayName = profile?.user?.display_name || username;
  const about = ogClamp(
    profile?.about || `${username}'s profile on Omniplex`,
    140,
  );
  const avatarUrl = await toOgImageSrc(profile?.user?.avatar);

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
            width={104}
            height={104}
            style={{ borderRadius: "50%" }}
            alt=""
          />
        ) : (
          <div
            style={{
              width: 104,
              height: 104,
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
              {displayName}
            </span>
            {profile?.certified && <OgPill>Certified Dev</OgPill>}
          </div>
          <span style={{ fontSize: 22, color: og.muted, maxWidth: 800 }}>
            {about}
          </span>
        </div>
      </div>

      {profile && (
        <div style={{ display: "flex", gap: 40 }}>
          <OgStat label="Bots" value={formatCount(profile.user_bots.length)} />
          <OgStat
            label="Packs"
            value={formatCount(profile.user_packs.length)}
          />
        </div>
      )}
    </OgFrame>,
    { ...size },
  );
}
