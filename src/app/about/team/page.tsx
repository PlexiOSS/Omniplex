import { CloudOff, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Avatar } from "@/components/ui/Avatar";
import { EmptyState } from "@/components/ui/EmptyState";
import { staff } from "@/lib/api";
import type { PublicStaffMember } from "@/lib/api/types";
import { mirroredAvatarUrl } from "@/lib/utils/assets";

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
      className="group flex h-full w-[calc(50%-0.375rem)] min-w-0 flex-col items-center rounded-2xl border border-zinc-200 bg-white p-5 text-center transition-colors hover:border-accent/40 sm:w-[calc(33.333%-0.5rem)] lg:w-[calc(25%-0.5625rem)] dark:border-zinc-800 dark:bg-zinc-900"
    >
      <Avatar
        src={mirroredAvatarUrl("users", member.user_id, member.avatar)}
        alt={name}
        size={64}
      />
      <p className="mt-3 w-full truncate font-semibold text-zinc-950 transition-colors group-hover:text-accent dark:text-zinc-50">
        {name}
      </p>
      <p className="w-full truncate text-xs text-zinc-500 dark:text-zinc-400">
        @{member.username}
      </p>
      {rest.length > 0 && (
        <div
          className="mt-3 flex flex-wrap justify-center gap-1"
          title={rest.map((p) => p.name).join(", ")}
        >
          {shown.map((p) => (
            <span
              key={p.name}
              className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {p.name}
            </span>
          ))}
          {hidden > 0 && (
            <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              +{hidden}
            </span>
          )}
        </div>
      )}
    </Link>
  );
}

export default async function TeamPage() {
  const team = await staff.listPublicTeam().catch(() => null);
  const groups = team ? groupByTopPosition(team) : [];

  return (
    <Container className="py-10">
      <PageHeader
        centered
        icon={Users}
        title="Team"
        description={
          <>
            The people who review listings, handle reports, and keep Omniplex
            running.
          </>
        }
      />

      {!team ? (
        <EmptyState icon={CloudOff} title="Couldn't load the team">
          Check back shortly.
        </EmptyState>
      ) : team.length === 0 ? (
        <EmptyState icon={Users} title="No team members to show" />
      ) : (
        <div className="mx-auto max-w-5xl space-y-12">
          {groups.map((group) => (
            <section key={group.title}>
              <h2 className="mb-4 flex items-center justify-center gap-2 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                {group.title}
                <span className="rounded-md bg-zinc-100 px-1.5 py-0.5 text-xs font-medium tabular-nums text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                  {group.members.length}
                </span>
              </h2>
              <div className="flex flex-wrap justify-center gap-3">
                {group.members.map((member) => (
                  <MemberCard key={member.user_id} member={member} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </Container>
  );
}
