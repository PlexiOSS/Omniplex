/**
 * These resolve through Omniplex's own `/cdn/...` proxy route
 * (`app/cdn/[...path]/route.ts`), not `cdn.omniplex.gg` directly the
 * RustFS bucket backing that hostname is private, so the proxy (holding
 * the only S3 credentials, server-side only) is the sole way any of this
 * is reachable. Same-origin relative paths on purpose, so this works
 * unchanged in every environment without needing a CDN_URL override.
 *
 * Partner logos are the one leftover piece of Popplio's now-removed CDN
 * upload pipeline: Popplio no longer exposes an `avatar` field on `Partner`
 * at all, but the old per-partner files staff manually uploaded (plus
 * anything uploaded since through the admin panel's new upload UI) live at
 * this fixed path, keyed by the partner's own `id` (not their linked
 * Discord user). Render through `Avatar`, which falls back to a generated
 * avatar on a 404.
 */
export function partnerAvatarUrl(partnerId: string): string {
  return `/cdn/avatars/partners/${encodeURIComponent(partnerId)}.webp`;
}

/**
 * Team avatars have the exact same story as partner logos: `Team.avatar`
 * was removed from Popplio's API entirely (see popplio's arcadia
 * CONFORMANCE.md §D11b "Team avatars remain removed; nothing analogous
 * exists for them"). What lives at this path is either the historical
 * migrated copy or something uploaded since via the team settings upload UI.
 */
export function teamAvatarUrl(teamId: string): string {
  return `/cdn/avatars/teams/${encodeURIComponent(teamId)}.webp`;
}

/**
 * Same story again, one directory further down: bot/server/team banners
 * were removed from Popplio's API in the same CDN-pipeline removal
 * (CONFORMANCE.md §D11b `banner` dropped from `Bot`, `IndexBot`, `Server`,
 * `IndexServer`, `Team`). Render through `Banner`
 * (`components/ui/Banner.tsx`), which falls back to a themed gradient for
 * entities that never had one uploaded, or whose file 404s.
 */
export function bannerUrl(
  targetType: "bots" | "servers" | "teams",
  id: string,
): string {
  return `/cdn/banners/${targetType}/${encodeURIComponent(id)}.webp`;
}

/**
 * Bot/server/user avatars are Discord's own avatar (synced live via
 * dovewing/Infernoplex, not an upload) this doesn't point at the static
 * `/cdn/...` proxy but at a separate mirror-and-cache route, which needs the
 * current live URL as a fallback source the first time (or after the cache
 * goes stale) it's asked for this entity. Also the right thing to use for a
 * signed-in user's own avatar, not just bots/servers — same stale-data
 * failure mode, same fix (falls through to a legacy migrated file before
 * giving up to a generated placeholder).
 *
 * Deliberately under `/cdn/avatar-mirror/...`, not `/cdn/avatars/...` —
 * that prefix belongs to `/cdn/[...path]`'s static assets (partner/team
 * avatars), and Next.js's route matcher picks the more specific dynamic
 * route by URL shape alone. `/cdn/avatars/partners/<file>.webp` and
 * `/cdn/avatars/bots/<id>` are both 2 segments after `avatars`, so a mirror
 * route living at `/cdn/avatars/[targetType]/[id]` silently swallowed every
 * partner/team avatar request (targetType "partners"/"teams" not being
 * "bots"/"servers", it 404'd before ever touching S3) instead of falling
 * through to the catch-all. Different prefix removes the ambiguity outright.
 */
export function mirroredAvatarUrl(
  targetType: "bots" | "servers" | "users",
  id: string,
  liveSrc: string | null | undefined,
): string {
  const base = `/cdn/avatar-mirror/${targetType}/${encodeURIComponent(id)}`;
  // Some PlatformUser.avatar values are stale https://cdn.omniplex.gg/...
  // URLs left over from before dovewing's old CDN-mirroring middleware was
  // removed (see Avatar.tsx's isDeadCdnUrl) — that host is a private bucket
  // now, so any fetch to it (including this route's own server-side mirror
  // attempt) is guaranteed to 403. Treat it as no live source at all rather
  // than wasting a round trip proving that on every request.
  const usableSrc =
    liveSrc && !/^https?:\/\/cdn\.omniplex\.gg\//.test(liveSrc)
      ? liveSrc
      : null;
  return usableSrc ? `${base}?src=${encodeURIComponent(usableSrc)}` : base;
}

/**
 * Bot avatars come from `bot.user.avatar` dovewing resolves them to full
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
