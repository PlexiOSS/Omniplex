import { ArrowLeft, GitBranch, Globe, Link as LinkIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BotCard } from "@/components/cards/BotCard";
import { PackCard } from "@/components/cards/PackCard";
import { ServerCard } from "@/components/cards/ServerCard";
import { TeamCard } from "@/components/cards/TeamCard";
import { Container } from "@/components/layout/Container";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { users } from "@/lib/api";
import type { Link as ApiLink } from "@/lib/api/types";

interface Props {
  params: Promise<{ id: string }>;
}

const KNOWN_LINK_ICONS: Record<string, typeof Globe> = {
  website: Globe,
  github: GitBranch,
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const user = await users.getUser(id).catch(() => null);
  if (!user) return {};
  const username = user.user?.username ?? id;
  return {
    title: username,
    description: user.about || `${username}'s profile on Omniplex`,
  };
}

export default async function UserPage({ params }: Props) {
  const { id } = await params;
  const user = await users.getUser(id).catch(() => null);
  if (!user) notFound();

  const username = user.user?.username ?? "Unknown";
  const displayName = user.user?.display_name ?? username;
  const avatarSrc =
    user.user?.avatar || `https://cdn.discordapp.com/embed/avatars/0.png`;

  // Links starting with "_" are private/system-managed (same convention as
  // the dashboard's profile editor) never shown on the public profile.
  const publicLinks = user.extra_links.filter(
    (l: ApiLink) => !l.name.startsWith("_"),
  );

  const hasNothingListed =
    user.user_bots.length === 0 &&
    user.user_servers.length === 0 &&
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

      {/* Bots */}
      {user.user_bots.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Bots
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {user.user_bots.map((bot) => (
              <BotCard key={bot.bot_id} bot={bot} />
            ))}
          </div>
        </section>
      )}

      {/* Servers */}
      {user.user_servers.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Servers
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {user.user_servers.map((server) => (
              <ServerCard key={server.server_id} server={server} />
            ))}
          </div>
        </section>
      )}

      {/* Packs */}
      {user.user_packs.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Packs
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {user.user_packs.map((pack) => (
              <PackCard key={pack.url} pack={pack} />
            ))}
          </div>
        </section>
      )}

      {/* Teams */}
      {user.user_teams.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Teams
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {user.user_teams.map((team) => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        </section>
      )}

      {hasNothingListed && (
        <div className="mt-16 flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400">
          <p className="text-sm">This user hasn&apos;t listed anything yet.</p>
        </div>
      )}
    </Container>
  );
}
