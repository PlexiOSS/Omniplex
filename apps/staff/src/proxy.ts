import { type NextRequest, NextResponse } from "next/server";
import { buildCsp } from "@/lib/csp";

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/") || pathname.startsWith("/cdn/")) {
    return NextResponse.next();
  }

  const nonce = btoa(crypto.randomUUID());
  const csp = buildCsp(nonce, process.env.NODE_ENV === "development");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
