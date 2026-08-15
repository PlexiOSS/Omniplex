import {
  ArrowLeft,
  ExternalLink,
  Eye,
  Globe,
  MousePointerClick,
  Star,
  Users,
  Zap,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { Markdown } from "@/components/markdown/Markdown";
import { ReminderToggle } from "@/components/reminders/ReminderToggle";
import { ReportModal } from "@/components/reports/ReportModal";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { EmojiStickerGallery } from "@/components/servers/EmojiStickerGallery";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { WidgetShare } from "@/components/widget/WidgetShare";
import { reviews, servers, users, vanity } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { bannerUrl, mirroredAvatarUrl, teamAvatarUrl } from "@/lib/utils/assets";
import { isApiUnavailable } from "@/lib/utils/errors";
import { formatCount } from "@/lib/utils/format";
import { SERVER_WIDGET_STATS } from "@/lib/widget/shared";
import { ServerVoteButton } from "./ServerVoteButton";

interface Props {
  params: Promise<{ id: string }>;
}

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
    throw err;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const server = await fetchServer(id).catch(() => null);
  if (!server) return {};
  return {
    title: server.name,
    description: server.short,
  };
}

export default async function ServerPage({ params }: Props) {
  const { id } = await params;
  let server = null;
  try {
    server = await fetchServer(id);
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable inline />;
    notFound();
  }
  if (!server) notFound();

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

  const reviewList = await reviews
    .getAll("server", server.server_id)
    .catch(() => ({ reviews: [] }));

  const voteBlitzActive =
    !!server.vote_blitz_until && new Date(server.vote_blitz_until) > new Date();

  const actionsCard = (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-col gap-2">
        {voteBlitzActive && (
          <div className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-2 text-xs font-medium text-accent">
            <Zap size={12} />
            Vote Blitz active — cooldown is halved right now
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
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
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
        />
      </div>
    </div>
  );

  return (
    <Container className="py-10">
      <Link
        href="/servers"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        Back to servers
      </Link>

      <Banner
        src={bannerUrl("servers", server.server_id)}
        alt={server.name}
        className="mb-6 -mt-2 h-40 rounded-2xl sm:h-52"
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="min-w-0">
          <div className="flex items-start gap-4">
            <Avatar src={avatarSrc} alt={server.name} size={64} />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                  {server.name}
                </h1>
                {server.premium && <Badge variant="premium">Premium</Badge>}
                {server.type === "certified" && (
                  <Badge variant="success">Certified</Badge>
                )}
                {server.supporter_badge && <Badge variant="info">Supporter</Badge>}
                {server.nsfw && <Badge variant="danger">NSFW</Badge>}
              </div>
              <p className="mt-1 text-zinc-500 dark:text-zinc-400">
                {server.short}
              </p>
            </div>
          </div>

          {server.tags.length > 0 && (
            <div className="mt-5 flex flex-wrap gap-2">
              {server.tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          )}

          {/* Actions (mobile only — desktop version lives in the sidebar) */}
          <div className="mt-5 lg:hidden">{actionsCard}</div>

          <div className="mt-3 flex items-center gap-4">
            <ReportModal
              targetType="server"
              targetId={server.server_id}
              targetLabel="server"
            />
            <ReminderToggle targetType="server" targetId={server.server_id} />
          </div>

          <div className="mt-8 border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <h2 className="mb-4 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              About
            </h2>
            {server.long?.trim() ? (
              <Markdown
                content={server.long}
                className="text-sm text-zinc-700 dark:text-zinc-300"
              />
            ) : (
              <p className="text-sm text-zinc-400 dark:text-zinc-600">
                No description provided.
              </p>
            )}
          </div>

          {server.show_emojis && (
            <EmojiStickerGallery
              emojis={server.emojis}
              stickers={server.stickers}
            />
          )}

          <ReviewsSection
            targetType="server"
            targetId={server.server_id}
            initialReviews={reviewList.reviews}
          />
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Actions (desktop only — mobile version renders above the About section) */}
          <div className="hidden lg:block">{actionsCard}</div>

          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="mb-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">
              Stats
            </h3>
            <dl className="space-y-2.5">
              <StatRow
                icon={<Star size={14} />}
                label="Votes"
                value={formatCount(server.approximate_votes)}
              />
              <StatRow
                icon={<Users size={14} />}
                label="Members"
                value={formatCount(server.total_members)}
              />
              {server.online_members != null && (
                <StatRow
                  icon={<Users size={14} />}
                  label="Online"
                  value={formatCount(server.online_members)}
                />
              )}
              <StatRow
                icon={<Eye size={14} />}
                label="Page Views"
                value={formatCount(server.clicks)}
              />
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
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <h3 className="mb-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">
                {server.team_owner ? "Team" : "Owner"}
              </h3>
              {server.team_owner ? (
                <div className="flex items-center gap-2.5">
                  <Avatar
                    src={teamAvatarUrl(server.team_owner.id)}
                    alt={server.team_owner.name}
                    size={32}
                  />
                  <span className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                    {server.team_owner.name}
                  </span>
                </div>
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
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <h3 className="mb-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">
                Links
              </h3>
              <div className="space-y-2">
                {server.extra_links.map((link) => (
                  <LinkItem
                    key={link.name}
                    href={link.value}
                    icon={<Globe size={14} />}
                    label={link.name}
                  />
                ))}
              </div>
            </div>
          )}

          <WidgetShare
            widgetPath={`/servers/${server.vanity || server.server_id}/widget`}
            stats={SERVER_WIDGET_STATS}
          />
        </aside>
      </div>
    </Container>
  );
}

function StatRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2 text-sm">
      <span className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400">
        {icon}
        {label}
      </span>
      <span className="font-medium text-zinc-950 dark:text-zinc-50">
        {value}
      </span>
    </div>
  );
}

function LinkItem({
  href,
  icon,
  label,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex items-center gap-2 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
    >
      {icon}
      {label}
    </a>
  );
}
