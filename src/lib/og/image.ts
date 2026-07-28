import sharp from "sharp";

/**
 * Fetches a remote avatar/banner and re-encodes it as a base64 PNG data URI.
 *
 * Satori/resvg (the renderer behind `next/og`'s `ImageResponse`) doesn't
 * reliably decode `.webp` — which is exactly what Omniplex's CDN serves for
 * every bot/server/user avatar — so `<img src="https://...avatar.webp">`
 * silently renders nothing. Re-encoding through sharp sidesteps that gap
 * regardless of the source format.
 */
export async function toOgImageSrc(
  url: string | null | undefined,
): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    const png = await sharp(buf).resize(256, 256).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}
