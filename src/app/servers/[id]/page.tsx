import {
  ArrowLeft,
  ArrowRightLeft,
  ExternalLink,
  Eye,
  Gem,
  MousePointerClick,
  Star,
  Users,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EntityBadges } from "@/components/badges/EntityBadges";
import { ServerCard } from "@/components/cards/ServerCard";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { isListed, UnlistedNotice } from "@/components/listing/UnlistedNotice";
import { ReminderToggle } from "@/components/reminders/ReminderToggle";
import { ReportModal } from "@/components/reports/ReportModal";
import { ServerPageTabs } from "@/components/servers/ServerPageTabs";
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
import { reviews, servers, users, vanity, votes } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { shortLinkUrl } from "@/lib/shortLinks";
import {
  bannerUrl,
  mirroredAvatarUrl,
  serverPath,
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
import { SERVER_WIDGET_STATS } from "@/lib/widget/shared";
import { ServerVoteButton } from "./ServerVoteButton";

interface Props {
  params: Promise<{ id: string }>;
}

async function fetchServer(id: string, token?: string) {
  try {
    return await servers.getServer(id, token);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      const resolved = await vanity.resolve(id).catch(nullIfNotFound);
      if (resolved?.target_type === "server") {
        return servers.getServer(resolved.target_id, token);
      }
    }
    throw err;
  }
}

async function fetchServerSeo(id: string) {
  try {
    return await servers.getSeo(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      const resolved = await vanity.resolve(id).catch(nullIfNotFound);
      if (resolved?.target_type === "server") {
        return servers.getSeo(resolved.target_id);
      }
    }
    throw err;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const seo = await fetchServerSeo(id).catch(() => null);
  if (!seo) return {};
  return {
    title: seo.name,
    description: seo.short,
    alternates: { canonical: serverPath(seo.id, seo.vanity) },
  };
}

export default async function ServerPage({ params }: Props) {
  const { id } = await params;
  const token = await getServerToken();
  let server = null;
  try {
    server = await fetchServer(id, token);
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable inline />;
    if (isNotFoundError(err)) notFound();
    throw err;
  }
  if (!server) notFound();
  const tint = headerTint(server.card_color);

  const owner = server.team_owner
    ? null
    : server.claimed_by
      ? await users.getUser(server.claimed_by).catch(() => null)
      : null;

  const avatarSrc = mirroredAvatarUrl(
    "servers",
    server.server_id,
    server.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(server.name)}&size=256&background=random`,
  );

  const [reviewList, similarServers, voterList] = await Promise.all([
    reviews
      .getAll(
        "server",
        server.server_id,
        isListed(server.type) ? undefined : token,
      )
      .catch(() => ({ reviews: [] })),
    servers.getSimilar(server.server_id).catch(() => []),
    votes
      .getVoters(
        "server",
        server.server_id,
        24,
        isListed(server.type) ? undefined : token,
      )
      .catch(() => null),
  ]);

  const voteBlitzActive =
    !!server.vote_blitz_until && new Date(server.vote_blitz_until) > new Date();

  const actionsCard = (
    <div className="rounded-2xl border border-zinc-200 p-4 dark:border-zinc-800 bg-white dark:bg-zinc-900">
      <div className="flex flex-col gap-2">
        {voteBlitzActive && (
          <div className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-2 text-xs font-medium text-accent">
            <Zap size={12} />
            Vote Blitz active: cooldown is halved right now
          </div>
        )}
        {(() => {
          const inviteLink = server.extra_links.find(
            (l) => l.name === "invite",
          )?.value;
          return inviteLink ? (
            <a
              href={inviteLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-accent px-4 text-sm font-medium text-accent-fg transition-colors hover:bg-accent-muted"
            >
              <ExternalLink size={14} />
              Join Server
            </a>
          ) : null;
        })()}
        <ServerVoteButton
          serverId={server.server_id}
          currentVotes={server.approximate_votes}
          premium={server.premium}
          captchaOptOut={server.captcha_opt_out}
          acceptsAutoVotes={!server.auto_votes_opt_out}
        />
      </div>
    </div>
  );

  const shortLink = shortLinkUrl(server.vanity || server.server_id);

  return (
    <Container className="py-10">
      <Link
        href="/servers"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        Back to servers
      </Link>

      <UnlistedNotice type={server.type} entityLabel="server" />

      <Banner
        src={bannerUrl(
          "servers",
          server.server_id,
          server.asset_versions?.banner,
        )}
        alt={server.name}
        className="mb-6 -mt-2 rounded-2xl"
        sizeClassName="h-40 sm:h-52"
        missingSizeClassName="h-20"
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="min-w-0">
          <div
            className={`flex items-start gap-4 ${tint.className}`}
            style={tint.style}
          >
            <Avatar src={avatarSrc} alt={server.name} size={64} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="min-w-0 text-2xl font-semibold text-zinc-950 wrap-anywhere dark:text-zinc-50">
                  {server.name}
                </h1>
                {server.premium && <Badge variant="premium">Premium</Badge>}
                {server.type === "certified" && (
                  <Badge variant="success">Certified</Badge>
                )}
                {server.supporter_badge && (
                  <Badge variant="info">Supporter</Badge>
                )}
                {server.nsfw && <Badge variant="danger">NSFW</Badge>}
                <EntityBadges targetType="server" targetId={server.server_id} />
              </div>
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                {server.short}
              </p>
            </div>
          </div>

          {server.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {server.tags.map((tag) => (
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
            <ReminderToggle targetType="server" targetId={server.server_id} />
            <Link
              href={`/servers/compare?a=${encodeURIComponent(server.server_id)}`}
              className={ENTITY_ACTION_CLASS}
            >
              <ArrowRightLeft size={13} />
              Compare
            </Link>
            <WidgetShare
              widgetPath={`/servers/${server.vanity || server.server_id}/widget`}
              stats={SERVER_WIDGET_STATS}
            />
            <ReportModal
              targetType="server"
              targetId={server.server_id}
              targetLabel="server"
            />
          </div>

          <ServerPageTabs
            serverId={server.server_id}
            longDescription={server.long ?? ""}
            showEmojis={server.show_emojis}
            emojis={server.emojis}
            stickers={server.stickers}
            emojisSyncedAt={server.emojis_synced_at}
            initialReviews={reviewList.reviews}
            initialVoters={voterList}
          />
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Actions (desktop only — mobile version renders above the About section) */}
          <div className="hidden lg:block">{actionsCard}</div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <h3 className="mb-3 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
              Stats
            </h3>
            <dl className="space-y-2.5">
              <StatRow
                icon={<Star size={14} />}
                label="Votes"
                value={formatCount(server.approximate_votes)}
              />
              <div>
                <StatRow
                  icon={<Users size={14} />}
                  label="Members"
                  value={formatCount(server.total_members)}
                />
                {server.online_members != null && server.total_members > 0 && (
                  <>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{
                          width: `${Math.min(100, (server.online_members / server.total_members) * 100)}%`,
                        }}
                      />
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {formatCount(server.online_members)} online
                    </p>
                  </>
                )}
              </div>
              {(server.boost_count ?? 0) > 0 && (
                <StatRow
                  icon={<Gem size={14} />}
                  label="Boosts"
                  value={`${server.premium_tier ? `Level ${server.premium_tier} · ` : ""}${formatCount(server.boost_count ?? 0)}`}
                />
              )}
              {server.clicks > 0 && (
                <StatRow
                  icon={<Eye size={14} />}
                  label="Page Views"
                  value={formatCount(server.clicks)}
                />
              )}
              {server.invite_clicks > 0 && (
                <StatRow
                  icon={<MousePointerClick size={14} />}
                  label="Invite Clicks"
                  value={formatCount(server.invite_clicks)}
                />
              )}
            </dl>
          </div>

          {(server.team_owner || owner?.user) && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                {server.team_owner ? "Team" : "Owner"}
              </h3>
              {server.team_owner ? (
                <Link
                  href={`/teams/${server.team_owner.id}`}
                  className="flex items-center gap-2.5"
                >
                  <Avatar
                    src={
                      server.team_owner.asset_versions?.avatar
                        ? teamAvatarUrl(
                            server.team_owner.id,
                            server.team_owner.asset_versions.avatar,
                          )
                        : avatarSrc
                    }
                    alt={server.team_owner.name}
                    size={32}
                  />
                  <span className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {server.team_owner.name}
                  </span>
                </Link>
              ) : (
                owner?.user && (
                  <Link
                    href={`/user/${owner.user.id}`}
                    className="flex items-center gap-2.5"
                  >
                    <Avatar
                      src={owner.user.avatar}
                      alt={owner.user.username}
                      size={32}
                    />
                    <span className="truncate text-sm font-medium text-zinc-950 transition-colors hover:text-accent dark:text-zinc-50">
                      {owner.user.display_name || owner.user.username}
                    </span>
                  </Link>
                )
              )}
            </div>
          )}

          {server.extra_links.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <h3 className="mb-3 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                Links
              </h3>
              <div className="space-y-1">
                {server.extra_links.map((link) => (
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

      {similarServers.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Similar Servers
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {similarServers.map((similarServer) => (
              <ServerCard
                key={similarServer.server_id}
                server={similarServer}
              />
            ))}
          </div>
        </section>
      )}
      <MobileActionBar
        targetId="mobile-actions"
        name={server.name}
        avatar={avatarSrc}
        primaryHref={server.extra_links.find((l) => l.name === "invite")?.value}
        primaryLabel="Join"
      />
    </Container>
  );
}
