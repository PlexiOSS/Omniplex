import { CDN_URL } from "../api/config";

/**
 * Partner logos are the one leftover piece of Popplio's now-removed CDN
 * upload pipeline: Popplio no longer exposes an `avatar` field on `Partner`
 * at all, but the old per-partner files staff manually uploaded are still
 * sitting on the CDN at this fixed path, keyed by the partner's own `id`
 * (not their linked Discord user). Existing partners still resolve here;
 * anything uploaded after the pipeline's removal won't exist, so callers
 * should render this through `Avatar`, which already falls back to a
 * generated avatar on a 404.
 */
export function partnerAvatarUrl(partnerId: string): string {
  return `${CDN_URL}/avatars/partners/${encodeURIComponent(partnerId)}.webp`;
}

/**
 * Team avatars have the exact same story as partner logos: `Team.avatar`
 * was removed from Popplio's API entirely (see popplio's arcadia
 * CONFORMANCE.md §D11b — "Team avatars remain removed; nothing analogous
 * exists for them"), but a one-time migration (`cmd/kitehelper`) copied
 * every team's old avatar to a fixed CDN path keyed by team ID before that
 * pipeline was torn down. The frontend's `Team.avatar` field is stale — it's
 * still typed as `AssetMetadata | null` but Popplio no longer sends it, so
 * `resolveAsset(team.avatar)` silently resolves to null for every team.
 */
export function teamAvatarUrl(teamId: string): string {
  return `${CDN_URL}/avatars/teams/${encodeURIComponent(teamId)}.webp`;
}

/**
 * Same story again, one directory further down: bot/server/team banners
 * were removed from Popplio's API in the same CDN-pipeline removal
 * (CONFORMANCE.md §D11b — `banner` dropped from `Bot`, `IndexBot`, `Server`,
 * `IndexServer`, `Team`), but the historical banner migration
 * (`cmd/kitehelper`) left every existing banner sitting at this fixed path,
 * keyed by the entity's own ID. Render through `Banner`
 * (`components/ui/Banner.tsx`), which falls back to a themed gradient for
 * entities that never had one uploaded, or whose file 404s.
 */
export function bannerUrl(
  targetType: "bots" | "servers" | "teams",
  id: string,
): string {
  return `${CDN_URL}/banners/${targetType}/${encodeURIComponent(id)}.webp`;
}

/**
 * Bot avatars come from `bot.user.avatar` — dovewing resolves them to full
 * Discord CDN URLs already. Use this only as a fallback placeholder.
 */
export function discordDefaultAvatar(discriminator = "0"): string {
  const index = Number(discriminator) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

/** Return the canonical path for a bot (prefers vanity) */
export function botPath(botId: string, vanity?: string | null): string {
  return `/bots/${vanity || botId}`;
}

/** Return the canonical path for a server (prefers vanity) */
export function serverPath(serverId: string, vanity?: string | null): string {
  return `/servers/${vanity || serverId}`;
}
