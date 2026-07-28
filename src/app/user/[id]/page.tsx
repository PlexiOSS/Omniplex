import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, GitBranch, Globe } from "lucide-react";
import { users } from "@/lib/api";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { BotCard } from "@/components/cards/BotCard";
import { Container } from "@/components/layout/Container";

interface Props {
  params: Promise<{ id: string }>;
}

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
  const avatarSrc = user.user?.avatar || `https://cdn.discordapp.com/embed/avatars/0.png`;
  const websiteLink = user.extra_links.find((l) => l.name === "website")?.value;
  const githubLink = user.extra_links.find((l) => l.name === "github")?.value;

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
            {user.certified && (
              <Badge variant="success">Certified Dev</Badge>
            )}
            {user.bot_developer && <Badge>Bot Developer</Badge>}
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
          <div className="mt-3 flex items-center gap-4">
            {websiteLink && (
              <a
                href={websiteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                <Globe size={13} />
                Website
              </a>
            )}
            {githubLink && (
              <a
                href={githubLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
              >
                <GitBranch size={13} />
                GitHub
              </a>
            )}
          </div>
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

      {user.user_bots.length === 0 && (
        <div className="mt-16 flex flex-col items-center justify-center text-zinc-500 dark:text-zinc-400">
          <p className="text-sm">This user hasn&apos;t listed any bots yet.</p>
        </div>
      )}
    </Container>
  );
}
