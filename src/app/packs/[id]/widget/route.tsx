import { ImageResponse } from "next/og";
import { packs } from "@/lib/api";
import { toOgImageSrc } from "@/lib/og/image";
import { formatCount } from "@/lib/utils/format";
import {
  getPackItemCount,
  getPackWidgetStats,
  PACK_WIDGET_STATS,
  resolveVisibleStats,
  resolveWidgetTheme,
  WIDGET_CONTENT_TYPE,
  WIDGET_SIZE,
  WidgetFrame,
  WidgetStat,
  widgetClamp,
} from "@/lib/widget/shared";

export const contentType = WIDGET_CONTENT_TYPE;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const theme = resolveWidgetTheme(searchParams);

  const pack = await packs.getPack(id).catch(() => null);

  // Secondary stat key depends on pack_type (bots vs servers vs emojis vs stickers)
  const packStats = pack ? getPackWidgetStats(pack) : PACK_WIDGET_STATS;
  const visibleStats = resolveVisibleStats(
    searchParams,
    packStats.map((s) => s.key),
  );

  if (!pack) {
    return new ImageResponse(
      <WidgetFrame theme={theme}>
        <div
          style={{
            display: "flex",
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            color: theme.dim,
            fontSize: 16,
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Pack not found
        </div>
      </WidgetFrame>,
      { ...WIDGET_SIZE },
    );
  }

  const description = widgetClamp(pack.short, 90);
  const secondaryKey = packStats[1]?.key;
  const secondaryLabel = packStats[1]?.label ?? "Items";
  const secondaryValue = formatCount(getPackItemCount(pack));
  const avatars = await Promise.all(
    (pack.bots ?? []).slice(0, 5).map(async (bot) => ({
      id: bot.bot_id,
      src: await toOgImageSrc(bot.user.avatar),
    })),
  );

  return new ImageResponse(
    <WidgetFrame theme={theme}>
      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <span
          style={{
            fontSize: 22,
            fontWeight: 700,
            color: theme.fg,
            letterSpacing: "-0.5px",
          }}
        >
          {pack.name}
        </span>
        <span style={{ fontSize: 12, color: theme.dim }}>
          by {pack.owner.username}
        </span>
      </div>

      <p
        style={{
          marginTop: 12,
          fontSize: 13,
          lineHeight: 1.4,
          color: theme.muted,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}
      >
        {description}
      </p>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginTop: "auto",
        }}
      >
        <div style={{ display: "flex", gap: 28 }}>
          {visibleStats.has("votes") && (
            <WidgetStat
              theme={theme}
              label="Votes"
              value={formatCount(pack.votes)}
            />
          )}
          {secondaryKey && visibleStats.has(secondaryKey) && (
            <WidgetStat
              theme={theme}
              label={secondaryLabel}
              value={secondaryValue}
            />
          )}
        </div>
        {avatars.length > 0 && (
          <div style={{ display: "flex" }}>
            {avatars.map((avatar, i) =>
              avatar.src ? (
                <img
                  key={avatar.id}
                  // eslint-disable-next-line @next/next/no-img-element
                  src={avatar.src}
                  width={32}
                  height={32}
                  alt=""
                  style={{
                    borderRadius: "50%",
                    border: `2px solid ${theme.bg}`,
                    marginLeft: i === 0 ? 0 : -10,
                    background: theme.border,
                  }}
                />
              ) : (
                <div
                  key={avatar.id}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    border: `2px solid ${theme.bg}`,
                    marginLeft: i === 0 ? 0 : -10,
                    background: theme.border,
                  }}
                />
              ),
            )}
          </div>
        )}
      </div>
    </WidgetFrame>,
    { ...WIDGET_SIZE },
  );
}
