// Copyright (C) 2026 NodeByte LTD

import { DISCORD_CDN_URL, JAPI_URL } from "@/lib/api/config";

const DISCORD_CDN_HOST = new URL(DISCORD_CDN_URL).hostname;
const USER_AGENT = "Omniplex (+https://omniplex.gg)";
const SNOWFLAKE = /^[0-9]{16,20}$/;
const JAPI_BACKOFF_MS = 60_000;

let japiDownUntil = 0;

function japiIsDown(): boolean {
  return Date.now() < japiDownUntil;
}

function markJapiDown(): void {
  japiDownUntil = Date.now() + JAPI_BACKOFF_MS;
}

function isUpstreamFailure(status: number): boolean {
  return status === 429 || status >= 500;
}

export interface DiscordImage {
  body: Uint8Array;
  contentType: string;
  sourceUrl: string;
}

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

export function isSnowflake(id: string): boolean {
  return SNOWFLAKE.test(id);
}

async function readImageBody(
  res: Response,
  maxBytes: number,
): Promise<Uint8Array | null> {
  const declared = Number(res.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    await res.body?.cancel();
    return null;
  }
  if (!res.body) return null;

  const reader = res.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
  } catch {
    await reader.cancel().catch(() => {});
    return null;
  }

  const body = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return body;
}

export async function fetchDiscordImage(
  url: string,
  timeoutMs = 4000,
  viaJapi = false,
): Promise<DiscordImage | null> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (viaJapi && isUpstreamFailure(res.status)) markJapiDown();
    const finalUrl = new URL(res.url || url);
    const contentType = res.headers.get("content-type");
    if (
      !res.ok ||
      finalUrl.protocol !== "https:" ||
      finalUrl.hostname !== DISCORD_CDN_HOST ||
      (contentType !== null && !contentType.startsWith("image/"))
    ) {
      await res.body?.cancel();
      return null;
    }
    const body = await readImageBody(res, MAX_IMAGE_BYTES);
    if (!body) return null;
    return {
      body,
      contentType: contentType ?? "image/png",
      sourceUrl: finalUrl.href,
    };
  } catch {
    if (viaJapi) markJapiDown();
    return null;
  }
}

export function fetchCurrentAvatar(
  userId: string,
): Promise<DiscordImage | null> {
  if (!isSnowflake(userId) || japiIsDown()) return Promise.resolve(null);
  return fetchDiscordImage(
    `${JAPI_URL}/user/${userId}/avatar?size=256`,
    4000,
    true,
  );
}

export type BannerLookup =
  | { status: "found"; url: string }
  | { status: "none" }
  | { status: "error" };

export async function lookupBanner(userId: string): Promise<BannerLookup> {
  if (!isSnowflake(userId)) return { status: "none" };
  if (japiIsDown()) return { status: "error" };

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
      if (isUpstreamFailure(res.status)) markJapiDown();
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
    markJapiDown();
    return { status: "error" };
  }
}
