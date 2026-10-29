import { NextResponse } from "next/server";
import { DISCORD_CDN_URL } from "@/lib/api/config";
import { cdnHeaders, isSafeImageType } from "@/lib/cdn/safety";
import { fetchCurrentAvatar, fetchDiscordImage } from "@/lib/japi/client";
import { MIRROR_SOURCE_METADATA_KEY } from "@/lib/s3/config";
import {
  discardObject,
  type FetchedObject,
  getObject,
  putObject,
  S3UnavailableError,
} from "@/lib/s3/objects";

const DISCORD_CDN_HOST = new URL(DISCORD_CDN_URL).hostname;

interface Params {
  params: Promise<{ targetType: string; id: string }>;
}

const VALID_TARGET_TYPES = new Set(["bots", "servers", "users"]);
const MATCHED = "public, max-age=31536000, immutable";
const FALLBACK = "public, max-age=300";
const IMAGE_FILE = /[A-Za-z0-9_]+\.(?:png|jpe?g|gif|webp)/.source;
const DEFAULT_AVATAR = /^\/embed\/avatars\/[0-9]\.png$/;
const OWN_IMAGE: Record<string, RegExp> = {
  bots: new RegExp(`^/avatars/([0-9]{16,20})/${IMAGE_FILE}$`),
  users: new RegExp(`^/avatars/([0-9]{16,20})/${IMAGE_FILE}$`),
  servers: new RegExp(`^/icons/([0-9]{16,20})/${IMAGE_FILE}$`),
};

export async function GET(req: Request, { params }: Params) {
  const { targetType, id } = await params;
  if (!VALID_TARGET_TYPES.has(targetType) || !id) {
    return new NextResponse("Not found", { status: 404 });
  }

  const key = `avatars/${targetType}/${id}`;
  const src = parseDiscordSrc(
    new URL(req.url).searchParams.get("src"),
    targetType,
    id,
  );

  let s3Down = false;
  let cached: FetchedObject | null = null;
  try {
    const result = await getObject(key);
    if (result.status === "found") cached = result.object;
  } catch (err) {
    if (!(err instanceof S3UnavailableError)) throw err;
    console.error(err, err.cause);
    s3Down = true;
  }

  if (cached && !isTrustedCache(cached, targetType, id)) {
    discardObject(cached);
    cached = null;
  }

  const cachedSource = cached?.metadata[MIRROR_SOURCE_METADATA_KEY];

  if (cached && (!src || cachedSource === src.href)) {
    return streamResponse(cached, src ? MATCHED : FALLBACK);
  }

  if (src) {
    const mirrored = await fetchDiscordImage(src.href, 2500);
    if (mirrored) {
      if (cached) discardObject(cached);
      if (!s3Down) {
        await putObject(key, mirrored.body, mirrored.contentType, {
          [MIRROR_SOURCE_METADATA_KEY]: src.href,
        });
      }
      return new NextResponse(Buffer.from(mirrored.body), {
        headers: {
          ...cdnHeaders(mirrored.contentType),
          "Cache-Control": MATCHED,
        },
      });
    }
  }

  if (targetType !== "servers") {
    const current = await fetchCurrentAvatar(id);
    if (current) {
      if (cached) discardObject(cached);
      if (!s3Down) {
        await putObject(key, current.body, current.contentType, {
          [MIRROR_SOURCE_METADATA_KEY]: src?.href ?? current.sourceUrl,
        });
      }
      return new NextResponse(Buffer.from(current.body), {
        headers: {
          ...cdnHeaders(current.contentType),
          "Cache-Control": FALLBACK,
        },
      });
    }
  }

  if (cached) return streamResponse(cached, FALLBACK);

  if (!s3Down) {
    try {
      const legacy = await getObject(`${key}.webp`);
      if (legacy.status === "found") {
        if (isSafeImageType(legacy.object.contentType)) {
          return streamResponse(legacy.object, FALLBACK);
        }
        discardObject(legacy.object);
      }
    } catch (err) {
      if (!(err instanceof S3UnavailableError)) throw err;
      s3Down = true;
    }
  }

  if (s3Down) {
    return new NextResponse("CDN temporarily unavailable", {
      status: 503,
      headers: { "Cache-Control": "no-store", "Retry-After": "5" },
    });
  }

  return new NextResponse("Not found", {
    status: 404,
    headers: { "Cache-Control": "public, max-age=60" },
  });
}

function streamResponse(object: FetchedObject, cacheControl: string) {
  const headers: Record<string, string> = {
    ...cdnHeaders(object.contentType),
    "Cache-Control": cacheControl,
  };
  if (object.contentLength) {
    headers["Content-Length"] = String(object.contentLength);
  }
  return new NextResponse(object.stream, { headers });
}

function isTrustedCache(object: FetchedObject, targetType: string, id: string) {
  if (!isSafeImageType(object.contentType)) return false;
  const source = object.metadata[MIRROR_SOURCE_METADATA_KEY];
  return !source || parseDiscordSrc(source, targetType, id) !== null;
}

function parseDiscordSrc(
  rawSrc: string | null,
  targetType: string,
  id: string,
): URL | null {
  if (!rawSrc) return null;
  try {
    const url = new URL(rawSrc);
    if (url.protocol !== "https:" || url.hostname !== DISCORD_CDN_HOST) {
      return null;
    }
    if (!DEFAULT_AVATAR.test(url.pathname)) {
      const owner = OWN_IMAGE[targetType]?.exec(url.pathname)?.[1];
      if (owner !== id) return null;
    }
    const size = url.searchParams.get("size");
    url.search = "";
    url.hash = "";
    if (size && /^[0-9]{2,4}$/.test(size)) url.searchParams.set("size", size);
    return url;
  } catch {
    return null;
  }
}
