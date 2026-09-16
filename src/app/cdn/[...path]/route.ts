import { NextResponse } from "next/server";
import { getObject } from "@/lib/s3/objects";

interface Params {
  params: Promise<{ path: string[] }>;
}

const CACHE_CONTROL = "public, max-age=60, stale-while-revalidate=300";

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

  const ifNoneMatch = req.headers.get("if-none-match");

  if (ifNoneMatch && object.etag && object.etag === ifNoneMatch) {
    const headers: Record<string, string> = {
      "Cache-Control": CACHE_CONTROL,
      ETag: object.etag,
    };
    if (object.lastModified) {
      headers["Last-Modified"] = object.lastModified.toUTCString();
    }
    return new NextResponse(null, { status: 304, headers });
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

  return new NextResponse(object.stream as ReadableStream, { headers });
}