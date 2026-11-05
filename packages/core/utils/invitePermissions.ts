const ZERO = BigInt(0);
const ONE = BigInt(1);
const ADMINISTRATOR = BigInt(8);

export interface InvitePermissions {
  value: bigint;
  count: number;
  administrator: boolean;
}

function parseDiscordAuthorizeUrl(
  invite: string | null | undefined,
): URL | null {
  if (!invite) return null;
  let url: URL;
  try {
    url = new URL(invite);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www|canary|ptb)\./, "");
  if (
    !["discord.com", "discordapp.com"].includes(host) ||
    !url.pathname.includes("oauth2/authorize")
  ) {
    return null;
  }
  return url;
}

export function isDiscordAuthorizeUrl(
  invite: string | null | undefined,
): boolean {
  return parseDiscordAuthorizeUrl(invite) !== null;
}

export function readInvitePermissions(
  invite: string | null | undefined,
): InvitePermissions | null {
  const url = parseDiscordAuthorizeUrl(invite);
  if (!url) return null;
  const raw = url.searchParams.get("permissions");
  if (!raw || !/^\d+$/.test(raw)) return null;

  const value = BigInt(raw);
  let count = 0;
  for (let rest = value; rest > ZERO; rest >>= ONE) {
    if ((rest & ONE) !== ZERO) count++;
  }
  return { value, count, administrator: (value & ADMINISTRATOR) !== ZERO };
}

export function requestsAdministrator(
  invite: string | null | undefined,
): boolean {
  return readInvitePermissions(invite)?.administrator ?? false;
}
