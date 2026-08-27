import { Users } from "lucide-react";
import type { Metadata } from "next";
import { Container } from "@/components/layout/Container";
import { Avatar } from "@/components/ui/Avatar";
import { Badge } from "@/components/ui/Badge";
import { staff } from "@/lib/api";
import { mirroredAvatarUrl } from "@/lib/utils/assets";

export const metadata: Metadata = {
  title: "Team",
  description: "The staff behind Omniplex.",
};

export default async function TeamPage() {
  const team = await staff.listPublicTeam().catch(() => null);

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
          Couldn't load the team roster right now — check back shortly.
        </p>
      ) : team.length === 0 ? (
        <p className="mt-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
          No team members to show.
        </p>
      ) : (
        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
          {team.map((member) => (
            <div
              key={member.user_id}
              className="flex items-center gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
            >
              <Avatar
                src={mirroredAvatarUrl("users", member.user_id, member.avatar)}
                alt={member.username}
                size={44}
              />
              <div className="min-w-0">
                <p className="truncate font-medium text-zinc-950 dark:text-zinc-50">
                  {member.display_name || member.username}
                </p>
                {member.positions.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {member.positions.map((position) => (
                      <Badge key={position.name} variant="info">
                        {position.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Container>
  );
}
