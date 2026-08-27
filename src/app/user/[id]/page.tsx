import { ArrowLeft, GitBranch, Globe, Link as LinkIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { UserEntityTabs } from "@/components/profile/UserEntityTabs";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { badges as badgesApi, users } from "@/lib/api";
import type { Link as ApiLink } from "@/lib/api/types";
import { badgeColor, badgeIcon } from "@/lib/constants/badgeIcons";

interface Props {
  params: Promise<{ id: string }>;
}

const KNOWN_LINK_ICONS: Record<string, typeof Globe> = {
  website: Globe,
  github: GitBranch,
};

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
  const [user, badgeData] = await Promise.all([
    users.getUser(id).catch(() => null),
    badgesApi.getForEntity("user", id).catch(() => null),
  ]);
  if (!user) notFound();

  const customBadges = badgeData?.badges ?? [];

  const username = user.user?.username ?? "Unknown";
  const displayName = user.user?.display_name ?? username;
  const avatarSrc =
    user.user?.avatar || `https://cdn.discordapp.com/embed/avatars/0.png`;

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
  const teamBots = user.user_teams.flatMap(
    (team) => team.entities?.bots ?? [],
  );
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

      {/* Profile header */}
      <div className="flex items-start gap-5">
        <Avatar src={avatarSrc} alt={username} size={72} />
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
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
          {displayName !== username && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              @{username}
            </p>
          )}
          {user.about && (
            <p className="mt-2 max-w-lg text-sm text-zinc-600 dark:text-zinc-300">
              {user.about}
            </p>
          )}
          {publicLinks.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-4">
              {publicLinks.map((link: ApiLink) => {
                const Icon =
                  KNOWN_LINK_ICONS[link.name.toLowerCase()] ?? LinkIcon;
                return (
                  <a
                    key={link.name}
                    href={link.value}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
                  >
                    <Icon size={13} />
                    <span className="capitalize">{link.name}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <UserEntityTabs
        bots={allBots}
        servers={allServers}
        packs={user.user_packs}
        teams={user.user_teams}
      />

      {hasNothingListed && (
        <div className="mt-16 flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400">
          <p className="text-sm">This user hasn&apos;t listed anything yet.</p>
        </div>
      )}
    </Container>
  );
}
