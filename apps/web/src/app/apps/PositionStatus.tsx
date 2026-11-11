"use client";

import { useMyApplications } from "@/hooks/useApplications";
import { useAuth } from "@/hooks/useAuth";

const LABELS = {
  pending: {
    text: "Applied, in review",
    className:
      "bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-300",
  },
  approved: {
    text: "Approved",
    className:
      "bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
  },
  denied: {
    text: "Previously denied",
    className:
      "bg-zinc-100 text-zinc-600 ring-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:ring-zinc-700",
  },
} as const;

export function PositionStatus({ positionId }: { positionId: string }) {
  const { session } = useAuth();
  const { apps } = useMyApplications(session);
  const latest = (apps ?? [])
    .filter((a) => a.position === positionId)
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0];
  if (!latest) return null;
  const label = LABELS[latest.state];
  return (
    <span
      className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${label.className}`}
    >
      {label.text}
    </span>
  );
}
