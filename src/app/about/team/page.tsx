import { Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
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
  const [top, ...rest] = member.positions;
  const shown = rest.slice(0, EXTRA_ROLES_SHOWN).map((p) => p.name);
  const hidden = rest.length - shown.length;

  return (
    <Link
      href={`/user/${member.user_id}`}
      className="group flex min-w-0 items-center gap-3 rounded-xl border border-zinc-200 p-4 transition-colors hover:border-accent/40 dark:border-zinc-800"
    >
      <Avatar
        src={mirroredAvatarUrl("users", member.user_id, member.avatar)}
        alt={name}
        size={44}
      />
      <div className="min-w-0 flex-1">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate font-medium text-zinc-950 transition-colors group-hover:text-accent dark:text-zinc-50">
            {name}
          </p>
          {top && (
            <Badge variant="info" className="shrink-0">
              {top.name}
            </Badge>
          )}
        </div>
        <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
          @{member.username}
        </p>
        {rest.length > 0 && (
          <p
            className="mt-1 truncate text-xs text-zinc-400 dark:text-zinc-500"
            title={rest.map((p) => p.name).join(", ")}
          >
            Also: {shown.join(", ")}
            {hidden > 0 && ` +${hidden}`}
          </p>
        )}
      </div>
    </Link>
  );
}

export default async function TeamPage() {
  const team = await staff.listPublicTeam().catch(() => null);
  const groups = team ? groupByTopPosition(team) : [];

  return (
    <Container className="py-16">
      <div className="mx-auto max-w-2xl text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
          <Users size={22} className="text-accent" />
        </div>
        <h1 className="text-2xl font-semibold text-zinc-950 dark:text-zinc-50">
          Team
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          The people who review listings, handle reports, and keep Omniplex
          running.
        </p>
      </div>

      {!team ? (
        <p className="mt-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
          Couldn't load the team roster right now. Check back shortly.
        </p>
      ) : team.length === 0 ? (
        <p className="mt-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No team members to show.
        </p>
      ) : (
        <div className="mx-auto mt-12 max-w-3xl space-y-10">
          {groups.map((group) => (
            <section key={group.title}>
              <h2 className="mb-3 text-sm font-semibold text-zinc-950 dark:text-zinc-50">
                {group.title}
                <span className="ml-1.5 font-normal text-zinc-400 dark:text-zinc-500">
                  · {group.members.length}
                </span>
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
