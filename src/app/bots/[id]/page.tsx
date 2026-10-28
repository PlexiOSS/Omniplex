import {
  Activity,
  ArrowLeft,
  ArrowRightLeft,
  Code2,
  ExternalLink,
  Eye,
  MousePointerClick,
  Server,
  Star,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EntityBadges } from "@/components/badges/EntityBadges";
import { BotPageTabs } from "@/components/bots/BotPageTabs";
import { InvitePermissionNote } from "@/components/bots/InvitePermissionNote";
import { BotCard } from "@/components/cards/BotCard";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { isListed, UnlistedNotice } from "@/components/listing/UnlistedNotice";
import { ReminderToggle } from "@/components/reminders/ReminderToggle";
import { ReportModal } from "@/components/reports/ReportModal";
import { JsonLd } from "@/components/seo/JsonLd";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import {
  ENTITY_ACTION_CLASS,
  ENTITY_ACTION_ROW,
} from "@/components/ui/entityAction";
import { MobileActionBar } from "@/components/ui/MobileActionBar";
import { ShortLinkButton } from "@/components/ui/ShortLinkButton";
import { SidebarLink } from "@/components/ui/SidebarLink";
import { StatRow } from "@/components/ui/StatRow";
import { TagBadgeLink } from "@/components/ui/TagBadgeLink";
import { WidgetShare } from "@/components/widget/WidgetShare";
import { bots, reviews, vanity, votes } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { BASE_URL } from "@/lib/api/config";
import { shortLinkUrl } from "@/lib/shortLinks";
import {
  bannerUrl,
  botPath,
  discordBannerUrl,
  mirroredAvatarUrl,
  teamAvatarUrl,
} from "@/lib/utils/assets";
import { headerTint } from "@/lib/utils/cardCosmetics";
import {
  isApiUnavailable,
  isNotFoundError,
  nullIfNotFound,
} from "@/lib/utils/errors";
import { formatCount } from "@/lib/utils/format";
import { getServerToken } from "@/lib/utils/serverSession";
import { BOT_WIDGET_STATS } from "@/lib/widget/shared";
import { VoteButton } from "./VoteButton";

interface Props {
  params: Promise<{ id: string }>;
}

async function fetchBot(id: string, token?: string) {
  try {
    return await bots.getBot(id, token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      const resolved = await vanity.resolve(id).catch(nullIfNotFound);
      if (resolved?.target_type === "bot") {
        return bots.getBot(resolved.target_id, token);
      }
    }
    throw err;
  }
}

async function fetchBotSeo(id: string) {
  try {
    return await bots.getSeo(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      const resolved = await vanity.resolve(id).catch(nullIfNotFound);
      if (resolved?.target_type === "bot") {
        return bots.getSeo(resolved.target_id);
      }
    }
    throw err;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const seo = await fetchBotSeo(id).catch(() => null);
  if (!seo) return {};
  return {
    title: seo.name,
    description: seo.short,
    alternates: { canonical: botPath(seo.id, seo.vanity) },
  };
}

export default async function BotPage({ params }: Props) {
  const { id } = await params;
  const token = await getServerToken();
  let bot = null;
  try {
    bot = await fetchBot(id, token);
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable inline />;
    if (isNotFoundError(err)) notFound();
    throw err;
  }
  if (!bot) notFound();
  const tint = headerTint(bot.card_color);

  const listedToken = isListed(bot.type) ? undefined : token;

  const [reviewList, commandList, changelogList, similarBots, voterList] =
    await Promise.all([
      reviews
        .getAll("bot", bot.bot_id, listedToken)
        .catch(() => ({ reviews: [] })),
      bots.getCommands(bot.bot_id, listedToken).catch(() => ({ commands: [] })),
      bots
        .getChangelogs(bot.bot_id, listedToken)
        .catch(() => ({ changelogs: [] })),
      bots.getSimilar(bot.bot_id).catch(() => []),
      votes.getVoters("bot", bot.bot_id, 24, listedToken).catch(() => null),
    ]);

  const uptimePercent =
    bot.total_uptime > 0
      ? Math.min(100, (bot.uptime / bot.total_uptime) * 100)
      : null;
  const statusLabel = bot.user.status
    ? STATUS_LABELS[bot.user.status]
    : undefined;

  const avatarSrc = mirroredAvatarUrl(
    "bots",
    bot.bot_id,
    bot.user.avatar ||
      `https://cdn.discordapp.com/embed/avatars/${Number(bot.bot_id) % 5}.png`,
  );

  const voteBlitzActive =
    !!bot.vote_blitz_until && new Date(bot.vote_blitz_until) > new Date();

  const actionsCard = (
    <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="flex flex-col gap-2">
        {voteBlitzActive && (
          <div className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-2 text-xs font-medium text-accent">
            <Zap size={12} />
            Vote Blitz active: cooldown is halved right now
          </div>
        )}
        {bot.invite && (
          <a
            href={bot.invite}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-muted"
          >
            <ExternalLink size={14} />
            Add to Server
          </a>
        )}
        {bot.invite && <InvitePermissionNote invite={bot.invite} />}
        <VoteButton
          botId={bot.bot_id}
          currentVotes={bot.approximate_votes}
          premium={bot.premium}
          captchaOptOut={bot.captcha_opt_out}
          acceptsAutoVotes={!bot.auto_votes_opt_out}
        />
      </div>
    </div>
  );

  const shortLink = shortLinkUrl(bot.vanity || bot.bot_id);
  const ratedReviews = reviewList.reviews.filter((r) => !r.parent_id);

  return (
    <Container className="py-10">
      <Link
        href="/bots"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        Back to bots
      </Link>

      <UnlistedNotice type={bot.type} entityLabel="bot" />

      <Banner
        src={bannerUrl("bots", bot.bot_id, bot.asset_versions?.banner)}
        fallbackSrc={discordBannerUrl("bots", bot.bot_id)}
        alt={bot.user.username}
        className="mb-6 -mt-2 rounded-2xl"
        sizeClassName="h-40 sm:h-52"
        missingSizeClassName="h-20"
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="min-w-0">
          {/* Bot header */}
          <div
            className={`flex items-start gap-4 ${tint.className}`}
            style={tint.style}
          >
            <Avatar
              src={avatarSrc}
              alt={bot.user.username}
              size={64}
              status={bot.user.status}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="min-w-0 text-2xl font-semibold text-zinc-950 wrap-anywhere dark:text-zinc-50">
                  {bot.user.username}
                </h1>
                {bot.premium && <Badge variant="premium">Premium</Badge>}
                {bot.type === "certified" && (
                  <Badge variant="success">Certified</Badge>
                )}
                {bot.supporter_badge && <Badge variant="info">Supporter</Badge>}
                {bot.nsfw && <Badge variant="danger">NSFW</Badge>}
                <EntityBadges targetType="bot" targetId={bot.bot_id} />
                {statusLabel && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    {statusLabel}
                  </span>
                )}
              </div>
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                {bot.short}
              </p>
            </div>
          </div>

          {/* Tags */}
          {bot.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {bot.tags.map((tag) => (
                <TagBadgeLink key={tag} tag={tag} />
              ))}
            </div>
          )}

          {/* Actions (mobile only — desktop version lives in the sidebar) */}
          <div id="mobile-actions" className="mt-5 scroll-mt-24 lg:hidden">
            {actionsCard}
          </div>

          <div className={ENTITY_ACTION_ROW}>
            {shortLink && <ShortLinkButton url={shortLink} />}
            <ReminderToggle targetType="bot" targetId={bot.bot_id} />
            <Link
              href={`/bots/compare?a=${encodeURIComponent(bot.bot_id)}`}
              className={ENTITY_ACTION_CLASS}
            >
              <ArrowRightLeft size={13} />
              Compare
            </Link>
            <WidgetShare
              widgetPath={`/bots/${bot.vanity || bot.bot_id}/widget`}
              stats={BOT_WIDGET_STATS}
            />
            <ReportModal
              targetType="bot"
              targetId={bot.bot_id}
              targetLabel="bot"
            />
          </div>

          <BotPageTabs
            botId={bot.bot_id}
            longDescription={bot.long ?? ""}
            commands={commandList.commands}
            changelogs={changelogList.changelogs}
            initialReviews={reviewList.reviews}
            initialVoters={voterList}
          />
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Actions (desktop only — mobile version renders above the About section) */}
          <div className="hidden lg:block">{actionsCard}</div>

          {/* Stats */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-3 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Stats
            </h3>
            <dl className="space-y-2.5">
              <StatRow
                icon={<Star size={14} />}
                label="Votes"
                value={formatCount(bot.approximate_votes)}
              />
              <StatRow
                icon={<Server size={14} />}
                label="Servers"
                value={formatCount(bot.servers)}
              />
              {uptimePercent !== null && (
                <div>
                  <StatRow
                    icon={<Activity size={14} />}
                    label="Uptime"
                    value={`${uptimePercent >= 99.95 ? "100" : uptimePercent.toFixed(1)}%`}
                  />
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                    <div
                      className={[
                        "h-full rounded-full",
                        uptimePercent >= 95
                          ? "bg-emerald-500"
                          : uptimePercent >= 80
                            ? "bg-amber-500"
                            : "bg-red-500",
                      ].join(" ")}
                      style={{ width: `${Math.max(uptimePercent, 2)}%` }}
                    />
                  </div>
                </div>
              )}
              {bot.shards != null && (
                <StatRow
                  icon={<Server size={14} />}
                  label="Shards"
                  value={formatCount(bot.shards)}
                />
              )}
              {bot.clicks > 0 && (
                <StatRow
                  icon={<Eye size={14} />}
                  label="Page Views"
                  value={formatCount(bot.clicks)}
                />
              )}
              {bot.invite_clicks > 0 && (
                <StatRow
                  icon={<MousePointerClick size={14} />}
                  label="Invite Clicks"
                  value={formatCount(bot.invite_clicks)}
                />
              )}
              {bot.library && (
                <div className="flex items-start justify-between gap-3 text-sm">
                  <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
                    <Code2 size={14} />
                    Library
                  </span>
                  <span className="flex flex-wrap justify-end gap-1">
                    {bot.library
                      .split(/[\s,/]+/)
                      .filter(Boolean)
                      .map((lib) => (
                        <span
                          key={lib}
                          className="rounded-md bg-zinc-100 px-1.5 py-0.5 font-mono text-xs text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                        >
                          {lib}
                        </span>
                      ))}
                  </span>
                </div>
              )}
            </dl>
          </div>

          {/* Owner */}
          {(bot.team_owner || bot.owner) && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                {bot.team_owner ? "Team" : "Owner"}
              </h3>
              {bot.team_owner ? (
                <Link
                  href={`/teams/${bot.team_owner.id}`}
                  className="flex items-center gap-2.5"
                >
                  <Avatar
                    src={
                      bot.team_owner.asset_versions?.avatar
                        ? teamAvatarUrl(
                            bot.team_owner.id,
                            bot.team_owner.asset_versions.avatar,
                          )
                        : avatarSrc
                    }
                    alt={bot.team_owner.name}
                    size={32}
                  />
                  <span className="truncate text-sm font-medium text-zinc-950 transition-colors hover:text-accent dark:text-zinc-50">
                    {bot.team_owner.name}
                  </span>
                </Link>
              ) : (
                bot.owner && (
                  <Link
                    href={`/user/${bot.owner.id}`}
                    className="flex items-center gap-2.5"
                  >
                    <Avatar
                      src={bot.owner.avatar}
                      alt={bot.owner.username}
                      size={32}
                    />
                    <span className="truncate text-sm font-medium text-zinc-950 transition-colors hover:text-accent dark:text-zinc-50">
                      {bot.owner.display_name || bot.owner.username}
                    </span>
                  </Link>
                )
              )}
            </div>
          )}

          {/* Links */}
          {bot.extra_links.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Links
              </h3>
              <div className="space-y-1">
                {bot.extra_links.map((link) => (
                  <SidebarLink
                    key={link.name}
                    href={link.value}
                    label={link.name}
                  />
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>

      {similarBots.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Similar Bots
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similarBots.map((similarBot) => (
              <BotCard key={similarBot.bot_id} bot={similarBot} />
            ))}
          </div>
        </section>
      )}
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          name: bot.user.username,
          description: bot.short,
          image: avatarSrc,
          url: `${BASE_URL}/bots/${bot.vanity || bot.bot_id}`,
          applicationCategory: "CommunicationApplication",
          operatingSystem: "Discord",
          offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          ...(ratedReviews.length > 0
            ? {
                aggregateRating: {
                  "@type": "AggregateRating",
                  ratingValue: (
                    ratedReviews.reduce((sum, r) => sum + r.stars, 0) /
                    ratedReviews.length
                  ).toFixed(1),
                  reviewCount: ratedReviews.length,
                  bestRating: 5,
                  worstRating: 1,
                },
              }
            : {}),
        }}
      />
      <MobileActionBar
        targetId="mobile-actions"
        name={bot.user.username}
        avatar={avatarSrc}
        primaryHref={bot.invite || undefined}
        primaryLabel="Add"
      />
    </Container>
  );
}

const STATUS_LABELS: Record<string, string> = {
  online: "Online",
  idle: "Idle",
  dnd: "Do not disturb",
  offline: "Offline",
};
