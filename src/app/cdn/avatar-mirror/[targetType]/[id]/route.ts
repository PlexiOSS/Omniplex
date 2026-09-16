import { NextResponse } from "next/server";
import { DISCORD_CDN_URL } from "@/lib/api/config";
import { AVATAR_MIRROR_MAX_AGE_MS } from "@/lib/s3/config";
import { getObject, putObject } from "@/lib/s3/objects";

const DISCORD_CDN_HOST = new URL(DISCORD_CDN_URL).hostname;

interface Params {
  params: Promise<{ targetType: string; id: string }>;
}

const VALID_TARGET_TYPES = new Set(["bots", "servers", "users"]);

export async function GET(req: Request, { params }: Params) {
  const { targetType, id } = await params;
  if (!VALID_TARGET_TYPES.has(targetType) || !id) {
    return new NextResponse("Not found", { status: 404 });
  }

  const key = `avatars/${targetType}/${id}`;
  const rawSrc = new URL(req.url).searchParams.get("src");

  const cached = await getObject(key);
  const isStale =
    !cached?.lastModified ||
    Date.now() - cached.lastModified.getTime() > AVATAR_MIRROR_MAX_AGE_MS;

  if ((!cached || isStale) && rawSrc) {
    const mirrored = await fetchFromDiscord(rawSrc);
    if (mirrored) {
      await putObject(key, mirrored.body, mirrored.contentType);

      return new NextResponse(Buffer.from(mirrored.body), {
        headers: {
          "Content-Type": mirrored.contentType,
          "Cache-Control": "public, max-age=3600",
        },
      });
    }
  }

  if (cached) {
    return new NextResponse(cached.stream as ReadableStream, {
      headers: {
        "Content-Type": cached.contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  const legacy = await getObject(`${key}.webp`);
  if (legacy) {
    return new NextResponse(legacy.stream as ReadableStream, {
      headers: {
        "Content-Type": legacy.contentType,
        "Cache-Control": "public, max-age=3600",
      },
    });
  }

  return new NextResponse("Not found", { status: 404 });
}

async function fetchFromDiscord(
  rawSrc: string,
): Promise<{ body: Uint8Array; contentType: string } | null> {
  let url: URL;

  try {
    url = new URL(rawSrc);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" || url.hostname !== DISCORD_CDN_HOST) {
    return null;
  }

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") ?? "image/webp";
    const body = new Uint8Array(await res.arrayBuffer());
    return { body, contentType };
  } catch {
    return null;
  }
}