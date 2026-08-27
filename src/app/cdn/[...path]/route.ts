import { NextResponse } from "next/server";
import { getObject, headObject } from "@/lib/s3/objects";

interface Params {
  params: Promise<{ path: string[] }>;
}

/**
 * These paths are all fixed per-entity (`banners/bots/{id}.webp` etc, not
 * content-hashed), so a re-upload never changes the URL. `max-age=60,
 * stale-while-revalidate=300` means a browser serves its cached copy
 * instantly (no network round trip at all) for the first 60 seconds, then
 * keeps serving it instantly while revalidating in the background for the
 * next 5 minutes — a re-upload is visible within roughly a minute, and
 * repeat page loads in between cost nothing. The previous `max-age=0,
 * must-revalidate` forced a network round trip for literally every image
 * on every page load, which is what made pages feel slow to load images.
 */
const CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=300";

export async function GET(req: Request, { params }: Params) {
  const { path } = await params;

  if (path.some((segment) => segment.includes("..") || segment === "")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const key = path.join("/");

  // A conditional request only needs metadata to decide 304 vs 200 — HEAD
  // is a fraction of the cost of a full GET on a multi-MB banner, and
  // avoids pulling the whole object down from RustFS just to discard it.
  const ifNoneMatch = req.headers.get("if-none-match");
  if (ifNoneMatch) {
    const meta = await headObject(key);
    if (meta?.etag && meta.etag === ifNoneMatch) {
      const headers: Record<string, string> = {
        "Cache-Control": CACHE_CONTROL,
        ETag: meta.etag,
      };
      if (meta.lastModified) {
        headers["Last-Modified"] = meta.lastModified.toUTCString();
      }
      return new NextResponse(null, { status: 304, headers });
    }
  }

  const object = await getObject(key);
  if (!object) {
    return new NextResponse("Not found", { status: 404 });
  }

  const headers: Record<string, string> = {
    "Content-Type": object.contentType,
    "Cache-Control": CACHE_CONTROL,
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
