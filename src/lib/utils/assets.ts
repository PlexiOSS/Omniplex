// Copyright (C) 2026 NodeByte LTD

export function partnerAvatarUrl(partnerId: string): string {
  return `/cdn/avatars/partners/${encodeURIComponent(partnerId)}.webp`;
}

export function teamAvatarUrl(teamId: string): string {
  return `/cdn/avatars/teams/${encodeURIComponent(teamId)}.webp`;
}

export function bannerUrl(
  targetType: "bots" | "servers" | "teams",
  id: string,
): string {
  return `/cdn/banners/${targetType}/${encodeURIComponent(id)}.webp`;
}

export function mirroredAvatarUrl(
  targetType: "bots" | "servers" | "users",
  id: string,
  liveSrc: string | null | undefined,
): string {
  const base = `/cdn/avatar-mirror/${targetType}/${encodeURIComponent(id)}`;
  const usableSrc =
    liveSrc && !/^https?:\/\/cdn\.omniplex\.gg\//.test(liveSrc)
      ? liveSrc
      : null;
  return usableSrc ? `${base}?src=${encodeURIComponent(usableSrc)}` : base;
}

export function discordDefaultAvatar(discriminator = "0"): string {
  const index = Number(discriminator) % 5;
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

export function packEmojiUrl(
  packUrl: string,
  emojiId: string,
  animated: boolean,
): string {
  return `/cdn/emojis/packs/${encodeURIComponent(packUrl)}/${encodeURIComponent(emojiId)}.${animated ? "gif" : "webp"}`;
}

export function packStickerUrl(
  packUrl: string,
  stickerId: string,
  animated: boolean,
): string {
  return `/cdn/stickers/packs/${encodeURIComponent(packUrl)}/${encodeURIComponent(stickerId)}.${animated ? "gif" : "webp"}`;
}

export function botPath(botId: string, vanity?: string | null): string {
  return `/bots/${vanity || botId}`;
}

export function serverPath(serverId: string, vanity?: string | null): string {
  return `/servers/${vanity || serverId}`;
}
