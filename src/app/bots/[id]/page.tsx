import {
  ArrowLeft,
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
import { BotPageTabs } from "@/components/bots/BotPageTabs";
import { BotCard } from "@/components/cards/BotCard";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { ReminderToggle } from "@/components/reminders/ReminderToggle";
import { ReportModal } from "@/components/reports/ReportModal";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { TagBadgeLink } from "@/components/ui/TagBadgeLink";
import { WidgetShare } from "@/components/widget/WidgetShare";
import { bots, reviews, vanity } from "@/lib/api";
import { ApiError } from "@/lib/api/client";
import {
  bannerUrl,
  mirroredAvatarUrl,
  teamAvatarUrl,
} from "@/lib/utils/assets";
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

async function fetchBotSeo(id: string) {
  try {
    return await bots.getSeo(id);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      const resolved = await vanity.resolve(id).catch(() => null);
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

  const [reviewList, commandList, changelogList, similarBots] =
    await Promise.all([
      reviews.getAll("bot", bot.bot_id).catch(() => ({ reviews: [] })),
      bots.getCommands(bot.bot_id).catch(() => ({ commands: [] })),
      bots.getChangelogs(bot.bot_id).catch(() => ({ changelogs: [] })),
      bots.getSimilar(bot.bot_id).catch(() => []),
    ]);

  const avatarSrc = mirroredAvatarUrl(
    "bots",
    bot.bot_id,
    bot.user.avatar ||
      `https://cdn.discordapp.com/embed/avatars/${Number(bot.bot_id) % 5}.png`,
  );

  const voteBlitzActive =
    !!bot.vote_blitz_until && new Date(bot.vote_blitz_until) > new Date();

  const actionsCard = (
    <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
      <div className="flex flex-col gap-2">
        {voteBlitzActive && (
          <div className="flex items-center gap-1.5 rounded-lg bg-accent/10 px-3 py-2 text-xs font-medium text-accent">
            <Zap size={12} />
            Vote Blitz active — cooldown is halved right now
          </div>
        )}
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
          premium={bot.premium}
          captchaOptOut={bot.captcha_opt_out}
        />
      </div>
    </div>
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
                {bot.supporter_badge && <Badge variant="info">Supporter</Badge>}
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
                <TagBadgeLink key={tag} tag={tag} />
              ))}
            </div>
          )}

          {/* Actions (mobile only — desktop version lives in the sidebar) */}
          <div className="mt-5 lg:hidden">{actionsCard}</div>

          <div className="mt-3 flex items-center gap-4">
            <ReportModal
              targetType="bot"
              targetId={bot.bot_id}
              targetLabel="bot"
            />
            <ReminderToggle targetType="bot" targetId={bot.bot_id} />
          </div>

          <BotPageTabs
            botId={bot.bot_id}
            longDescription={bot.long ?? ""}
            commands={commandList.commands}
            changelogs={changelogList.changelogs}
            initialReviews={reviewList.reviews}
          />
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          {/* Actions (desktop only — mobile version renders above the About section) */}
          <div className="hidden lg:block">{actionsCard}</div>

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
