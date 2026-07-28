import { CDN_URL } from "../api/config";
import type { AssetMetadata } from "../api/types";

/**
 * Resolve an AssetMetadata object to a full CDN URL.
 * Returns null if neither path nor default_path is set.
 */
export function resolveAsset(meta: AssetMetadata | null | undefined): string | null {
  if (!meta) return null;
  if (meta.exists && meta.path) return `${CDN_URL}/${meta.path}`;
  if (meta.default_path) return `${CDN_URL}/${meta.default_path}`;
  return null;
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
