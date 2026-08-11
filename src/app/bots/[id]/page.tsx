import {
  ArrowLeft,
  ExternalLink,
  Eye,
  MousePointerClick,
  Server,
  Star,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { Markdown } from "@/components/markdown/Markdown";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { WidgetShare } from "@/components/widget/WidgetShare";
import { bots, reviews, vanity } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import { bannerUrl, mirroredAvatarUrl, teamAvatarUrl } from "@/lib/utils/assets";
import { isApiUnavailable } from "@/lib/utils/errors";
import { formatCount } from "@/lib/utils/format";
import { BOT_WIDGET_STATS } from "@/lib/widget/shared";
import { VoteButton } from "./VoteButton";

interface Props {
  params: Promise<{ id: string }>;
}

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
    throw err;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const bot = await fetchBot(id).catch(() => null);
  if (!bot) return {};
  return {
    title: bot.user.username,
    description: bot.short,
  };
}

export default async function BotPage({ params }: Props) {
  const { id } = await params;
  let bot = null;
  try {
    bot = await fetchBot(id);
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable inline />;
    notFound();
  }
  if (!bot) notFound();

  const reviewList = await reviews
    .getAll("bot", bot.bot_id)
    .catch(() => ({ reviews: [] }));

  const avatarSrc = mirroredAvatarUrl(
    "bots",
    bot.bot_id,
    bot.user.avatar ||
      `https://cdn.discordapp.com/embed/avatars/${Number(bot.bot_id) % 5}.png`,
  );

  return (
    <Container className="py-10">
      <Link
        href="/bots"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        Back to bots
      </Link>

      <Banner
        src={bannerUrl("bots", bot.bot_id)}
        alt={bot.user.username}
        className="mb-6 -mt-2 h-40 rounded-2xl sm:h-52"
      />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
        {/* Main */}
        <div className="min-w-0">
          {/* Bot header */}
          <div className="flex items-start gap-4">
            <Avatar
              src={avatarSrc}
              alt={bot.user.username}
              size={64}
              status={bot.user.status}
            />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
                  {bot.user.username}
                </h1>
                {bot.premium && <Badge variant="premium">Premium</Badge>}
                {bot.type === "certified" && (
                  <Badge variant="success">Certified</Badge>
                )}
                {bot.nsfw && <Badge variant="danger">NSFW</Badge>}
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
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          )}

          {/* Long description */}
          <div className="mt-8 border-t border-zinc-200 pt-8 dark:border-zinc-800">
            <h2 className="mb-4 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
              About
            </h2>
            {bot.long?.trim() ? (
              <Markdown
                content={bot.long}
                className="text-sm text-zinc-700 dark:text-zinc-300"
              />
            ) : (
              <p className="text-sm text-zinc-400 dark:text-zinc-600">
                No description provided.
              </p>
            )}
          </div>

          <ReviewsSection
            targetType="bot"
            targetId={bot.bot_id}
            initialReviews={reviewList.reviews}
          />
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Actions */}
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div className="flex flex-col gap-2">
              {bot.invite && (
                <a
                  href={bot.invite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-zinc-900 px-4 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
                >
                  <ExternalLink size={14} />
                  Add to Server
                </a>
              )}
              <VoteButton
                botId={bot.bot_id}
                currentVotes={bot.approximate_votes}
              />
            </div>
          </div>

          {/* Stats */}
          <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <h3 className="mb-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">
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
              {bot.shards != null && (
                <StatRow
                  icon={<Server size={14} />}
                  label="Shards"
                  value={formatCount(bot.shards)}
                />
              )}
              <StatRow
                icon={<Eye size={14} />}
                label="Page Views"
                value={formatCount(bot.clicks)}
              />
              {bot.invite_clicks > 0 && (
                <StatRow
                  icon={<MousePointerClick size={14} />}
                  label="Invite Clicks"
                  value={formatCount(bot.invite_clicks)}
                />
              )}
              {bot.library && (
                <StatRow icon={null} label="Library" value={bot.library} />
              )}
            </dl>
          </div>

          {/* Owner */}
          {(bot.team_owner || bot.owner) && (
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <h3 className="mb-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">
                {bot.team_owner ? "Team" : "Owner"}
              </h3>
              {bot.team_owner ? (
                <Link
                  href={`/teams/${bot.team_owner.id}`}
                  className="flex items-center gap-2.5"
                >
                  <Avatar
                    src={teamAvatarUrl(bot.team_owner.id)}
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
            <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
              <h3 className="mb-3 text-sm font-medium text-zinc-950 dark:text-zinc-50">
                Links
              </h3>
              <div className="space-y-2">
                {bot.extra_links.map((link) => (
                  <ExternalLinkItem
                    key={link.name}
                    href={link.value}
                    icon={<ExternalLink size={14} />}
                    label={link.name}
                  />
                ))}
              </div>
            </div>
          )}

          <WidgetShare
            widgetPath={`/bots/${bot.vanity || bot.bot_id}/widget`}
            stats={BOT_WIDGET_STATS}
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

function ExternalLinkItem({
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
