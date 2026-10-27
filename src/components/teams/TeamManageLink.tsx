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
      className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-3.5 text-sm font-medium text-zinc-700 transition-colors hover:border-accent/40 hover:text-accent dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
    >
      <Settings size={14} />
      Manage Team
    </Link>
  );
}
