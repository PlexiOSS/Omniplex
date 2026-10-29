// Copyright (C) 2026 NodeByte LTD

export function normalizeHost(host: string): string {
  return host
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "")
    .replace(/^www\./, "");
}

export function getShortLinkDomains(): string[] {
  return (process.env.SHORT_LINK_DOMAINS ?? "")
    .split(",")
    .map(normalizeHost)
    .filter(Boolean);
}

export function shortLinkUrl(idOrVanity: string): string | null {
  const [primary] = getShortLinkDomains();
  if (!primary) return null;
  return `https://${primary}/${encodeURIComponent(idOrVanity)}`;
}

const TARGET_PATHS: Record<string, string> = {
  bot: "/bots/",
  server: "/servers/",
  team: "/teams/",
  pack: "/packs/",
  pack_emoji: "/emojis/",
  pack_sticker: "/stickers/",
  pack_sound: "/sounds/",
};

export function targetPath(
  targetType: string,
  targetId: string,
  typed: string,
): string | null {
  const base = TARGET_PATHS[targetType];
  if (!base) return null;
  const segment =
    targetType === "bot" || targetType === "server" ? typed : targetId;
  return `${base}${encodeURIComponent(segment)}`;
}
