import { API_URL, BROWSER_API_URL, CDN_URL } from "@omniplex/core/api/config";
import { ARCADIA_URL } from "@/lib/arcadia/config";

function origins(): string[] {
  return [API_URL, BROWSER_API_URL, CDN_URL, ARCADIA_URL].flatMap((url) => {
    try {
      return [new URL(url).origin];
    } catch {
      return [];
    }
  });
}

export function buildCsp(nonce: string, dev: boolean): string {
  const connect = ["'self'", ...origins()];
  if (dev) connect.push("http:", "ws:");

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' https: data: blob:",
    "media-src 'self' https: data: blob:",
    "font-src 'self' data:",
    `connect-src ${[...new Set(connect)].join(" ")}`,
    "frame-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}
