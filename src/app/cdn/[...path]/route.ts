import { NextResponse } from "next/server";
import { getObject } from "@/lib/s3/objects";

interface Params {
  params: Promise<{ path: string[] }>;
}

/**
 * These paths are all fixed per-entity (`banners/bots/{id}.webp` etc, not
 * content-hashed), so a re-upload never changes the URL — a long flat
 * `max-age` meant a banner update could stay invisible to visitors for up
 * to an hour, worse with `stale-while-revalidate`. `must-revalidate`
 * forces a conditional check on every request instead, so a changed
 * ETag (bumped by every putObject) is caught immediately; an unchanged one
 * gets a bodyless 304, which is what keeps this from just re-downloading
 * the full image on every load.
 */
export async function GET(req: Request, { params }: Params) {
  const { path } = await params;

  if (path.some((segment) => segment.includes("..") || segment === "")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const key = path.join("/");
  const object = await getObject(key);
  if (!object) {
    return new NextResponse("Not found", { status: 404 });
  }

  const cacheHeaders: Record<string, string> = {
    "Cache-Control": "public, max-age=0, must-revalidate",
  };
  if (object.etag) cacheHeaders.ETag = object.etag;
  if (object.lastModified) {
    cacheHeaders["Last-Modified"] = object.lastModified.toUTCString();
  }

  const ifNoneMatch = req.headers.get("if-none-match");
  if (object.etag && ifNoneMatch && ifNoneMatch === object.etag) {
    return new NextResponse(null, { status: 304, headers: cacheHeaders });
  }

  return new NextResponse(object.stream, {
    headers: {
      "Content-Type": object.contentType,
      ...(object.contentLength
        ? { "Content-Length": String(object.contentLength) }
        : {}),
      ...cacheHeaders,
    },
  });
}
