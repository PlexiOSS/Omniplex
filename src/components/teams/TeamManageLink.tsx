"use client";

import { Settings } from "lucide-react";
import Link from "next/link";
import { useEntityPermission } from "@/hooks/useEntityPermission";

interface TeamManageLinkProps {
  teamId: string;
}

/** Shows a "Manage Team" link only if the signed-in user has any permission on this team. */
export function TeamManageLink({ teamId }: TeamManageLinkProps) {
  const { hasAny } = useEntityPermission("team", teamId);

  if (!hasAny) return null;

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
