import { ImageResponse } from "next/og";
import { bots, vanity } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { toOgImageSrc } from "@/lib/og/image";
import { formatCount } from "@/lib/utils/format";
import {
  BOT_WIDGET_STATS,
  resolveVisibleStats,
  resolveWidgetTheme,
  WIDGET_CONTENT_TYPE,
  WIDGET_SIZE,
  WidgetBadge,
  WidgetFrame,
  WidgetStat,
  widgetClamp,
} from "@/lib/widget/shared";

export const contentType = WIDGET_CONTENT_TYPE;

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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { searchParams } = new URL(request.url);
  const theme = resolveWidgetTheme(searchParams);
  const visibleStats = resolveVisibleStats(
    searchParams,
    BOT_WIDGET_STATS.map((s) => s.key),
  );

  const bot = await fetchBot(id).catch(() => null);

  if (!bot) {
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
          Bot not found
        </div>
      </WidgetFrame>,
      { ...WIDGET_SIZE },
    );
  }

  const avatarSrc = await toOgImageSrc(bot.user.avatar);
  const description = widgetClamp(bot.short, 90);
  const ownerLine = bot.team_owner
    ? `Team: ${bot.team_owner.name}`
    : bot.owner
      ? `by ${bot.owner.username}`
      : null;

  return new ImageResponse(
    <WidgetFrame theme={theme}>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        {avatarSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarSrc}
            width={56}
            height={56}
            style={{ borderRadius: "50%" }}
            alt=""
          />
        ) : (
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: theme.border,
            }}
          />
        )}
        <div
          style={{ display: "flex", flexDirection: "column", gap: 3, flex: 1 }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: theme.fg,
                letterSpacing: "-0.5px",
              }}
            >
              {bot.user.username}
            </span>
            {bot.type === "certified" && (
              <WidgetBadge theme={theme}>Certified</WidgetBadge>
            )}
            {bot.premium && <WidgetBadge theme={theme}>Premium</WidgetBadge>}
          </div>
          {ownerLine && (
            <span style={{ fontSize: 12, color: theme.dim }}>{ownerLine}</span>
          )}
        </div>
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

      {visibleStats.size > 0 && (
        <div style={{ display: "flex", gap: 28, marginTop: "auto" }}>
          {visibleStats.has("votes") && (
            <WidgetStat
              theme={theme}
              label="Votes"
              value={formatCount(bot.approximate_votes)}
            />
          )}
          {visibleStats.has("servers") && (
            <WidgetStat
              theme={theme}
              label="Servers"
              value={formatCount(bot.servers)}
            />
          )}
        </div>
      )}
    </WidgetFrame>,
    { ...WIDGET_SIZE },
  );
}
