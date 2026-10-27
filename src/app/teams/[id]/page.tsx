import { ArrowLeft, Bot, Server, Star, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { EntityBadges } from "@/components/badges/EntityBadges";
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
import { ENTITY_ACTION_ROW } from "@/components/ui/entityAction";
import { ShortLinkButton } from "@/components/ui/ShortLinkButton";
import { reviews, teams } from "@/lib/api";
import { hasPermString } from "@/lib/permissions";
import { shortLinkUrl } from "@/lib/shortLinks";
import { bannerUrl, teamAvatarUrl } from "@/lib/utils/assets";
import { isApiUnavailable, isNotFoundError } from "@/lib/utils/errors";
import { formatCount } from "@/lib/utils/format";
import { getServerToken } from "@/lib/utils/serverSession";
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
    team = await teams.getTeam(id, await getServerToken());
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable inline />;
    if (isNotFoundError(err)) notFound();
    throw err;
  }
  if (!team) notFound();

  const reviewList = await reviews
    .getAll("team", team.id)
    .catch(() => ({ reviews: [] }));

  const avatarSrc = teamAvatarUrl(team.id, team.asset_versions?.avatar);
  const members = team.entities?.members ?? [];
  const bots = team.entities?.bots ?? [];
  const servers = team.entities?.servers ?? [];
  const tags = team.tags ?? [];

  const shortLink = shortLinkUrl(team.vanity || team.id);

  const listingVotes =
    bots.reduce((sum, b) => sum + (b.approximate_votes ?? 0), 0) +
    servers.reduce((sum, sv) => sum + (sv.approximate_votes ?? 0), 0);
  const stats = [
    { label: "Team votes", value: formatCount(team.votes) },
    { label: "Listing votes", value: formatCount(listingVotes) },
    { label: "Members", value: formatCount(members.length) },
    { label: "Bots", value: formatCount(bots.length) },
    { label: "Servers", value: formatCount(servers.length) },
  ];

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
          src={bannerUrl("teams", team.id, team.asset_versions?.banner)}
          alt={team.name}
          className="h-36 sm:h-48"
        />
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-10 flex flex-wrap items-end justify-between gap-4">
            <div className="rounded-2xl bg-white p-1 dark:bg-zinc-900">
              <Avatar src={avatarSrc} alt={team.name} size={80} />
            </div>
            <div className="flex flex-wrap items-center gap-2 pb-1">
              <TeamManageLink teamId={team.id} />
              <div className="w-48">
                <TeamVoteButton teamId={team.id} currentVotes={team.votes} />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <h1 className="min-w-0 text-2xl font-semibold tracking-tight text-zinc-950 wrap-anywhere sm:text-3xl dark:text-zinc-50">
              {team.name}
            </h1>
            {team.nsfw && <Badge variant="danger">NSFW</Badge>}
            <EntityBadges targetType="team" targetId={team.id} />
          </div>
          {team.short && (
            <p className="mt-1 max-w-2xl text-zinc-600 dark:text-zinc-300">
              {team.short}
            </p>
          )}

          {members.length > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <div className="flex -space-x-2">
                {members.slice(0, 6).map((m) => (
                  <span
                    key={m.itag}
                    className="rounded-full ring-2 ring-white dark:ring-zinc-900"
                  >
                    <Avatar
                      src={m.user?.avatar ?? ""}
                      alt={m.user?.username ?? "Member"}
                      size={28}
                    />
                  </span>
                ))}
              </div>
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {members.length === 1
                  ? "1 member"
                  : `${members.length} members`}
              </span>
            </div>
          )}

          {tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          )}

          <dl className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
            {stats.map((st) => (
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

          <div className={ENTITY_ACTION_ROW}>
            {shortLink && <ShortLinkButton url={shortLink} />}
            <ReportModal
              targetType="team"
              targetId={team.id}
              targetLabel="team"
            />
          </div>
        </div>
      </section>

      {bots.length > 0 && (
        <section className="mt-12">
          <SectionTitle icon={Bot} title="Bots" count={bots.length} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {bots.map((bot) => (
              <BotCard key={bot.bot_id} bot={bot} />
            ))}
          </div>
        </section>
      )}

      {servers.length > 0 && (
        <section className="mt-12">
          <SectionTitle icon={Server} title="Servers" count={servers.length} />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {servers.map((server) => (
              <ServerCard key={server.server_id} server={server} />
            ))}
          </div>
        </section>
      )}

      {members.length > 0 && (
        <section className="mt-12">
          <SectionTitle icon={Users} title="Members" count={members.length} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => {
              const isOwner = hasPermString(member.flags, "owner");
              const name =
                member.user?.display_name || member.user?.username || "Unknown";
              const body = (
                <>
                  <Avatar
                    src={member.user?.avatar ?? ""}
                    alt={member.user?.username ?? "Unknown"}
                    size={40}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-zinc-950 transition-colors group-hover:text-accent dark:text-zinc-50">
                      {name}
                    </p>
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {member.user?.username ? `@${member.user.username}` : ""}
                    </p>
                  </div>
                  {isOwner && (
                    <span className="shrink-0 rounded-md bg-accent/10 px-1.5 py-0.5 text-[11px] font-medium text-accent">
                      Owner
                    </span>
                  )}
                </>
              );
              const cls =
                "group flex min-w-0 items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4 transition-colors dark:border-zinc-800 dark:bg-zinc-900";
              return member.user?.id ? (
                <Link
                  key={member.itag}
                  href={`/user/${member.user.id}`}
                  className={`${cls} hover:border-accent/40`}
                >
                  {body}
                </Link>
              ) : (
                <div key={member.itag} className={cls}>
                  {body}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="mt-12">
        <SectionTitle icon={Star} title="Reviews" />
        <ReviewsSection
          targetType="team"
          targetId={team.id}
          initialReviews={reviewList.reviews}
        />
      </section>
    </Container>
  );
}

function SectionTitle({
  icon: Icon,
  title,
  count,
}: {
  icon: typeof Bot;
  title: string;
  count?: number;
}) {
  return (
    <h2 className="mb-5 flex items-center gap-2 text-lg font-semibold text-zinc-950 dark:text-zinc-50">
      <Icon size={18} className="text-zinc-400" />
      {title}
      {count !== undefined && (
        <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs font-medium tabular-nums text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
          {count}
        </span>
      )}
    </h2>
  );
}
