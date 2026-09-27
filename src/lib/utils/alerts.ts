export interface AlertLink {
  href: string;
  external: boolean;
}

export function alertLink(url: string | null | undefined): AlertLink | null {
  if (!url) return null;
  if (url.startsWith("/") && !url.startsWith("//"))
    return { href: url, external: false };

  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;

  const sameSite =
    typeof window !== "undefined" && parsed.origin === window.location.origin;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL;
  let frontend = false;
  if (baseUrl) {
    try {
      frontend = parsed.host === new URL(baseUrl).host;
    } catch {}
  }

  return sameSite || frontend
    ? {
        href: `${parsed.pathname}${parsed.search}${parsed.hash}`,
        external: false,
      }
    : { href: parsed.toString(), external: true };
}
