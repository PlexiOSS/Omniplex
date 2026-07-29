"use client";

import { Settings } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { teams } from "@/lib/api";

interface TeamManageLinkProps {
  teamId: string;
}

/** Shows a "Manage Team" link only if the signed-in user has any permission on this team. */
export function TeamManageLink({ teamId }: TeamManageLinkProps) {
  const { session, isAuthenticated } = useAuth();
  const [canManage, setCanManage] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !session) return;
    let cancelled = false;
    teams
      .getEntityPerms(session.user_id, "team", teamId)
      .then((res) => {
        if (!cancelled) setCanManage(res.perms.length > 0);
      })
      .catch(() => {
        if (!cancelled) setCanManage(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, session, teamId]);

  if (!canManage) return null;

  return (
    <Link
      href={`/teams/${teamId}/settings`}
      className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
    >
      <Settings size={14} />
      Manage Team
    </Link>
  );
}
