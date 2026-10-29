// Copyright (C) 2026 NodeByte LTD

function withVersion(path: string, version?: string | null): string {
  return version ? `${path}?v=${encodeURIComponent(version)}` : path;
}

export function partnerAvatarUrl(
  partnerId: string,
  version?: string | null,
): string {
  return withVersion(
    `/cdn/avatars/partners/${encodeURIComponent(partnerId)}.webp`,
    version,
  );
}

export function partnerLogoUrl(partner: {
  id: string;
  bot_id: string | null;
  bot?: { avatar: string } | null;
}): string {
  if (partner.bot_id && partner.bot) {
    return mirroredAvatarUrl("bots", partner.bot_id, partner.bot.avatar);
  }
  return partnerAvatarUrl(partner.id);
}

export function teamAvatarUrl(teamId: string, version?: string | null): string {
  return withVersion(
    `/cdn/avatars/teams/${encodeURIComponent(teamId)}.webp`,
    version,
  );
}

export function bannerUrl(
  targetType: "bots" | "servers" | "teams",
  id: string,
  version?: string | null,
): string {
  return withVersion(
    `/cdn/banners/${targetType}/${encodeURIComponent(id)}.webp`,
    version,
  );
}

export function discordBannerUrl(
  targetType: "bots" | "users",
  id: string,
): string {
  return `/cdn/discord-banner/${targetType}/${encodeURIComponent(id)}`;
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

export function packSoundUrl(packUrl: string, soundId: string): string {
  return `/cdn/sounds/packs/${encodeURIComponent(packUrl)}/${encodeURIComponent(soundId)}.mp3`;
}

export function botPath(botId: string, vanity?: string | null): string {
  return `/bots/${vanity || botId}`;
}

export function serverPath(serverId: string, vanity?: string | null): string {
  return `/servers/${vanity || serverId}`;
}
