const ZERO = BigInt(0);
const ONE = BigInt(1);
const ADMINISTRATOR = BigInt(8);

export interface InvitePermissions {
  value: bigint;
  count: number;
  administrator: boolean;
}

export function readInvitePermissions(
  invite: string | null | undefined,
): InvitePermissions | null {
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
  const raw = url.searchParams.get("permissions");
  if (!raw || !/^\d+$/.test(raw)) return null;

  const value = BigInt(raw);
  let count = 0;
  for (let rest = value; rest > ZERO; rest >>= ONE) {
    if ((rest & ONE) !== ZERO) count++;
  }
  return { value, count, administrator: (value & ADMINISTRATOR) !== ZERO };
}

export function noAdminReportUrl(invite: string): string {
  return `https://noadmin.info/analyze?invite=${encodeURIComponent(invite)}`;
}
