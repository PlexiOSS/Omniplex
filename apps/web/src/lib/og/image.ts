// Copyright (C) 2026 NodeByte LTD

import { CDN_URL, DISCORD_CDN_URL } from "@omniplex/core/api/config";
import { isSafeImageType } from "@omniplex/core/cdn/safety";
import sharp from "sharp";

const ALLOWED_HOSTS = new Set([
  new URL(DISCORD_CDN_URL).hostname,
  new URL(CDN_URL).hostname,
]);

export async function toOgImageSrc(
  url: string | null | undefined,
): Promise<string | null> {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "https:" || !ALLOWED_HOSTS.has(parsed.hostname)) {
      return null;
    }
    const res = await fetch(parsed, {
      redirect: "error",
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok || !isSafeImageType(res.headers.get("content-type"))) {
      await res.body?.cancel();
      return null;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const png = await sharp(buf).resize(256, 256).png().toBuffer();
    return `data:image/png;base64,${png.toString("base64")}`;
  } catch {
    return null;
  }
}
