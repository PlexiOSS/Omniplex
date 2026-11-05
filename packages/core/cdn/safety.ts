const SAFE_IMAGE_TYPES = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/avif",
]);

const INLINE_TYPES = new Set([
  ...SAFE_IMAGE_TYPES,
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "video/mp4",
  "video/webm",
]);

export const CDN_SECURITY_HEADERS: Record<string, string> = {
  "X-Content-Type-Options": "nosniff",
  "Content-Security-Policy": "default-src 'none'; sandbox",
  "Cross-Origin-Resource-Policy": "cross-origin",
};

function baseType(contentType: string | null | undefined): string {
  return (contentType ?? "").split(";")[0].trim().toLowerCase();
}

export function isSafeImageType(contentType: string | null | undefined) {
  return SAFE_IMAGE_TYPES.has(baseType(contentType));
}

export function cdnHeaders(contentType: string): Record<string, string> {
  const type = baseType(contentType);
  if (INLINE_TYPES.has(type)) {
    return { ...CDN_SECURITY_HEADERS, "Content-Type": type };
  }
  return {
    ...CDN_SECURITY_HEADERS,
    "Content-Type": "application/octet-stream",
    "Content-Disposition": "attachment",
  };
}

function startsWith(buf: Uint8Array, bytes: number[], offset = 0) {
  return bytes.every((b, i) => buf[offset + i] === b);
}

const ascii = (s: string) => [...s].map((c) => c.charCodeAt(0));

export function matchesDeclaredType(buf: Uint8Array, contentType: string) {
  switch (baseType(contentType)) {
    case "image/png":
      return startsWith(buf, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    case "image/jpeg":
      return startsWith(buf, [0xff, 0xd8, 0xff]);
    case "image/gif":
      return (
        startsWith(buf, ascii("GIF87a")) || startsWith(buf, ascii("GIF89a"))
      );
    case "image/webp":
      return (
        startsWith(buf, ascii("RIFF")) && startsWith(buf, ascii("WEBP"), 8)
      );
    case "audio/mpeg":
      return (
        startsWith(buf, ascii("ID3")) ||
        (buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)
      );
    default:
      return false;
  }
}
