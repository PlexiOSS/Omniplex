import {
  ArrowLeft,
  Bot,
  CalendarDays,
  Globe,
  Link as LinkIcon,
  Package,
  Pin,
  Server,
  ThumbsUp,
  Trophy,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BsDiscord, BsGithub, BsTwitter } from "react-icons/bs";
import { BadgeRow } from "@/components/badges/BadgeRow";
import { BotCard } from "@/components/cards/BotCard";
import { ServerCard } from "@/components/cards/ServerCard";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { Markdown } from "@/components/markdown/Markdown";
import {
  hasUserActivity,
  UserActivityPanel,
  VoterRankLine,
} from "@/components/profile/UserActivitySection";
import { UserEntityTabs } from "@/components/profile/UserEntityTabs";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { EmptyState } from "@/components/ui/EmptyState";
import { StatRow } from "@/components/ui/StatRow";
import { badges as badgesApi, users } from "@/lib/api";
import type { Link as ApiLink } from "@/lib/api/types";
import { discordBannerUrl, mirroredAvatarUrl } from "@/lib/utils/assets";
import { isApiUnavailable, isNotFoundError } from "@/lib/utils/errors";
import { formatCount } from "@/lib/utils/format";
import { getServerToken } from "@/lib/utils/serverSession";

interface Props {
  params: Promise<{ id: string }>;
}

function getLinkIcon(link: ApiLink) {
  const name = link.name.toLowerCase();
  const url = link.value.toLowerCase();
  if (name === "github" || url.includes("github.com")) return BsGithub;
  if (
    name === "twitter" ||
    name === "x" ||
    url.includes("twitter.com") ||
    url.includes("x.com")
  )
    return BsTwitter;
  if (
    name === "discord" ||
    url.includes("discord.gg") ||
    url.includes("discord.com") ||
    url.includes("discordapp.com")
  )
    return BsDiscord;
  if (name === "website") return Globe;
  return LinkIcon;
}

function dedupeById<T>(a: T[], b: T[], idOf: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of [...a, ...b]) {
    const id = idOf(item);
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(item);
  }
  return out;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const seo = await users.getSeo(id).catch(() => null);
  if (!seo) return {};
  return {
    title: seo.name,
    description: seo.short || `${seo.name}'s profile on Omniplex`,
    alternates: { canonical: `/user/${seo.id}` },
  };
}

export default async function UserPage({ params }: Props) {
  const { id } = await params;
  const badgePromise = badgesApi.getForEntity("user", id).catch(() => null);
  const activityPromise = users.getActivity(id).catch(() => null);
  let user = null;
  try {
    user = await users.getUser(id, await getServerToken());
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable inline />;
    if (isNotFoundError(err)) notFound();
    throw err;
  }
  if (!user) notFound();
  const [badgeData, activity] = await Promise.all([
    badgePromise,
    activityPromise,
  ]);

  const customBadges = badgeData?.badges ?? [];

  const username = user.user?.username ?? "Unknown";
  const displayName = user.user?.display_name ?? username;
  const avatarSrc = mirroredAvatarUrl("users", id, user.user?.avatar);

  // Links starting with "_" are private/system-managed (same convention as
  // the dashboard's profile editor) never shown on the public profile.
  const publicLinks = user.extra_links.filter(
    (l: ApiLink) => !l.name.startsWith("_"),
  );

  // user_bots/user_servers only cover directly-owned entities. Bots and
  // servers owned by a team this user belongs to live under
  // user_teams[].entities instead (same aggregation the dashboard does for
  // "my bots/servers") — merge them in so the profile isn't missing
  // anything the user can actually see on their own dashboard.
  const teamBots = user.user_teams.flatMap((team) => team.entities?.bots ?? []);
  const teamServers = user.user_teams.flatMap(
    (team) => team.entities?.servers ?? [],
  );
  const allBots = dedupeById(user.user_bots, teamBots, (b) => b.bot_id);
  const allServers = dedupeById(
    user.user_servers,
    teamServers,
    (s) => s.server_id,
  );

  const hasNothingListed =
    allBots.length === 0 &&
    allServers.length === 0 &&
    user.user_packs.length === 0 &&
    user.user_teams.length === 0;

  const pinnedBot =
    user.pinned_target_type === "bot"
      ? allBots.find((b) => b.bot_id === user.pinned_target_id)
      : undefined;
  const pinnedServer =
    user.pinned_target_type === "server"
      ? allServers.find((sv) => sv.server_id === user.pinned_target_id)
      : undefined;

  const builtinBadges = [
    user.staff && { key: "staff", label: "Staff", variant: "info" as const },
    user.certified && {
      key: "certified",
      label: "Certified Dev",
      variant: "success" as const,
    },
    user.bot_developer && {
      key: "dev",
      label: "Bot Developer",
      variant: "default" as const,
    },
    user.bug_hunters && {
      key: "bug",
      label: "Bug Hunter",
      variant: "danger" as const,
    },
  ].filter(Boolean) as {
    key: string;
    label: string;
    variant: "info" | "success" | "default" | "danger";
  }[];

  const card =
    "rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900";
  const cardTitle =
    "mb-3 text-sm font-semibold text-zinc-950 dark:text-zinc-50";

  return (
    <Container className="py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        Home
      </Link>

      <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <Banner
          src={discordBannerUrl("users", id)}
          alt={displayName}
          sizeClassName="h-36 sm:h-48"
          missingSizeClassName="h-24"
        />
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-10 inline-block rounded-full bg-white p-1 dark:bg-zinc-900">
            <Avatar src={avatarSrc} alt={username} size={80} />
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <h1 className="min-w-0 text-2xl font-semibold tracking-tight text-zinc-950 wrap-anywhere sm:text-3xl dark:text-zinc-50">
              {displayName}
            </h1>
            {builtinBadges.map((b) => (
              <Badge key={b.key} variant={b.variant}>
                {b.label}
              </Badge>
            ))}
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            @{username}
          </p>
          {activity && <VoterRankLine activity={activity} />}
        </div>
      </section>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          {(pinnedBot || pinnedServer) && (
            <section>
              <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                <Pin size={14} className="text-accent" />
                Pinned
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {pinnedBot && <BotCard bot={pinnedBot} />}
                {pinnedServer && <ServerCard server={pinnedServer} />}
              </div>
            </section>
          )}

          {user.about && (
            <section className={card}>
              <h2 className={cardTitle}>About</h2>
              <Markdown content={user.about} className="max-w-none text-sm" />
            </section>
          )}

          <UserEntityTabs
            bots={allBots}
            servers={allServers}
            packs={user.user_packs}
            teams={user.user_teams}
            activity={
              activity && hasUserActivity(activity) ? (
                <UserActivityPanel activity={activity} />
              ) : undefined
            }
          />

          {hasNothingListed && (
            <EmptyState icon={Package} title="Nothing listed yet">
              {displayName} hasn&apos;t listed any bots, servers or packs.
            </EmptyState>
          )}
        </div>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
          <div className={card}>
            <h3 className={cardTitle}>Stats</h3>
            <dl className="space-y-2.5">
              <StatRow
                icon={<Bot size={14} />}
                label="Bots"
                value={String(allBots.length)}
              />
              <StatRow
                icon={<Server size={14} />}
                label="Servers"
                value={String(allServers.length)}
              />
              <StatRow
                icon={<Package size={14} />}
                label="Packs"
                value={String(user.user_packs.length)}
              />
              <StatRow
                icon={<Users size={14} />}
                label="Teams"
                value={String(user.user_teams.length)}
              />
              {activity && (
                <>
                  <StatRow
                    icon={<ThumbsUp size={14} />}
                    label="Votes this month"
                    value={formatCount(activity.month.votes)}
                  />
                  <StatRow
                    icon={<Trophy size={14} />}
                    label="Votes all time"
                    value={formatCount(activity.all_time.votes)}
                  />
                </>
              )}
              <StatRow
                icon={<CalendarDays size={14} />}
                label="Joined"
                value={new Date(user.created_at).toLocaleDateString("en-GB", {
                  month: "short",
                  year: "numeric",
                })}
              />
            </dl>
          </div>

          {customBadges.length > 0 && (
            <div className={card}>
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  Badges
                </h3>
                <Link
                  href="/badges"
                  className="text-xs text-zinc-500 transition-colors hover:text-accent dark:text-zinc-400"
                >
                  All badges
                </Link>
              </div>
              <ul className="space-y-4">
                {customBadges.map(({ badge }) => (
                  <li key={badge.id}>
                    <BadgeRow
                      name={badge.name}
                      description={badge.description}
                      icon={badge.icon}
                      color={badge.color}
                    />
                  </li>
                ))}
              </ul>
            </div>
          )}

          {publicLinks.length > 0 && (
            <div className={card}>
              <h3 className={cardTitle}>Links</h3>
              <ul className="space-y-1">
                {publicLinks.map((link: ApiLink) => {
                  const Icon = getLinkIcon(link);
                  return (
                    <li key={link.name}>
                      <a
                        href={link.value}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="-mx-2 flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-800/60 dark:hover:text-zinc-50"
                      >
                        <Icon size={14} className="shrink-0" />
                        <span className="truncate capitalize">{link.name}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </Container>
  );
}
