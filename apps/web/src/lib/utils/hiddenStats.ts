export function statHidden(
  listing: { hidden_stats?: string[] | null } | null | undefined,
  stat: string,
): boolean {
  return listing?.hidden_stats?.includes(stat) ?? false;
}

export function knownStatus<T extends string>(user: {
  status?: T;
  extra_data?: Record<string, unknown> | null;
}): T | undefined {
  if (user.extra_data?.presence_unknown) return undefined;
  return user.status || undefined;
}

export const BOT_STAT_OPTIONS = [
  { value: "servers", label: "Server count" },
  { value: "shards", label: "Shards" },
  { value: "uptime", label: "Uptime and online status" },
  { value: "views", label: "Page views" },
  { value: "invites", label: "Invite clicks" },
];

export const SERVER_STAT_OPTIONS = [
  { value: "members", label: "Members and online count" },
  { value: "boosts", label: "Boosts" },
  { value: "views", label: "Page views" },
  { value: "invites", label: "Invite clicks" },
];
