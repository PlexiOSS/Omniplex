import { NextResponse } from "next/server";
import { ASSET_VERSION_METADATA_KEY } from "@/lib/s3/config";
import { getObject, S3UnavailableError } from "@/lib/s3/objects";

interface Params {
  params: Promise<{ path: string[] }>;
}

const IMMUTABLE = "public, max-age=31536000, immutable";
const REVALIDATE = "public, no-cache";
const MISSING = "public, max-age=60";

const IMMUTABLE_PREFIXES = [
  "emojis/packs/",
  "stickers/packs/",
  "sounds/packs/",
];

export async function GET(req: Request, { params }: Params) {
  const { path } = await params;

  if (path.some((segment) => segment.includes("..") || segment === "")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const key = path.join("/");
  const version = new URL(req.url).searchParams.get("v");

  let result: Awaited<ReturnType<typeof getObject>>;
  try {
    result = await getObject(key, {
      ifNoneMatch: req.headers.get("if-none-match"),
    });
  } catch (err) {
    if (err instanceof S3UnavailableError) {
      console.error(err, err.cause);
      return new NextResponse("CDN temporarily unavailable", {
        status: 503,
        headers: { "Cache-Control": "no-store", "Retry-After": "5" },
      });
    }
    throw err;
  }

  if (result.status === "missing") {
    return new NextResponse("Not found", {
      status: 404,
      headers: { "Cache-Control": MISSING },
    });
  }

  if (result.status === "not-modified") {
    const headers: Record<string, string> = { "Cache-Control": REVALIDATE };
    if (result.etag) headers.ETag = result.etag;
    return new NextResponse(null, { status: 304, headers });
  }

  const { object } = result;
  const versionMatches =
    IMMUTABLE_PREFIXES.some((prefix) => key.startsWith(prefix)) ||
    (!!version && object.metadata[ASSET_VERSION_METADATA_KEY] === version);

  const headers: Record<string, string> = {
    "Content-Type": object.contentType,
    "Cache-Control": versionMatches ? IMMUTABLE : REVALIDATE,
  };
  if (object.contentLength) {
    headers["Content-Length"] = String(object.contentLength);
  }
  if (object.etag) headers.ETag = object.etag;
  if (object.lastModified) {
    headers["Last-Modified"] = object.lastModified.toUTCString();
  }

  return new NextResponse(object.stream, { headers });
}
