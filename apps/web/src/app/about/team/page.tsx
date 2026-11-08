import { staff } from "@omniplex/core/api";
import type { PublicStaffMember } from "@omniplex/core/api/types";
import { mirroredAvatarUrl } from "@omniplex/core/utils/assets";
import { Avatar } from "@omniplex/ui/Avatar";
import { ArrowRight, CloudOff, UserPlus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { EmptyState } from "@/components/ui/EmptyState";

export const metadata: Metadata = {
  title: "Team",
  description: "The staff behind Omniplex.",
};

const EXTRA_ROLES_SHOWN = 2;

interface TeamGroup {
  title: string;
  index: number;
  members: PublicStaffMember[];
}

function groupByTopPosition(team: PublicStaffMember[]): TeamGroup[] {
  const groups = new Map<string, TeamGroup>();
  for (const member of team) {
    const top = member.positions[0];
    const title = top?.name ?? "Staff";
    const index = top?.index ?? Number.MAX_SAFE_INTEGER;
    const group = groups.get(title);
    if (group) group.members.push(member);
    else groups.set(title, { title, index, members: [member] });
  }
  return [...groups.values()].sort((a, b) => a.index - b.index);
}

function MemberCard({ member }: { member: PublicStaffMember }) {
  const name = member.display_name || member.username;
  const rest = member.positions.slice(1);
  const shown = rest.slice(0, EXTRA_ROLES_SHOWN);
  const hidden = rest.length - shown.length;

  return (
    <Link
      href={`/user/${member.user_id}`}
      className="group flex min-w-0 items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 transition-colors hover:border-accent/40 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <Avatar
        src={mirroredAvatarUrl("users", member.user_id, member.avatar)}
        alt={name}
        size={52}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold text-zinc-950 transition-colors group-hover:text-accent dark:text-zinc-50">
          {name}
        </p>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          @{member.username}
        </p>
        {rest.length > 0 && (
          <div
            className="mt-2 flex flex-wrap gap-1"
            title={rest.map((p) => p.name).join(", ")}
          >
            {shown.map((p) => (
              <span
                key={p.name}
                className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {p.name}
              </span>
            ))}
            {hidden > 0 && (
              <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                +{hidden}
              </span>
            )}
          </div>
        )}
      </div>
    </Link>
  );
}

export default async function TeamPage() {
  const team = await staff.listPublicTeam().catch(() => null);
  const groups = team ? groupByTopPosition(team) : [];

  return (
    <Container className="py-12">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="flex items-center gap-1.5 text-sm font-medium text-accent">
            <Users size={15} />
            Team
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl dark:text-zinc-50">
            The people behind Omniplex
          </h1>
          <p className="mt-3 text-zinc-600 dark:text-zinc-300">
            They review listings, handle reports and keep everything running.
            {team && team.length > 0 && (
              <>
                {" "}
                {team.length} people across {groups.length} roles.
              </>
            )}
          </p>
        </div>
        <Link
          href="/apps"
          className="inline-flex h-10 items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-700 transition-colors hover:border-accent/40 hover:text-accent dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
        >
          <UserPlus size={15} />
          Join the team
        </Link>
      </div>

      {!team ? (
        <div className="mt-10">
          <EmptyState icon={CloudOff} title="Couldn't load the team">
            Check back shortly.
          </EmptyState>
        </div>
      ) : team.length === 0 ? (
        <div className="mt-10">
          <EmptyState icon={Users} title="No team members to show" />
        </div>
      ) : (
        <div className="mt-12 space-y-10">
          {groups.map((group) => (
            <section key={group.title}>
              <div className="mb-4 flex items-center gap-3">
                <h2 className="text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                  {group.title}
                </h2>
                <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs font-medium tabular-nums text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {group.members.length}
                </span>
                <span className="h-px flex-1 bg-zinc-200 dark:bg-zinc-800" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {group.members.map((member) => (
                  <MemberCard key={member.user_id} member={member} />
                ))}
              </div>
            </section>
          ))}

          <Link
            href="/apps"
            className="group flex flex-wrap items-center justify-between gap-4 rounded-3xl border border-accent/20 bg-accent/5 p-6 transition-colors hover:border-accent/40"
          >
            <div>
              <p className="font-semibold text-zinc-950 dark:text-zinc-50">
                Want to help out?
              </p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">
                We open staff applications when we need more hands. See what's
                open right now.
              </p>
            </div>
            <span className="inline-flex items-center gap-1 text-sm font-medium text-accent">
              See open positions
              <ArrowRight
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </Link>
        </div>
      )}
    </Container>
  );
}
