import { ImageResponse } from "next/og";
import { packs } from "@/lib/api";
import { toOgImageSrc } from "@/lib/og/image";
import {
  OG_CONTENT_TYPE,
  OG_SIZE,
  OgBrand,
  OgFrame,
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
  const pack = await packs.getPack(id).catch(() => null);

  const name = pack?.name ?? "Bot Pack";
  const description = ogClamp(
    pack?.short ?? "A curated bot pack on Omniplex",
    140,
  );
  const avatarBots = (pack?.bots ?? []).slice(0, 5);
  const avatars = await Promise.all(
    avatarBots.map(async (bot) => ({
      id: bot.bot_id,
      src: await toOgImageSrc(bot.user.avatar),
    })),
  );

  return new ImageResponse(
    <OgFrame>
      <OgBrand />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 16,
          flex: 1,
        }}
      >
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
        <span style={{ fontSize: 22, color: og.muted, maxWidth: 820 }}>
          {description}
        </span>

        {avatars.length > 0 && (
          <div style={{ display: "flex", marginTop: 12 }}>
            {avatars.map((avatar, i) =>
              avatar.src ? (
                <img
                  key={avatar.id}
                  // eslint-disable-next-line @next/next/no-img-element
                  src={avatar.src}
                  width={64}
                  height={64}
                  alt=""
                  style={{
                    borderRadius: "50%",
                    border: `3px solid ${og.bg}`,
                    marginLeft: i === 0 ? 0 : -18,
                    background: og.border,
                  }}
                />
              ) : (
                <div
                  key={avatar.id}
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: "50%",
                    border: `3px solid ${og.bg}`,
                    marginLeft: i === 0 ? 0 : -18,
                    background: og.border,
                  }}
                />
              ),
            )}
          </div>
        )}
      </div>

      {pack && (
        <div style={{ display: "flex", gap: 40 }}>
          <OgStat label="Votes" value={formatCount(pack.votes)} />
          <OgStat label="Bots" value={formatCount(pack.bots.length)} />
        </div>
      )}
    </OgFrame>,
    { ...size },
  );
}
