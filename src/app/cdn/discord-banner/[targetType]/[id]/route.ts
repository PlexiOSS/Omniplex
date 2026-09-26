import { NextResponse } from "next/server";
import {
  fetchDiscordImage,
  isSnowflake,
  lookupBanner,
} from "@/lib/japi/client";
import {
  MIRROR_CHECKED_AT_METADATA_KEY,
  MIRROR_SOURCE_METADATA_KEY,
} from "@/lib/s3/config";
import {
  discardObject,
  type FetchedObject,
  getObject,
  putObject,
  S3UnavailableError,
} from "@/lib/s3/objects";

interface Params {
  params: Promise<{ targetType: string; id: string }>;
}

const VALID_TARGET_TYPES = new Set(["bots", "users"]);
const RECHECK_MS = 12 * 60 * 60 * 1000;
const NO_BANNER = "none";
const FOUND = "public, max-age=3600";
const MISSING = "public, max-age=3600";
const STALE = "public, max-age=300";

export async function GET(_req: Request, { params }: Params) {
  const { targetType, id } = await params;
  if (!VALID_TARGET_TYPES.has(targetType) || !isSnowflake(id)) {
    return notFound("public, max-age=86400");
  }

  const key = `discord-banners/${targetType}/${id}`;

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

  const cachedSource = cached?.metadata[MIRROR_SOURCE_METADATA_KEY];
  const checkedAt = Number(cached?.metadata[MIRROR_CHECKED_AT_METADATA_KEY]);

  if (cached && Date.now() - checkedAt < RECHECK_MS) {
    return serveCached(cached, FOUND, MISSING);
  }

  const lookup = await lookupBanner(id);

  if (lookup.status === "error") {
    return cached ? serveCached(cached, STALE, STALE) : notFound("no-store");
  }

  const checked = { [MIRROR_CHECKED_AT_METADATA_KEY]: String(Date.now()) };

  if (lookup.status === "none") {
    if (cached) discardObject(cached);
    if (!s3Down) {
      await putObject(key, new Uint8Array(0), "application/octet-stream", {
        ...checked,
        [MIRROR_SOURCE_METADATA_KEY]: NO_BANNER,
      });
    }
    return notFound(MISSING);
  }

  if (cached && cachedSource === lookup.url) {
    const body = new Uint8Array(
      await new Response(cached.stream).arrayBuffer(),
    );
    if (!s3Down) {
      await putObject(key, body, cached.contentType, {
        ...checked,
        [MIRROR_SOURCE_METADATA_KEY]: lookup.url,
      });
    }
    return imageResponse(body, cached.contentType, FOUND);
  }

  const image = await fetchDiscordImage(lookup.url);
  if (!image) {
    return cached ? serveCached(cached, STALE, STALE) : notFound("no-store");
  }

  if (cached) discardObject(cached);
  if (!s3Down) {
    await putObject(key, image.body, image.contentType, {
      ...checked,
      [MIRROR_SOURCE_METADATA_KEY]: lookup.url,
    });
  }
  return imageResponse(image.body, image.contentType, FOUND);
}

function serveCached(
  cached: FetchedObject,
  foundCache: string,
  missingCache: string,
) {
  if (cached.metadata[MIRROR_SOURCE_METADATA_KEY] === NO_BANNER) {
    discardObject(cached);
    return notFound(missingCache);
  }
  const headers: Record<string, string> = {
    "Content-Type": cached.contentType,
    "Cache-Control": foundCache,
  };
  if (cached.contentLength) {
    headers["Content-Length"] = String(cached.contentLength);
  }
  return new NextResponse(cached.stream, { headers });
}

function imageResponse(
  body: Uint8Array,
  contentType: string,
  cacheControl: string,
) {
  return new NextResponse(Buffer.from(body), {
    headers: { "Content-Type": contentType, "Cache-Control": cacheControl },
  });
}

function notFound(cacheControl: string) {
  return new NextResponse("Not found", {
    status: 404,
    headers: { "Cache-Control": cacheControl },
  });
}
