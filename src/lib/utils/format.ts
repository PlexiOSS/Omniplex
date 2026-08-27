/** Format a large number into a compact string (1.2K, 3.4M, etc.) */
export function formatCount(n: number): string {
  if (n >= 1_000_000_000_000) return `${(n / 1_000_000_000_000).toFixed(1)}T`;
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

/** Format ISO timestamp into a human-readable relative string */
export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

/** Format seconds into HH:MM:SS countdown */
export function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

/** Truncate text to a max length, appending ellipsis */
export function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

/**
 * Mirrors Popplio's EntityVoteInfo cooldown rules for bots/servers: premium
 * entities get a 4h window, everyone else gets 12h, halved to 6h on
 * Fri/Sat/Sun "double vote" days. Popplio's GetDoubleVote() pins this check
 * to UTC explicitly, so this uses getUTCDay() to match rather than the
 * viewer's local day — otherwise this copy could disagree with the server
 * near a day boundary depending on the viewer's timezone. The server
 * response's `weekend_bonus` field is still the source of truth when
 * available; this is a fallback for contexts (like the downvote confirm
 * modal) that only know premium status, not the live vote_info.
 */
export function voteCooldownHours(premium: boolean): number {
  if (premium) return 4;
  const day = new Date().getUTCDay();
  const isDoubleVoteDay = day === 0 || day === 5 || day === 6;
  return isDoubleVoteDay ? 6 : 12;
}

/** Whether today (UTC) falls on Popplio's double-vote weekend window. */
export function isWeekendVoteBonusDay(): boolean {
  const day = new Date().getUTCDay();
  return day === 0 || day === 5 || day === 6;
}
