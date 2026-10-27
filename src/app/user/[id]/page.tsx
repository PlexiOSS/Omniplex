import { ArrowLeft, Globe, Link as LinkIcon, Package } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BsDiscord, BsGithub, BsTwitter } from "react-icons/bs";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
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
import { badges as badgesApi, users } from "@/lib/api";
import type { Link as ApiLink } from "@/lib/api/types";
import { badgeColor, badgeIcon } from "@/lib/constants/badgeIcons";
import { discordBannerUrl, mirroredAvatarUrl } from "@/lib/utils/assets";
import { isApiUnavailable, isNotFoundError } from "@/lib/utils/errors";
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
            {user.staff && <Badge variant="info">Staff</Badge>}
            {user.certified && <Badge variant="success">Certified Dev</Badge>}
            {user.bot_developer && <Badge>Bot Developer</Badge>}
            {user.bug_hunters && <Badge variant="danger">Bug Hunter</Badge>}
            {customBadges.map(({ badge }) => {
              const Icon = badgeIcon(badge.icon);
              return (
                <Badge
                  key={badge.id}
                  variant={badgeColor(badge.color)}
                  title={badge.description || undefined}
                >
                  <Icon size={12} />
                  {badge.name}
                </Badge>
              );
            })}
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            @{username}
          </p>
          {user.about && (
            <p className="mt-3 max-w-2xl whitespace-pre-line text-zinc-600 dark:text-zinc-300">
              {user.about}
            </p>
          )}
          {activity && <VoterRankLine activity={activity} />}
          {publicLinks.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {publicLinks.map((link: ApiLink) => {
                const Icon = getLinkIcon(link);
                return (
                  <a
                    key={link.name}
                    href={link.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:text-zinc-950 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:border-zinc-700 dark:hover:text-zinc-50"
                  >
                    <Icon size={13} />
                    <span className="capitalize">{link.name}</span>
                  </a>
                );
              })}
            </div>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Bots", value: allBots.length },
              { label: "Servers", value: allServers.length },
              { label: "Packs", value: user.user_packs.length },
              { label: "Teams", value: user.user_teams.length },
            ].map((st) => (
              <div
                key={st.label}
                className="rounded-xl border border-zinc-200 px-3 py-2.5 dark:border-zinc-800"
              >
                <dt className="text-xs text-zinc-500 dark:text-zinc-400">
                  {st.label}
                </dt>
                <dd className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-950 dark:text-zinc-50">
                  {st.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

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
        <div className="mt-10">
          <EmptyState icon={Package} title="Nothing listed yet">
            {displayName} hasn&apos;t listed any bots, servers or packs.
          </EmptyState>
        </div>
      )}
    </Container>
  );
}
