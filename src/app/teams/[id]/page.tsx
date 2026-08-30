import { ArrowLeft, Bot, Server, Star, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BotCard } from "@/components/cards/BotCard";
import { ServerCard } from "@/components/cards/ServerCard";
import { Container } from "@/components/layout/Container";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { ReportModal } from "@/components/reports/ReportModal";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { TeamManageLink } from "@/components/teams/TeamManageLink";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { Banner } from "@/components/ui/Banner";
import { reviews, teams } from "@/lib/api";
import { hasPermString } from "@/lib/permissions";
import { bannerUrl, teamAvatarUrl } from "@/lib/utils/assets";
import { isApiUnavailable } from "@/lib/utils/errors";
import { formatCount } from "@/lib/utils/format";
import { TeamVoteButton } from "./TeamVoteButton";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const seo = await teams.getSeo(id).catch(() => null);
  if (!seo) return {};
  return {
    title: seo.name,
    description: seo.short || `${seo.name} on Omniplex`,
  };
}

export default async function TeamPage({ params }: Props) {
  const { id } = await params;
  let team = null;
  try {
    team = await teams.getTeam(id);
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable inline />;
    notFound();
  }
  if (!team) notFound();

  const reviewList = await reviews
    .getAll("team", team.id)
    .catch(() => ({ reviews: [] }));

  const avatarSrc = teamAvatarUrl(team.id);
  const members = team.entities?.members ?? [];
  const bots = team.entities?.bots ?? [];
  const servers = team.entities?.servers ?? [];
  const tags = team.tags ?? [];

  return (
    <Container className="py-10">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        <ArrowLeft size={14} />
        Home
      </Link>

      <Banner
        src={bannerUrl("teams", team.id)}
        alt={team.name}
        className="mb-6 -mt-2 h-40 rounded-2xl sm:h-52"
      />

      <div className="flex items-start gap-5">
        <Avatar src={avatarSrc} alt={team.name} size={64} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
              {team.name}
            </h1>
            {team.nsfw && <Badge variant="danger">NSFW</Badge>}
          </div>
          {team.short && (
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              {team.short}
            </p>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <Star size={13} />
              {formatCount(team.votes)} votes
            </span>
            <span className="flex items-center gap-1">
              <Users size={13} />
              {members.length} {members.length === 1 ? "member" : "members"}
            </span>
            <TeamManageLink teamId={team.id} />
          </div>

          {tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          )}

          <div className="mt-4 max-w-xs">
            <TeamVoteButton teamId={team.id} currentVotes={team.votes} />
          </div>

          <div className="mt-3 flex items-center gap-4">
            <ReportModal
              targetType="team"
              targetId={team.id}
              targetLabel="team"
            />
          </div>
        </div>
      </div>

      {members.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            Members
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => {
              const isOwner = hasPermString(member.flags, "owner");
              return (
                <div
                  key={member.itag}
                  className="flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <Avatar
                    src={member.user?.avatar ?? ""}
                    alt={member.user?.username ?? "Unknown"}
                    size={40}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-zinc-950 dark:text-zinc-50">
                      {member.user?.display_name ||
                        member.user?.username ||
                        "Unknown"}
                    </p>
                    {isOwner && (
                      <Badge variant="info" className="mt-1">
                        Owner
                      </Badge>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {bots.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            <Bot size={18} />
            Bots
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bots.map((bot) => (
              <BotCard key={bot.bot_id} bot={bot} />
            ))}
          </div>
        </section>
      )}

      {servers.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
            <Server size={18} />
            Servers
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {servers.map((server) => (
              <ServerCard key={server.server_id} server={server} />
            ))}
          </div>
        </section>
      )}

      <section className="mt-12">
        <h2 className="mb-5 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
          Reviews
        </h2>
        <ReviewsSection
          targetType="team"
          targetId={team.id}
          initialReviews={reviewList.reviews}
        />
      </section>
    </Container>
  );
}
