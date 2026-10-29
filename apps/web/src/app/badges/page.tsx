import { Award, Link2, ShieldCheck, Sparkles, Users } from "lucide-react";
import type { Metadata } from "next";
import { BadgeTile } from "@/components/badges/BadgeRow";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { ServiceUnavailable } from "@/components/layout/ServiceUnavailable";
import { EmptyState } from "@/components/ui/EmptyState";
import { badges as badgesApi } from "@/lib/api";
import type { PublicBadge } from "@/lib/api/types";
import { isApiUnavailable } from "@/lib/utils/errors";
import { formatCount } from "@/lib/utils/format";

export const metadata: Metadata = {
  title: "Badges",
  description:
    "Every badge on Omniplex, what it means and how to earn it, for profiles, bots, servers and teams.",
};

const GROUPS: { key: string; title: string; description: string }[] = [
  {
    key: "user",
    title: "Profile badges",
    description: "Shown on your profile for how you vote, review and build.",
  },
  {
    key: "listing",
    title: "Bot and server badges",
    description: "Shown on a bot or server's page for milestones it reaches.",
  },
  {
    key: "team",
    title: "Team badges",
    description: "Shown on a team's page.",
  },
];

const TARGET_LABEL: Record<string, string> = {
  user: "Profiles",
  bot: "Bots",
  server: "Servers",
  team: "Teams",
};

function groupOf(badge: PublicBadge) {
  if (badge.target_types.includes("user")) return "user";
  if (
    badge.target_types.includes("bot") ||
    badge.target_types.includes("server")
  )
    return "listing";
  return "team";
}

function BadgeCard({ badge }: { badge: PublicBadge }) {
  return (
    <article className="flex min-w-0 flex-col rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start gap-3.5">
        <BadgeTile icon={badge.icon} color={badge.color} size="md" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-zinc-950 dark:text-zinc-50">
            {badge.name}
          </h3>
          {badge.description && (
            <p className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">
              {badge.description}
            </p>
          )}
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-zinc-50 px-3 py-2.5 text-sm text-zinc-700 dark:bg-zinc-950 dark:text-zinc-300">
        {badge.automatic ? (
          <Sparkles size={15} className="mt-0.5 shrink-0 text-accent" />
        ) : (
          <ShieldCheck size={15} className="mt-0.5 shrink-0 text-zinc-400" />
        )}
        <span>{badge.how_to_earn}</span>
      </div>

      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 pt-4 text-xs text-zinc-500 dark:text-zinc-400">
        <span className="inline-flex items-center gap-1">
          <Users size={12} />
          {badge.holders === 1
            ? "1 holder"
            : `${formatCount(badge.holders)} holders`}
        </span>
        <span>{badge.automatic ? "Automatic" : "Staff awarded"}</span>
        {badge.linked_role && (
          <span className="inline-flex items-center gap-1">
            <Link2 size={12} />
            Discord linked role
          </span>
        )}
        <span className="ml-auto flex flex-wrap gap-1">
          {badge.target_types.map((t) => (
            <span
              key={t}
              className="rounded-md bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800"
            >
              {TARGET_LABEL[t] ?? t}
            </span>
          ))}
        </span>
      </div>
    </article>
  );
}

export default async function BadgesPage() {
  let list: PublicBadge[] = [];
  try {
    list = (await badgesApi.list()).badges;
  } catch (err) {
    if (isApiUnavailable(err)) return <ServiceUnavailable inline />;
    throw err;
  }

  return (
    <Container className="py-10">
      <PageHeader
        centered
        icon={Award}
        title="Badges"
        description="What every badge means and how to earn it. Automatic badges are added and removed as you qualify, usually within an hour."
      />

      {list.length === 0 ? (
        <EmptyState icon={Award} title="No badges yet">
          Check back soon.
        </EmptyState>
      ) : (
        <div className="mx-auto max-w-5xl space-y-12">
          {GROUPS.map((group) => {
            const items = list.filter((b) => groupOf(b) === group.key);
            if (items.length === 0) return null;
            return (
              <section key={group.key}>
                <div className="mb-4">
                  <h2 className="text-lg font-semibold text-zinc-950 dark:text-zinc-50">
                    {group.title}
                  </h2>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    {group.description}
                  </p>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {items.map((badge) => (
                    <BadgeCard key={badge.id} badge={badge} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </Container>
  );
}
