import { NextResponse } from "next/server";
import { getObject } from "@/lib/s3/objects";

interface Params {
  params: Promise<{ path: string[] }>;
}

export async function GET(_req: Request, { params }: Params) {
  const { path } = await params;

  if (path.some((segment) => segment.includes("..") || segment === "")) {
    return new NextResponse("Not found", { status: 404 });
  }

  const key = path.join("/");
  const object = await getObject(key);
  if (!object) {
    return new NextResponse("Not found", { status: 404 });
  }

  return new NextResponse(object.stream, {
    headers: {
      "Content-Type": object.contentType,
      ...(object.contentLength
        ? { "Content-Length": String(object.contentLength) }
        : {}),
      "Cache-Control": "public, max-age=3600, stale-while-revalidate=86400",
    },
  });
}
