import { API_URL, CDN_URL } from "@/lib/api/config";
import { ARCADIA_URL } from "@/lib/arcadia/config";

function insecureOrigins(): string[] {
  return [API_URL, CDN_URL, ARCADIA_URL].flatMap((url) => {
    try {
      const { protocol, origin } = new URL(url);
      return protocol === "http:" ? [origin] : [];
    } catch {
      return [];
    }
  });
}

export function buildCsp(nonce: string, dev: boolean): string {
  const connect = ["'self'", "https:", "wss:", ...insecureOrigins()];
  if (dev) connect.push("http:", "ws:");

  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${dev ? " 'unsafe-eval'" : ""}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src * data: blob:",
    "media-src * data: blob:",
    "font-src 'self' data:",
    `connect-src ${[...new Set(connect)].join(" ")}`,
    "frame-src http: https:",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}
