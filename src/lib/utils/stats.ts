import type { ListStats } from "@/lib/api/types";

/**
 * "Approved" and "certified" are separate, mutually exclusive bot statuses
 * on the backend, but both are live and browsable — anywhere the UI shows a
 * headline "how many bots are listed" figure, it must combine both, or it
 * will silently undercount and disagree with other pages showing the same
 * concept.
 */
export function totalListedBots(stats: ListStats): number {
  return stats.total_approved_bots + stats.total_certified_bots;
}
