// Copyright (C) 2026 NodeByte LTD

import { DISCORD_CDN_URL, JAPI_URL } from "@/lib/api/config";

const DISCORD_CDN_HOST = new URL(DISCORD_CDN_URL).hostname;
const USER_AGENT = "Omniplex (+https://omniplex.gg)";
const SNOWFLAKE = /^[0-9]{16,20}$/;

export interface DiscordImage {
  body: Uint8Array;
  contentType: string;
  sourceUrl: string;
}

export function isSnowflake(id: string): boolean {
  return SNOWFLAKE.test(id);
}

export async function fetchDiscordImage(
  url: string,
  timeoutMs = 4000,
): Promise<DiscordImage | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(timeoutMs),
    });
    const finalUrl = new URL(res.url || url);
    if (
      !res.ok ||
      finalUrl.protocol !== "https:" ||
      finalUrl.hostname !== DISCORD_CDN_HOST
    ) {
      await res.body?.cancel();
      return null;
    }
    return {
      body: new Uint8Array(await res.arrayBuffer()),
      contentType: res.headers.get("content-type") ?? "image/png",
      sourceUrl: finalUrl.href,
    };
  } catch {
    return null;
  }
}

export function fetchCurrentAvatar(
  userId: string,
): Promise<DiscordImage | null> {
  if (!isSnowflake(userId)) return Promise.resolve(null);
  return fetchDiscordImage(`${JAPI_URL}/user/${userId}/avatar?size=256`);
}

export type BannerLookup =
  | { status: "found"; url: string }
  | { status: "none" }
  | { status: "error" };

export async function lookupBanner(userId: string): Promise<BannerLookup> {
  if (!isSnowflake(userId)) return { status: "none" };

  try {
    const res = await fetch(`${JAPI_URL}/user/${userId}`, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(3000),
      cache: "no-store",
    });
    if (res.status === 400 || res.status === 404) {
      await res.body?.cancel();
      return { status: "none" };
    }
    if (!res.ok) {
      await res.body?.cancel();
      return { status: "error" };
    }

    const json = (await res.json()) as {
      data?: { id?: string; bannerURL?: string | null };
    };
    if (!json.data?.id) return { status: "error" };
    if (!json.data.bannerURL) return { status: "none" };

    const url = new URL(json.data.bannerURL);
    url.searchParams.set("size", "1024");
    return { status: "found", url: url.href };
  } catch {
    return { status: "error" };
  }
}
