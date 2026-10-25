import { type NextRequest, NextResponse } from "next/server";
import { API_URL, BASE_URL } from "@/lib/api/config";
import {
  getShortLinkDomains,
  normalizeHost,
  targetPath,
} from "@/lib/shortLinks";

const RESOLVE_TIMEOUT_MS = 3000;

async function resolvePack(code: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/packs/${encodeURIComponent(code)}`, {
      signal: AbortSignal.timeout(RESOLVE_TIMEOUT_MS),
    });
    return res.ok ? `/packs/${encodeURIComponent(code)}` : null;
  } catch {
    return null;
  }
}

async function resolveShortCode(code: string): Promise<string | null> {
  try {
    const res = await fetch(`${API_URL}/vanity/${encodeURIComponent(code)}`, {
      signal: AbortSignal.timeout(RESOLVE_TIMEOUT_MS),
    });
    if (res.status === 404) return resolvePack(code);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      target_type?: string;
      target_id?: string;
    };
    if (!data.target_type || !data.target_id) return null;
    return targetPath(data.target_type, data.target_id, code);
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const host = normalizeHost(request.headers.get("host") ?? "");
  const domains = getShortLinkDomains();
  if (!host || !domains.includes(host)) return NextResponse.next();

  const site = new URL(BASE_URL);
  const { pathname, search } = request.nextUrl;
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length !== 1) {
    return NextResponse.redirect(new URL(`${pathname}${search}`, site), 308);
  }

  const code = decodeURIComponent(segments[0]);
  const path = await resolveShortCode(code);
  const target = path
    ? new URL(path, site)
    : new URL(`/search?q=${encodeURIComponent(code)}`, site);
  return NextResponse.redirect(target, 307);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
